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
import { injectXUserNameIntoTweet, toastSuccess } from "libs/utils";
import { fetchSolPriceViaAPI, logPaymentToAPI, mintAlbumOrFanNFTAfterPaymentViaAPI, sleep } from "libs/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
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
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [hoveredLargeSizeTokenImg, setHoveredLargeSizeTokenImg] = useState<string | null>(null);
  const [selectedLargeSizeTokenImg, setSelectedLargeSizeTokenImg] = useState<string | null>(null);
  const [tweetText, setTweetText] = useState<string>("");
  const { artistLookupEverything } = useAppStore();
  const [notEnoughBalance, setNotEnoughBalance] = useState(true);

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
        const { currentSolPrice } = await fetchSolPriceViaAPI();

        // Calculate required SOL amount based on USD price
        const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
        const priceInUSD = typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
        const solAmount = Number(priceInUSD) / currentSolPrice;
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

  useEffect(() => {
    if (walletBalance && requiredSolAmount && walletBalance < requiredSolAmount) {
      setNotEnoughBalance(true);
    } else {
      setNotEnoughBalance(false);
    }
  }, [walletBalance, requiredSolAmount]);

  useEffect(() => {
    if (albumToBuyAndMint.title && albumToBuyAndMint.title !== "") {
      const findArtistUsingAlbumId = Object.values(artistLookupEverything).find((artist: Artist) =>
        artist.albums.find((album: Album) => album.albumId === albumToBuyAndMint.albumId)
      );

      const albumDeepSlug = `artist=${artistProfile.slug}~${albumToBuyAndMint.albumId}`;

      const tweetMsg = injectXUserNameIntoTweet(
        `I just bought ${albumToBuyAndMint.title} by ${artistProfile.name} _(xUsername)_on @SigmaXMusic and I'm excited to stream it!`,
        findArtistUsingAlbumId?.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?${albumDeepSlug}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [albumToBuyAndMint]);

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
        priceInUSD: (() => {
          const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
          return typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
        })(),
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

      // for priceOption1 and priceOption4, we dont need to mint the album
      if (AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption1) {
        // user is buying ONLY the digital album so we dont need minting
        setDigitalAlbumOnlyPurchaseStatus("processing");

        await sleep(3);

        toastSuccess("Digital Album Purchase Successful!", true);

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
      // if it's priceOption3, and we confirm again that we have an IpTokenId, then we need to use the commercial license mint metadata
      let useCommercialMusicAssetLicenseT2 = false;
      let onlyNeedCommercialLicenseSoBypassNftMinting = false;

      if (
        AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption3 ||
        AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption4
      ) {
        // we need to mint the commercial license
        useCommercialMusicAssetLicenseT2 = albumToBuyAndMint._buyNowMeta?.priceOption3?.IpTokenId ? true : false;

        if (AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption4) {
          onlyNeedCommercialLicenseSoBypassNftMinting = true;
        }
      }

      const mintParams: any = {
        solSignature,
        signatureNonce,
        mintForSolAddr: publicKey?.toBase58(),
        paymentHash: paymentMadeTx,
        nftType: "album",
        creatorWallet: artistProfile.creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        albumId: albumToBuyAndMint.albumId,
      };

      if (useCommercialMusicAssetLicenseT2) {
        mintParams.useCommercialMusicAssetLicenseT2 = "1";
      }

      if (onlyNeedCommercialLicenseSoBypassNftMinting) {
        // we need to mint the commercial license
        mintParams.onlyNeedCommercialLicenseSoBypassNftMinting = "1";
      }

      const _mintAlbumNFTAfterPaymentResponse = await mintAlbumOrFanNFTAfterPaymentViaAPI(mintParams);

      if (_mintAlbumNFTAfterPaymentResponse.error) {
        throw new Error(_mintAlbumNFTAfterPaymentResponse.errorMessage || "Minting failed");
      }

      // sleep for an extra 10 seconds after success to the RPC indexing can update
      await sleep(10);

      let responseMessage = "Minting Successful!";

      if (onlyNeedCommercialLicenseSoBypassNftMinting) {
        responseMessage = "Your on-chain commercial license is being processed and will be available in 'Your Collectibles Wallet' shortly.";
      }

      toastSuccess(responseMessage, true);
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
                {(() => {
                  const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
                  const priceInUSD = typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
                  return Number(priceInUSD);
                })()}
                )
              </p>
              <p>Your wallet balance: {walletBalance?.toFixed(4) ?? "..."} SOL</p>

              {paymentStatus === "idle" && <p>When you click "Proceed", you will be asked to sign a single transaction to send the payment.</p>}

              {paymentStatus === "processing" ? (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-300">Payment in process... do not close this page</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button onClick={() => setShowPaymentConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePaymentConfirmation}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                    disabled={isSolPaymentsDisabled || notEnoughBalance}>
                    Proceed
                  </Button>
                </div>
              )}

              {isSolPaymentsDisabled && (
                <div className="flex gap-4 bg-red-500 p-4 rounded-lg text-sm">
                  <p className="text-white">SOL payments are currently disabled. Please try again later.</p>
                </div>
              )}

              {notEnoughBalance && (
                <div className="flex-1 bg-red-500 text-white p-2 rounded-lg text-sm">
                  <p>You do not have enough SOL to purchase this album.</p>
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

  const mintingIsInCommercialLicensePathway = AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start md:items-center md:justify-center z-50">
      {showPaymentConfirmation && <PaymentConfirmationPopup />}

      <div
        className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 ${musicAssetProcurementFullyDone() ? "max-w-lg" : "grid grid-cols-1 md:grid-cols-2 max-w-6xl"} gap-6`}>
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
                <div className="flex flex-col items-center p-4 w-full">
                  <div className="relative group mb-6 flex justify-center w-full">
                    <div
                      className={`albumImg w-40 h-40 md:w-56 md:h-56 lg:w-80 lg:h-80 bg-no-repeat bg-cover rounded-md md:m-auto relative group ${hoveredLargeSizeTokenImg ? "cursor-pointer" : ""}`}
                      style={{
                        "backgroundImage": `url(${albumToBuyAndMint.img})`,
                      }}
                      onClick={() => {
                        // if there is a token image, show it in a large version
                        if (hoveredLargeSizeTokenImg) {
                          setSelectedLargeSizeTokenImg(hoveredLargeSizeTokenImg);
                        } else {
                          return;
                        }
                      }}>
                      {hoveredLargeSizeTokenImg && (
                        <>
                          <div className="absolute inset-0 bg-black opacity-[70%] group-hover:opacity-[80%] transition-opacity duration-300" />
                          <div
                            className="absolute inset-0 bg-no-repeat bg-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              "backgroundImage": `url(${hoveredLargeSizeTokenImg})`,
                              "backgroundPosition": "center",
                              "backgroundSize": "contain",
                            }}
                          />

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-300 pointer-events-none z-10">
                            <div
                              className="relative bg-black/90 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap before:absolute before:inset-0 before:rounded-lg before:border before:border-emerald-400/50 
                      after:absolute after:inset-0 after:rounded-lg after:border after:border-yellow-400/50">
                              This version of the album comes with this collectible!
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-center space-y-4 w-full">
                    <h3 className="text-xl md:text-2  xl font-bold text-white">
                      <span className="text-yellow-300">{albumToBuyAndMint.title}</span> by <span className="text-yellow-300">{artistProfile.name}</span>
                    </h3>
                  </div>
                </div>
              </div>

              {mintingStatus === "processing" && (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg col-span-2">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-300">
                    {mintingIsInCommercialLicensePathway
                      ? "License procurement processing... do not close this page"
                      : "Collectible Minting in process... do not close this page"}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Purchase Options */}
            <PurchaseOptions
              isPaymentsDisabled={isSolPaymentsDisabled}
              buyNowMeta={albumToBuyAndMint._buyNowMeta}
              disableActions={mintingStatus === "processing" || digitalAlbumOnlyPurchaseStatus === "processing"}
              handlePaymentAndMint={handlePaymentAndMint}
              handleShowLargeSizeTokenImg={(tokenImg: string | null) => {
                setHoveredLargeSizeTokenImg(tokenImg);
              }}
            />

            <div className="flex flex-col md:flex-row gap-2 col-span-2">
              {backendErrorMessage && (
                <div className="flex flex-col col-span-2 text-center">
                  <p className="bg-red-500 p-2 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
                </div>
              )}

              {mintingStatus === "failed" && (
                <div className="flex flex-col gap-2 col-span-2">
                  <div className="text-center">
                    <p className="bg-red-500 p-2 rounded-lg text-sm">
                      Error! Minting seems to have failed. We are looking into it. Please DM us on our support telegram:{" "}
                      <a className="underline" href="http://t.me/SigmaXMusicOfficial" target="_blank" rel="noopener noreferrer">
                        http://t.me/SigmaXMusicOfficial
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {mintingStatus === "failed" && (
                <Button
                  onClick={() => {
                    resetStateToPristine();
                    onCloseModal(false);
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity m-auto">
                  Back to Artist Page
                </Button>
              )}
            </div>
          </>
        )}

        {musicAssetProcurementFullyDone() && (
          <>
            <div className="space-y-4 flex flex-col items-center w-full">
              <h2 className={`!text-2xl text-center font-bold`}>
                Success! You can now stream <span className="text-yellow-300">{albumToBuyAndMint.title}</span> by{" "}
                <span className="text-yellow-300">{artistProfile.name}</span>!
              </h2>

              {mintingIsInCommercialLicensePathway && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  Your on-chain commercial license is being processed and will be available in 'Your Collectibles Wallet' shortly.
                </p>
              )}

              <Button
                onClick={() => {
                  resetStateToPristine();
                  onCloseModal(true);
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Back to Artist Page
              </Button>

              <div className="bg-yellow-300 rounded-full p-[10px] -z-1 ">
                <a
                  className="z-1 bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
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

        {/* Show larger profile or token image modal */}
        {selectedLargeSizeTokenImg && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
              <img src={selectedLargeSizeTokenImg} alt="Membership Token" className="w-[75%] h-auto m-auto rounded-lg" />
              <div>
                <button
                  onClick={() => {
                    setSelectedLargeSizeTokenImg(null);
                  }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
