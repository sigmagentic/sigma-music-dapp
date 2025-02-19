import React, { useState, useEffect } from "react";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import { SOLANA_NETWORK_RPC } from "config";
import { Button } from "libComponents/Button";

export const LaunchToPumpFun = ({
  onCloseModal,
  tokenImg,
  tokenName,
  tokenSymbol,
  tokenDesc,
  tokenId,
}: {
  onCloseModal: () => void;
  tokenImg: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDesc: string;
  tokenId: string;
}) => {
  const { publicKey, wallet } = useWallet();
  const [description, setDescription] = useState(tokenDesc);
  const [twitter, setTwitter] = useState("https://x.com/SigmaXMusic");
  const [telegram, setTelegram] = useState("https://t.me/SigmaXMusicOfficial");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [devBuy, setDevBuy] = useState("0");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Add effect to fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && SOLANA_NETWORK_RPC) {
        const connection = new Connection(SOLANA_NETWORK_RPC);
        try {
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setWalletBalance(null);
        }
      }
    };

    fetchBalance();
  }, [publicKey]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length > 800) {
      newErrors.description = "Description must be less than 800 characters";
    }

    const urlRegex = /^https:\/\/.+/;
    if (!urlRegex.test(twitter)) {
      newErrors.twitter = "Twitter URL must start with https://";
    }
    if (!urlRegex.test(telegram)) {
      newErrors.telegram = "Telegram URL must start with https://";
    }

    // Validate dev buy amount
    const devBuyAmount = parseFloat(devBuy);
    if (isNaN(devBuyAmount)) {
      newErrors.devBuy = "Please enter a valid number";
    } else if (devBuyAmount < 0) {
      newErrors.devBuy = "Amount cannot be negative";
    } else if (walletBalance !== null && devBuyAmount > walletBalance) {
      newErrors.devBuy = "Amount exceeds wallet balance";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLaunch = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLaunchError(null);

    try {
      // Initialize connection
      if (!SOLANA_NETWORK_RPC) {
        throw new Error("No RPC endpoint provided");
      }

      const web3Connection = new Connection(SOLANA_NETWORK_RPC, "confirmed");

      // Generate a random keypair for the token
      const mintKeypair = Keypair.generate();

      // Prepare metadata
      const formData = new FormData();
      formData.append("file", tokenImg); // Using the tokenImg from props
      formData.append("name", tokenName);
      formData.append("symbol", tokenSymbol);
      formData.append("description", description);
      formData.append("twitter", twitter);
      formData.append("telegram", telegram);
      formData.append("website", `https://sigmamusic.fm/remix?listen=${tokenId}`);
      formData.append("showName", "true");

      // Create IPFS metadata storage
      const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const metadataResponseJSON = await metadataResponse.json();

      // Get the create transaction
      const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: publicKey?.toBase58(),
          action: "create",
          tokenMetadata: {
            name: metadataResponseJSON.metadata.name,
            symbol: metadataResponseJSON.metadata.symbol,
            uri: metadataResponseJSON.metadataUri,
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: "true",
          amount: parseFloat(devBuy),
          slippage: 10,
          priorityFee: 0.0005,
          pool: "pump",
        }),
      });

      if (response.ok) {
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        tx.sign([mintKeypair]); // Note: Removed signerKeyPair as we're using wallet adapter
        const signature = await web3Connection.sendTransaction(tx);
        console.log("Transaction: https://solscan.io/tx/" + signature);
        onCloseModal(); // Close modal on success
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error("Launch error:", error);
      setLaunchError(typeof error === "object" && error !== null && "message" in error ? (error as Error).message : "Failed to launch token");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-6">
      <div className="relative bg-[#1A1A1A] rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Close button - adjusted positioning and styling */}
        <button
          onClick={onCloseModal}
          className="absolute top-2 right-0 w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-50 shadow-lg">
          ✕
        </button>

        {/* Left Column - Form */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Send it to Pump.fun</h2>
          </div>

          <div className="space-y-4">
            <div>
              <img src={tokenImg} alt={tokenName} className="w-32 h-32 rounded-lg object-cover mb-4" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <div className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600">{tokenName}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <div className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600">{tokenSymbol}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none min-h-[100px]"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{description.length}/800 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Twitter URL</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              {errors.twitter && <p className="text-red-500 text-xs mt-1">{errors.twitter}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telegram URL</label>
              <input
                type="url"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              {errors.telegram && <p className="text-red-500 text-xs mt-1">{errors.telegram}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <div className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600">{`https://sigmamusic.fm/remix?album=${tokenId}`}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dev Buy Amount (SOL)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={devBuy}
                  onChange={(e) => setDevBuy(e.target.value)}
                  step="any"
                  min="0"
                  className="flex-1 p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-sm text-gray-400">Balance: {walletBalance !== null ? `${walletBalance.toFixed(4)} SOL` : "Loading..."}</span>
              </div>
              {errors.devBuy && <p className="text-red-500 text-xs mt-1">{errors.devBuy}</p>}
            </div>

            <Button
              onClick={handleLaunch}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              {isLoading ? "Launching..." : "LFG, Send It to Pump.fun"}
            </Button>
            {launchError && <p className="text-red-500 text-sm mt-2">{launchError}</p>}
          </div>
        </div>

        {/* Right Column - Instructions */}
        <div className="bg-cyan-900 bg-opacity-20 rounded-lg flex flex-col gap-2 p-8 mt-[20px]">
          <p className="text-xl font-bold mb-4">How it works?</p>
          <ul className="space-y-3 list-none">
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">1.</span>
              Your Music NFT will be fractionalized into a AI Music Meme coin on Pump.Fun.
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">2.</span>
              Holders of the AI Music Meme coin will be able to own a share of your Music NFT and listen to it sigmamusic.fm. As the AI Music Meme coin is
              linked to a Music NFT, the holders therefore have got built-in utility and always "own something"! No more "dev rugs" where the token has ZERO
              utility!
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">3.</span>
              To launch it on pump.fun, you need to a small SOL payment of 0.02 to Sigma's wallet.
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">4.</span>
              You can choose to keep your own "dev" % (just like all the other pump.fun launches)
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">5.</span>
              The pump fun token profile will have a direct link to the Music NFT placed on the "website" of the token, so holders can click and listen to the
              music with one-click!
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">6.</span>
              Once launched, it immediately goes to the pump.fun bonding curve and is available for purchase by the public!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
