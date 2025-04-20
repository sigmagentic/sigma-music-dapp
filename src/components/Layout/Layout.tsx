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
} from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { routeNames } from "routes";
import { useAppStore } from "store/app";
import { AlertBanner } from "./AlertBanner";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group flex md:block">
      {children}
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  );
};

export const Layout = ({ children, homeMode, setHomeMode }: { children: React.ReactNode; homeMode: string; setHomeMode: (homeMode: string) => void }) => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { publicKey: publicKeySol } = useSolanaWallet();
  const paymentInProgress = useAppStore((state) => state.paymentInProgress);

  const removeArtistProfileParamFromUrl = () => {
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist"];
    setSearchParams(currentParams);
  };

  const isLoginRoute = location.pathname === routeNames.login;
  const isRemixRoute = location.pathname === routeNames.remix;
  const isLoggedIn = !!publicKeySol;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className={`header ${paymentInProgress ? "opacity-50 cursor-progress pointer-events-none" : ""} md:fixed md:top-0 md:left-0 md:right-0 md:z-10`}>
        <Navbar />
      </div>

      <div className="body mt-2 flex-1 md:mt-[72px] md:mb-[30px]">
        <div className="flex flex-col md:flex-row h-full">
          <div
            className={`side-panel-menu md:min-h-[calc(100vh-102px)] md:p-4 text-white transition-all duration-300 relative w-full ${isMenuCollapsed ? "md:w-20" : "md:w-52"} ${isLoginRoute || isRemixRoute ? "hidden" : ""}`}>
            <nav className={`flex flex-row md:flex-col md:space-y-6 ${paymentInProgress ? "opacity-50 cursor-progress pointer-events-none" : ""}`}>
              <div className={`menu-section hidden md:flex ${isMenuCollapsed ? "" : "md:justify-center"} `}>
                <button
                  onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                  className="py-3 px-4 text-white rounded-full transition-colors border-2 border-white">
                  {isMenuCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
                </button>
              </div>

              <div className="menu-section w-full">
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
                    `}>
                      <HomeIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">Home</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Home</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="Radio">
                    <button
                      onClick={() => {
                        removeArtistProfileParamFromUrl();
                        setHomeMode("radio");
                      }}
                      disabled={homeMode === "radio"}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                      hover:text-black
                    `}>
                      <RadioIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">Radio</span>
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
                      hover:text-black
                    `}>
                      <UserGroupIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">Artists</span>
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
                    `}>
                      <Square3Stack3DIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">Albums</span>
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
                    `}>
                      <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">AI Agent</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Agent</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text="REMiX">
                    <button
                      onClick={() => {
                        window.open(routeNames.remix, "_blank");
                      }}
                      className={`
                      flex items-center flex-shrink-0
                      ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                      py-3 px-4 rounded-lg transition-colors text-lg 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:text-orange-500
                    `}>
                      <CursorArrowRippleIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">REMiX</span>
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
                    `}>
                      <PuzzlePieceIcon className="h-6 w-6 mr-1 md:mr-0" />
                      <span className="md:hidden">Games</span>
                      {!isMenuCollapsed && <span className="hidden md:inline">Games</span>}
                    </button>
                  </Tooltip>
                  {isLoggedIn && (
                    <>
                      <Tooltip text="Your Sigma NFT Collection">
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
                        `}>
                          <WalletIcon className="h-6 w-6 mr-1 md:mr-0" />
                          <span className="md:hidden">Collect</span>
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
                        `}>
                          <UserIcon className="h-6 w-6 mr-1 md:mr-0" />
                          <span className="md:hidden">Profile</span>
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
