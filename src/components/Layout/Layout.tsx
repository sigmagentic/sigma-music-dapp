import React, { useState } from "react";
import {
  HomeIcon,
  RadioIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  Square3Stack3DIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CursorArrowRippleIcon,
  PuzzlePieceIcon,
  UserIcon,
  GlobeEuropeAfricaIcon,
} from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { ENABLE_WSB_CAMPAIGN } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { routeNames } from "routes";
import { useAppStore } from "store/app";
import { AlertBanner } from "./AlertBanner";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute transform -translate-y-full mt-5 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 peer-hover:opacity-100 peer-hover:fixed transition-opacity whitespace-nowrap z-50">
        {text}
      </div>
    </div>
  );
};

export const Layout = ({
  children,
  homeMode,
  setHomeMode,
  setTriggerToggleRadioPlayback,
}: {
  children: React.ReactNode;
  homeMode: string;
  setHomeMode: (homeMode: string) => void;
  setTriggerToggleRadioPlayback: (triggerToggleRadioPlayback: string) => void;
}) => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { publicKey: publicKeySol } = useSolanaWallet();
  const paymentInProgress = useAppStore((state) => state.paymentInProgress);

  const removeArtistProfileParamFromUrl = () => {
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist"];
    delete currentParams["campaign"];
    delete currentParams["tab"];
    setSearchParams(currentParams);
  };

  const isLoginRoute = location.pathname === routeNames.login;
  const isFAQRoute = location.pathname === routeNames.faq;
  const isLoggedIn = !!publicKeySol;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className={`header ${paymentInProgress ? "opacity-50 cursor-progress pointer-events-none" : ""} md:fixed md:top-0 md:left-0 md:right-0 md:z-10`}>
        <Navbar />
      </div>

      <div className="body mt-2 flex-1 md:mt-[72px] md:mb-[30px]">
        <div className="flex flex-col md:flex-row h-full">
          <div
            className={`${isFAQRoute ? "hidden" : ""} side-panel-menu md:min-h-[calc(100vh-102px)] md:p-4 text-white transition-all duration-300 relative w-full ${isMenuCollapsed ? "md:w-20" : "md:w-52"} ${isLoginRoute ? "hidden" : ""}`}>
            <nav className={`flex flex-row md:flex-col md:space-y-6 ${paymentInProgress ? "opacity-50 cursor-progress pointer-events-none" : ""}`}>
              <div className={`menu-section hidden md:flex ${isMenuCollapsed ? "ml-[7px]" : "md:justify-center"} `}>
                <button
                  onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                  className="py-2 px-3 text-white rounded-full transition-colors border-2 border-white">
                  {isMenuCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronLeftIcon className="h-3 w-3" />}
                </button>
              </div>

              <div className="menu-section w-full !mt-[10px]">
                <div
                  className={`
                flex md:flex-col 
                overflow-y-hidden
                overflow-x-auto md:overflow-x-hidden 
                scrollbar-hide 
                py-2 md:py-0
                px-4 md:px-0
                space-x-4 md:space-x-0 
                md:space-y-2 
                ${!isMenuCollapsed ? "md:ml-4" : ""}
              `}>
                  <Tooltip text="Home">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode("home");
                      }}
                      disabled={homeMode === "home"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <HomeIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">Home</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Home</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Toggle Radio">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setTriggerToggleRadioPlayback("radio-" + new Date().getTime().toString());
                      }}
                      disabled={homeMode === "radio"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <RadioIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">Radio</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Radio</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Artists">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode(`artists-${new Date().getTime()}`);
                      }}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <UserGroupIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">Artists</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Artists</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Albums">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode(`albums-${new Date().getTime()}`);
                      }}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <Square3Stack3DIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">Albums</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Albums</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Sigma: AI Music Agent">
                    <button
                      onClick={() => {
                        window.open("https://x.com/sigmaXMusic", "_blank");
                      }}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">AI Agent</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Agent</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="AI REMiX : Generate & Own Royalty-Free Viral AI Music">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode(`remix`);
                      }}
                      disabled={homeMode === "remix"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <CursorArrowRippleIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">REMiX</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">REMiX</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Play Music Mini-Games">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode(`games`);
                      }}
                      disabled={homeMode === "games"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <PuzzlePieceIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">Games</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Games</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="World Supremacy Battle Campaign">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode(`campaigns-wsb-${new Date().getTime()}`);
                      }}
                      disabled={homeMode.includes("campaigns-wsb") || ENABLE_WSB_CAMPAIGN === "0"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      peer
                    `}>
                      <GlobeEuropeAfricaIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden w-max">WSB</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">WSB</span>}
                    </button>
                  </Tooltip>
                  {isLoggedIn && (
                    <>
                      <Tooltip text="Your collection of Sigma NFTs">
                        <button
                          onClick={() => {
                            removeArtistProfileParamFromUrl();
                            setHomeMode("wallet");
                          }}
                          disabled={homeMode === "wallet"}
                          className={`
                          flex items-center flex-shrink-0
                          ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                          py-3 px-4 rounded-lg transition-colors text-lg 
                          disabled:opacity-50 disabled:cursor-not-allowed
                          hover:text-orange-500
                          peer
                        `}>
                          <WalletIcon className="h-6 w-6 mr-1 md:mr-0" />
                          <span className="md:hidden w-max">Collect</span>
                          {!isMenuCollapsed && <span className="hidden md:inline">Collect</span>}
                        </button>
                      </Tooltip>
                      <Tooltip text="Your Profile">
                        <button
                          onClick={() => {
                            removeArtistProfileParamFromUrl();
                            setHomeMode("profile");
                          }}
                          disabled={homeMode === "profile"}
                          className={`
                          flex items-center flex-shrink-0
                          ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                          py-3 px-4 rounded-lg transition-colors text-lg 
                          disabled:opacity-50 disabled:cursor-not-allowed
                          hover:text-orange-500
                          peer
                        `}>
                          <UserIcon className="h-6 w-6 mr-1 md:mr-0" />
                          <span className="md:hidden w-max">Profile</span>
                          {!isMenuCollapsed && <span className="hidden md:inline">Profile</span>}
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </nav>
          </div>
          {/* this is the body part that is fixed and scrolls in view */}
          <div
            className={`main-content transition-all duration-300 w-full md:overflow-y-auto md:max-h-[calc(100vh-102px)] md:overflow-x-hidden
               [&::-webkit-scrollbar]:w-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
            `}>
            <AlertBanner />
            <main className="flex flex-col flex-auto md:mx-[1rem] min-h-[80dvh] px-4 md:px-0">{children}</main>
          </div>
        </div>
      </div>

      <div className="footer md:fixed md:bottom-0 md:left-0 md:right-0 md:z-10 md:h-[30px] bg-[#171717] md:before:content-[''] md:before:absolute md:before:top-[-10px] md:before:left-0 md:before:right-0 md:before:h-[10px] md:before:bg-gradient-to-b md:before:from-transparent md:before:to-[#171717]/90 md:before:pointer-events-none">
        <Footer />
      </div>

      <Toaster
        toastOptions={{
          // Default options for specific types
          error: {
            duration: 30000,
          },
        }}
      />
    </div>
  );
};
