import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Button } from "libComponents/Button";
import StripeCheckoutFormAlbum from "libs/stripe/StripeCheckoutFormAlbum";
import { Artist, Album } from "libs/types";
import { getApiWeb2Apps } from "libs/utils/misc";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const BuyAndMintAlbumUsingCC = ({
  onCloseModal,
  artistProfile,
  albumToBuyAndMint,
}: {
  onCloseModal: () => void;
  artistProfile: Artist;
  albumToBuyAndMint: Album;
}) => {
  const { publicKey } = useSolanaWallet();
  const [showStripePaymentPopup, setShowStripePaymentPopup] = useState(false);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const { userInfo } = useWeb3Auth();

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
    if (!publicKey) return;

    const intentExtraParams: Record<string, any> = {
      amountToPay: albumToBuyAndMint._buyNowMeta?.priceInUSD,
      type: "album",
      albumId: albumToBuyAndMint.albumId,
      artistSlug: artistProfile.slug,
      artistName: artistProfile.name,
      buyerSolAddress: publicKey.toBase58(),
    };

    if (userInfo.email) {
      intentExtraParams.accountEmail = userInfo.email;
    }

    // Fetch payment intent clientSecret from your backend
    fetch(`${getApiWeb2Apps()}/datadexapi/sigma/paymentCreateIntent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(intentExtraParams),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setClientSecret(data.clientSecret))
      .catch((error) => {
        console.error("Error creating payment intent:", error);
        setBackendErrorMessage("Failed to initialize payment. Please try again later.");
      });
  }, [publicKey, albumToBuyAndMint.albumId]);

  const StripePaymentPopup = useMemo(() => {
    return () => (
      <>
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
              },
            }}>
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
              <div className="relative bg-[#1A1A1A] rounded-lg p-6 max-w-md md:max-w-lg w-full mx-4">
                <div
                  className="max-h-[550px] overflow-x-hidden overflow-y-auto p-[15px] 
                  [&::-webkit-scrollbar]:h-2
                dark:[&::-webkit-scrollbar-track]:bg-neutral-700
                dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                  <h3 className="text-xl font-bold mb-4">Secure Payment</h3>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    $ {albumToBuyAndMint._buyNowMeta?.priceInUSD} USD
                  </span>
                  <div className="mt-2">
                    <StripeCheckoutFormAlbum
                      artistProfile={artistProfile}
                      albumToBuyAndMint={albumToBuyAndMint}
                      priceInUSD={albumToBuyAndMint._buyNowMeta?.priceInUSD || null}
                      closeStripePaymentPopup={() => {
                        setShowStripePaymentPopup(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Elements>
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin" />
              <p className="text-white text-sm font-bold">Loading payment gateway...</p>
            </div>
          </div>
        )}
      </>
    );
  }, [clientSecret, artistProfile, albumToBuyAndMint]);

  function resetStateToPristine() {
    setBackendErrorMessage(null);
    setClientSecret("");
  }

  let isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showStripePaymentPopup && <StripePaymentPopup />}
      <div className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1 md:grid-cols-1 max-w-xl gap-6`}>
        {/* Close button  */}
        <button
          onClick={() => {
            resetStateToPristine();
            onCloseModal();
          }}
          className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        <div>
          <div className="mb-2">
            <h2 className={`!text-2xl text-center font-bold`}>Buy Premium Music Album</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center p-3 shadow-xl">
              <div className="relative group mb-6">
                <img
                  src={albumToBuyAndMint.img}
                  alt={albumToBuyAndMint.title}
                  className="w-32 h-32 md:w-48 md:h-48 lg:w-52 lg:h-52 object-cover rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {albumToBuyAndMint.title} by <span className="text-gray-400">{artistProfile.name}</span>
                </h3>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      $ {albumToBuyAndMint._buyNowMeta?.priceInUSD} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {backendErrorMessage && (
              <div className="flex flex-col gap-4">
                <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 text-sm">
              <p>
                <span className="font-bold text-yellow-400">What are you buying?</span> Access to stream the premium music album with all hidden bonus tracks
                unlocked and an exclusive copy of the album as an NFT collectible.
              </p>
              <p>
                <span className="font-bold text-yellow-400">Terms of Sale:</span> By clicking "Proceed", you agree to these{" "}
                <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                  Terms
                </a>
                .
              </p>
              <p className="text-xs text-gray-400">Payments are processed securely by Stripe. Click on Proceed when ready to pay.</p>
            </div>

            {isCCPaymentsDisabled && (
              <div className="flex gap-4 bg-red-500 p-4 rounded-lg text-sm">
                <p className="text-white">CC payments are currently disabled. Please try again later.</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  resetStateToPristine();
                  onCloseModal();
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
              <Button
                onClick={() => setShowStripePaymentPopup(true)}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                disabled={isCCPaymentsDisabled}>
                Proceed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
