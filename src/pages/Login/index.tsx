import React, { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { Loader } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthRedirectWrapper } from "components";
import { SOL_ENV_ENUM } from "config";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { getApiWeb2Apps, getArtistByCreatorWallet } from "libs/utils";
import { useSolanaWallet } from "../../contexts/sol/useSolanaWallet";
import { useAccountStore } from "../../store/account";
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
  const { updateUserWeb2AccountDetails, updateUserArtistProfile } = useAccountStore();
  const { userInfo } = useWeb3Auth();

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
      const userLoggedInMetadata: any = {
        addr,
        chainId,
      };

      if (userInfo.name) {
        userLoggedInMetadata.displayName = userInfo.name;
      }

      if (userInfo.email) {
        userLoggedInMetadata.primaryAccountEmail = userInfo.email;
      }

      const callRes = await axios.post(`${getApiWeb2Apps()}/datadexapi/userAccounts/userLoggedIn`, {
        ...userLoggedInMetadata,
      });

      const userLoggedInCallData = callRes.data;

      if (userLoggedInCallData?.error) {
        console.error("User account login call failed");
      } else {
        // let isTriggerProductTour = ""; // should we trigger the "free gift" for new users?
        let triggerNewuserExtendedProfileSetupFlag = "";
        const celebrateEmojis = ["🥳", "🎊", "🍾", "🥂", "🍻", "🍾"];

        if (userLoggedInCallData?.newUserAccountCreated) {
          updateUserWeb2AccountDetails(userLoggedInCallData);

          // isTriggerProductTour = "g=1";
          triggerNewuserExtendedProfileSetupFlag = "e=1";
        } else {
          // if profileTypes is empty, we need to trigger the extended profile setup workflow
          if (!userLoggedInCallData?.profileTypes || userLoggedInCallData?.profileTypes?.length === 0) {
            triggerNewuserExtendedProfileSetupFlag = "e=1";
          }

          updateUserWeb2AccountDetails(userLoggedInCallData);

          // get user artist profile data (IF user ever created an artist profile in the past)
          // rawAddr is the creator wallet address
          if (userLoggedInCallData.rawAddr) {
            const _artist = await getArtistByCreatorWallet(userLoggedInCallData.rawAddr);
            if (_artist) {
              updateUserArtistProfile(_artist);
            }
          }
        }

        // Get the redirect path from query parameter
        const searchParams = new URLSearchParams(location.search);
        let fromWhere = searchParams.get("from") || "/";

        // Clear the from parameter from the URL
        searchParams.delete("from");
        const newSearch = searchParams.toString();
        const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
        window.history.replaceState({}, "", newUrl);

        if (fromWhere.includes("?")) {
          if (triggerNewuserExtendedProfileSetupFlag !== "") {
            triggerNewuserExtendedProfileSetupFlag = `&${triggerNewuserExtendedProfileSetupFlag}`;
          }

          fromWhere = `${fromWhere}${triggerNewuserExtendedProfileSetupFlag}`;
        } else {
          if (triggerNewuserExtendedProfileSetupFlag !== "") {
            triggerNewuserExtendedProfileSetupFlag = `?${triggerNewuserExtendedProfileSetupFlag}`;
          }

          fromWhere = `${fromWhere}${triggerNewuserExtendedProfileSetupFlag}`;
        }

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
        <div className="rounded-2xl my-4 text-center dark:bg-[#0a0a0a] bg-slate-100 drop-shadow-2xl w-[300px] md:w-[390px]">
          {userAccountLoggingIn ? (
            <div className="p-20 flex flex-col items-center mb-[300px] mt-[200px]">
              <Loader className="animate-spin" />
              <p className="mt-2">{loggingInMsg}</p>
            </div>
          ) : (
            <div className="p-10">
              <h4 className="mb-4 font-weight-bold">Log into Sigma Music</h4>

              <div className="flex flex-col px-3 items-center mt-3">
                {isConnected ? (
                  <>
                    <button className="p-2 rounded-md border-2 cursor-pointer border-orange-400 w-[200px] h-[50px] font-bold" onClick={disconnect}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="p-2 rounded-md border-2 cursor-pointer border-orange-400 w-[200px] h-[50px] font-bold"
                    onClick={() => {
                      connect({ useWeb3AuthConnect: true });
                    }}>
                    Login With Email
                  </button>
                )}
              </div>

              <div className="phantom-login-button flex flex-col px-3 items-center mt-5">
                <span className="text-xs text-muted-foreground mb-2">Or for web3 native users, login with a solana wallet</span>
                <WalletMultiButton className="w-full !m-0">Login With Solana</WalletMultiButton>
              </div>

              <p className="text-sm text-muted-foreground mt-8">
                By "Logging in" and "Signing up", you agree to these{" "}
                <a className="underline" href="https://sigmamusic.fm/legal#terms-of-use" target="_blank" rel="noopener noreferrer">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a className="underline" href="https://sigmamusic.fm/legal#privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </p>
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
