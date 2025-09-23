import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader, ChevronUp, ChevronDown } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS, ONE_USD_IN_XP } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Button } from "libComponents/Button";
import StripeCheckoutFormFanMembership from "libs/stripe/StripeCheckoutFormFanMembership";
import { getApiWeb2Apps, mintAlbumOrFanNFTAfterPaymentViaAPI } from "libs/utils/api";
import { convertTokenImageUrl, injectXUserNameIntoTweet } from "libs/utils/ui";
import { tierData } from "./tierData";
import { Artist } from "libs/types/common";
import useSolBitzStore from "store/solBitz";
import { useNftsStore } from "store/nfts";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { useAccountStore } from "store/account";
import { useWallet } from "@solana/wallet-adapter-react";
import { sendPowerUpSol, SendPowerUpSolResult } from "pages/BodySections/HomeSection/SendBitzPowerUp";
import { logPaymentToAPI, sleep } from "libs/utils";
import { toastSuccess } from "libs/utils";
import { showSuccessConfetti } from "libs/utils/uiShared";
import { usePreventScroll } from "hooks";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const JoinInnerCircleCC = ({
  onCloseModal,
  artistName,
  artistXLink,
  artistSlug,
  creatorPaymentsWallet,
  membershipId,
  artistId,
  creatorFanMembershipAvailability,
  payWithXP,
  artistProfile,
}: {
  onCloseModal: (isMintingSuccess: boolean) => void;
  artistName: string;
  artistXLink: string | undefined;
  artistSlug: string;
  creatorPaymentsWallet: string;
  membershipId: string;
  artistId: string;
  creatorFanMembershipAvailability: Record<string, any>;
  payWithXP: boolean;
  artistProfile: Artist;
}) => {
  const { publicKey, walletType } = useSolanaWallet();
  const { userInfo, web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { solBitzNfts } = useNftsStore();
  const { bitzBalance: solBitzBalance, givenBitzSum: givenBitzSumSol, updateBitzBalance, updateGivenBitzSum, isSigmaWeb2XpSystem } = useSolBitzStore();

  const [showStripePaymentPopup, setShowStripePaymentPopup] = useState(false);
  const [paymentIntentReceived, setPaymentIntentReceived] = useState(false);
  const [fetchingPaymentIntent, setFetchingPaymentIntent] = useState(false);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [tweetText, setTweetText] = useState<string>("");

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

  usePreventScroll(); // Prevent scrolling on non-mobile screens on view

  useEffect(() => {
    if (paymentIntentReceived && clientSecret && clientSecret !== "" && !fetchingPaymentIntent) {
      setShowStripePaymentPopup(true);
    }
  }, [paymentIntentReceived, clientSecret, fetchingPaymentIntent]);

  useEffect(() => {
    if (artistName && artistName !== "") {
      const tweetMsg = injectXUserNameIntoTweet(
        `I just joined ${artistName}'s _(xUsername)_exclusive Inner Circle fan club on @SigmaXMusic. Come and join me!`,
        artistXLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm${location.search}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [artistXLink, artistName]);

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
                    ${(tierData[membershipId].defaultPriceUSD * totalQuantity).toFixed(2)} {totalQuantity > 1 && `for ${totalQuantity} items`}
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
              <Loader className="animate-spin text-yellow-300" size={20} />
              <p className="text-white text-sm font-bold">Loading payment gateway...</p>
            </div>
          </div>
        )}
      </>
    );
  }, [clientSecret, artistName, artistSlug, membershipId, creatorPaymentsWallet]);

  const handlePaymentConfirmation_XP = async (priceInXP: number, priceInUSD: number) => {
    if (!publicKey || !priceInXP || !priceInUSD || !artistProfile || !artistProfile.creatorWallet || !artistProfile.bountyId) return;

    setPaymentStatus("processing");

    // // TEST UI WORKFLOW HERE
    // // need to pull it out of the ui thread of for some reason the confetti goes first
    // toastSuccess("Payment Successful!");
    // setPaymentStatus("confirmed");
    // setShowPaymentConfirmation(false);

    // setMintingStatus("processing");

    // await sleep(3);

    // toastSuccess("Minting Successful!");
    // setMintingStatus("confirmed");

    // // need to pull it out of the ui thread of for some reason the confetti goes first
    // setTimeout(() => {
    //   showSuccessConfetti();
    // }, 500);

    // return;

    // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
      publicKey,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    try {
      let xpPaymentReceipt = "";

      const sendPowerUpSolResult: SendPowerUpSolResult = await sendPowerUpSol(
        priceInXP,
        artistProfile.creatorWallet,
        artistProfile.bountyId + "-p",
        solBitzNfts,
        isSigmaWeb2XpSystem,
        publicKey,
        solBitzBalance,
        givenBitzSumSol,
        usedPreAccessNonce,
        usedPreAccessSignature
      );

      if (sendPowerUpSolResult.error) {
        throw new Error(sendPowerUpSolResult.errorMessage || "Payment failed - error returned when sending XP");
      }

      if (sendPowerUpSolResult.success && sendPowerUpSolResult.paymentReceipt !== "") {
        xpPaymentReceipt = sendPowerUpSolResult.paymentReceipt;
      } else {
        throw new Error("Payment failed - no receipt returned when sending XP");
      }

      if (xpPaymentReceipt === "") {
        throw new Error("Payment failed - no receipt returned when sending XP");
      }

      // Log payment to web2 API
      const _logPaymentToAPIResponse = await logPaymentToAPI({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        payer: publicKey.toBase58(),
        tx: xpPaymentReceipt,
        task: "joinFanClub",
        type: "xp",
        amount: priceInXP.toString(),
        priceInUSD: priceInUSD,
        creatorWallet: creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        membershipId: membershipId,
        artistId: artistId,
      });

      if (_logPaymentToAPIResponse.error) {
        throw new Error(_logPaymentToAPIResponse.errorMessage || "Payment failed");
      }

      toastSuccess("Payment Successful!");
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      // update the bitz balance and given bitz sum
      updateBitzBalance(sendPowerUpSolResult.bitzBalance);
      updateGivenBitzSum(sendPowerUpSolResult.givenBitzSum);

      handleMinting({ paymentMadeTx: xpPaymentReceipt, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce });
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again - " + (error as Error).message);
      setPaymentStatus("idle");
    }
  };

  const handleMinting = async ({ paymentMadeTx, solSignature, signatureNonce }: { paymentMadeTx: string; solSignature: string; signatureNonce: string }) => {
    setMintingStatus("processing");

    try {
      const mintParams: any = {
        solSignature,
        signatureNonce,
        mintForSolAddr: publicKey?.toBase58(),
        paymentHash: paymentMadeTx,
        nftType: "fan",
        creatorWallet: creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        membershipId: membershipId,
        artistId: artistId,
      };

      if (payWithXP) {
        mintParams.isXPPayment = "1";
      }

      // Mint the Collectible
      const _mintNFTAfterPaymentResponse = await mintAlbumOrFanNFTAfterPaymentViaAPI(mintParams);

      if (_mintNFTAfterPaymentResponse.error) {
        throw new Error(_mintNFTAfterPaymentResponse.errorMessage || "Minting failed");
      }

      // sleep for an extra 10 seconds after success to the RPC indexing can update
      await sleep(10);

      toastSuccess("Minting Successful!");
      setMintingStatus("confirmed");

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Error: Minting seems to have failed");
      setBackendErrorMessage((error as Error).message);
      setMintingStatus("failed");
    }
  };

  const PaymentConfirmationPopup_XP = () => {
    const priceInUSD = Number(tierData[membershipId]?.defaultPriceUSD) * totalQuantity;
    const priceInXP = Number(priceInUSD) * ONE_USD_IN_XP;
    const notEnoughXP = priceInXP > solBitzBalance;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">{paymentStatus === "idle" ? "Confirm XP Payment" : "Payment Transfer in Process..."}</h3>
          <div className="space-y-4">
            <p>Amount to pay: {priceInXP.toLocaleString()} XP</p>
            <p>Your XP balance: {solBitzBalance.toLocaleString()} XP</p>

            {paymentStatus === "processing" ? (
              <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
                <Loader className="w-full text-center animate-spin hover:scale-105" />
                <p className="text-yellow-300">Payment in process... do not close this page</p>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button onClick={resetStateToPristine} className="flex-1 bg-gray-600 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handlePaymentConfirmation_XP(priceInXP, Number(priceInUSD));
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  disabled={payWithXP && notEnoughXP}>
                  Proceed
                </Button>
              </div>
            )}

            {payWithXP && notEnoughXP && (
              <div className="flex-1 bg-red-500 text-white p-2 rounded-lg text-sm">
                <p>You do not have enough XP to proceed. You can earn more XP or buy an XP boost. Check for options in the top app menu.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  function resetStateToPristine() {
    setBackendErrorMessage(null);
    setClientSecret("");
    setShowPaymentConfirmation(false);
    setPaymentStatus("idle");
    setMintingStatus("idle");
    setTotalQuantity(1);
  }

  const isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";
  const tokenImg = convertTokenImageUrl(creatorFanMembershipAvailability[membershipId]?.tokenImg);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      {!payWithXP && showStripePaymentPopup && <StripePaymentPopup />}
      {payWithXP && showPaymentConfirmation && <PaymentConfirmationPopup_XP />}

      <div
        className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 grid grid-cols-1 ${mintingStatus === "confirmed" ? "md:grid-cols-1 max-w-xl" : "md:grid-cols-2 max-w-4xl"} gap-4`}>
        {/* Close button  */}
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

        {/* Form */}
        {mintingStatus !== "confirmed" && (
          <>
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
                    className="w-48 h-48 lg:w-[400px] lg:h-[400px] m-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm items-center justify-center">
              <div className="text-center space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-white">{tierData[membershipId]?.label.toUpperCase()}</h3>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      {payWithXP
                        ? (Number(tierData[membershipId]?.defaultPriceUSD) * totalQuantity * ONE_USD_IN_XP).toLocaleString() + " XP"
                        : "$" + (tierData[membershipId].defaultPriceUSD * totalQuantity).toFixed(2)}
                    </span>
                    {totalQuantity > 1 && <span className="text-sm text-gray-400">for {totalQuantity}</span>}
                  </div>
                </div>
              </div>

              {!payWithXP && (
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
              )}

              <div className="flex flex-col gap-2 text-sm lg:mt-5">
                <p>
                  <span className="font-bold text-yellow-300">What are you buying?</span> Access to join the Inner Circle fan collectible of {artistName} and
                  receive exclusive content and perks.
                </p>
                <p>
                  <span className="font-bold text-yellow-300">Terms of Sale:</span> By clicking "Proceed", you agree to these{" "}
                  <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                    Terms
                  </a>
                </p>
                {totalQuantity > 1 && (
                  <p>
                    <span className="font-bold text-yellow-300">Multiple Memberships:</span> When buying multiple memberships, you'll receive one immediately
                    and the rest within 24 hours.{" "}
                    <a className="underline" href="https://sigmamusic.fm/legal#multiple-memberships" target="_blank" rel="noopener noreferrer">
                      Learn more
                    </a>
                  </p>
                )}
                <p className="text-xs text-gray-400">Payments are processed securely by Stripe. Click on Proceed when ready to pay.</p>
              </div>

              {isCCPaymentsDisabled && (
                <div className="flex gap-4 bg-red-500 p-4 rounded-lg text-sm w-full">
                  <p className="text-white">CC payments are currently disabled. Please try again later.</p>
                </div>
              )}

              {backendErrorMessage && (
                <div className="flex flex-col gap-4 w-full">
                  <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
                </div>
              )}

              <div className="flex gap-4 lg:mt-5">
                <Button
                  onClick={() => {
                    resetStateToPristine();
                    onCloseModal(false);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!payWithXP) {
                      createPaymentIntentForThisPayment();
                    } else {
                      setShowPaymentConfirmation(true);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  disabled={isCCPaymentsDisabled || fetchingPaymentIntent || mintingStatus !== "idle"}>
                  {fetchingPaymentIntent ? <Loader className="animate-spin" /> : "Proceed"}
                </Button>
              </div>

              {mintingStatus === "processing" && (
                <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg w-full mt-2">
                  <Loader className="w-full text-center animate-spin hover:scale-105" />
                  <p className="text-yellow-300">Collectible Minting in process... do not close this page</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Success Notification */}
        {mintingStatus === "confirmed" && (
          <div className="md:col-span-2">
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
          </div>
        )}
      </div>
    </div>
  );
};
