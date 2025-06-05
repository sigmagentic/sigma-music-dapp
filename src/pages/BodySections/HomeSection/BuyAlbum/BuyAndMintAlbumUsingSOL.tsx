import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, Commitment, TransactionConfirmationStrategy } from "@solana/web3.js";
import { confetti } from "@tsparticles/confetti";
import { Loader } from "lucide-react";
import { SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS, ENABLE_SOL_PAYMENTS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { Artist, Album, AlbumSaleTypeOption } from "libs/types";
import { toastSuccess } from "libs/utils";
import { fetchSolPrice, logPaymentToAPI, mintAlbumOrFanNFTAfterPaymentViaAPI, sleep } from "libs/utils/misc";
import { useAccountStore } from "store/account";
import PurchaseOptions from "./PurchaseOptions";

export const BuyAndMintAlbumUsingSOL = ({
  onCloseModal,
  artistProfile,
  albumToBuyAndMint,
}: {
  onCloseModal: (isMintingSuccess: boolean) => void;
  artistProfile: Artist;
  albumToBuyAndMint: Album;
}) => {
  const { connection } = useConnection();
  const { sendTransaction, signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [albumSaleTypeOption, setAlbumSaleTypeOption] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [mintingStatus, setMintingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [digitalAlbumOnlyPurchaseStatus, setDigitalAlbumOnlyPurchaseStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const tweetText = `url=${encodeURIComponent(`https://sigmamusic.fm?artist=${artistProfile.slug}`)}&text=${encodeURIComponent(
    `I just bought ${albumToBuyAndMint.title} by ${artistProfile.name} on @SigmaXMusic and I'm excited to stream it!`
  )}`;
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!albumToBuyAndMint || !albumToBuyAndMint._buyNowMeta || !albumSaleTypeOption) {
      return;
    }

    const fetchPrice = async () => {
      try {
        const { currentSolPrice } = await fetchSolPrice();

        // Calculate required SOL amount based on USD price
        const solAmount =
          Number(albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta]?.priceInUSD) / currentSolPrice;
        setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
  }, [albumToBuyAndMint, albumSaleTypeOption]);

  // Add effect to fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      try {
        const balance = await connection.getBalance(publicKey);
        setWalletBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  const handlePaymentConfirmation = async () => {
    if (!publicKey || !requiredSolAmount) return;

    // handlePaymentConfirmation_Simulate();

    // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage,
      publicKey,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    setPaymentStatus("processing");

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS),
          lamports: Math.round(requiredSolAmount * 1e9), // Convert SOL to lamports and ensure integer
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      const strategy: TransactionConfirmationStrategy = {
        signature: signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      };

      await connection.confirmTransaction(strategy, "finalized" as Commitment);

      // Log payment to web2 API
      const _logPaymentToAPIResponse = await logPaymentToAPI({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        payer: publicKey.toBase58(),
        tx: signature,
        task: "buyAlbum",
        type: "sol",
        amount: requiredSolAmount.toString(),
        priceInUSD: albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta]?.priceInUSD,
        creatorWallet: artistProfile.creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        albumId: albumToBuyAndMint.albumId,
        albumSaleTypeOption: AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption],
      });

      if (_logPaymentToAPIResponse.error) {
        throw new Error(_logPaymentToAPIResponse.errorMessage || "Payment failed");
      }

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      if (AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption1) {
        // user is buying ONLY the digital album so we dont need minting
        setDigitalAlbumOnlyPurchaseStatus("processing");

        await sleep(3);

        toastSuccess("Album Purchase Successful!", true);

        // need to pull it out of the ui thread of for some reason the confetti goes first
        setTimeout(() => {
          setDigitalAlbumOnlyPurchaseStatus("confirmed");
          showSuccessConfetti();
        }, 500);
      } else {
        // for all other options, we need to mint the album as well
        handleMinting({ paymentMadeTx: signature, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again - " + (error as Error).message);
      setPaymentStatus("idle");
    }
  };

  /*
  const handlePaymentConfirmation_Simulate = async () => {
    if (!publicKey || !requiredSolAmount) return;

    setPaymentStatus("processing");

    try {
      await sleep(3);

      // Log payment to web2 API

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      handleMinting_Simulate();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
      setPaymentStatus("idle");
    }
  };
  */

  const handleMinting = async ({ paymentMadeTx, solSignature, signatureNonce }: { paymentMadeTx: string; solSignature: string; signatureNonce: string }) => {
    setMintingStatus("processing");

    try {
      // Mint the music
      const _mintAlbumNFTAfterPaymentResponse = await mintAlbumOrFanNFTAfterPaymentViaAPI({
        solSignature,
        signatureNonce,
        mintForSolAddr: publicKey?.toBase58(),
        paymentHash: paymentMadeTx,
        nftType: "album",
        creatorWallet: artistProfile.creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        albumId: albumToBuyAndMint.albumId,
      });

      if (_mintAlbumNFTAfterPaymentResponse.error) {
        throw new Error(_mintAlbumNFTAfterPaymentResponse.errorMessage || "Minting failed");
      }

      // sleep for an extra 10 seconds after success to the RPC indexing can update
      await sleep(10);

      toastSuccess("Minting Successful!", true);
      setMintingStatus("confirmed");

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Error: Minting seems to have failed - " + (error as Error).message);
      setBackendErrorMessage((error as Error).message);
      setMintingStatus("failed");
    }
  };

  /*
  const handleMinting_Simulate = async () => {
    setMintingStatus("processing");

    try {
      // Mint the Collectible
      // await mintNFTAfterPaymentAPI({
      //   payer: publicKey.toBase58(),
      //   tx: signature,
      //   nftType: "fan",
      //   creatorWallet: artistProfile.creatorPaymentsWallet,
      //   membershipId: membershipId,
      //   creatorSlug: artistSlug,
      // });
      await sleep(5);
      // throw new Error("Minting failed");
      toastSuccess("Minting Successful!", true);
      setMintingStatus("confirmed");
      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Minting failed:", error);
      setMintingStatus("failed");
    }
  };
  */

  const handlePaymentAndMint = async (_albumSaleTypeOption: string) => {
    if (!publicKey?.toBase58()) {
      return;
    }

    setAlbumSaleTypeOption(_albumSaleTypeOption);
    setShowPaymentConfirmation(true);
  };

  const showSuccessConfetti = async () => {
    const animation = await confetti({
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      particleCount: 200,
      scalar: 2,
      shapes: ["emoji", "circle", "square"],
      shapeOptions: {
        emoji: {
          value: ["💎", "⭐", "✨", "💫"],
        },
      },
    });

    if (animation) {
      await sleep(10);
      animation.stop();
      if ((animation as any).destroy) {
        (animation as any).destroy();
      }
    }
  };

  // Payment confirmation popup
  const PaymentConfirmationPopup = () => (
    <>
      {albumSaleTypeOption ? (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{paymentStatus === "idle" ? "Confirm Payment" : "Payment Transfer in Process..."}</h3>
            <div className="space-y-4">
              <p>
                Amount to pay: {requiredSolAmount ?? "..."} SOL ($
                {Number(albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta]?.priceInUSD)})
              </p>
              <p>Your wallet balance: {walletBalance?.toFixed(4) ?? "..."} SOL</p>

              {paymentStatus === "idle" && <p>When you click "Proceed", you will be asked to sign a single transaction to send the payment.</p>}

              {paymentStatus === "processing" ? (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-500">Payment in process... do not close this page</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button onClick={() => setShowPaymentConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePaymentConfirmation}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                    disabled={isSolPaymentsDisabled || !requiredSolAmount}>
                    Proceed
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  function resetStateToPristine() {
    setShowPaymentConfirmation(false);
    setPaymentStatus("idle");
    setMintingStatus("idle");
    setDigitalAlbumOnlyPurchaseStatus("idle");
    setBackendErrorMessage(null);
    setAlbumSaleTypeOption(null);
  }

  let isSolPaymentsDisabled = !ENABLE_SOL_PAYMENTS || ENABLE_SOL_PAYMENTS !== "1";

  function musicAssetProcurementFullyDone() {
    return mintingStatus === "confirmed" || digitalAlbumOnlyPurchaseStatus === "confirmed";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showPaymentConfirmation && <PaymentConfirmationPopup />}

      <div
        className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4   ${musicAssetProcurementFullyDone() ? "max-w-lg" : "grid grid-cols-1 md:grid-cols-2 max-w-6xl"} gap-6`}>
        {/* Close button  */}
        {(paymentStatus === "idle" || mintingStatus === "failed" || musicAssetProcurementFullyDone()) && (
          <button
            onClick={() => {
              resetStateToPristine();
              onCloseModal(musicAssetProcurementFullyDone());
            }}
            className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
            ✕
          </button>
        )}

        {mintingStatus !== "confirmed" && digitalAlbumOnlyPurchaseStatus !== "confirmed" && (
          <>
            {/* Left Column - Album Details */}
            <div className="flex flex-col items-center justify-center h-full p-2">
              <div className="mb-2 w-full">
                <h2 className={` ${paymentStatus === "idle" ? "!text-3xl" : "!text-2xl"} text-center font-bold`}>
                  {paymentStatus === "idle" ? "Buy Album" : "Minting Album..."}
                </h2>
              </div>

              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="flex flex-col items-center p-4 shadow-xl w-full">
                  <div className="relative group mb-6 flex justify-center w-full">
                    <img
                      src={albumToBuyAndMint.img}
                      alt={albumToBuyAndMint.title}
                      className="w-40 h-40 md:w-56 md:h-56 lg:w-80 lg:h-80 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02] mx-auto"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="text-center space-y-4 w-full">
                    <h3 className="text-xl md:text-2  xl font-bold text-white">
                      <span className="text-yellow-400">{albumToBuyAndMint.title}</span> by <span className="text-yellow-400">{artistProfile.name}</span>
                    </h3>
                  </div>
                </div>
              </div>

              {mintingStatus === "processing" && (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg col-span-2">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-500">Collectible Minting in process... do not close this page</p>
                </div>
              )}
            </div>

            {/* Right Column - Purchase Options */}
            <PurchaseOptions
              isPaymentsDisabled={isSolPaymentsDisabled}
              handlePaymentAndMint={handlePaymentAndMint}
              buyNowMeta={albumToBuyAndMint._buyNowMeta}
              disableActions={mintingStatus === "processing" || digitalAlbumOnlyPurchaseStatus === "processing"}
            />

            {backendErrorMessage && (
              <div className="flex flex-col gap-4 col-span-2">
                <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
              </div>
            )}

            {mintingStatus === "failed" && (
              <div className="flex flex-col gap-4 col-span-2">
                <div className="text-center">
                  <p className="bg-red-500 p-4 rounded-lg text-sm">
                    Error! Minting seems to have failed. We are looking into it. Please also wait a few minutes, return back to the artist profile and reload
                    the page to check if the Music Collectible has been minted (as sometime blockchain can be congested). If it still doesn't show up, please DM
                    us on telegram:{" "}
                    <a className="underline" href="http://t.me/SigmaXMusicOfficial" target="_blank" rel="noopener noreferrer">
                      http://t.me/SigmaXMusicOfficial
                    </a>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    resetStateToPristine();
                    onCloseModal(false);
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity m-auto">
                  Back to Artist Page
                </Button>
              </div>
            )}
          </>
        )}

        {musicAssetProcurementFullyDone() && (
          <>
            <div className="space-y-4 flex flex-col items-center w-full">
              <h2 className={`!text-2xl text-center font-bold`}>
                Success! You can now stream <span className="text-yellow-400">{albumToBuyAndMint.title}</span> by{" "}
                <span className="text-yellow-400">{artistProfile.name}</span>!
              </h2>

              <Button
                onClick={() => {
                  resetStateToPristine();
                  onCloseModal(true);
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Back to Artist Page
              </Button>

              <div className="bg-black rounded-full p-[10px] -z-1 ">
                <a
                  className="z-1 bg-black text-white  rounded-3xl gap-2 flex flex-row justify-center items-center"
                  href={"https://twitter.com/intent/tweet?" + tweetText}
                  data-size="large"
                  target="_blank"
                  rel="noreferrer">
                  <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                    </svg>
                  </span>
                  <p className="z-10">Share this news on X</p>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
