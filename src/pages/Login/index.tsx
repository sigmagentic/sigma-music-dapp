import React, { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthRedirectWrapper } from "components";
import { SOL_ENV_ENUM } from "config";
import { getApiWeb2Apps } from "libs/utils";
import { useSolanaWallet } from "../../contexts/sol/useSolanaWallet";

/* 
we use global vars here so we can maintain this state across routing back and forth to this unlock page
these vars are used to detect a "new login", i.e a logged out user logged in. we can use this to enable
"user accounts" type activity, i.e. check if its a new user or returning user etc
*/
declare const window: {
  ITH_SOL_WALLET_CONNECTED: boolean;
} & Window;

window.ITH_SOL_WALLET_CONNECTED = false;

const loggingInMsgs = ["Logging you in", "Taking you to Web3", "Plugging you in", "Letting you in the backdoor"];

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userAccountLoggingIn, setIsUserAccountLoggingIn] = useState<boolean>(false);
  const { publicKey, isConnected, connect, disconnect } = useSolanaWallet();
  const address = publicKey?.toBase58();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    let addressSolToUse = address;

    if (!addressSolToUse) {
      window.ITH_SOL_WALLET_CONNECTED = false;
    } else {
      if (!window.ITH_SOL_WALLET_CONNECTED) {
        setIsUserAccountLoggingIn(true);

        // the user came to the unlock page without a solana connection and then connected a wallet,
        // ... i.e a non-logged in user, just logged in using SOL
        const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

        logUserLoggedInInUserAccounts(addressSolToUse, chainId);
      }

      window.ITH_SOL_WALLET_CONNECTED = true;
    }
  }, [address]);

  const logUserLoggedInInUserAccounts = async (addr: string, chainId: string) => {
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

        // // login was a success, so we take them back to where they were if possible
        // if (fromWhere.includes("?")) {
        //   fromWhere = `${fromWhere}&fromLogin=1`;
        // } else {
        //   fromWhere = `${fromWhere}?fromLogin=1`;
        // }

        navigate(fromWhere);
      }
    } catch (e) {
      console.error(e);
    }

    setIsUserAccountLoggingIn(false);
  };

  const loggingInMsg = loggingInMsgs[Math.floor(Math.random() * loggingInMsgs.length)] + "...";

  return (
    <div className="flex flex-auto">
      <div className="m-auto" data-testid="unlockPage">
        <div className="rounded-2xl my-4 text-center dark:bg-[#0a0a0a] bg-slate-100 drop-shadow-2xl w-[300px] md:w-[500px]">
          {userAccountLoggingIn ? (
            <div className="p-20 flex flex-col items-center mb-[300px] mt-[200px]">
              <Loader className="animate-spin" />
              <p className="mt-2">{loggingInMsg}</p>
            </div>
          ) : (
            <div className="p-10">
              <h4 className="mb-4 font-weight-bold">Log into Sigma Music</h4>

              <div className="flex flex-col gap-4 px-3 items-center">
                <WalletMultiButton className="w-full !m-0">Login With Solana</WalletMultiButton>
              </div>

              <div className="">
                {isConnected ? (
                  <>
                    <button className="mt-2 p-2 rounded-md border-2 cursor-pointer border-orange-400 w-[190px] font-bold" onClick={disconnect}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="mt-2 p-2 rounded-md border-2 cursor-pointer border-orange-400 w-[190px] font-bold"
                    onClick={() => {
                      connect({ useWeb3AuthConnect: true });
                    }}>
                    Login With Email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Login = () => (
  <AuthRedirectWrapper>
    <LoginPage />
  </AuthRedirectWrapper>
);
