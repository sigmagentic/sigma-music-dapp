import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Speaker } from "lucide-react";
import Countdown from "react-countdown";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { Popover, PopoverContent, PopoverTrigger } from "libComponents/Popover";
import { useNftsStore } from "store/nfts";
import useSolBitzStore from "store/solBitz";

export const SolBitzDropdown = (props: any) => {
  const { skipNavBarPopOverOption, showOnlyClaimBitzButton, handlePlayActionBtn, handleShowBuyXPModal } = props;
  const cooldown = useSolBitzStore((state: any) => state.cooldown);
  const solBitzBalance = useSolBitzStore((state: any) => state.bitzBalance);
  const { isConnected: isLoggedInSol } = useSolanaWallet();

  return (
    <div className={`${!skipNavBarPopOverOption ? "border border-yellow-500 rounded-sm justify-center cursor-pointer" : ""}`}>
      <Popover>
        {showOnlyClaimBitzButton ? (
          <>
            <ClaimBitzButton cooldown={cooldown} handlePlayActionBtn={handlePlayActionBtn} />
            <Button className="text-sm tracking-wide hover:bg-transparent px-0.5 ml-0.5" variant="ghost">
              Purchase Sigma XP Boost
            </Button>
          </>
        ) : (
          <>
            <PopoverTrigger>
              <div className="flex flex-row items-center px-3 py-[3.5px]">
                <Button className="text-sm tracking-wide hover:bg-transparent px-0.5 ml-0.5" variant="ghost">
                  {isLoggedInSol ? (
                    solBitzBalance === -2 ? (
                      <div className="flex items-center gap-0.5 blinkMe text-lg">
                        <FlaskBottleAnimation cooldown={cooldown} />
                      </div>
                    ) : (
                      <>
                        {solBitzBalance === -1 ? (
                          <div className="flex items-center gap-0.5 text-base">
                            0 <FlaskBottleAnimation cooldown={cooldown} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 text-base">
                            {solBitzBalance.toLocaleString()} <FlaskBottleAnimation cooldown={cooldown} />
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    <>CTA</>
                  )}
                </Button>
              </div>
            </PopoverTrigger>

            {!skipNavBarPopOverOption && (
              <PopoverContent className="w-[15rem] md:w-[25rem]">
                <PopoverPrimitive.Arrow className="fill-border w-5 h-3" />
                <div className="flex flex-col justify-center p-3 w-full">
                  <div className="flex justify-center w-full py-4">
                    <div className="flex w-16 h-16 justify-center items-center rounded-sm border-yellow-500 border-[1px]">
                      <Speaker className="w-7 h-7" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl text-center font-[Clash-Medium]">What is Sigma XP?</p>
                  <p className="text-xs md:text-sm font-[Satoshi-Regular] leading-relaxed py-4 text-center">
                    Collect and Use Sigma XP in the Sigma Music app to generate and curate content.
                  </p>

                  <ClaimBitzButton cooldown={cooldown} handlePlayActionBtn={handlePlayActionBtn} />
                  <BuySigmaXPButton handleShowBuyXPModal={handleShowBuyXPModal} />
                </div>
              </PopoverContent>
            )}
          </>
        )}
      </Popover>
    </div>
  );
};

export const BuySigmaXPButton = (props: any) => {
  const { handleShowBuyXPModal } = props;
  return (
    <PopoverPrimitive.PopoverClose asChild>
      <div
        className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] mt-5"
        onClick={() => {
          handleShowBuyXPModal();
        }}>
        <span className="absolute hover:bg-[#fde047] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#fde047,#fde047_30%,#111111_50%)]" />
        <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#fde047] w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
          Purchase Sigma XP Boost
        </span>
      </div>
    </PopoverPrimitive.PopoverClose>
  );
};

export const ClaimBitzButton = (props: any) => {
  const { cooldown, handlePlayActionBtn } = props;
  const { updateCooldown } = useSolBitzStore();
  const { solBitzNfts } = useNftsStore();

  return (
    <div
      className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px]"
      onClick={() => {
        if (cooldown > -2 && handlePlayActionBtn && solBitzNfts.length > 0) {
          handlePlayActionBtn();
        } else {
          return;
        }
      }}>
      <span className="absolute hover:bg-[#fde047] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#fde047,#fde047_30%,#111111_50%)]" />
      <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#fde047] w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
        {cooldown === -2 ? (
          <span className="blinkMe">Click to Get Sigma XP</span>
        ) : cooldown > 0 ? (
          <Countdown
            date={cooldown}
            onComplete={() => {
              updateCooldown(0);
            }}
            renderer={(props: { hours: number; minutes: number; seconds: number; completed: boolean }) => {
              if (props.completed) {
                return (
                  <PopoverPrimitive.PopoverClose asChild>
                    <div className="flex flex-row justify-center items-center">
                      <span className="text-[12px] md:text-sm"> Win Free Sigma XP </span>
                    </div>
                  </PopoverPrimitive.PopoverClose>
                );
              } else {
                return (
                  <PopoverPrimitive.PopoverClose asChild>
                    <span className="ml-1 text-center">
                      Play again in <br></br>
                      {props.hours > 0 ? <>{`${props.hours} ${props.hours === 1 ? " Hour " : " Hours "}`}</> : ""}
                      {props.minutes > 0 ? props.minutes + " Min " : ""} {props.seconds} Sec
                    </span>
                  </PopoverPrimitive.PopoverClose>
                );
              }
            }}
          />
        ) : (
          <PopoverPrimitive.PopoverClose asChild>
            <div className="flex flex-row justify-center items-center">
              <span className="text-[12px] md:text-sm"> Win Free Sigma XP </span>
            </div>
          </PopoverPrimitive.PopoverClose>
        )}
      </span>
    </div>
  );
};

export const FlaskBottleAnimation = (props: any) => {
  const { cooldown } = props;

  return (
    <div className="relative w-full h-full ">
      {cooldown <= 0 && cooldown != -2 && (
        <>
          <div
            className="absolute rounded-full w-[0.4rem] h-[0.4rem] top-[-15px] left-[10px] bg-[#fde047] animate-ping-slow"
            style={{ animationDelay: "1s" }}></div>
          <div
            className="absolute rounded-full w-[0.3rem] h-[0.3rem] top-[-8px] left-[4px] bg-[#fde047] animate-ping-slow"
            style={{ animationDelay: "0.5s" }}></div>
          <div className="absolute rounded-full w-1 h-1 top-[-5px] left-[13px] bg-[#fde047] animate-ping-slow"></div>
        </>
      )}
      <Speaker className="" />
    </div>
  );
};
