import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import StripeCheckoutFormAlbum from "libs/stripe/StripeCheckoutFormAlbum";
import { Artist, Album, AlbumSaleTypeOption } from "libs/types";
import { getApiWeb2Apps } from "libs/utils/misc";
import PurchaseOptions from "./PurchaseOptions";

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
  const [paymentIntentReceived, setPaymentIntentReceived] = useState(false);
  const [fetchingPaymentIntent, setFetchingPaymentIntent] = useState(false);
  const [albumSaleTypeOption, setAlbumSaleTypeOption] = useState<string | null>(null);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const { userInfo } = useWeb3Auth();
  const [hoveredLargeSizeTokenImg, setHoveredLargeSizeTokenImg] = useState<string | null>(null);
  const [selectedLargeSizeTokenImg, setSelectedLargeSizeTokenImg] = useState<string | null>(null);

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
    if (albumSaleTypeOption && albumSaleTypeOption !== "") {
      createPaymentIntentForThisPayment();
    }
  }, [albumSaleTypeOption]);

  useEffect(() => {
    if (paymentIntentReceived && clientSecret && clientSecret !== "" && !fetchingPaymentIntent) {
      setShowStripePaymentPopup(true);
    }
  }, [paymentIntentReceived, clientSecret, fetchingPaymentIntent]);

  function createPaymentIntentForThisPayment() {
    if (!publicKey || !albumSaleTypeOption) return;
    setFetchingPaymentIntent(true);

    const intentExtraParams: Record<string, any> = {
      amountToPay: (() => {
        const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
        return typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
      })(),
      type: "album",
      albumId: albumToBuyAndMint.albumId,
      artistSlug: artistProfile.slug,
      artistName: artistProfile.name,
      buyerSolAddress: publicKey.toBase58(),
      albumSaleTypeOption: AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption],
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
      .then((data) => {
        setClientSecret(data.clientSecret);
        setPaymentIntentReceived(true);
        setFetchingPaymentIntent(false);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
        setBackendErrorMessage("Failed to initialize payment. Please try again later.");
        setFetchingPaymentIntent(false);
      });
  }

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
                    ${" "}
                    {(() => {
                      const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
                      return typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
                    })()}{" "}
                    USD
                  </span>
                  <div className="mt-2">
                    <StripeCheckoutFormAlbum
                      artistProfile={artistProfile}
                      albumToBuyAndMint={albumToBuyAndMint}
                      priceInUSD={(() => {
                        const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
                        return typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
                      })()}
                      albumSaleTypeOption={albumSaleTypeOption}
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
    setAlbumSaleTypeOption(null);
    setShowStripePaymentPopup(false);
    setPaymentIntentReceived(false);
    setFetchingPaymentIntent(false);
  }

  let isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showStripePaymentPopup && <StripePaymentPopup />}

      <div
        className={`purchase-music-modal relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1 md:grid-cols-2 max-w-6xl gap-6 max-h-[90vh] md:max-h-none overflow-x-hidden overflow-y-auto md:overflow-y-visible`}>
        {/* Close button  */}
        <button
          onClick={() => {
            resetStateToPristine();
            onCloseModal();
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        {/* Left Column - Album Details */}
        <div className="flex flex-col items-center justify-center h-full p-2">
          <div className="mb-2 w-full">
            <h2 className="!text-3xl text-center font-bold">Buy Album</h2>
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
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  <span className="text-yellow-300">{albumToBuyAndMint.title}</span> by <span className="text-yellow-300">{artistProfile.name}</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Purchase Options */}
        <div>
          <PurchaseOptions
            isPaymentsDisabled={isCCPaymentsDisabled}
            buyNowMeta={albumToBuyAndMint._buyNowMeta}
            disableActions={fetchingPaymentIntent}
            handlePaymentAndMint={(_albumSaleTypeOption: string) => {
              setAlbumSaleTypeOption(_albumSaleTypeOption);
            }}
            handleShowLargeSizeTokenImg={(tokenImg: string | null) => {
              setHoveredLargeSizeTokenImg(tokenImg);
            }}
          />
          <div className="text-xs text-right mt-[5px]">
            <p>
              <span className="font-bold text-yellow-300">Terms of Sale:</span> By clicking "Buy Now", you agree to these{" "}
              <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                Terms
              </a>
            </p>
            <p className="text-xs text-gray-400">Payments are processed securely by Stripe. Click on Proceed when ready to pay.</p>
          </div>
        </div>

        {backendErrorMessage && (
          <div className="flex flex-col gap-4 col-span-2">
            <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
          </div>
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
