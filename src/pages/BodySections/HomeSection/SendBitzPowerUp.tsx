import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { confetti } from "@tsparticles/confetti";
import { Container } from "@tsparticles/engine";
import { ExternalLinkIcon } from "lucide-react";
import { Modal } from "components/Modal/Modal";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature, sigmaWeb2XpSystem, viewDataWrapperSol } from "libs/sol/SolViewData";
import { sleep } from "libs/utils";
import { injectXUserNameIntoTweet } from "libs/utils/ui";
import { toastClosableError } from "libs/utils/uiShared";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";
import useSolBitzStore from "store/solBitz";

type SendBitzPowerUpProps = {
  giveBitzForMusicBountyConfig: {
    creatorIcon?: string | undefined;
    creatorName?: string | undefined;
    creatorSlug?: string | undefined;
    creatorXLink?: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
    isRemixVoteMode?: boolean;
  };
  onCloseModal: any;
};

export const SendBitzPowerUp = (props: SendBitzPowerUpProps) => {
  const { giveBitzForMusicBountyConfig, onCloseModal } = props;
  const { creatorIcon, creatorName, creatorXLink, giveBitzToWho, giveBitzToCampaignId, isLikeMode, isRemixVoteMode } = giveBitzForMusicBountyConfig;
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol } = useSolanaWallet();
  const [giftBitzWorkflow, setGiftBitzWorkflow] = useState<boolean>(false);
  const [bitzValToGift, setBitzValToGift] = useState<number>(0);
  const [minBitzValNeeded, setMinBitzValNeeded] = useState<number>(1);
  const [poweringUpInProgress, setPoweringUpInProgress] = useState<boolean>(false);
  const [powerUpSuccessfullyDone, setPowerUpSuccessfullyDone] = useState<boolean>(false);
  const [poweringUpError, setPoweringUpError] = useState<boolean>(false);
  const { solBitzNfts } = useNftsStore();
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const { bitzBalance: solBitzBalance, givenBitzSum: givenBitzSumSol, updateBitzBalance, updateGivenBitzSum, isSigmaWeb2XpSystem } = useSolBitzStore();
  const [bitBalanceOnChain, setBitBalanceOnChain] = useState<number>(0);
  const [tweetText, setTweetText] = useState<string>("");

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  useEffect(() => {
    if (publicKeySol) {
      setBitBalanceOnChain(solBitzBalance);
    }
  }, [publicKeySol, solBitzBalance]);

  useEffect(() => {
    // if we don't do the powerUpSuccessfullyDone and poweringUpInProgress check, this block gets triggered even after a success and bitzValToGift and minBitzValNeeded get reset
    if (!powerUpSuccessfullyDone && !poweringUpInProgress && giveBitzToWho && giveBitzToWho !== "" && giveBitzToCampaignId && giveBitzToCampaignId !== "") {
      if (isLikeMode) {
        setBitzValToGift(5);
        setMinBitzValNeeded(5);
      } else {
        if (bitBalanceOnChain > 5) {
          setBitzValToGift(5);
        } else {
          setBitzValToGift(bitBalanceOnChain);
        }
      }

      setGiftBitzWorkflow(true);
    }
  }, [giveBitzToWho, giveBitzToCampaignId, bitBalanceOnChain, powerUpSuccessfullyDone]);

  useEffect(() => {
    if (creatorName && creatorName !== "") {
      const tweetMsg = injectXUserNameIntoTweet(
        `I just supported ${creatorName} _(xUsername)_on @SigmaXMusic by giving them ${bitzValToGift} of my XP!`,
        creatorXLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm${location.search}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [creatorXLink, creatorName, bitzValToGift]);

  async function sendPowerUpSol() {
    setPoweringUpInProgress(true);

    try {
      const headersToSend: Record<string, any> = {
        "dmf-custom-give-bits": "1",
        "dmf-custom-give-bits-val": bitzValToGift,
        "dmf-custom-give-bits-to-who": giveBitzToWho,
        "dmf-custom-give-bits-to-campaign-id": giveBitzToCampaignId,
        "dmf-custom-sol-collection-id": solBitzNfts[0].grouping[0].group_value,
      };

      const keysToSend = [
        "dmf-custom-give-bits",
        "dmf-custom-give-bits-val",
        "dmf-custom-give-bits-to-who",
        "dmf-custom-give-bits-to-campaign-id",
        "dmf-custom-sol-collection-id",
      ];

      const viewDataArgs = {
        headers: headersToSend,
        fwdHeaderKeys: keysToSend,
      };

      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey: publicKeySol,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      let giveBitzGameResult = null;

      if (isSigmaWeb2XpSystem === 1) {
        giveBitzGameResult = await sigmaWeb2XpSystem(publicKeySol!, usedPreAccessNonce, usedPreAccessSignature, viewDataArgs, solBitzNfts[0].id);
      } else {
        giveBitzGameResult = await viewDataWrapperSol(publicKeySol!, usedPreAccessNonce, usedPreAccessSignature, viewDataArgs, solBitzNfts[0].id);
      }

      if (giveBitzGameResult) {
        if (giveBitzGameResult?.data?.statusCode && giveBitzGameResult?.data?.statusCode != 200) {
          toastClosableError("Error: Not possible to send power-up. Error code returned. Do you have enough XP to give?");
          setPoweringUpError(true);
        } else {
          // we can "locally" estimate and update the balance counts (no need to get it from the marshal as it will be synced when user reloads page or logs in/out or plays the get bitz game)
          updateBitzBalance(bitBalanceOnChain - bitzValToGift); // current balance - what they donated
          updateGivenBitzSum(givenBitzSumSol + bitzValToGift); // given bits + what they donated

          setPowerUpSuccessfullyDone(true);
          showConfetti();
        }
      } else {
        toastClosableError("Error: Not possible to send power-up");
        setPoweringUpError(true);
      }
    } catch (err: any) {
      toastClosableError(`Error: Not possible to send power-up. ${err.toString()}`);
      setPoweringUpError(true);
    }

    setPoweringUpInProgress(false);
  }

  async function showConfetti() {
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
          value: ["💎", "⭐", "✨", "💫", "🎵", "🎶", "🎸", "🎼"],
        },
      },
    });

    if (animation) {
      await sleep(10);

      animation.stop();
      // as its confetti, then we have to destroy it
      if ((animation as unknown as Container).destroy) {
        (animation as unknown as Container).destroy();
      }
    }
  }

  const getTitle = () => {
    if (isLikeMode) {
      return "Boost This Album With 5 XP";
    }
    if (isRemixVoteMode) {
      return "Vote For This Remix With XP";
    }
    return "Power-Up This Creator With XP";
  };

  return (
    <>
      <Modal
        triggerOpen={giftBitzWorkflow}
        triggerOnClose={() => {
          onCloseModal(powerUpSuccessfullyDone ? { bitzValToGift, giveBitzToCampaignId } : undefined);
          setGiftBitzWorkflow(false);
        }}
        closeOnOverlayClick={false}
        title={getTitle()}
        hasFilter={false}
        filterData={[]}
        modalClassName={""}
        titleClassName={"p-6 md:!p-4 !text-2xl md:!text-3xl"}>
        {
          <div
            className="bg1-cyan-900"
            style={{
              minHeight: "10rem",
            }}>
            <div className="bg1-cyan-200 flex flex-col gap-2 p-8">
              <div className="text-md mb-2">
                {" "}
                {isLikeMode ? (
                  <>
                    <span className="font-bold cursor-pointer" onClick={() => setShowDetails((prev) => !prev)}>
                      ℹ️ Why should you boost albums?
                    </span>{" "}
                    {showDetails && (
                      <div>
                        Boosted albums get promoted and featured more on Sigma Music and other social channels, and this may drive more sales of the artist's
                        content.
                      </div>
                    )}
                  </>
                ) : !isRemixVoteMode ? (
                  <>
                    <span className="font-bold cursor-pointer" onClick={() => setShowDetails((prev) => !prev)}>
                      ℹ️ Why should you power-up artists?
                    </span>{" "}
                    {showDetails && <div>Artists with the most XP powering them will be featured more on Sigma Music and other social channels.</div>}
                  </>
                ) : (
                  <></>
                )}
              </div>
              <div className="bg1-green-200 flex flex-col md:flex-row md:items-center">
                <div className="bg1-blue-200">
                  <div
                    className="border-[0.5px] border-neutral-500/90 w-[150px] h-[150px] md:h-[150px] md:w-[150px] bg-no-repeat bg-cover rounded-lg"
                    style={{
                      "backgroundImage": `url(${creatorIcon})`,
                    }}></div>
                </div>
                <div className="bg1-blue-300 md:ml-5 mt-5 md:mt-0 text-xl font-bold">{creatorName}</div>
              </div>
              {!powerUpSuccessfullyDone && bitBalanceOnChain < minBitzValNeeded && (
                <>
                  {bitBalanceOnChain === -2 && (
                    <div className="mt-2">
                      ⚠️ Do you get your free XP Data NFT yet? You will need this for this action. To get a free one, click on the button below.
                    </div>
                  )}
                  {bitBalanceOnChain > -1 && bitBalanceOnChain < minBitzValNeeded && <div className="mt-2">⚠️ You don't have enough XP for this action.</div>}
                </>
              )}
              {(bitBalanceOnChain >= minBitzValNeeded || powerUpSuccessfullyDone) && (
                <>
                  <div className="mt-2 text-lg">
                    <div className="">Your XP Balance: {bitBalanceOnChain} XP</div>
                  </div>

                  {poweringUpError && (
                    <div className="h-[100px] text-lg mt-3">
                      <div>Error! Power-up not possible.</div>
                      <Button
                        className="text-sm mt-2 cursor-pointer !text-yellow-300"
                        variant="destructive"
                        onClick={() => {
                          onCloseModal(powerUpSuccessfullyDone ? { bitzValToGift, giveBitzToCampaignId } : undefined);
                          setGiftBitzWorkflow(false);
                        }}>
                        Close & Try Again
                      </Button>
                    </div>
                  )}

                  {powerUpSuccessfullyDone && (
                    <div className="h-[100px] text-lg mt-1">
                      <div>Success! thank you for supporting this {isRemixVoteMode ? "remix" : "creator"}.</div>
                      <div className="bg-yellow-300 mt-1 rounded-full p-[10px] -z-1 w-[269px]">
                        <a
                          className="z-1 bg-yellow-300 text-black text-sm rounded-3xl gap-2 flex flex-row justify-center items-center"
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
                      <Button
                        className="text-sm mt-2 mb-2 cursor-pointer !text-orange-500 dark:!text-yellow-300"
                        variant="secondary"
                        onClick={() => {
                          onCloseModal(powerUpSuccessfullyDone ? { bitzValToGift, giveBitzToCampaignId } : undefined);
                          setGiftBitzWorkflow(false);
                        }}>
                        Close
                      </Button>
                    </div>
                  )}

                  {!powerUpSuccessfullyDone && !poweringUpError && (
                    <>
                      {!isLikeMode && (
                        <div className="">
                          <div className="">
                            <div className="flex flex-row gap-2 justify-center items-center">
                              <input
                                type="range"
                                id="rangeBitz"
                                min="1"
                                max={bitBalanceOnChain}
                                step="1"
                                value={bitzValToGift}
                                disabled={poweringUpInProgress}
                                onChange={(e) => setBitzValToGift(Number(e.target.value))}
                                className="accent-black dark:accent-white w-full cursor-pointer custom-range-slider"
                              />
                              <input
                                type="number"
                                min="1"
                                max={bitBalanceOnChain}
                                step="1"
                                value={bitzValToGift}
                                disabled={poweringUpInProgress}
                                onChange={(e) => setBitzValToGift(Math.min(Number(e.target.value), bitBalanceOnChain))}
                                className="bg-[#fde047]/30 focus:none focus:outline-none focus:border-transparent text-center border-[#fde047] rounded-md text-[2rem] p-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="">
                        <div className="">
                          <Button
                            disabled={bitBalanceOnChain < minBitzValNeeded || bitzValToGift < 1 || poweringUpInProgress}
                            className="!text-black text-lg bg-gradient-to-br from-yellow-300 to-orange-500 cursor-pointer w-[200px] md:w-[300px] md:h-[50px]"
                            onClick={() => {
                              sendPowerUpSol();
                            }}>
                            <span className="ml-2">
                              {poweringUpInProgress
                                ? "Sending, Please Wait..."
                                : !isLikeMode && !isRemixVoteMode
                                  ? `Gift Creator ${bitzValToGift} XP`
                                  : `Like with ${bitzValToGift} XP`}
                            </span>
                          </Button>
                        </div>
                        <div className="bg1-blue-300 mt-5">
                          <div className="flex flex-col md:flex-row">
                            By gifting, you agree to our a
                            <br />
                            <a
                              className="!text-[#fde047] hover:underline ml-2 flex"
                              href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/bitz-xp/give-bitz"
                              target="blank">
                              Give XP terms of use <ExternalLinkIcon width={16} className="ml-2" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        }
      </Modal>
    </>
  );
};
