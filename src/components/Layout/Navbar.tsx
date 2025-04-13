declare const window: {
  ITH_SOL_WALLET_CONNECTED: boolean;
} & Window;

import React, { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import sigmaLogo from "assets/img/sigma-header-logo.png";
import { SolBitzDropdown } from "components/BitzDropdown/SolBitzDropdown";
import { DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "libComponents/NavigationMenu";
import { sleep } from "libs/utils";
import { routeNames } from "routes";
import { useNftsStore } from "store/nfts";
import { DataNftAirdropsBannerCTA } from "../DataNftAirdropsBannerCTA";
import { PlayBitzModal } from "../PlayBitzModal/PlayBitzModal";

export const Navbar = () => {
  const { publicKey: publicKeySol, walletType, disconnect, isConnected } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const isLoggedInSol = !!addressSol;
  const [showPlayBitzModal, setShowPlayBitzModal] = useState<boolean>(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState<boolean>(false);
  const location = useLocation();
  const { solBitzNfts } = useNftsStore();

  useEffect(() => {
    // if the user is logged in (even after they reload page and still have a session)
    // ... and then they logout, we hard reload the page to clear the app state to pristine
    // ... but we dont do any this logic in the login route as that messes with the post login redirect
    if (location.pathname !== routeNames.login) {
      if (!addressSol && window.ITH_SOL_WALLET_CONNECTED) {
        setTimeout(() => {
          window.ITH_SOL_WALLET_CONNECTED = false;
          window.location = window.location.href.split("?")[0];
        }, 200);
      } else if (isConnected && !window.ITH_SOL_WALLET_CONNECTED) {
        // connected user reloaded page
        window.ITH_SOL_WALLET_CONNECTED = true;
      }
    }
  }, [addressSol, isConnected, location.pathname]);

  return (
    <>
      <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem] h-full">
        <div className="flex flex-col items-left text-xl">
          <Link className="flex flex-row items-center" to={routeNames.home}>
            <div className="flex flex-row leading-none">
              <img src={sigmaLogo} alt="Sigma Music Logo" className="w-[230px] mt-[10px]" />
            </div>
          </Link>
        </div>

        <NavigationMenu className="md:!inline !hidden z-0 pr-2 relative md:z-10">
          <NavigationMenuList>
            {/* XP Button */}
            {!DISABLE_BITZ_FEATURES && isLoggedInSol && solBitzNfts.length > 0 && (
              <>
                <NavigationMenuItem>
                  <SolBitzDropdown
                    handlePlayActionBtn={async () => {
                      await sleep(0.2);
                      setShowPlayBitzModal(true);
                    }}
                  />
                </NavigationMenuItem>
              </>
            )}

            {location.pathname !== routeNames.login && (
              <NavigationMenuItem>
                {!publicKeySol ? (
                  <>
                    {/* Web3 Wallet Login Button */}
                    <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center">
                      <Button
                        className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-lg h-[48px]"
                        variant="outline"
                        onClick={() => {
                          window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search)}`;
                        }}>
                        Login
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Web3 Wallet Account Button */}
                    {walletType === "web3auth" ? (
                      <button
                        className="mt-2 p-2 rounded-md border-2 cursor-pointer border-orange-400 font-bold"
                        onClick={() => setShowLogoutConfirmation(true)}>
                        Logout
                      </button>
                    ) : (
                      <div className="phantom-manage-account-button">
                        <WalletMultiButton className="w-full !m-0">Account</WalletMultiButton>
                      </div>
                    )}
                  </>
                )}
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu */}
        {location.pathname !== routeNames.login && (
          <div className="md:!hidden !visible">
            <DropdownMenu>
              <div className="flex flex-row">
                {isLoggedInSol ? (
                  <SolBitzDropdown
                    handlePlayActionBtn={async () => {
                      await sleep(0.2);
                      setShowPlayBitzModal(true);
                    }}
                  />
                ) : (
                  <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                    <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] w-full rounded-lg justify-center">
                      <Button
                        className="dark:bg-[#0f0f0f] dark:text-white hover:dark:bg-[#0f0f0f20] border-0 rounded-lg font-medium tracking-wide"
                        variant="outline">
                        Login
                      </Button>
                    </div>
                  </Link>
                )}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Menu />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="w-56">
                {isLoggedInSol && (
                  <>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuGroup>
                  <div className="m-auto bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg w-fit">
                    <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                      <Button
                        className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-lg"
                        variant="outline">
                        Account
                      </Button>
                    </Link>
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Inline Game For Play Bitz Modal */}
        {!DISABLE_BITZ_FEATURES && showPlayBitzModal && (
          <PlayBitzModal
            showPlayBitzModel={showPlayBitzModal}
            handleHideBitzModel={() => {
              setShowPlayBitzModal(false);
            }}
          />
        )}
      </div>

      {publicKeySol && walletType !== "web3auth" && (
        <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem]">
          <DataNftAirdropsBannerCTA
            onRemoteTriggerOfBiTzPlayModel={(open: boolean) => {
              setShowPlayBitzModal(open);
            }}
          />
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Logout</h3>
            <div className="space-y-4">
              <p>Are you sure you want to logout?</p>
              <div className="flex gap-4">
                <Button onClick={() => setShowLogoutConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowLogoutConfirmation(false);
                    disconnect();
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
