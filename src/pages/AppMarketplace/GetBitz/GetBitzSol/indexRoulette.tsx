import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { confetti } from "@tsparticles/confetti";
import { Loader } from "lucide-react";
import Countdown from "react-countdown";
import { Wheel } from "react-custom-roulette";
import { LuMousePointerClick } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature, viewDataViaMarshalSol } from "libs/sol/SolViewData";
import { cn, sleep } from "libs/utils";
import { computeRemainingCooldown } from "libs/utils/functions";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";
import "../common/GetBitz.css";
import useSolBitzStore from "store/solBitz";

const rouletteData = [
  { option: "Rugged", bitz: "0", style: { backgroundColor: "#FF0000", textColor: "white" } }, // red
  { option: "2", bitz: "2", style: { backgroundColor: "#000000", textColor: "white" } }, // black
  { option: "4", bitz: "4", style: { backgroundColor: "#D35400", textColor: "white" } }, // dark orange
  { option: "5", bitz: "5", style: { backgroundColor: "#000000", textColor: "white" } }, // black
  { option: "6", bitz: "6", style: { backgroundColor: "#D35400", textColor: "white" } }, // dark orange
  { option: "8", bitz: "8", style: { backgroundColor: "#000000", textColor: "white" } }, // black
  { option: "10", bitz: "10", style: { backgroundColor: "#D35400", textColor: "white" } }, // dark orange
  { option: "12", bitz: "12", style: { backgroundColor: "#000000", textColor: "white" } }, // black
  { option: "15", bitz: "15", style: { backgroundColor: "#D35400", textColor: "white" } }, // dark orange
  { option: "16", bitz: "16", style: { backgroundColor: "#000000", textColor: "white" } }, // black
  { option: "18", bitz: "18", style: { backgroundColor: "#D35400", textColor: "white" } }, // dark orange
  { option: "Gifted (20)", bitz: "20", style: { backgroundColor: "#006D6D", textColor: "white" } }, // dark teal
  { option: "Heroic (25)", bitz: "25", style: { backgroundColor: "#008000", textColor: "white" } }, // green
  { option: "Legend (50)", bitz: "50", style: { backgroundColor: "#FFD700", textColor: "black" } }, // gold
];

