declare const window: {
  ITH_SOL_WALLET_CONNECTED: boolean;
} & Window;

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SolBitzDropdown } from "components/BitzDropdown/SolBitzDropdown";
import { DISABLE_BITZ_FEATURES } from "config";
import { Button } from "libComponents/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "libComponents/NavigationMenu";
import { sleep } from "libs/utils";
import { routeNames } from "routes";
import { useNftsStore } from "store/nfts";
import { AlertBanner } from "./AlertBanner";
import { DataNftAirdropsBannerCTA } from "../DataNftAirdropsBannerCTA";
import { PlayBitzModal } from "../PlayBitzModal/PlayBitzModal";

export const Navbar = () => {
  const { publicKey: publicKeySol, connected } = useWallet();
  const addressSol = publicKeySol?.toBase58();
  const isLoggedInSol = !!addressSol;
  const [showPlayBitzModal, setShowPlayBitzModal] = useState<boolean>(false);
  const location = useLocation();
  const { solBitzNfts } = useNftsStore();
  const navigate = useNavigate();

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
      } else if (connected && !window.ITH_SOL_WALLET_CONNECTED) {
        // connected user reloaded page
        window.ITH_SOL_WALLET_CONNECTED = true;
      }
    }
  }, [addressSol, connected, location]);

  const appSubtitle = "Create Music with AI Agents. Collect Music NFTs. Support Musicians.";

  return (
    <>
      <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem] h-20">
        <div className="flex flex-col items-left text-xl">
          <Link className="flex flex-row items-center" to={routeNames.home}>
            <div className="flex flex-row leading-none">
              <span className="text-black dark:!text-white text-3xl">Sigma&nbsp;</span>
              <span className="bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent text-sm -ml-1">Music</span>
            </div>
          </Link>
          <span className="hidden md:block text-xs text-muted-foreground mt-1">{appSubtitle}</span>
        </div>

        <NavigationMenu className="md:!inline !hidden z-0 pr-2 relative md:z-10">
          <NavigationMenuList>
            {location.pathname !== routeNames.remix && location.pathname !== routeNames.login && (
              <>
                <Button
                  onClick={() => {
                    navigate(routeNames.remix);
                  }}
                  className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%] transition ease-in-out delay-50 duration-100 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-sm md:text-lg text-center p-2 md:p-3 h-[49px] rounded-lg">
                  <div>REMiX: Launch AI Music Meme Coins</div>
                </Button>
              </>
            )}

            {!DISABLE_BITZ_FEATURES && isLoggedInSol && solBitzNfts.length > 0 ? (
              <>
                <NavigationMenuItem>
                  {isLoggedInSol && (
                    <SolBitzDropdown
                      handlePlayActionBtn={async () => {
                        await sleep(0.2);
                        setShowPlayBitzModal(true);
                      }}
                    />
                  )}
                </NavigationMenuItem>
              </>
            ) : (
              <></>
            )}

            {location.pathname !== routeNames.login && (
              <NavigationMenuItem>
                {!publicKeySol ? (
                  <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                    <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center">
                      <Button
                        className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-lg h-[48px]"
                        variant="outline">
                        Login
                      </Button>
                    </div>
                  </Link>
                ) : (
                  <WalletMultiButton className="w-full !m-0">Account</WalletMultiButton>
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
                        Manage Login
                      </Button>
                    </Link>
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!DISABLE_BITZ_FEATURES && showPlayBitzModal && (
          <PlayBitzModal
            showPlayBitzModel={showPlayBitzModal}
            handleHideBitzModel={() => {
              setShowPlayBitzModal(false);
            }}
          />
        )}
      </div>

      <div className="md:hidden flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem]">
        <span className="text-xs text-muted-foreground mt-1 text-center">{appSubtitle}</span>
      </div>

      {publicKeySol && (
        <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem]">
          <DataNftAirdropsBannerCTA
            onRemoteTriggerOfBiTzPlayModel={(open: boolean) => {
              setShowPlayBitzModal(open);
            }}
          />
        </div>
      )}

      <AlertBanner />
    </>
  );
};
