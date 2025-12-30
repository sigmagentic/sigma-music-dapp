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
import loginHeroImg from "assets/img/sigma-login-hero.png";

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
  const { publicKey, isConnected, connect, disconnect } = useSolanaWallet();
  const address = publicKey?.toBase58();
  const { updateUserWeb2AccountDetails, updateUserArtistProfile } = useAccountStore();
  const { userInfo } = useWeb3Auth();

  const [userAccountLoggingIn, setIsUserAccountLoggingIn] = useState<boolean>(false);

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

      // we send the displayName and primaryAccountEmail, but it onlt gets used if its a new user to create the base profile
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
        let triggerNewuserExtendedProfileSetupFlag = "";

        if (userLoggedInCallData?.newUserAccountCreated) {
          updateUserWeb2AccountDetails(userLoggedInCallData);

          triggerNewuserExtendedProfileSetupFlag = "e=1";
        } else {
          // if profileTypes is empty, we need to trigger the extended profile setup workflow
          if (!userLoggedInCallData?.profileTypes || userLoggedInCallData?.profileTypes?.length === 0) {
            triggerNewuserExtendedProfileSetupFlag = "e=1";
          }

          updateUserWeb2AccountDetails(userLoggedInCallData);

          // get user artist profile data (IF user ever created an artist profile in the past), rawAddr is the creator wallet address
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
      <div className="m-auto w-full" data-testid="unlockPage">
        <div className="flex flex-col lg:flex-row w-full lg:h-[calc(100dvh-110px)] ">
          {/* Left Column - Login Form */}
          <div className="flex flex-col items-center justify-center w-full lg:w-[600px]">
            <div className="rounded-xl text-center dark:bg-[#0a0a0a] bg-slate-100 w-[300px] lg:w-[390px] m-auto border border-yellow-300/20">
              {userAccountLoggingIn ? (
                <div className="p-20 flex flex-col items-center ">
                  <Loader className="animate-spin text-yellow-300" size={20} />
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

          {/* Right Column */}
          <div
            className="hidden lg:flex items-center justify-center w-full lg:w-3/4 bg-yellow-300 p-8 bg-cover 2xl:bg-contain 2xl:bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${loginHeroImg})` }}></div>
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
