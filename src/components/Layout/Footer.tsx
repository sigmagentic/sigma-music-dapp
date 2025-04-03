import React from "react";
import { ExternalLink } from "lucide-react";
import { APP_NETWORK } from "config";

export const Footer = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : "version number unknown";

  return (
    <footer className="mx-[1rem] md:mx-[1rem] h-auto mb-10 opacity-70 md:p-10">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[50%] p-5">
          <div>
            <p className="mb-3 bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 text-transparent font-bold text-[1.5rem]">
              Sigma Music
            </p>
            <p className="text-xs md:text-sm">
              Sigma Music is the first-of-its-kind music super app built around unique fan experiences, putting fans at the heart of the music journey. While
              most platforms focus on artists, Sigma Music empowers fans to discover musicians early, engage deeply, and share in their success. Here, fans
              don’t just listen—they shape the future of music.
            </p>
          </div>
          <div className="">
            <div className="flex py-5 flex-col">
              <ul className="flex gap-2 mt-5">
                <li>
                  {" "}
                  <a href="https://sigmamusic.fm/legal/terms-of-use" target="_blank" className="flex justify-center items-center gap-0.5 hover:underline">
                    <small>Terms of Use</small>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  {" "}
                  <a href="https://sigmamusic.fm/legal/privacy-policy" target="_blank" className="flex justify-center items-center gap-0.5 hover:underline">
                    <small>Privacy Policy</small>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
              <div className="flex flex-col mt-2 opacity-60">
                <p>
                  <small>
                    {appVersion + " "}
                    {APP_NETWORK.toUpperCase()}
                  </small>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col md:w-[50%] pl-5 h-auto items-end md:text-right">
          <div className="flex justify-between">
            <div className="py-5 md:flex-1">
              <p className="text-md mb-2 bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 text-transparent font-bold text-base">
                Connect With Us
              </p>
              <ul className="text-xs md:text-sm flex flex-col gap-1">
                <li>
                  <a href="https://x.com/SigmaXMusic" target="_blank" className="hover:underline">
                    Sigma AI Agent on X
                  </a>
                  {" <"}
                </li>
                <li>
                  <a href="https://t.me/SigmaXMusicOfficial" target="_blank" className="hover:underline">
                    Official Telegram Community
                  </a>
                  {" <"}
                </li>
                <li>
                  <a href="https://drip.haus/itheum" target="_blank" className="hover:underline">
                    Get Sigma Music NFTs on Drip Haus
                  </a>
                  {" <"}
                </li>
                <li>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform"
                    target="_blank"
                    className="hover:underline">
                    Launch Your Music with Sigma Music
                  </a>
                  {" <"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
