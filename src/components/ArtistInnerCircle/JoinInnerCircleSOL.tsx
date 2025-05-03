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
import { toastSuccess } from "libs/utils";
import { fetchSolPrice, logPaymentToAPI, mintAlbumOrFanNFTAfterPaymentViaAPI, sleep } from "libs/utils/misc";
import { useAccountStore } from "store/account";
import { tierData } from "./tierData";

export const JoinInnerCircleSOL = ({
  onCloseModal,
  artistName,
  artistSlug,
  creatorPaymentsWallet,
  membershipId,
  creatorFanMembershipAvailability,
  artistId,
}: {
  onCloseModal: (isMintingSuccess: boolean) => void;
  artistName: string;
  artistSlug: string;
  creatorPaymentsWallet: string;
  membershipId: string;
  creatorFanMembershipAvailability: Record<string, any>;
  artistId: string;
}) => {
  const { connection } = useConnection();
  const { sendTransaction, signMessage } = useWallet();
  const { publicKey, walletType } = useSolanaWallet();
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [mintingStatus, setMintingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const tweetText = `url=${encodeURIComponent(`https://sigmamusic.fm/?artist=${artistSlug}&tab=fan`)}&text=${encodeURIComponent(
    `I just joined ${artistName}'s exclusive Inner Circle fan club on Sigma Music. Come and join me!`
  )}`;
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

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
    const fetchPrice = async () => {
      try {
        const { currentSolPrice } = await fetchSolPrice();

        // Calculate required SOL amount based on USD price
        const solAmount = tierData[membershipId].defaultPriceUSD / currentSolPrice;
        setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
  }, [membershipId]);

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
          lamports: requiredSolAmount * 1e9, // Convert SOL to lamports
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
        payer: publicKey.toBase58(),
        tx: signature,
        task: "joinFanClub",
        type: "sol",
        amount: requiredSolAmount.toString(),
        creatorWallet: creatorPaymentsWallet,
        membershipId: membershipId,
      });

      if (_logPaymentToAPIResponse.error) {
        throw new Error(_logPaymentToAPIResponse.errorMessage || "Payment failed");
      }

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      handleMinting({ paymentMadeTx: signature, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce });
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again - " + (error as Error).message);
      setPaymentStatus("idle");
    }
  };

  const handlePaymentConfirmation_Simulate = async () => {
    if (!publicKey || !requiredSolAmount) return;

    setPaymentStatus("processing");

    try {
      await sleep(3);

      // Update payment transaction hash
      // setPaymentTx("simulated-signature");

      // Log payment to web2 API

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      handleMinting_Simulate();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
      setMintingStatus("failed");
    }
  };

  const handleMinting = async ({ paymentMadeTx, solSignature, signatureNonce }: { paymentMadeTx: string; solSignature: string; signatureNonce: string }) => {
    setMintingStatus("processing");

    try {
      // Mint the NFT
      const _mintNFTAfterPaymentResponse = await mintAlbumOrFanNFTAfterPaymentViaAPI({
        solSignature,
        signatureNonce,
        mintForSolAddr: publicKey?.toBase58(),
        paymentHash: paymentMadeTx,
        nftType: "fan",
        creatorWallet: creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        membershipId: membershipId,
        artistId: artistId,
      });

      if (_mintNFTAfterPaymentResponse.error) {
        throw new Error(_mintNFTAfterPaymentResponse.errorMessage || "Minting failed");
      }

      // sleep for an extra 10 seconds after success to the RPC indexing can update
      await sleep(10);

      toastSuccess("Minting Successful!", true);
      setMintingStatus("confirmed");
      await showSuccessConfetti();
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Error: Minting seems to have failed");
      setBackendErrorMessage((error as Error).message);
      setMintingStatus("failed");
    }
  };

  const handleMinting_Simulate = async () => {
    setMintingStatus("processing");

    try {
      // Mint the NFT
      // await mintNFTAfterPaymentAPI({
      //   payer: publicKey.toBase58(),
      //   tx: signature,
      //   nftType: "fan",
      //   creatorWallet: creatorPaymentsWallet,
      //   membershipId: membershipId,
      //   creatorSlug: artistSlug,
      // });
      await sleep(5);

      toastSuccess("Minting Successful!", true);
      setMintingStatus("confirmed");
      await showSuccessConfetti();
    } catch (error) {
      console.error("Minting failed:", error);
      setMintingStatus("failed");
    }
  };

  const handlePaymentAndMint = async () => {
    if (!publicKey?.toBase58()) {
      return;
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">{paymentStatus === "idle" ? "Confirm Payment" : "Payment Transfer in Process..."}</h3>
        <div className="space-y-4">
          <p>
            Amount to pay: {requiredSolAmount ?? "..."} SOL (${tierData[membershipId]?.defaultPriceUSD} USD)
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
              <Button onClick={handlePaymentConfirmation} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                Proceed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function resetStateToPristine() {
    setShowPaymentConfirmation(false);
    setPaymentStatus("idle");
    setMintingStatus("idle");
    setBackendErrorMessage(null);
  }

  const tokenImg = creatorFanMembershipAvailability[membershipId]?.tokenImg || null;
  const isSolPaymentsDisabled = !ENABLE_SOL_PAYMENTS || ENABLE_SOL_PAYMENTS !== "1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showPaymentConfirmation && <PaymentConfirmationPopup />}

      <div
        className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1  ${paymentStatus === "idle" ? "md:grid-cols-2 max-w-5xl" : "md:grid-cols-1 max-w-xl"} gap-6`}>
        {/* Close button - moved outside the grid */}
        {(paymentStatus === "idle" || mintingStatus === "confirmed" || mintingStatus === "failed") && (
          <button
            onClick={() => {
              resetStateToPristine();
              onCloseModal(mintingStatus === "confirmed");
            }}
            className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
            ✕
          </button>
        )}

        {/* Left Column - Form */}
        {mintingStatus !== "confirmed" && (
          <div>
            <div className="mb-2">
              <h2 className={` ${paymentStatus === "idle" ? "!text-3xl" : "!text-2xl"} text-center font-bold`}>
                {paymentStatus === "idle" ? "Join Inner Circle" : "Minting Inner Circle Membership..."}
              </h2>
            </div>

            <div className="text-center text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {tierData[membershipId]?.label.toUpperCase()} Tier @ {requiredSolAmount ?? "..."} SOL (${tierData[membershipId]?.defaultPriceUSD} USD)
              {tierData[membershipId]?.term === "annual" ? " per year" : ""}
            </div>

            <div className="space-y-2">
              <div className="flex justify-center items-center w-full mb-6">
                <img src={tokenImg || ""} alt="Inner Circle NFT" className="w-32 h-32 md:w-72 md:h-72 object-cover rounded-lg" />
              </div>

              {mintingStatus === "processing" && (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-500">Minting in process... do not close this page</p>
                </div>
              )}

              {backendErrorMessage && (
                <div className="flex flex-col gap-4">
                  <p className="bg-red-600 p-4 rounded-lg text-sm">⚠️ {backendErrorMessage}</p>
                </div>
              )}

              {mintingStatus === "failed" && (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <p className="bg-red-500 p-4 rounded-lg text-sm">
                      Error! Minting seems to have failed. We are looking into it. Please also wait a few minutes, return back to the artist profile and reload
                      the page to check if the Music NFT has been minted (as sometime blockchain can be congested). If it still doesn't show up, please DM us on
                      telegram:{" "}
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

              {paymentStatus === "idle" && (
                <>
                  <div className="flex flex-col gap-4 text-center">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Wallet Address (for receiving the Membership NFT)</label>
                      <p className="text-sm">
                        <a
                          href={`https://solscan.io/account/${publicKey?.toBase58()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline">
                          {publicKey?.toBase58() || "..."}
                        </a>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Make sure payment ALSO comes from this wallet as we will verify this.</p>
                    </div>
                  </div>

                  {isSolPaymentsDisabled && (
                    <div className="flex gap-4 bg-red-600 p-4 rounded-lg text-sm">
                      <p className="text-white">SOL payments are currently disabled. Please try again later.</p>
                    </div>
                  )}

                  <Button
                    onClick={handlePaymentAndMint}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    disabled={isSolPaymentsDisabled}>
                    Make Payment and Mint NFT
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {mintingStatus === "confirmed" && (
          <div>
            <div className="mb-6"></div>

            <div className="space-y-4 flex flex-col items-center">
              <h2 className={`!text-2xl text-center font-bold`}>Success! Welcome to {artistName}'s Inner Circle!</h2>

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
                  <p className="z-10">Share this news on Twitter</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Right Column - Instructions */}
        {paymentStatus === "idle" && (
          <div className="bg-cyan-900 bg-opacity-20 rounded-lg flex flex-col gap-2 p-8">
            <p className="text-xl font-bold mb-4">How it works?</p>
            <p className="text-md mb-4">
              The inner circle fan membership is powered by NFT technology to ensure that it's fraud proof (no one can fake a membership) and it's shareable and
              tradable (i.e. you can give it to your friends or sell it).
            </p>
            <ul className="space-y-3 list-none">
              <li className="flex gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                Make a SOL payment of{" "}
                <span className="text-orange-600 contents">
                  {requiredSolAmount ?? "..."} SOL (${tierData[membershipId]?.defaultPriceUSD} USD)
                </span>{" "}
                to Sigma's wallet. This is used to pay for the membership tokenization
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400 font-bold">2.</span>
                The membership token will be sent to your wallet!
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
