import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader } from "lucide-react";
import { LuSpeaker } from "react-icons/lu";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS, DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import StripeCheckoutFormXP from "libs/stripe/StripeCheckoutFormXP";
import { getApiWeb2Apps } from "libs/utils";
import { useNftsStore } from "store/nfts";
import useSolBitzStore from "store/solBitz";
import { usePreventScroll } from "hooks";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// XP purchase options configuration
const XP_PURCHASE_OPTIONS = [
  { id: "1000", priceInUSD: 1, label: "1,000 XP" },
  { id: "5000", priceInUSD: 5, label: "5,000 XP" },
  { id: "10000", priceInUSD: 10, label: "10,000 XP" },
  { id: "25000", priceInUSD: 25, label: "25,000 XP" },
  { id: "100000", priceInUSD: 100, label: "100,000 XP" },
];

export const BuyXPUsingCC = ({ onCloseModal }: { onCloseModal: () => void }) => {
  const { publicKey } = useSolanaWallet();
  const addressSol = publicKey?.toBase58();
  const [showStripePaymentPopup, setShowStripePaymentPopup] = useState(false);
  const [paymentIntentReceived, setPaymentIntentReceived] = useState(false);
  const [fetchingPaymentIntent, setFetchingPaymentIntent] = useState(false);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const { userInfo } = useWeb3Auth();
  const [selectedXPOption, setSelectedXPOption] = useState<string>("1000");
  const [commitedXPOption, setCommitedXPOption] = useState<string | null>(null); // XP they ready to buy via the CC
  const bitzBalance = useSolBitzStore((state: any) => state.bitzBalance);
  const { solBitzNfts } = useNftsStore();

  // Get the selected option details
  const selectedOption = XP_PURCHASE_OPTIONS.find((option) => option.id === selectedXPOption);

  usePreventScroll(); // Prevent scrolling on non-mobile screens on view

  useEffect(() => {
    if (commitedXPOption) {
      createPaymentIntentForThisPayment();
    }
  }, [commitedXPOption]);

  useEffect(() => {
    if (paymentIntentReceived && clientSecret && clientSecret !== "" && !fetchingPaymentIntent) {
      setShowStripePaymentPopup(true);
    }
  }, [paymentIntentReceived, clientSecret, fetchingPaymentIntent]);

  function createPaymentIntentForThisPayment() {
    if (!publicKey || !commitedXPOption) return;
    setFetchingPaymentIntent(true);

    const amountToPay = XP_PURCHASE_OPTIONS.find((option) => option.id === commitedXPOption)?.priceInUSD;

    if (!amountToPay) {
      setBackendErrorMessage("Failed to initialize payment. Please try again later.");
      setFetchingPaymentIntent(false);
      return;
    }

    const intentExtraParams: Record<string, any> = {
      amountToPay: amountToPay.toString(),
      type: "xp",
      buyerSolAddress: publicKey.toBase58(),
      XPTx: `${commitedXPOption} for ${amountToPay}$`,
    };

    if (userInfo?.email) {
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

  const handleCheckout = () => {
    if (selectedOption) {
      setBackendErrorMessage(null);
      setCommitedXPOption(selectedOption.id);
    }
  };

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
                    $ {selectedOption?.priceInUSD.toFixed(2)}
                    &nbsp;USD
                  </span>
                  <div className="mt-2">
                    <StripeCheckoutFormXP
                      priceInUSD={selectedOption?.priceInUSD.toString() || "0"}
                      commitedXPOption={commitedXPOption}
                      XPCollectionIdToUse={XPCollectionIdToUse}
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
  }, [clientSecret, selectedOption]);

  function resetStateToPristine() {
    setBackendErrorMessage(null);
    setClientSecret("");
    setCommitedXPOption(null);
    setShowStripePaymentPopup(false);
    setPaymentIntentReceived(false);
    setFetchingPaymentIntent(false);
    setSelectedXPOption("1000");
  }

  let isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";
  const XPCollectionIdToUse = !addressSol || solBitzNfts.length === 0 ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-start md:items-center md:justify-center z-50">
      {showStripePaymentPopup && <StripePaymentPopup />}

      <div
        className={`purchase-xp-modal relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1 md:grid-cols-1 max-w-xl max-h-[90vh] md:max-h-none overflow-x-hidden overflow-y-auto md:overflow-y-visible`}>
        {/* Close button  */}
        <button
          onClick={() => {
            resetStateToPristine();
            onCloseModal();
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        <div className="flex flex-col items-center justify-center h-full p-2">
          <div className="mb-2 w-full">
            <h2 className="!text-3xl text-center font-bold">Purchase Sigma XP Boost</h2>
          </div>

          <div className="mb-6 flex flex-row items-center w-full justify-center">
            <p className="text-gray-400 text-sm">Current XP Balance:</p>
            <div className="text-yellow-300 flex flex-row items-center ml-2">
              {bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <>0</> : <>{bitzBalance}</>}</>}
              <LuSpeaker fontSize="1.4rem" className="ml-1" />
            </div>
          </div>

          {/* XP Purchase Options */}
          <div className="w-full space-y-2 mb-6">
            {XP_PURCHASE_OPTIONS.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedXPOption(option.id)}
                className={`flex flex-row items-center justify-between w-full p-2.5 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedXPOption === option.id
                    ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20"
                    : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                }`}>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedXPOption === option.id ? "border-yellow-400 bg-yellow-400" : "border-gray-500"
                    }`}>
                    {selectedXPOption === option.id && <div className="w-2 h-2 rounded-full bg-black"></div>}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{option.label}</div>
                    <div className="text-yellow-400 font-medium text-xs">${option.priceInUSD.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Click to select</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-4 w-full">
            <button
              onClick={() => {
                resetStateToPristine();
                onCloseModal();
              }}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={!selectedOption || fetchingPaymentIntent || isCCPaymentsDisabled}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {fetchingPaymentIntent ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                `Checkout - $${selectedOption?.priceInUSD.toFixed(2)}`
              )}
            </button>
          </div>

          <div className="space-y-4 w-full flex flex-col items-center mt-6">
            <div className="flex flex-col items-center p-4 w-full">
              <div className="text-xs text-center mt-[5px]">
                <p>
                  <span className="font-bold text-yellow-300">Terms of Sale:</span> By clicking "Checkout", you agree to these{" "}
                  <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                    Terms
                  </a>
                </p>
                <p className="text-xs text-gray-400">Payments are processed securely by Stripe.</p>
              </div>
            </div>
          </div>
        </div>

        {backendErrorMessage && (
          <div>
            <p className="bg-red-500 p-2 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
          </div>
        )}

        {isCCPaymentsDisabled && (
          <div className="flex gap-4 bg-red-500 p-2 rounded-lg text-sm">
            <p className="text-white">CC payments are currently disabled. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};
