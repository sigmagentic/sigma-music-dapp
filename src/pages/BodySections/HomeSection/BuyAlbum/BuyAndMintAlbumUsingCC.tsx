import React, { useState, useEffect, useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY, ENABLE_CC_PAYMENTS, ONE_USD_IN_XP } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import StripeCheckoutFormAlbum from "libs/stripe/StripeCheckoutFormAlbum";
import { Artist, Album, AlbumSaleTypeOption } from "libs/types";
import { getApiWeb2Apps, injectXUserNameIntoTweet } from "libs/utils";
import PurchaseOptions from "./PurchaseOptions";
import useSolBitzStore from "store/solBitz";
import { useNftsStore } from "store/nfts";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccountStore } from "store/account";
import { sendPowerUpSol, SendPowerUpSolResult } from "../SendBitzPowerUp";
import { logPaymentToAPI } from "libs/utils";
import { toastSuccess } from "libs/utils";
import { sleep } from "libs/utils";
import { showSuccessConfetti } from "libs/utils/uiShared";
import { mintAlbumOrFanNFTAfterPaymentViaAPI } from "libs/utils";
import { useAppStore } from "store/app";
import { usePreventScroll } from "hooks";
import { EntitlementForMusicAsset } from "libs/types";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const BuyAndMintAlbumUsingCC = ({
  fullEntitlementsForSelectedAlbum,
  inDebugModeForMultiPurchaseFeatureLaunch,
  artistProfile,
  albumToBuyAndMint,
  onCloseModal,
}: {
  fullEntitlementsForSelectedAlbum: {
    entitlementsForSelectedAlbum: EntitlementForMusicAsset | null;
    ownedStoryProtocolCommercialLicense: any | null;
  };
  inDebugModeForMultiPurchaseFeatureLaunch: boolean;
  artistProfile: Artist;
  albumToBuyAndMint: Album;
  onCloseModal: (isMintingSuccess: boolean) => void;
}) => {
  const { publicKey, walletType } = useSolanaWallet();
  const { artistLookupEverything } = useAppStore();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { bitzBalance: solBitzBalance, givenBitzSum: givenBitzSumSol, updateBitzBalance, updateGivenBitzSum, isSigmaWeb2XpSystem } = useSolBitzStore();
  const { userInfo, web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { solBitzNfts } = useNftsStore();

  const [showStripePaymentPopup, setShowStripePaymentPopup] = useState(false);
  const [paymentIntentReceived, setPaymentIntentReceived] = useState(false);
  const [fetchingPaymentIntent, setFetchingPaymentIntent] = useState(false);
  const [albumSaleTypeOption, setAlbumSaleTypeOption] = useState<string | null>(null);
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [hoveredLargeSizeTokenImg, setHoveredLargeSizeTokenImg] = useState<string | null>(null);
  const [selectedLargeSizeTokenImg, setSelectedLargeSizeTokenImg] = useState<string | null>(null);
  const [payWithXP, setPayWithXP] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [digitalAlbumOnlyPurchaseStatus, setDigitalAlbumOnlyPurchaseStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [mintingStatus, setMintingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [tweetText, setTweetText] = useState<string>("");

  usePreventScroll(); // Prevent scrolling on non-mobile screens on view

  useEffect(() => {
    if (albumSaleTypeOption && albumSaleTypeOption !== "" && !payWithXP) {
      createPaymentIntentForThisPayment();
    }
  }, [albumSaleTypeOption]);

  useEffect(() => {
    if (paymentIntentReceived && clientSecret && clientSecret !== "" && !fetchingPaymentIntent) {
      setShowStripePaymentPopup(true);
    }
  }, [paymentIntentReceived, clientSecret, fetchingPaymentIntent]);

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
              <Loader className="animate-spin text-yellow-300" size={20} />

              <p className="text-white text-sm font-bold">Loading payment gateway...</p>
            </div>
          </div>
        )}
      </>
    );
  }, [clientSecret, artistProfile, albumToBuyAndMint]);

  const PaymentConfirmationPopup_XP = () => {
    const priceInUSD = (() => {
      const priceOption = albumToBuyAndMint._buyNowMeta?.[albumSaleTypeOption as keyof typeof albumToBuyAndMint._buyNowMeta];
      return typeof priceOption === "object" && priceOption !== null && "priceInUSD" in priceOption ? priceOption.priceInUSD : null;
    })();

    const priceInXP = Number(priceInUSD) * ONE_USD_IN_XP;
    const notEnoughXP = priceInXP > solBitzBalance;

    return (
      <>
        {albumSaleTypeOption ? (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">{paymentStatus === "idle" ? "Confirm XP Payment" : "Payment Transfer in Process..."}</h3>
              <div className="space-y-4">
                <p>Amount to pay: {priceInXP.toLocaleString()} XP</p>
                <p>Your XP balance: {solBitzBalance.toLocaleString()} XP</p>

                {paymentStatus === "processing" ? (
                  <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
                    <Loader className="animate-spin text-yellow-300" size={20} />
                    <p className="text-yellow-300 text-sm">Payment in process... do not close this page</p>
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
                      disabled={notEnoughXP}>
                      Proceed
                    </Button>
                  </div>
                )}

                {notEnoughXP && (
                  <div className="flex-1 bg-red-500 text-white p-2 rounded-lg text-sm">
                    <p>You do not have enough XP to proceed. You can earn more XP or buy an XP boost. Check for options in the top app menu.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  };

  const handlePaymentConfirmation_XP = async (priceInXP: number, priceInUSD: number) => {
    if (!publicKey || !priceInXP || !priceInUSD) return;

    setPaymentStatus("processing");

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

    /*
    // TEST UI WORKFLOW HERE
    setTimeout(async () => {
      // need to pull it out of the ui thread of for some reason the confetti goes first
      toastSuccess("Payment Successful!");
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      // user is buying ONLY the digital album so we dont need minting
      setDigitalAlbumOnlyPurchaseStatus("processing");

      await sleep(3);

      toastSuccess("Digital Album Purchase Successful!");

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        setDigitalAlbumOnlyPurchaseStatus("confirmed");
        showSuccessConfetti();
      }, 500);
    }, 5000);

    return;
    */

    try {
      // we GIVE XP to the album bounty ID, but we also send an extra "flag" to indicate its a purchase and not a donation?
      // This way we dont need any custom logic to handle the XP purchase, we trate it as a standard GIVE XP call
      // the GIVE BIT XP route returns a "receipt" ID, which we can then send as the "tx" field in the logPaymentToAPI call
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
        task: "buyAlbum",
        type: "xp",
        amount: priceInXP.toString(),
        priceInUSD: priceInUSD,
        creatorWallet: artistProfile.creatorPaymentsWallet, // creatorPaymentsWallet is the wallet that belongs to the artists for payments/royalty etc
        albumId: albumToBuyAndMint.albumId,
        albumSaleTypeOption: AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption],
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

      // for priceOption1 and priceOption4, we dont need to mint the album
      if (AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption1) {
        // user is buying ONLY the digital album so we dont need minting
        setDigitalAlbumOnlyPurchaseStatus("processing");

        await sleep(3);

        toastSuccess("Digital Album Purchase Successful!");

        // need to pull it out of the ui thread of for some reason the confetti goes first
        setTimeout(() => {
          setDigitalAlbumOnlyPurchaseStatus("confirmed");
          showSuccessConfetti();
        }, 500);
      } else {
        // for all other options, we need to mint the album as well
        handleMinting({ paymentMadeTx: xpPaymentReceipt, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again - " + (error as Error).message);
      setPaymentStatus("idle");
    }
  };

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
        isXPPayment: "1",
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

      toastSuccess(responseMessage);
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

  function resetStateToPristine() {
    setBackendErrorMessage(null);
    setClientSecret("");
    setAlbumSaleTypeOption(null);
    setShowStripePaymentPopup(false);
    setPaymentIntentReceived(false);
    setFetchingPaymentIntent(false);
    setShowPaymentConfirmation(false);
  }

  let isCCPaymentsDisabled = !ENABLE_CC_PAYMENTS || ENABLE_CC_PAYMENTS !== "1" || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "";

  function musicAssetProcurementFullyDone() {
    return mintingStatus === "confirmed" || digitalAlbumOnlyPurchaseStatus === "confirmed";
  }

  const mintingIsInCommercialLicensePathway =
    AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption4 ||
    AlbumSaleTypeOption[albumSaleTypeOption as keyof typeof AlbumSaleTypeOption] === AlbumSaleTypeOption.priceOption3;

  console.log("entitlementsForSelectedAlbum_A (fullEntitlementsForSelectedAlbum)", fullEntitlementsForSelectedAlbum);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-start md:items-center md:justify-center z-50">
      <>
        {!payWithXP && showStripePaymentPopup && <StripePaymentPopup />}
        {payWithXP && showPaymentConfirmation && <PaymentConfirmationPopup_XP />}

        <div
          className={`relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 ${musicAssetProcurementFullyDone() ? "max-w-lg" : "grid grid-cols-1 md:grid-cols-2 max-w-6xl"} gap-6`}>
          {/* Close button  */}
          {(paymentStatus === "idle" || mintingStatus === "failed" || musicAssetProcurementFullyDone()) && (
            <button
              onClick={() => {
                resetStateToPristine();
                onCloseModal(musicAssetProcurementFullyDone());
              }}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
              ✕
            </button>
          )}

          {mintingStatus !== "confirmed" && digitalAlbumOnlyPurchaseStatus !== "confirmed" && (
            <>
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

                {mintingStatus === "processing" && (
                  <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg col-span-2">
                    <Loader className="animate-spin text-yellow-300" size={20} />
                    <p className="text-yellow-300 text-sm">
                      {mintingIsInCommercialLicensePathway
                        ? "License procurement processing... do not close this page"
                        : "Collectible Minting in process... do not close this page"}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Purchase Options */}
              {!fullEntitlementsForSelectedAlbum.entitlementsForSelectedAlbum ? (
                <div className="flex flex-col items-center justify-center h-full p-2">
                  <Loader className="animate-spin text-yellow-300" size={30} />
                  <p className="text-yellow-300 text-sm font-bold mt-2">Loading purchase options...</p>
                </div>
              ) : (
                <PurchaseOptions
                  isPaymentsDisabled={isCCPaymentsDisabled}
                  buyNowMeta={albumToBuyAndMint._buyNowMeta}
                  disableActions={fetchingPaymentIntent || mintingStatus === "processing" || digitalAlbumOnlyPurchaseStatus === "processing"}
                  payWithXP={payWithXP}
                  albumSaleTypeOption={albumSaleTypeOption || ""}
                  fullEntitlementsForSelectedAlbum={fullEntitlementsForSelectedAlbum}
                  inDebugModeForMultiPurchaseFeatureLaunch={inDebugModeForMultiPurchaseFeatureLaunch}
                  handlePaymentAndMint={(_albumSaleTypeOption: string) => {
                    if (!publicKey?.toBase58()) {
                      return;
                    }

                    setAlbumSaleTypeOption(_albumSaleTypeOption);

                    if (payWithXP) {
                      setShowPaymentConfirmation(true);
                    }
                  }}
                  handleShowLargeSizeTokenImg={(tokenImg: string | null) => {
                    setHoveredLargeSizeTokenImg(tokenImg);
                  }}
                  handlePayWithXP={setPayWithXP}
                />
              )}

              {paymentStatus === "idle" ||
                (paymentStatus === "processing" && (
                  <div className="text-xs text-right mt-[5px]">
                    <p>
                      <span className="font-bold text-yellow-300">Terms of Sale:</span> By clicking "Buy Now", you agree to these{" "}
                      <a className="underline" href="https://sigmamusic.fm/legal#terms-of-sale" target="_blank" rel="noopener noreferrer">
                        Terms
                      </a>
                    </p>
                    <p className="text-xs text-gray-400">Payments are processed securely by Stripe. Click on Proceed when ready to pay.</p>
                  </div>
                ))}

              <div className="flex flex-col md:flex-row gap-2 col-span-2">
                {backendErrorMessage && (
                  <div className="flex flex-col gap-4 col-span-2">
                    <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
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

                <div className="bg-yellow-300 rounded-full p-[10px] -z-1">
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
                    <p className="z-10 text-sm">Share this news on X</p>
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Show larger profile or token image modal */}
          {selectedLargeSizeTokenImg && (
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
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
      </>
    </div>
  );
};
