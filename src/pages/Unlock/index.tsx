import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { ArrowBigLeft } from "lucide-react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthRedirectWrapper } from "components";
import { SOL_ENV_ENUM } from "config";
import { Button } from "libComponents/Button";
import {  getApiWeb2Apps } from "libs/utils";

/* 
we use global vars here so we can maintain this state across routing back and forth to this unlock page
these vars are used to detect a "new login", i.e a logged out user logged in. we can use this to enable
"user accounts" type activity, i.e. check if its a new user or returning user etc
*/
let solGotConnected = false;

const loggingInMsgs = ["Logging you in", "Taking you to Web3", "Plugging you in", "Letting you in the backdoor"];

const UnlockPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { publicKey: publicKeySol } = useWallet();
  const addressSol = publicKeySol?.toBase58();
  const [userAccountLoggingIn, setIsUserAccountLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    // console.log("==== effect for addressSol. addressSol = ", addressSol);

    if (!addressSol) {
      solGotConnected = false;
    } else {
      if (!solGotConnected) {
        setIsUserAccountLoggingIn(true);

        // the user came to the unlock page without a solana connection and then connected a wallet,
        // ... i.e a non-logged in user, just logged in using SOL
        // console.log("==== User JUST logged in with addressSol = ", addressSol);

        const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
        logUserLoggedInInUserAccounts(addressSol, chainId);
      }

      solGotConnected = true;
    }
  }, [addressSol]);


  const handleGoBack = () => {
    navigate(location.state?.from || "/");
    // navigate(-1); // This will take the user back to the previous page
  };

  const logUserLoggedInInUserAccounts = async (addr: string, chainId: string, isMvx?: boolean) => {
    try {
      const callRes = await axios.post(`${getApiWeb2Apps()}/datadexapi/userAccounts/userLoggedIn`, {
        addr,
        chainId,
      });

      const userLoggedInCallData = callRes.data;

      if (userLoggedInCallData?.error) {
        console.error("User account login call failed");
      } else {
        let isTriggerFreeGift = ""; // should we trigger the "free gift" for new users?
        const celebrateEmojis = ["🥳", "🎊", "🍾", "🥂", "🍻", "🍾"];

        if (userLoggedInCallData?.newUserAccountCreated) {
          toast.success("Welcome New User! Its Great To Have You Here.", {
            position: "bottom-center",
            duration: 6000,
            icon: celebrateEmojis[Math.floor(Math.random() * celebrateEmojis.length)],
          });

          isTriggerFreeGift = "g=1";
        } else if (userLoggedInCallData?.existingUserAccountLastLoginUpdated) {
          let userMessage = "";

          if (isMvx) {
            userMessage = "Welcome Back Itheum MultiversX OG!";
          } else {
            userMessage = "Welcome Back Itheum Solana Legend!";
          }

          toast.success(userMessage, {
            position: "bottom-center",
            duration: 6000,
            icon: celebrateEmojis[Math.floor(Math.random() * celebrateEmojis.length)],
          });
        }

        // where can we send them back?
        let fromWhere = location.state?.from || "/";

        if (fromWhere.includes("?")) {
          if (isTriggerFreeGift !== "") {
            isTriggerFreeGift = `&${isTriggerFreeGift}`;
          }

          fromWhere = `${fromWhere}${isTriggerFreeGift}`;
        } else {
          if (isTriggerFreeGift !== "") {
            isTriggerFreeGift = `?${isTriggerFreeGift}`;
          }

          fromWhere = `${fromWhere}${isTriggerFreeGift}`;
        }

        // login was a success, so we take them back to where they were if possible
        navigate(fromWhere);
      }
    } catch (e) {
      console.error(e);
    }

    setIsUserAccountLoggingIn(false);
  };

  const loggingInMsg = loggingInMsgs[Math.floor(Math.random() * loggingInMsgs.length)] + "...";

  return (
    <div className="flex flex-auto items-center -z-1]">
      <div className="m-auto" data-testid="unlockPage">
        <div className="rounded-2xl my-4 text-center dark:bg-[#0a0a0a] bg-slate-100 drop-shadow-2xl">
          {userAccountLoggingIn ? (
            <div className="p-20 flex flex-col items-center mb-[300px] mt-[100px]">
              <Loader2 className="animate-spin" />
              <p className="mt-2">{loggingInMsg}</p>
            </div>
          ) : (
            <>
              <Button
                className="mt-4" // Add your styling here
                onClick={handleGoBack}>
                <ArrowBigLeft /> Go Back
              </Button>
              <div className={`pt-10 px-5 px-sm-2 mx-lg-4`}>
                <h4 className="mb-4 font-weight-bold">Solana</h4>

                <div className="flex flex-col min-w-[20rem] gap-4 px-3 items-center">
                  <WalletMultiButton className="w-full !m-0" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const Unlock = () => (
  <AuthRedirectWrapper>
    <UnlockPage />
  </AuthRedirectWrapper>
);