import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "libComponents/Button";

const MUSIC_STYLES = ["Hip Hop Music", "Country Music", "EDM Music"];
const EXAMPLE_THEMES = ["Degen Trader", "Meme Galore", "Moon Mission", "Diamond Hands"];

export const LaunchMusicMeme = ({ onCloseModal }: { onCloseModal: () => void }) => {
  const { publicKey } = useWallet();
  const [songTitle, setSongTitle] = useState("");
  const [musicStyle, setMusicStyle] = useState(MUSIC_STYLES[0]);
  const [walletAddress, setWalletAddress] = useState(publicKey?.toBase58() || "");
  const [promptGenerated, setPromptGenerated] = useState(false);

  // Hardcoded payment TX for now
  const PAYMENT_TX = "2Qp7u1KghmrRVLNwbDY4BqLgMhJ7EYe8NxAFTfChRqCfuvTwB4kYvfePh4d32MNewbHVfj6TXJPPX5AVmobiKkgC";

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleGeneratePrompt = () => {
    if (!songTitle || !musicStyle || !walletAddress) {
      alert("Please fill in all fields");
      return;
    }
    setPromptGenerated(true);
  };

  const getTweetUrl = () => {
    const tweetText = encodeURIComponent(
      `hey can you create me a unique single titled "${songTitle}" in the style of ${musicStyle} and send it to my wallet ${walletAddress}. Here is the SOL payment TX: ${PAYMENT_TX}. Trigger this ACTION: CREATE_MUSIC_PLAYLIST`
    );
    return `https://twitter.com/intent/tweet?text=${tweetText}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative bg-[#1A1A1A] rounded-lg p-6 max-w-5xl w-full mx-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Close button - moved outside the grid */}
        <button
          onClick={onCloseModal}
          className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        {/* Left Column - Form */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Launch Music Meme</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Song Title / Lyrics Theme</label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder={EXAMPLE_THEMES.join(" • ")}
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Art / Music Style</label>
              <select
                value={musicStyle}
                onChange={(e) => setMusicStyle(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none">
                {MUSIC_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address (for receiving the music NFT)</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter Solana wallet address"
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Make sure payment comes from this wallet as Sigma will verify</p>
            </div>

            {!promptGenerated ? (
              <Button
                onClick={handleGeneratePrompt}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Make Payment and Generate Prompt for Sigma
              </Button>
            ) : (
              <a
                href={getTweetUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#1DA1F2] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1a91da] transition-colors">
                Send Prompt to Sigma on X
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Instructions */}
        <div className="bg-cyan-900 bg-opacity-20 rounded-lg flex flex-col gap-2 p-8">
          <p className="text-xl font-bold mb-4">How it works?</p>
          <ul className="space-y-3 list-none">
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">1.</span>
              Fill the form for your music meme preferences
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">2.</span>
              Make a small SOL payment of 0.02 to Sigma's wallet. This is used to pay for music AI LLM usage and tokenization of your music NFT
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">3.</span>
              Click the prompt button to send the instruction to Sigma on X
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">4.</span>
              Sigma will create a music NFT and send it to your wallet (it's yours to own forever!)
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">5.</span>
              Sigma lists your new Music NFT in the Remix curation feed so others vote for it
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">6.</span>
              If your music NFT gets enough votes and graduates, you can fractionalize the Music NFT and launch it on pump.fun as a Music Meme coin (this step
              is optional -- you don't need to launch anything on pump.fun if you don't want to)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
