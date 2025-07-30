import React from "react";
import storyProtocolIpOpen from "assets/img/story-protocol-ip-open.png";
import { APP_NETWORK } from "config";

export function StoryIPLicenseDisplay({ license }: { license: any }) {
  return (
    <div className="bg-black p-4 rounded-md mt-4 text-sm mx-auto">
      <div className="mb-3 text-center font-medium text-gray-100">You have also been allocated an on-chain legal license via Story Protocol.</div>
      <div className="flex flex-col gap-4 mb-4 items-center">
        <div
          className="w-[112px] h-[25px] rounded-md overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer border border-gray-700 shadow"
          title="View on Story Protocol Explorer"
          onClick={() => {
            window.open(
              APP_NETWORK === "devnet"
                ? `https://aeneid.explorer.story.foundation/ipa/${license.ipTokenId}`
                : `https://www.ipontop.com/ip/${license.ipTokenId}`,
              "_blank"
            );
          }}
          style={{
            backgroundImage: `url(${storyProtocolIpOpen})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}></div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <a
            href="https://github.com/piplabs/pil-document/blob/v1.3.0/Story%20Foundation%20-%20Programmable%20IP%20License%20(1.31.25).pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-300 cursor-pointer flex items-center gap-1 hover:underline hover:opacity-80 transition-colors">
            <span>View PIL Legal Document</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
            </svg>
          </a>
          <a
            href="https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CC-BY.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-300 cursor-pointer flex items-center gap-1 hover:underline hover:opacity-80 transition-colors">
            <span>View Off-Chain Terms</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center">
        {license.storyProtocolLicenseTokenId && (
          <div className="bg-gray-700 rounded px-3 py-2 w-full text-center">
            <span className="font-semibold text-gray-200">On-Chain License ID:</span> {license.storyProtocolLicenseTokenId}
          </div>
        )}
        {license.storyProtocolLicenseMintingTxHash && (
          <div className="bg-gray-700 rounded px-3 py-2 w-full text-center">
            <span className="font-semibold text-gray-200">License Procurement Transaction:</span>
            <div className="flex flex-row gap-2 items-center justify-center">
              <span>{license.storyProtocolLicenseMintingTxHash.slice(0, 4) + "..." + license.storyProtocolLicenseMintingTxHash.slice(-4)}</span>
              <a
                href={`${APP_NETWORK === "devnet" ? "https://aeneid.explorer.story.foundation/transactions/" : "https://explorer.story.foundation/transactions/"}${license.storyProtocolLicenseMintingTxHash}`}
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline break-all"
                rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
              <a
                href={`${APP_NETWORK === "devnet" ? "https://aeneid.storyscan.io/tx/" : "https://storyscan.io/tx/"}${license.storyProtocolLicenseMintingTxHash}`}
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline break-all"
                rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          </div>
        )}
        {license.storyProtocolLicenseMintingSQSMessageId && !license.storyProtocolLicenseTokenId && (
          <div className="bg-yellow-900 rounded px-3 py-2 w-full text-center font-bold text-yellow-300 border border-yellow-600">On-Chain License: Pending</div>
        )}
      </div>
    </div>
  );
}
