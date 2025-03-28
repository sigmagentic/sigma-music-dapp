import React, { useEffect, useState } from "react";
import { confetti } from "@tsparticles/confetti";
import { motion } from "framer-motion";
import { ArrowBigRightDashIcon, ExternalLinkIcon } from "lucide-react";
import bitzLogo from "assets/img/getbitz/givebitz/flaskBottle.png";
import { HoverBorderGradient } from "libComponents/animated/HoverBorderGradient";
import useSolBitzStore from "store/solBitz";
import GiverLeaderboard from "./GiverLeaderboard";
import { GiveBitzLowerCardProps } from "../interfaces";

const GiveBitzLowerCard: React.FC<GiveBitzLowerCardProps> = (props) => {
  const { bountyId, bountySubmitter, sendPowerUp, fetchGivenBitsForGetter, fetchGetterLeaderBoard, isSendingPowerUp, setIsSendingPowerUp } = props;
  const [isPowerUpSuccess, setIsPowerUpSuccess] = useState(false);
  const [tweetText, setTweetText] = useState("");
  const [termsOfUseCheckbox, setTermsOfUseCheckbox] = useState(false);
  const [bitzVal, setBitzVal] = useState<number>(0);
  const [bitzGivenToCreator, setBitzGivenToCreator] = useState<number>(-1);
  const solBitzBalance = useSolBitzStore((state) => state.bitzBalance);
  const bitzBalance = solBitzBalance;

  useEffect(() => {
    async function fetchData() {
      const _fetchGivenBitsForCreator = await fetchGivenBitsForGetter({ getterAddr: bountySubmitter, campaignId: bountyId });
      setBitzGivenToCreator(_fetchGivenBitsForCreator);
    }
    fetchData();
  }, []);

  async function handlePowerUp() {
    setIsSendingPowerUp(true);
    setIsPowerUpSuccess(false);
    setTweetText("");
    const bitzSent = bitzVal;
    const _isPowerUpSuccess = await sendPowerUp({
      bitsVal: bitzVal,
      bitsToWho: bountySubmitter,
      bitsToCampaignId: bountyId,
      isNewGiver: bitzGivenToCreator <= 0 ? 1 : 0,
    });

    if (_isPowerUpSuccess) {
      const _bitzGivenToCreator = bitzGivenToCreator >= 0 ? bitzGivenToCreator + bitzSent : bitzSent;

      await (async () => {
        const canvas = document.getElementById("canvas-" + bountyId) as any;
        canvas.confetti = canvas.confetti || (await confetti.create(canvas, {}));
        await canvas.confetti({
          spread: 90,
          particleCount: Math.min(bitzSent * 8, 400),
          scalar: 2,
          shapes: ["image"],
          shapeOptions: {
            image: [
              {
                src: bitzLogo,
                width: 30,
                height: 30,
              },
            ],
          },
        });
      })();
      setTweetText(
        `url=https://explorer.itheum.io/getbitz?v=2&text=I just gave ${bitzVal} of my precious %23itheum BiTz XP to Power-Up a Data Bounty in return for some exclusive rewards and perks.%0A%0AWhat are you waiting for? %23GetBiTz and %23GiveBiTz here`
      );
      setBitzVal(0);
      setBitzGivenToCreator(_bitzGivenToCreator);
      setIsPowerUpSuccess(true);
    }

    setBitzVal(0); // reset the figure the user sent
    setIsSendingPowerUp(false);
  }

  return (
    <>
      <div className="h-[18rem]">
        <div className=" items-center gap-2   my-rank-and-score  flex  justify-center   p-[.6rem] mb-[1rem] rounded-[1rem] text-center bg-[#fde047] bg-opacity-25">
          <p className="flex  md:text-lg md:mr-[1rem]">Given BiTz</p>
          <p className="text-lg md:text-xl dark:text-[#fde047] font-bold">
            {bitzGivenToCreator === -1 ? "Loading..." : <>{bitzGivenToCreator === -2 ? "0" : bitzGivenToCreator}</>}
          </p>
        </div>

        <div id={"canvas-" + bountyId} className="flex flex-col items-center justify-between w-full h-[75%] relative">
          <motion.div
            className="flex flex-col items-center justify-between w-full h-full absolute top-0 left-0"
            initial={{ x: 0 }}
            animate={{ x: isPowerUpSuccess ? 0 : "100%", opacity: isPowerUpSuccess ? 1 : 0 }}
            transition={{ duration: 0.6 }}>
            <p> Share your support for the bounty! Tweet about your contribution and help spread the word.</p>

            <button onClick={() => setIsPowerUpSuccess(false)} className=" justify-end z-10 ml-auto">
              <ArrowBigRightDashIcon className="text-foreground hover:scale-125 transition-all" />
            </button>
            <HoverBorderGradient className="-z-1 ">
              <a
                className="z-1 bg-black text-white  rounded-3xl gap-2 flex flex-row justify-center items-center"
                href={"https://twitter.com/intent/tweet?" + tweetText}
                data-size="large"
                target="_blank">
                <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                  </svg>
                </span>
                <p className="z-10">Tweet</p>
              </a>
            </HoverBorderGradient>
          </motion.div>

          <motion.div
            className="flex flex-col items-start justify-between w-full h-full absolute top-0 left-0"
            initial={{ x: 0 }}
            animate={{ x: !isPowerUpSuccess ? 0 : "100%", opacity: !isPowerUpSuccess ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}>
            <div>Give More BiTz</div>
            <div className="mb-3 mt-1 w-full">
              <div className="flex flex-row gap-2 justify-center items-center">
                <input
                  type="range"
                  id="rangeBitz"
                  min="0"
                  max={bitzBalance}
                  step="1"
                  value={bitzVal}
                  onChange={(e) => setBitzVal(Number(e.target.value))}
                  className="accent-black dark:accent-white w-full cursor-pointer custom-range-slider"
                />
                <input
                  type="number"
                  min="0"
                  max={bitzBalance}
                  step="1"
                  value={bitzVal}
                  onChange={(e) => setBitzVal(Math.min(Number(e.target.value), bitzBalance))}
                  className="bg-[#fde047]/30 text- dark:text-[#fde047] focus:none  focus:outline-none focus:border-transparent text-center border-[#fde047] rounded-md"
                />
              </div>

              <div className="flex flex-row items-center md:gap-2">
                <input
                  type="checkbox"
                  required
                  className="cursor-pointer accent-[#fde047]"
                  checked={termsOfUseCheckbox}
                  onChange={(e) => setTermsOfUseCheckbox(e.target.checked)}
                />
                <div className="ml-1 mt-5 text-sm md:text-base">
                  I have read and agree to the <br />
                  <a
                    className="!text-[#fde047] hover:underline flex flex-row gap-2"
                    href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/bitz-xp/give-bitz"
                    target="blank">
                    Give BiTz terms of use <ExternalLinkIcon width={16} />
                  </a>
                </div>
              </div>
            </div>

            <button
              disabled={!(bitzVal > 0) || isSendingPowerUp || !termsOfUseCheckbox}
              className="disabled:cursor-not-allowed hover:scale-110 transition-all flex items-center justify-center disabled:bg-[#fde047]/30 bg-[#fde047]   mt-10 w-[12rem] md:w-[15rem] mx-auto rounded-3xl h-10"
              onClick={() => {
                setIsPowerUpSuccess(false);
                setTweetText("");
                handlePowerUp();
              }}>
              {!isSendingPowerUp ? (
                <div className=" flex items-center m-[2px] p-2 justify-center text-foreground bg-neutral-950/30 dark:bg-neutral-950  w-full h-full rounded-3xl">
                  {bitzBalance === -1 ? "No bitz to send" : `Send ${bitzVal} BiTz Power Up`}
                </div>
              ) : (
                <div className="w-[12rem] md:w-[15rem] h-10 relative inline-flex  overflow-hidden rounded-3xl p-[1px] text-foreground ">
                  <span className="absolute hover:bg-[#fde047] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
                  <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#fde047] w-full cursor-pointer items-center justify-center rounded-full bg-[#fde047]/20 dark:bg-neutral-950 px-3 py-1 text-sm font-medium backdrop-blur-3xl">
                    <p className="text-foreground"> Sending bitz... </p>
                  </span>
                </div>
              )}
            </button>
          </motion.div>
        </div>
      </div>
      <GiverLeaderboard
        bountyId={bountyId}
        bountySubmitter={bountySubmitter}
        fetchGetterLeaderBoard={fetchGetterLeaderBoard}
        showUserPosition={bitzGivenToCreator > 0}
      />
    </>
  );
};

export default GiveBitzLowerCard;