const GetBitzSol = (props: any) => {
  const { modalMode, onIsDataMarshalFetching, onHideBitzModel } = props;
  const { publicKey: userPublicKey, signMessage } = useWallet();
  const address = userPublicKey?.toBase58();
  const [checkingIfHasGameDataNFT, setCheckingIfHasGameDataNFT] = useState<boolean>(true);
  const [hasGameDataNFT, setHasGameDataNFT] = useState<boolean>(false);
  const navigate = useNavigate();

  const { cooldown, updateBitzBalance, updateCooldown, updateGivenBitzSum, updateCollectedBitzSum, updateBonusBitzSum, updateBonusTries } = useSolBitzStore();

  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);

  // a single game-play related (so we have to reset these if the user wants to "replay")
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(false);
  const [gameDataFetched, setGameDataFetched] = useState<boolean>(false);
  const [viewDataRes, setViewDataRes] = useState<any>();

  // Game canvas related
  const [loadBlankGameCanvas, setLoadBlankGameCanvas] = useState<boolean>(false);
  const { solBitzNfts } = useNftsStore();
  const [populatedBitzStore, setPopulatedBitzStore] = useState<boolean>(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState<number>(0);
  const [spinComplete, setSpinComplete] = useState(false);
  const [userClickedToPlay, setUserClickedToPlay] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(false);
  const tweetText = `url=https://ai-workforce.itheum.io/?text=${viewDataRes?.data.gamePlayResult.bitsWon > 0 ? "I just played the Get BiTz XP Game on %23itheum and won " + viewDataRes?.data.gamePlayResult.bitsWon + " BiTz points 🙌!%0A%0APlay now and get your own BiTz! %23GetBiTz %23DRiP %23Solana" : "Oh no, I got rugged getting BiTz points this time. Maybe you will have better luck?%0A%0ATry here to %23GetBiTz %23itheum %0A"}`;

  const handleSpinOver = async () => {
    setMustSpin(false);
    setSpinComplete(true);

    let animation;

    if (viewDataRes?.data.gamePlayResult.bitsWon > 0) {
      if (
        viewDataRes.data.gamePlayResult.userWonMaxBits === 1 ||
        viewDataRes.data.gamePlayResult.bitsWon === 25 ||
        viewDataRes.data.gamePlayResult.bitsWon === 50
      ) {
        animation = await confetti({
          spread: 360,
          ticks: 200,
          gravity: 0.3,
          decay: 0.95,
          startVelocity: 45,
          particleCount: 400,
          scalar: 2,
          shapes: ["emoji", "circle", "square"],
          colors: ["#FFD700", "#FFA500", "#FF4500", "#ff0000", "#00ff00"],
          shapeOptions: {
            emoji: {
              value: ["🎉", "💎", "🏆", "⭐", "💫", "🌟", "🔥", "👑"],
            },
          },
          origin: { y: 0.7 },
          zIndex: 9999,
        });
      } else {
        animation = await confetti({
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
      }

      if (animation) {
        await sleep(10);
        animation.stop();
        if ((animation as any).destroy) {
          (animation as any).destroy();
        }
      }
    }

    setGameInProgress(false);
  };

  useEffect(() => {
    if (gameDataFetched) {
      // start the spinning animation
      setGameInProgress(true);
      setMustSpin(true);
      const prizeIndex = rouletteData.findIndex((item) => item.bitz === viewDataRes.data.gamePlayResult.bitsWon.toString());
      setPrizeNumber(prizeIndex >= 0 ? prizeIndex : 0);
    }
  }, [gameDataFetched, viewDataRes]);

  useEffect(() => {
    if (spinComplete && viewDataRes) {
      // spinning is over, so we can now update the bitz counts in the store
      const viewDataPayload = viewDataRes;

      updateCooldown(
        computeRemainingCooldown(
          Math.max(viewDataPayload.data.gamePlayResult.lastPlayedAndCommitted, viewDataPayload.data.gamePlayResult.lastPlayedBeforeThisPlay),
          viewDataPayload.data.gamePlayResult.configCanPlayEveryMSecs
        )
      );

      let sumBitzBalance = viewDataPayload.data.gamePlayResult.bitsScoreAfterPlay || 0;
      let sumBonusBitz = viewDataPayload.data?.bitsMain?.bitsBonusSum || 0;
      let sumGivenBits = viewDataPayload.data?.bitsMain?.bitsGivenSum || 0;

      // some values can be -1 during first play or other situations, so we make it 0 or else we get weird numbers like 1 for the some coming up
      if (sumBitzBalance < 0) {
        sumBitzBalance = 0;
      }

      if (sumGivenBits < 0) {
        sumGivenBits = 0;
      }

      if (sumBonusBitz < 0) {
        sumBonusBitz = 0;
      }

      if (viewDataPayload.data.gamePlayResult.bitsScoreAfterPlay > -1) {
        updateBitzBalance(sumBitzBalance + sumBonusBitz - sumGivenBits); // won some bis, minus given bits and show
        updateCollectedBitzSum(viewDataPayload.data.gamePlayResult.bitsScoreAfterPlay);
      } else {
        updateBitzBalance(viewDataPayload.data.gamePlayResult.bitsScoreBeforePlay + sumBonusBitz - sumGivenBits); // did not win bits, minus given bits from current and show
        updateCollectedBitzSum(viewDataPayload.data.gamePlayResult.bitsScoreBeforePlay);
      }

      // how many bonus tries does the user have
      if (viewDataPayload.data.gamePlayResult.bonusTriesAfterThisPlay > -1) {
        updateBonusTries(viewDataPayload.data.gamePlayResult.bonusTriesAfterThisPlay);
      } else {
        updateBonusTries(viewDataPayload.data.gamePlayResult.bonusTriesBeforeThisPlay || 0);
      }
    }
  }, [spinComplete, viewDataRes]);

  useEffect(() => {
    if (solBitzNfts === undefined) return;

    if (!populatedBitzStore) {
      if (userPublicKey && solBitzNfts.length > 0) {
        updateBitzBalance(-2);
        updateCooldown(-2);
        updateGivenBitzSum(-2);
        setPopulatedBitzStore(true);

        (async () => {
          // setIsFetchingDataMarshal(true);

          const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
            solPreaccessNonce,
            solPreaccessSignature,
            solPreaccessTimestamp,
            signMessage,
            publicKey: userPublicKey,
            updateSolPreaccessNonce,
            updateSolSignedPreaccess,
            updateSolPreaccessTimestamp,
          });

          const viewDataArgs = {
            headers: {
              "dmf-custom-only-state": "1",
              "dmf-custom-sol-collection-id": solBitzNfts[0].grouping[0].group_value,
            },
            fwdHeaderKeys: ["dmf-custom-only-state", "dmf-custom-sol-collection-id"],
          };

          const getBitzGameResult = await viewDataToOnlyGetReadOnlyBitz(
            solBitzNfts[0],
            usedPreAccessNonce,
            usedPreAccessSignature,
            userPublicKey,
            viewDataArgs
          );

          setIsFetchingDataMarshal(false);

          if (getBitzGameResult) {
            let bitzBeforePlay = getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay || 0; // first play: 0
            let sumGivenBits = getBitzGameResult.data?.bitsMain?.bitsGivenSum || 0; // first play: -1
            let sumBonusBitz = getBitzGameResult.data?.bitsMain?.bitsBonusSum || 0; // first play: 0

            // some values can be -1 during first play or other situations, so we make it 0 or else we get weird numbers like 1 for the some coming up
            if (bitzBeforePlay < 0) {
              bitzBeforePlay = 0;
            }

            if (sumGivenBits < 0) {
              sumGivenBits = 0;
            }

            if (sumBonusBitz < 0) {
              sumBonusBitz = 0;
            }

            updateBitzBalance(bitzBeforePlay + sumBonusBitz - sumGivenBits); // collected bits - given bits
            updateGivenBitzSum(sumGivenBits); // given bits -- for power-ups
            updateBonusBitzSum(sumBonusBitz);

            updateCooldown(
              computeRemainingCooldown(
                getBitzGameResult.data.gamePlayResult.lastPlayedBeforeThisPlay,
                getBitzGameResult.data.gamePlayResult.configCanPlayEveryMSecs
              )
            );
          }
        })();
      } else {
        updateBitzBalance(-1);
        updateGivenBitzSum(-1);
        updateCooldown(-1);
        updateCollectedBitzSum(-1);
      }
    } else {
      if (!userPublicKey) {
        setPopulatedBitzStore(false);
      }
    }
  }, [solBitzNfts, userPublicKey]);

  useEffect(() => {
    checkIfHasGameDataNft();
  }, [solBitzNfts]);

  useEffect(() => {
    onIsDataMarshalFetching(isFetchingDataMarshal);
  }, [isFetchingDataMarshal]);

  useEffect(() => {
    if (address && !loadBlankGameCanvas && !checkingIfHasGameDataNFT && hasGameDataNFT) {
      setLoadBlankGameCanvas(true);
    }
  }, [address, checkingIfHasGameDataNFT, hasGameDataNFT, loadBlankGameCanvas]);

  async function viewData(viewDataArgs: any, requiredDataNFT: any) {
    try {
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey: userPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!userPublicKey) throw new Error("Missing data for viewData");

      const res = await viewDataViaMarshalSol(
        requiredDataNFT.id,
        usedPreAccessNonce,
        usedPreAccessSignature,
        userPublicKey,
        viewDataArgs.fwdHeaderKeys,
        viewDataArgs.headers
      );

      if (res.ok) {
        const data = await res.json();
        return { data, contentType: res.headers.get("content-type") };
      }

      console.error("viewData threw catch error" + res.statusText);
      return undefined;
    } catch (err) {
      return undefined;
    }
  }

  // we get the user's Data NFTs and flag if the user has the required Data NFT for the game in their wallet
  async function checkIfHasGameDataNft() {
    const hasRequiredDataNFT = solBitzNfts && solBitzNfts.length > 0;
    setHasGameDataNFT(hasRequiredDataNFT ? true : false);
    setCheckingIfHasGameDataNFT(false);
  }

  function resetToStartGame() {
    setIsFetchingDataMarshal(false);
    setGameDataFetched(false);
    setViewDataRes(undefined);
  }

  async function playGame() {
    setSpinComplete(false);
    setUserClickedToPlay(true); // a flag to indicate that the user explicitly clicked to play
    setIsFetchingDataMarshal(true);
    await sleep(5);

    const viewDataArgs: Record<string, any> = {
      headers: {
        "dmf-custom-sol-collection-id": solBitzNfts[0].grouping[0].group_value,
      },
      fwdHeaderKeys: ["dmf-custom-sol-collection-id"],
    };

    const viewDataPayload = await viewData(viewDataArgs, solBitzNfts[0]);

    if (viewDataPayload) {
      setGameDataFetched(true);
      setIsFetchingDataMarshal(false);
      setViewDataRes(viewDataPayload);
    }
  }

  const OverLay = ({ label = "", ActionComponent = null }: { label?: string; ActionComponent?: ReactNode }) => {
    return (
      <div className="relative">
        <div className={cn("absolute z-5 w-full h-full rounded-[3rem] bg-black/90", modalMode ? "rounded" : "")}>
          <div className="flex w-full h-full items-center justify-center">
            <div className="text-3xl md:text-5xl flex flex-col items-center justify-center text-white ">
              <p className={`text-white my-4 text-xl md:text-3xl`}>{label} </p> {ActionComponent}
            </div>
          </div>
        </div>
        <div className={`bg-black/90 min-h-[350px] rounded-[3rem] w-full`}></div>
      </div>
    );
  };

  function gamePlayImageSprites() {
    const _loadBlankGameCanvas = loadBlankGameCanvas;

    const CountDownComplete = () => (
      <div
        className="cursor-pointer relative inline-flex h-12 overflow-hidden rounded-full p-[1px] "
        onClick={() => {
          resetToStartGame();
        }}>
        <span className="absolute hover:bg-[#35d9fa] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
        <span className="text-primary inline-flex h-full hover:bg-gradient-to-tl from-background to-[#35d9fa] w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium   backdrop-blur-3xl">
          RIGHT NOW! Try again <LuMousePointerClick className="ml-2 text-[#35d9fa]" />
        </span>
      </div>
    );

    // Renderer callback with condition
    const countdownRenderer = (props: { hours: number; minutes: number; seconds: number; completed: boolean }) => {
      if (props.completed) {
        // Render a complete state
        return <CountDownComplete />;
      } else {
        // Render a countdown
        return (
          <span>
            {props.hours > 0 ? <>{`${props.hours} ${props.hours === 1 ? " Hour " : " Hours "}`}</> : ""}
            {props.minutes > 0 ? props.minutes + " Min " : ""} {props.seconds} Sec
          </span>
        );
      }
    };

    // Game State 1: User is not logged in
    if (!address) {
      return (
        <OverLay
          label="Connect your wallet to play..."
          ActionComponent={
            <div
              onClick={() => {
                onHideBitzModel();
                navigate("/dashboard");
              }}
              className="text-sm cursor-pointer border border-primary rounded-md p-2 mt-5 bg-teal-200 hover:bg-teal-300 text-black">
              Back to Dashboard
            </div>
          }
        />
      );
    }

    // Game State 2: User is logged, check if they have the data nft to play
    if ((address && checkingIfHasGameDataNFT && !hasGameDataNFT) || cooldown === -2) {
      return <OverLay ActionComponent={<Loader className="animate-spin" />} />;
    }

    // Game State 3: User is logged in but does not have the data nft so take them to the dashboard to claim it
    if (address && !checkingIfHasGameDataNFT && !hasGameDataNFT) {
      return (
        <OverLay
          label="Get Free BiTz Data NFT from Dashboard... "
          ActionComponent={
            <div
              onClick={() => {
                onHideBitzModel();
                navigate("/dashboard");
              }}
              className="text-sm cursor-pointer border border-primary rounded-md p-2 mt-5 bg-teal-200 hover:bg-teal-300 text-black">
              Back to Dashboard
            </div>
          }
        />
      );
    }

    // Game State 5: user can play now!
    if (_loadBlankGameCanvas) {
      return (
        <>
          <div className="relative overflow-hidden flex flex-col justify-center items-center bgx-red-700">
            <div className="gameCanvas bgx-green-500 flex flex-col md:flex-row">
              <div className={`scale-75 bgx-green-700 relative ${isFetchingDataMarshal ? "opacity-50 blur-sm" : ""}`}>
                <Wheel mustStartSpinning={mustSpin} prizeNumber={prizeNumber} data={rouletteData} onStopSpinning={handleSpinOver} />
              </div>
              <div className="flex flex-col justify-center items-center pb-[10px] md:pb-[0px]">
                <Button
                  onClick={playGame}
                  disabled={isFetchingDataMarshal || spinComplete || cooldown > 0 || gameInProgress}
                  className="m-auto text-sm w-[150px] bg-gradient-to-r from-yellow-300 to-orange-500 rounded-sm">
                  {isFetchingDataMarshal ? (
                    <span className="flex items-center justify-center">
                      <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : spinComplete ? (
                    `You won ${rouletteData[prizeNumber].bitz} points!`
                  ) : (
                    <>{gameInProgress ? "GOOD LUCK!" : "SPIN NOW!"}</>
                  )}
                </Button>
              </div>
            </div>

            {spinComplete && (
              <div className="gamePlayMeta bgx-blue-700 pb-5">
                {viewDataRes && !viewDataRes.error && (
                  <>
                    {viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs > 0 && (
                      <div>
                        <p className="text-lg text-center">You FOMOed in too fast, try again in:</p>
                        <div className="text-lg text-center mt-[.5rem]">
                          <Countdown date={Date.now() + viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs} renderer={countdownRenderer} />
                        </div>
                      </div>
                    )}
                    {viewDataRes.data.gamePlayResult.triedTooSoonTryAgainInMs === -1 && (
                      <div className="flex flex-col justify-around items-center text-center">
                        {viewDataRes.data.gamePlayResult.bitsWon === 0 && (
                          <>
                            <div className="">
                              <p className="text-lg mb-2">OPPS! You got rugged! 0 points this time...</p>
                            </div>
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
                                <p className="z-10">Tweet</p>
                              </a>
                            </div>
                          </>
                        )}

                        {(((viewDataRes.data.gamePlayResult.bonusTriesBeforeThisPlay > 0 && viewDataRes.data.gamePlayResult.bonusTriesAfterThisPlay === -1) ||
                          viewDataRes.data.gamePlayResult.bonusTriesAfterThisPlay > 0) && (
                          <div className="text-center mt-[2rem]">
                            <p className="text-lg">
                              BONUS GAMES AVAILABLE! w👀t! your referrals have earned you{" "}
                              {viewDataRes.data.gamePlayResult.bonusTriesAfterThisPlay > 0
                                ? viewDataRes.data.gamePlayResult.bonusTriesAfterThisPlay
                                : viewDataRes.data.gamePlayResult.bonusTriesBeforeThisPlay}{" "}
                              more bonus tries!
                            </p>
                            <div
                              className="cursor-pointer relative inline-flex h-12 overflow-hidden rounded-full p-[1px] "
                              onClick={() => {
                                resetToStartGame();
                              }}>
                              <span className="absolute hover:bg-sky-300 inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
                              <span className="text-primary inline-flex h-full hover:bg-gradient-to-tl from-background to-sky-300 w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
                                PLAY AGAIN! <LuMousePointerClick className="ml-2 text-sky-300" />
                              </span>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center my-[.5rem]">
                            <p className="text-lg">You can try again in:</p>
                            <div className="text-lg">
                              <Countdown date={Date.now() + viewDataRes.data.gamePlayResult.configCanPlayEveryMSecs} renderer={countdownRenderer} />
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={onHideBitzModel}
                          className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
                          Close & Return
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!userClickedToPlay && cooldown > 0 && (
              <div className="gamePlayMeta bgx-blue-700 pb-5">
                <Countdown
                  className="mx-auto text-3"
                  date={cooldown}
                  renderer={(props: { hours: number; minutes: number; seconds: number; completed: boolean }) => {
                    if (props.completed) {
                      return <> </>;
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex flex-row items-center justify-center">
                            <p className="mr-2 my-2 text-lg"> You can play again in: </p>{" "}
                            {props.hours > 0 ? <>{`${props.hours} ${props.hours === 1 ? " Hour " : " Hours "}`}</> : ""}
                            {props.minutes > 0 ? props.minutes + " Min " : ""} {props.seconds} Sec
                          </div>
                          <Button
                            onClick={onHideBitzModel}
                            className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
                            Close & Return
                          </Button>
                        </div>
                      );
                    }
                  }}
                />
              </div>
            )}
          </div>
        </>
      );
    }
  }

  return (
    <div>
      <div className="relative w-full">{gamePlayImageSprites()}</div>
    </div>
  );
};

export async function viewDataToOnlyGetReadOnlyBitz(
  requiredDataNFT: any,
  usedPreAccessNonce: string,
  usedPreAccessSignature: string,
  userPublicKey: PublicKey,
  viewDataArgs: any
) {
  try {
    if (!userPublicKey) throw new Error("Missing data for viewData");

    const res = await viewDataViaMarshalSol(
      requiredDataNFT.id,
      usedPreAccessNonce,
      usedPreAccessSignature,
      userPublicKey,
      viewDataArgs.fwdHeaderKeys,
      viewDataArgs.headers
    );

    if (res.ok) {
      const data = await res.json();
      return { data, contentType: res.headers.get("content-type") };
    }

    console.error("viewData threw catch error" + res.statusText);
    return undefined;
  } catch (err) {
    return undefined;
  }
}

export default GetBitzSol;
