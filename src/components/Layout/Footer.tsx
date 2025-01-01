import React from "react";
import { ExternalLink } from "lucide-react";
import { APP_NETWORK } from "config";

export const Footer = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ? `v${import.meta.env.VITE_APP_VERSION}` : "version number unknown";

  return (
    <footer className="xl:mx-[1rem] md:mx-[1rem] h-auto mb-10 mt-10">
      <div className="w-full h-[2px] bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]"></div>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[50%] p-5">
          <div>
            <p className="mb-3 bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 text-transparent font-bold text-[1.5rem]">
              Sigma Music
            </p>
            <p className="text-xs md:text-sm">Stream and collect Music. Support your favorite artists.</p>
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
                <li>
                  {" "}
                  <a href="https://stats.uptimerobot.com/D8JBwIo983" target="_blank" className="flex justify-center items-center gap-0.5 hover:underline">
                    <small>Protocol Status</small>
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
