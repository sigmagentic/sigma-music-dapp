declare const window: {
  ITH_SOL_WALLET_CONNECTED: boolean;
} & Window;

import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Menu, User } from "lucide-react";
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
import { AlertBanner } from "./AlertBanner";
import { DataNftAirdropsBannerCTA } from "../DataNftAirdropsBannerCTA";
import { GetNFMeModal } from "../GetNFMeModal";
import { NFMePreferencesModal } from "../NFMePreferencesModal";
import { PlayBitzModal } from "../PlayBitzModal/PlayBitzModal";

interface NFMeIdContent {
  links: {
    image: string;
  };
  metadata: {
    name: string;
    description: string;
  };
}

export const Navbar = () => {
  const { publicKey: publicKeySol, walletType, disconnect, isConnected } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const isLoggedInSol = !!addressSol;
  const [showPlayBitzModal, setShowPlayBitzModal] = useState<boolean>(false);
  const [showNfMeIdModal, setShowNfMeIdModal] = useState<boolean>(false);
  const [showNfMePreferencesModal, setShowNfMePreferencesModal] = useState<boolean>(false);
  const location = useLocation();
  const { solBitzNfts, solNFMeIdNfts } = useNftsStore();
  const [nfMeIdImageUrl, setNfMeIdImageUrl] = useState<string | null>(null);

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
  }, [addressSol, isConnected, location]);

  useEffect(() => {
    if (solNFMeIdNfts.length > 0) {
      // Get the NFMe ID image if available (@TODO : in reality user may have multiple NFMes and only 1 that is bonded into a NFMe ID, we can do this later)
      const nfMeId = solNFMeIdNfts[0] as (DasApiAsset & { content: NFMeIdContent }) | undefined;

      const nfmeImg = nfMeId?.content?.links?.image;

      if (nfmeImg) {
        sessionStorage.removeItem("sig-nfme-later"); // cleanup this session storage key
        setNfMeIdImageUrl(nfmeImg);
      } else {
        setNfMeIdImageUrl(null);
      }
    }
  }, [solNFMeIdNfts]);

  return (
    <>
      <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem] h-full">
        <div className="flex flex-col items-left text-xl">
          <Link className="flex flex-row items-center" to={routeNames.home}>
            <div className="flex flex-row leading-none">
              <img src={sigmaLogo} alt="Sigma Music Logo" className="w-[230px]" />
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

            {isLoggedInSol && walletType !== "web3auth" && (
              <>
                <NavigationMenuItem>
                  {/* NFMe ID Profile Image */}
                  <div className="flex items-center relative group">
                    {nfMeIdImageUrl ? (
                      <img
                        src={nfMeIdImageUrl}
                        alt="NFMe ID"
                        className="w-[48px] h-[48px] rounded-md object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                        onClick={() => setShowNfMePreferencesModal(true)}
                      />
                    ) : (
                      <div
                        onClick={() => setShowNfMeIdModal(true)}
                        className="w-[48px] h-[48px] rounded-md bg-gray-800 flex items-center justify-center cursor-pointer transition-transform duration-300 group-hover:scale-110">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {nfMeIdImageUrl ? "Your NFMe ID" : "Get NFMe ID"}
                    </div>
                  </div>
                </NavigationMenuItem>
              </>
            )}

            {location.pathname !== routeNames.login && (
              <NavigationMenuItem>
                {!publicKeySol ? (
                  <>
                    {/* Web3 Wallet Login Button */}
                    <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                      <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center">
                        <Button
                          className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-lg h-[48px]"
                          variant="outline">
                          Login
                        </Button>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Web3 Wallet Account Button */}
                    {walletType === "web3auth" ? (
                      <button
                        className="mt-2 p-2 rounded-md border-2 cursor-pointer border-orange-400 w-[190px] font-bold"
                        onClick={() => {
                          const confirmed = window.confirm("Are you sure you want to logout?");
                          if (confirmed) {
                            disconnect();
                          }
                        }}>
                        Logout{" "}
                        <span className="text-xs">
                          {publicKeySol?.toBase58().slice(0, 4)}... {publicKeySol?.toBase58().slice(-4)}
                        </span>
                      </button>
                    ) : (
                      <WalletMultiButton className="w-full !m-0">Account</WalletMultiButton>
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

      <AlertBanner />

      {publicKeySol && walletType !== "web3auth" && (
        <div className="flex flex-row justify-between items-center mx-[1rem] md:mx-[1rem]">
          <DataNftAirdropsBannerCTA
            onRemoteTriggerOfBiTzPlayModel={(open: boolean) => {
              setShowPlayBitzModal(open);
            }}
          />
        </div>
      )}

      {/* NFMe ID Claim Modal */}
      {showNfMeIdModal && <GetNFMeModal setShowNfMeIdModal={setShowNfMeIdModal} setShowNfMePreferencesModal={setShowNfMePreferencesModal} />}

      {/* NFMe Preferences Modal */}
      <NFMePreferencesModal isOpen={showNfMePreferencesModal} onClose={() => setShowNfMePreferencesModal(false)} />
    </>
  );
};
