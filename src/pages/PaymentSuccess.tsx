import React, { useEffect, useState } from "react";
import { confetti } from "@tsparticles/confetti";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BUY_AND_MINT_ALBUM_PRICE_IN_USD } from "config";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { getApiWeb2Apps, logPaymentToAPI, mintAlbumNFTAfterPayment, sleep } from "libs/utils/misc";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [albumImg, setAlbumImg] = useState<string | null>(null);
  const [albumTitle, setAlbumTitle] = useState<string | null>(null);
  const [albumArtist, setAlbumArtist] = useState<string | null>(null);
  const { signMessageViaWeb3Auth, isLoading: isWeb3AuthLoading, isConnected, connect } = useWeb3Auth();
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "confirmed" | "failed">("processing");
  const [paymentLogStatus, setPaymentLogStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [mintingStatus, setMintingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading"); // the overall status of the process
  const [error, setError] = useState<string | null>(null); // the error message if the process fails

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  useEffect(() => {
    useAppStore.getState().updatePaymentInProgress(true);
  }, []);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Wait for Web3Auth to initialize
        if (isWeb3AuthLoading) {
          return;
        }

        // Ensure user is connected
        if (!isConnected) {
          await connect();
        }

        const buyerSolAddress = searchParams.get("buyerSolAddress");
        const paymentIntentId = searchParams.get("payment_intent");
        const albumId = searchParams.get("albumId");
        const artistSlug = searchParams.get("artist");
        const _albumImg = searchParams.get("albumImg");
        const _albumTitle = searchParams.get("albumTitle");
        const _albumArtist = searchParams.get("albumArtist");
        const creatorWallet = searchParams.get("creatorWallet");

        setAlbumImg(_albumImg);
        setAlbumTitle(_albumTitle);
        setAlbumArtist(_albumArtist);

        console.log("albumId", albumId);
        console.log("artistSlug", artistSlug);
        console.log("albumImg", _albumImg);
        console.log("albumTitle", _albumTitle);
        console.log("albumArtist", _albumArtist);
        console.log("creatorWallet", creatorWallet);

        if (!paymentIntentId || !albumId) {
          throw new Error("Missing required parameters");
        }

        // Verify payment with backend
        const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/paymentVerifyPayment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });

        const result = await response.json();

        if (result.success) {
          setPaymentStatus("confirmed");
          setPaymentLogStatus("processing");

          // Log payment to web2 API
          try {
            const _logPaymentToAPIResponse = await logPaymentToAPI({
              payer: buyerSolAddress,
              tx: paymentIntentId,
              task: "buyAlbum",
              type: "cc",
              amount: BUY_AND_MINT_ALBUM_PRICE_IN_USD.toString(),
              creatorWallet: creatorWallet,
              albumId: albumId,
            });

            if (_logPaymentToAPIResponse.error) {
              setPaymentLogStatus("failed");
              throw new Error(_logPaymentToAPIResponse.errorMessage || "Payment failed");
            }
          } catch (e) {
            setPaymentLogStatus("failed");
            throw e;
          }

          setPaymentLogStatus("confirmed");
          setMintingStatus("processing");

          // Mint the music NFT
          try {
            const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
              solPreaccessNonce,
              solPreaccessSignature,
              solPreaccessTimestamp,
              signMessage: signMessageViaWeb3Auth,
              updateSolPreaccessNonce,
              updateSolSignedPreaccess,
              updateSolPreaccessTimestamp,
              forceNewSession: true,
            });

            const _mintAlbumNFTAfterPaymentResponse = await mintAlbumNFTAfterPayment({
              solSignature: usedPreAccessSignature,
              signatureNonce: usedPreAccessNonce,
              mintForSolAddr: buyerSolAddress,
              paymentHash: paymentIntentId, // in the db, we verify that paymentIntentId is not used multiple times
              nftType: "album",
              creatorWallet: creatorWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
              albumId: albumId,
              isCCPayment: "1",
            });

            if (_mintAlbumNFTAfterPaymentResponse.error) {
              setMintingStatus("failed");
              throw new Error(_mintAlbumNFTAfterPaymentResponse.errorMessage || "Minting failed");
            }
          } catch (e) {
            setMintingStatus("failed");
            throw e;
          }

          setMintingStatus("confirmed");

          // sleep for an extra 15 seconds after success to the RPC indexing can update
          await sleep(15);

          setStatus("success"); // everything was a success
          await showSuccessConfetti();

          useAppStore.getState().updatePaymentInProgress(false);
          navigate(`/?artist=${artistSlug}~${albumId}`);
        } else {
          setPaymentStatus("failed");
          throw new Error("Payment verification failed");
        }
      } catch (err) {
        useAppStore.getState().updatePaymentInProgress(false);
        setStatus("error");
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    verifyPayment();
  }, [searchParams, navigate, isWeb3AuthLoading, isConnected, connect]);

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

  return (
    <div className="min-h-[80dvh] flex items-center justify-center">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full grid grid-cols-1 md:grid-cols-2 max-w-xl gap-3">
        <div>
          <div className="">
            <h2 className={`!text-xl text-center font-bold`}>Purchase In Progress</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center p-3 shadow-xl">
              <div className="relative group mb-6">
                {albumImg ? (
                  <img
                    src={albumImg}
                    alt={albumTitle || ""}
                    className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 object-cover rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-lg shadow-2xl bg-gray-700 animate-pulse" />
                )}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {albumTitle} by <span className="text-gray-400">{albumArtist}</span>
                </h3>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      $ {BUY_AND_MINT_ALBUM_PRICE_IN_USD} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-black p-8 rounded-lg shadow-xl flex flex-col items-center justify-center">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="mt-4 text-white">
                {isWeb3AuthLoading && "Initializing Web3Auth..."}
                {paymentStatus === "processing" && "Verifying payment..."}
                {paymentLogStatus === "processing" && "Finalizing payment..."}
                {mintingStatus === "processing" && (
                  <>
                    <span>Minting Music NFT on the blockchain...</span>
                    <span className="text-gray-300 text-xs">This may take a few minutes.</span>
                  </>
                )}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h2>
              <p className="text-gray-300">Redirecting you back...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">✕</div>
              <h2 className="text-2xl font-bold text-white mb-2">Purchase Failed</h2>
              <p className="text-gray-300">{error}</p>

              <p className="mt-4 text-gray-300 text-xs">
                Find out where it went wrong:
                {paymentStatus === "confirmed" && (
                  <p>
                    <span className="text-green-500">✓</span> Payment verification success
                  </p>
                )}
                {paymentStatus === "failed" && (
                  <p>
                    <span className="text-red-500">✕</span> Payment verification failed
                  </p>
                )}
                {paymentLogStatus === "confirmed" && (
                  <p>
                    <span className="text-green-500">✓</span> Payment finalization success
                  </p>
                )}
                {paymentLogStatus === "failed" && (
                  <p>
                    <span className="text-red-500">✕</span> Payment finalization failed
                  </p>
                )}
                {mintingStatus === "failed" && (
                  <p>
                    <span className="text-red-500">✕</span> NFT minting failed
                  </p>
                )}
              </p>

              <button onClick={() => navigate(-1)} className="mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
