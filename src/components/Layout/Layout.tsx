import React, { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import { useWallet } from "@solana/wallet-adapter-react";
import { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { routeNames } from "routes";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";

export const Layout = ({ children, homeMode, setHomeMode }: { children: React.ReactNode; homeMode: string; setHomeMode: (homeMode: string) => void }) => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { publicKey: publicKeySol } = useSolanaWallet();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMenuCollapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const removeArtistProfileParamFromUrl = () => {
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist-profile"];
    setSearchParams(currentParams);
  };

  const isLoginRoute = location.pathname === routeNames.login;
  const isRemixRoute = location.pathname === routeNames.remix;
  const isLoggedIn = !!publicKeySol;

  return (
    <div className="flex flex-col flex-auto min-h-[100dvh]">
      <div className="header">
        <Navbar />
      </div>

      <div className="body flex flex-col md:flex-row">
        <div
          className={`side-panel-menu md:min-h-[80dvh] md:p-4 text-white transition-all duration-300 relative w-full ${isMenuCollapsed ? "md:w-20" : "md:w-52"} ${isLoginRoute || isRemixRoute ? "hidden" : ""}`}>
          <nav className="flex flex-row md:flex-col md:space-y-6">
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
                overflow-x-auto md:overflow-x-visible 
                scrollbar-hide 
                py-2 md:py-0
                px-4 md:px-0
                space-x-4 md:space-x-0 
                md:space-y-2 
                ${!isMenuCollapsed ? "md:ml-4" : ""}
              `}>
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
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <HomeIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">Home</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Home</span>}
                </button>
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
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <RadioIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">Radio</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Radio</span>}
                </button>
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
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <UserGroupIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">Artists</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Artists</span>}
                </button>
                <button
                  onClick={() => {
                    removeArtistProfileParamFromUrl();
                    setHomeMode(`albums`);
                  }}
                  disabled={homeMode === "albums"}
                  className={`
                    flex items-center flex-shrink-0
                    ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                    py-3 px-4 rounded-lg transition-colors text-lg 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <Square3Stack3DIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">Albums</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Albums</span>}
                </button>
                <button
                  onClick={() => {
                    window.open("https://x.com/sigmaXMusic", "_blank");
                  }}
                  className={`
                    flex items-center flex-shrink-0
                    ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                    py-3 px-4 rounded-lg transition-colors text-lg 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">AI Agent</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Agent</span>}
                </button>
                <button
                  onClick={() => {
                    window.open(routeNames.remix, "_blank");
                  }}
                  className={`
                    flex items-center flex-shrink-0
                    ${isMenuCollapsed ? "md:justify-center" : "space-x-3"} 
                    py-3 px-4 rounded-lg transition-colors text-lg 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <CursorArrowRippleIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">REMiX</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">REMiX</span>}
                </button>
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
                    hover:bg-orange-500
                    hover:text-black
                  `}>
                  <PuzzlePieceIcon className="h-6 w-6 mr-1 md:mr-0" />
                  <span className="md:hidden">Games</span>
                  {!isMenuCollapsed && <span className="hidden md:inline">Games</span>}
                </button>
                {isLoggedIn && (
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
                      hover:bg-orange-500
                      hover:text-black
                    `}>
                    <WalletIcon className="h-6 w-6 mr-1 md:mr-0" />
                    <span className="md:hidden">Collect</span>
                    {!isMenuCollapsed && <span className="hidden md:inline">Collect</span>}
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>
        <div className={`main-content transition-all duration-300 w-full `}>
          <main className="flex flex-col flex-auto mx-[1rem] md:mx-[1rem] base:mx-[1.5rem min-h-[80dvh] px-4 md:px-0">{children}</main>
        </div>
      </div>

      <div className="footer">
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
