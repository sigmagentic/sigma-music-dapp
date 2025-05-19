import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader, ChevronUp, ChevronDown } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Button } from "libComponents/Button";
import StripeCheckoutFormFanMembership from "libs/stripe/StripeCheckoutFormFanMembership";
import { getApiWeb2Apps } from "libs/utils/misc";
import { convertTokenImageUrl } from "libs/utils/ui";
import { tierData } from "./tierData";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const JoinInnerCircleCC = ({
  onCloseModal,
  artistName,
  artistSlug,
  creatorPaymentsWallet,
  membershipId,
  artistId,
  creatorFanMembershipAvailability,
}: {
  onCloseModal: () => void;
  artistName: string;
  artistSlug: string;
  creatorPaymentsWallet: string;
  membershipId: string;
  artistId: string;
  creatorFanMembershipAvailability: Record<string, any>;
}) => {
  const { publicKey } = useSolanaWallet();
  const [showStripePaymentPopup, setShowStripePaymentPopup] = useState(false);
  const [paymentIntentReceived, setPaymentIntentReceived] = useState(false);
  const [fetchingPaymentIntent, setFetchingPaymentIntent] = useState(false);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const { userInfo } = useWeb3Auth();

  const MAX_QUANTITY = 10;
  const MIN_QUANTITY = 1;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > MAX_QUANTITY) {
      setTotalQuantity(MIN_QUANTITY);
    } else if (newQuantity < MIN_QUANTITY) {
      setTotalQuantity(MAX_QUANTITY);
    } else {
      setTotalQuantity(newQuantity);
    }
  };

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // useEffect(() => {
  //   if (!publicKey || !creatorPaymentsWallet || !membershipId) return;

  //   const intentExtraParams: Record<string, any> = {
  //     amountToPay: (tierData[membershipId].defaultPriceUSD * totalQuantity).toString(),
  //     type: "fan",
  //     creatorAndMembershipTierId: `fan-${creatorPaymentsWallet.trim().toLowerCase()}-${artistId.trim()}-${membershipId}`,
  //     artistSlug,
  //     artistName,
  //     buyerSolAddress: publicKey.toBase58(),
  //     totalQuantity: totalQuantity.toString(),
  //   };

  //   if (userInfo.email) {
  //     intentExtraParams.accountEmail = userInfo.email;
  //   }

  //   // Fetch payment intent clientSecret from your backend
  //   fetch(`${getApiWeb2Apps()}/datadexapi/sigma/paymentCreateIntent`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(intentExtraParams),
  //   })
  //     .then((res) => {
  //       if (!res.ok) {
  //         throw new Error(`HTTP error! status: ${res.status}`);
  //       }
  //       return res.json();
  //     })
  //     .then((data) => {
  //       setClientSecret(data.clientSecret);
  //       setPaymentIntentReceived(true);
  //     })
  //     .catch((error) => {
  //       console.error("Error creating payment intent:", error);
  //       setBackendErrorMessage("Failed to initialize payment. Please try again later.");
  //     });
  // }, [publicKey, creatorPaymentsWallet, membershipId]);

  useEffect(() => {
    if (paymentIntentReceived && clientSecret && clientSecret !== "" && !fetchingPaymentIntent) {
      setShowStripePaymentPopup(true);
    }
  }, [paymentIntentReceived, clientSecret, fetchingPaymentIntent]);

  function createPaymentIntentForThisPayment() {
    if (!publicKey || !creatorPaymentsWallet || !membershipId) return;
    setFetchingPaymentIntent(true);

    const intentExtraParams: Record<string, any> = {
      amountToPay: (tierData[membershipId].defaultPriceUSD * totalQuantity).toString(),
      type: "fan",
      creatorAndMembershipTierId: `fan-${creatorPaymentsWallet.trim().toLowerCase()}-${artistId.trim()}-${membershipId}`,
      artistSlug,
      artistName,
      buyerSolAddress: publicKey.toBase58(),
      totalQuantity: totalQuantity.toString(),
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
    const tokenImg = convertTokenImageUrl(creatorFanMembershipAvailability[membershipId]?.tokenImg);

    return () => (
      <>
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              // Fully customizable with appearance API.
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
                    $ {(tierData[membershipId].defaultPriceUSD * totalQuantity).toFixed(2)} USD {totalQuantity > 1 && `for ${totalQuantity} items`}
                  </span>
                  <div className="mt-2">
                    <StripeCheckoutFormFanMembership
                      membershipProfile={{
                        artistSlug,
                        artistName,
                        membershipId,
                        artistId,
                        tokenImg,
                        membershipPriceUSD: tierData[membershipId].defaultPriceUSD * totalQuantity,
                        membershipLabel: tierData[membershipId].label,
                        creatorPaymentsWallet,
                        totalQuantity,
                      }}
                      closeStripePaymentPopup={() => {
                        setPaymentIntentReceived(false);
                        setShowStripePaymentPopup(false);
                        setClientSecret("");
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
  }, [clientSecret, artistName, artistSlug, membershipId, creatorPaymentsWallet]);

  function resetStateToPristine() {
    setBackendErrorMessage(null);
    setClientSecret("");
  }

  let isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";

  const tokenImg = convertTokenImageUrl(creatorFanMembershipAvailability[membershipId]?.tokenImg);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showStripePaymentPopup && <StripePaymentPopup />}
      <div className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6`}>
        {/* Close button  */}
        <button
          onClick={() => {
            resetStateToPristine();
            onCloseModal();
          }}
          className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        <div className="md:col-span-2">
          <div className="mb-2">
            <h2 className={`!text-2xl text-center font-bold`}>Join {artistName}'s Inner Circle</h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="token-img flex flex-col items-center p-3 ">
            <div className="relative group w-full h-full">
              <img
                src={tokenImg}
                alt={tierData[membershipId]?.label.toUpperCase()}
                className="w-48 h-48 lg:w-[400px] lg:h-[400px] m-auto object-cover rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>

        <div className="token-info-and-buy flex flex-col gap-2 text-sm items-center justify-center">
          <div className="text-center space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-white">{tierData[membershipId]?.label.toUpperCase()}</h3>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  $ {(tierData[membershipId].defaultPriceUSD * totalQuantity).toFixed(2)} USD
                </span>
                {totalQuantity > 1 && <span className="text-sm text-gray-400">for {totalQuantity}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs items-center justify-center mt-2">
            <label className="text-sm font-medium text-gray-300">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(totalQuantity - 1)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={totalQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || MIN_QUANTITY)}
                min={MIN_QUANTITY}
                max={MAX_QUANTITY}
                className="w-16 text-center bg-gray-800 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xl"
              />
              <button
                onClick={() => handleQuantityChange(totalQuantity + 1)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm lg:mt-5">
            <p>
              <span className="font-bold text-yellow-400">What are you buying?</span> Access to join the Inner Circle fan collectible of {artistName} and
              receive exclusive content and perks.
            </p>
            <p>
              <span className="font-bold text-yellow-400">Terms of Sale:</span> By clicking "Proceed", you agree to these{" "}
              <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                Terms
              </a>
            </p>
            {totalQuantity > 1 && (
              <p>
                <span className="font-bold text-yellow-400">Multiple Memberships:</span> When buying multiple memberships, you'll receive one immediately and
                the rest within 24 hours.{" "}
                <a className="underline" href="https://sigmamusic.fm/legal#multiple-memberships" target="_blank" rel="noopener noreferrer">
                  Learn more
                </a>
              </p>
            )}
            <p className="text-xs text-gray-400">Payments are processed securely by Stripe. Click on Proceed when ready to pay.</p>
          </div>

          {isCCPaymentsDisabled && (
            <div className="flex gap-4 bg-red-600 p-4 rounded-lg text-sm">
              <p className="text-white">CC payments are currently disabled. Please try again later.</p>
            </div>
          )}

          {backendErrorMessage && (
            <div className="flex flex-col gap-4">
              <p className="bg-red-600 p-4 rounded-lg text-sm">⚠️ {backendErrorMessage}</p>
            </div>
          )}

          <div className="flex gap-4 lg:mt-5">
            <Button
              onClick={() => {
                resetStateToPristine();
                onCloseModal();
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700">
              Cancel
            </Button>
            <Button
              onClick={() => {
                // setShowStripePaymentPopup(true);
                createPaymentIntentForThisPayment();
              }}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
              disabled={isCCPaymentsDisabled || fetchingPaymentIntent}>
              {fetchingPaymentIntent ? <Loader className="animate-spin" /> : "Proceed"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
