import React from "react";
import { ExternalLink } from "lucide-react";
import { APP_NETWORK } from "config";

export const Footer = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : "version number unknown";

  return (
    <footer className="mx-[1rem] md:mx-[1rem] h-auto mb-10 mt-10 border-t-2 opacity-70">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[50%] p-5">
          <div>
            <p className="mb-3 bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 text-transparent font-bold text-[1.5rem]">
              Sigma Music (Beta)
            </p>
            <p className="text-xs md:text-sm">
              Sigma Music is a revolutionary music platform powered by Blockchain, Itheum (a data NFT platform), and AI Agent technology. Musicians can launch
              their music as Music Data NFTs and have Sigma AI serve as their music agent to amplify their reach. With Sigma Remix, users can remix opted-in
              tracks, which are tokenized into music meme coins and launched on pump.fun, creating immediate liquidity and new fanbases.
            </p>
          </div>
          <div className="">
            <div className="flex py-5 flex-col">
              <ul className="flex gap-2 mt-5">
                <li>
                  {" "}
                  <a
                    href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/terms-of-use"
                    target="_blank"
                    className="flex justify-center items-center gap-0.5 hover:underline">
                    <small>Terms of Use</small>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="https://docs.itheum.io/product-docs/legal/ecosystem-tools-terms/datadex/privacy-policy"
                    target="_blank"
                    className="flex justify-center items-center gap-0.5 hover:underline">
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

        <div className="flex md:flex-col md:w-[50%] pl-5 h-auto border-l-2">
          <div className="flex justify-between">
            <div className="py-5 md:flex-1">
              <p className="text-md mb-2 bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 text-transparent font-bold text-base">
                Connect With Us
              </p>
              <ul className="text-xs md:text-sm flex flex-col gap-1">
                <li>
                  {"> "}
                  <a href="https://x.com/SigmaXMusic" target="_blank" className="hover:underline">
                    Sigma AI Agent on X
                  </a>
                </li>
                <li>
                  {"> "}
                  <a href="https://t.me/SigmaXMusicOfficial" target="_blank" className="hover:underline">
                    Official Telegram Community
                  </a>
                </li>
                <li>
                  {"> "}
                  <a href="https://drip.haus/itheum" target="_blank" className="hover:underline">
                    Get Sigma Music NFTs on Drip Haus
                  </a>
                </li>
                <li>
                  {"> "}
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform"
                    target="_blank"
                    className="hover:underline">
                    Launch Your Music with Sigma Music
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
