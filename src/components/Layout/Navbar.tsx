import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { SolBitzDropdown, FlaskBottleAnimation } from "components/BitzDropdown/SolBitzDropdown";
import { CopyAddress } from "components/CopyAddress";
import { Button } from "libComponents/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "libComponents/NavigationMenu";
import { sleep } from "libs/utils";
import { getNFTuneFirstTrackBlobData } from "pages/AppMarketplace/NFTunes";
import { routeNames } from "routes";
import { useAppsStore } from "store/apps";
import { useLocalStorageStore } from "store/LocalStorageStore.ts";
import { SwitchButton } from "./SwitchButton";
import { DataNftAirdropsBannerCTA } from "../DataNftAirdropsBannerCTA";
import { PlayBitzModal } from "../PlayBitzModal/PlayBitzModal";

export const Navbar = () => {
  const { publicKey: publicKeySol, signMessage } = useWallet();
  const addressSol = publicKeySol?.toBase58();
  const isLoggedInSol = !!addressSol;
  const setDefaultChain = useLocalStorageStore((state) => state.setDefaultChain);
  const [showPlayBitzModal, setShowPlayBitzModal] = useState<boolean>(false);
  const appsStore = useAppsStore();
  const updateNfTunesRadioFirstTrackCachedBlob = appsStore.updateNfTunesRadioFirstTrackCachedBlob;

  useEffect(() => {
    // lets get the 1st song blob for NFTunes Radio, so we can store in the "browser" cache for fast playback
    // ... we do it here as the NavBar loads first always
    async function cacheFirstNFTuneRadioTrack() {
      const nfTunesRadioFirstTrackCachedBlob = appsStore.nfTunesRadioFirstTrackCachedBlob;

      if (nfTunesRadioFirstTrackCachedBlob === "") {
        const trackBlobUrl = await getNFTuneFirstTrackBlobData();

        if (trackBlobUrl !== "") {
          console.log("NFTune Radio 1st Song Data Cached...");
        }

        updateNfTunesRadioFirstTrackCachedBlob(trackBlobUrl || "");
      }
    }

    cacheFirstNFTuneRadioTrack();
  }, []);

  return (
    <>
      <div className="flex flex-row justify-between items-center xl:mx-[1rem] md:mx-[1rem] h-20">
        <div className="flex flex-row items-center text-xl">
          <Link className="flex flex-row items-center" to={routeNames.home}>
            <div className="flex flex-row leading-none">
              <span className="text-black dark:!text-white md:text-lg text-base">Sigma &nbsp;</span>
              <span className="bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold text-base ">Music</span>
            </div>
          </Link>
        </div>

        <NavigationMenu className="md:!inline !hidden z-0 pr-2 relative md:z-10">
          <NavigationMenuList>
            {isLoggedInSol ? (
              <>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Account</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {isLoggedInSol && (
                        <div className="flex flex-col p-3">
                          <p className="text-sm font-medium leading-none pb-0.5">SOL Address Quick Copy</p>
                          <CopyAddress address={addressSol} precision={6} />
                        </div>
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  {isLoggedInSol && (
                    <SolBitzDropdown
                      handlePlayActionBtn={async () => {
                        setDefaultChain("solana");
                        await sleep(0.2);
                        setShowPlayBitzModal(true);
                      }}
                    />
                  )}
                </NavigationMenuItem>
              </>
            ) : (
              // <div className={"shadow-sm shadow-[#35d9fa] rounded-lg justify-center cursor-pointer"}>
              //   <div className="flex flex-row items-center px-3">
              //     <Link to={routeNames.getbitz}>
              //       <Button className="text-sm tracking-wide hover:bg-transparent px-0.5 ml-0.5" variant="ghost">
              //         <FlaskBottleAnimation cooldown={0} />
              //         <div className="ml-1">XP</div>
              //       </Button>
              //     </Link>
              //   </div>
              // </div>
              <></>
            )}

            <NavigationMenuItem>
              <Link to={routeNames.unlock} state={{ from: `${location.pathname}${location.search}` }}>
                <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center">
                  <Button
                    className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-lg"
                    variant="outline">
                    Manage Login
                  </Button>
                </div>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <SwitchButton />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu */}
        <div className="md:!hidden !visible">
          <DropdownMenu>
            <div className="flex flex-row">
              {isLoggedInSol ? (
                <SolBitzDropdown
                  handlePlayActionBtn={async () => {
                    setDefaultChain("solana");
                    await sleep(0.2);
                    setShowPlayBitzModal(true);
                  }}
                />
              ) : (
                <Link to={routeNames.unlock} state={{ from: `${location.pathname}${location.search}` }}>
                  <div className="bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] w-full rounded-lg justify-center">
                    <Button
                      className="dark:bg-[#0f0f0f] dark:text-white hover:dark:bg-[#0f0f0f20] border-0 rounded-lg font-medium tracking-wide"
                      variant="outline">
                      Login
                    </Button>
                  </div>
                </Link>
              )}
              <SwitchButton />
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
                  {isLoggedInSol && (
                    <DropdownMenuItem className="gap-4">
                      <CopyAddress address={addressSol || ""} precision={6} />
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <DropdownMenuGroup>
                <div className="m-auto bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg w-fit">
                  <Link to={routeNames.unlock} state={{ from: `${location.pathname}${location.search}` }}>
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

        {showPlayBitzModal && <PlayBitzModal showPlayBitzModel={showPlayBitzModal} handleHideBitzModel={() => setShowPlayBitzModal(false)} />}
      </div>

      {publicKeySol && (
        <div className="flex flex-row justify-between items-center xl:mx-[1rem] md:mx-[1rem]">
          <DataNftAirdropsBannerCTA />
        </div>
      )}
    </>
  );
};
