import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, Commitment, TransactionConfirmationStrategy } from "@solana/web3.js";
import { GENERATE_MUSIC_MEME_PRICE_IN_USD, SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS } from "config";
import { Button } from "libComponents/Button";
import { fetchSolPrice, logPaymentToAPI } from "libs/utils/misc";

const MUSIC_STYLES = ["D&B", "EDM"];
const EXAMPLE_THEMES = ["Degen Trader", "Meme Galore", "Moon Mission", "Diamond Hands"];
const MAX_TITLE_LENGTH = 20;

// max length
/*
yo @SigmaXMusic create a single titled "I'm So Sigma" in D&B style. code XXXXX. Send it to 7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj. SOL payment: 2acubH5SW2zuDn1kkD6K4uBZxM8G2KHLYnmDchHHSyuTeZfqjhcVjGFRjTEinYNsYtmTRbzogsxVFg1Qbfwcttx1. Action: CREATE_MUSIC_PLAYLIST
*/

export const LaunchMusicMeme = ({ onCloseModal }: { onCloseModal: () => void }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [songTitle, setSongTitle] = useState("");
  const [musicStyle, setMusicStyle] = useState(MUSIC_STYLES[0]);
  const [promptGenerated, setPromptGenerated] = useState(false);
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [paymentTx, setPaymentTx] = useState("");

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { currentSolPrice } = await fetchSolPrice();

        // Calculate required SOL amount based on USD price
        const solAmount = GENERATE_MUSIC_MEME_PRICE_IN_USD / currentSolPrice;
        setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
  }, []);

  // Add effect to fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      try {
        const balance = await connection.getBalance(publicKey);
        setWalletBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  const handlePaymentConfirmation = async () => {
    if (!publicKey || !requiredSolAmount) return;

    setPaymentStatus("processing");

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS),
          lamports: requiredSolAmount * 1e9, // Convert SOL to lamports
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      const strategy: TransactionConfirmationStrategy = {
        signature: signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      };

      await connection.confirmTransaction(strategy, "finalized" as Commitment);

      // Update payment transaction hash
      setPaymentTx(signature);

      // Log payment to web2 API (placeholder)
      await logPaymentToAPI({
        payer: publicKey.toBase58(),
        tx: signature,
        task: "gen",
        amount: requiredSolAmount.toString(),
      });

      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);
      setPromptGenerated(true);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
      setPaymentStatus("idle");
    }
  };

  const handleGeneratePrompt = () => {
    if (!songTitle || !musicStyle || !publicKey?.toBase58()) {
      alert("Please fill in all fields");
      return;
    }
    setShowPaymentConfirmation(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_TITLE_LENGTH);
    setSongTitle(value);
  };

  // Payment confirmation popup
  const PaymentConfirmationPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Confirm Payment</h3>
        <div className="space-y-4">
          <p>
            Amount to pay: {requiredSolAmount ?? "..."} SOL (${GENERATE_MUSIC_MEME_PRICE_IN_USD})
          </p>
          <p>Your wallet balance: {walletBalance?.toFixed(4) ?? "..."} SOL</p>
          <p>When you click "Proceed", you will be asked to sign a single transaction to send the payment for processing your music generation request.</p>

          {paymentStatus === "processing" ? (
            <div className="text-center">
              <p>Payment transfer in process... do not close this page</p>
            </div>
          ) : paymentStatus === "confirmed" ? (
            <div className="text-center text-green-500">
              <p>Payment confirmed! You can now send your prompt to Sigma.</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button onClick={() => setShowPaymentConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
              <Button onClick={handlePaymentConfirmation} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                Proceed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getTweetUrl = () => {
    const tweetText = encodeURIComponent(
      `yo @SigmaXMusic create a single titled "${songTitle}" in ${musicStyle} style. Send it to ${publicKey?.toBase58()}. SOL payment: ${paymentTx}. Action: CREATE_MUSIC_PLAYLIST`
    );
    return `https://twitter.com/intent/tweet?text=${tweetText}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showPaymentConfirmation && <PaymentConfirmationPopup />}

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
            <div className={`flex flex-col gap-4 ${promptGenerated ? "opacity-50 cursor-not-allowed" : ""}`}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Song Title / Lyrics Theme
                  <span className="float-right text-gray-400">{MAX_TITLE_LENGTH - songTitle.length} characters left</span>
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={handleTitleChange}
                  maxLength={MAX_TITLE_LENGTH}
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
                <label className="block text-sm font-medium mb-2">Your Wallet Address (for receiving the music NFT)</label>
                <p className="text-sm">
                  <a
                    href={`https://solscan.io/account/${publicKey?.toBase58()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline">
                    {publicKey?.toBase58() || "..."}
                  </a>
                </p>
                <p className="text-xs text-gray-400 mt-1">Make sure payment ALSO comes from this wallet as Sigma will verify this.</p>
              </div>
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
                className="block w-full text-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
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
              Make a small SOL payment of{" "}
              <span className="text-orange-600 contents">
                {requiredSolAmount ?? "..."} SOL (${GENERATE_MUSIC_MEME_PRICE_IN_USD})
              </span>{" "}
              to Sigma's wallet. This is used to pay for music AI LLM usage and tokenization of your music NFT
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
              If your music NFT gets enough votes and graduates, you can fractionalize the Music NFT and launch it on pump.fun as a AI Music Meme coin (this
              step is optional -- you don't need to launch anything on pump.fun if you don't want to)
            </li>
          </ul>
        </div>
      </div>

      {promptGenerated && (
        <div className="absolute top-4 right-4 bg-green-500 text-white p-4 rounded-lg">Payment confirmed! You can now send your prompt to Sigma on X.</div>
      )}
    </div>
  );
};
