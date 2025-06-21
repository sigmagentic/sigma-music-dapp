import React, { useEffect, useState } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { X, Info, Award } from "lucide-react";
import Countdown from "react-countdown";
import { useSearchParams } from "react-router-dom";
import { SOLANA_NETWORK_RPC } from "config";
import { rewardPools } from "config/rewardPools";
import { Button } from "libComponents/Button";

interface PriceSplit {
  [key: string]: string;
}

export interface RewardPool {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  featured: boolean;
  totalWinners: number;
  priceSplit: PriceSplit[];
  terms: string[];
  eligibility: string[];
  cta: {
    text: string;
    link: string;
    isNewWindow: boolean;
  };
  walletAddress: string;
}

interface RewardPoolsProps {}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="text-gray-300">{children}</div>
      </div>
    </div>
  );
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const RewardPoolCard: React.FC<{ pool: RewardPool; isFeatured?: boolean }> = ({ pool, isFeatured }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showEligibility, setShowEligibility] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [isCheckingWinner, setIsCheckingWinner] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsdcBalance = async () => {
      try {
        setIsLoading(true);
        const connection = new Connection(SOLANA_NETWORK_RPC);
        const walletPubkey = new PublicKey(pool.walletAddress);

        // Get all token accounts for the wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, { programId: TOKEN_PROGRAM_ID });

        // Find USDC token account (USDC mint address: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
        const usdcAccount = tokenAccounts.value.find((account) => account.account.data.parsed.info.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

        if (usdcAccount) {
          const balance = usdcAccount.account.data.parsed.info.tokenAmount.uiAmount;
          setUsdcBalance(balance);
        } else {
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        setUsdcBalance(0);
      } finally {
        setIsLoading(false);
        setIsAnimating(true);
      }
    };

    fetchUsdcBalance();
  }, [pool.walletAddress]);

  const getPoolStatus = () => {
    const now = new Date();
    const start = new Date(pool.startDate);
    const end = new Date(pool.endDate);

    if (now < start) return { status: "upcoming", color: "border-yellow-500" };
    if (now > end) return { status: "closed", color: "border-red-500" };
    return { status: "active", color: "border-green-500" };
  };

  const status = getPoolStatus();
  const now = new Date();
  const start = new Date(pool.startDate);
  const end = new Date(pool.endDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <div
        id={pool.id}
        className={`w-[98%] bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all border border-gray-800 rounded-lg p-6 mb-6 border-b-4 ${status.color} ${isFeatured ? "scale-100" : "scale-100"}`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">{pool.name}</h2>
            <p className="text-gray-300 mb-4">{pool.description}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              status.status === "active" ? "bg-green-500" : status.status === "upcoming" ? "bg-yellow-500" : "bg-red-500"
            } text-white`}>
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </span>
        </div>

        {pool.cta.text !== "" && (
          <div className="mb-10">
            <Button
              onClick={() => {
                if (pool.cta.isNewWindow) {
                  window.open(pool.cta.link, "_blank");
                } else {
                  window.location.href = pool.cta.link;
                }
              }}
              variant="outline"
              className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-600 hover:text-black">
              {pool.cta.text}
            </Button>
          </div>
        )}

        <div className="mb-6">
          <div className="text-3xl font-bold text-white mb-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span>Loading balance...</span>
              </div>
            ) : isAnimating ? (
              <Countdown
                date={Date.now() + 2000}
                renderer={({ seconds }) => <span className="text-yellow-300">{Math.floor((usdcBalance * (2 - seconds)) / 2)} USDC</span>}
                onComplete={() => setIsAnimating(false)}
              />
            ) : (
              <span className="text-yellow-300">{usdcBalance.toFixed(2)} USDC</span>
            )}
          </div>
          <p className="text-gray-400">Total Pool Value</p>
        </div>

        <div className="mb-6 py-4 md:pl-0 bg-black/20 rounded-lg">
          {now < start ? (
            <div className="space-y-2">
              <p className="text-gray-300">Pool starts in:</p>
              <div className="text-xl font-bold text-yellow-300">
                <Countdown
                  date={start}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <span>
                      {days}d {hours}h {minutes}m {seconds}s
                    </span>
                  )}
                />
              </div>
              <p className="text-gray-400">Pool will be open for {duration} days</p>
            </div>
          ) : now > end ? (
            <div className="space-y-2">
              <p className="text-gray-300">Pool has ended</p>
              <p className="text-gray-400">
                Ran from {formatDate(start)} to {formatDate(end)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-300">Pool ends in:</p>
              <div className="text-xl font-bold text-green-400">
                <Countdown
                  date={end}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <span>
                      {days}d {hours}h {minutes}m {seconds}s
                    </span>
                  )}
                />
              </div>
              <p className="text-gray-400">Started on {formatDate(start)}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowEligibility(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 rounded-lg text-white hover:bg-orange-700">
            <Info size={16} />
            Eligibility Criteria
          </button>
          <button onClick={() => setShowTerms(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 rounded-lg text-white hover:bg-orange-700">
            <Info size={16} />
            Terms & Conditions
          </button>
          <button onClick={() => setShowRewards(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 rounded-lg text-white hover:bg-orange-700">
            <Award size={16} />
            View All Rewards
          </button>
        </div>

        <button
          onClick={() => setIsCheckingWinner(true)}
          disabled={status.status !== "closed"}
          className={`p-3 font-bold rounded-lg transition-all ${
            status.status === "closed"
              ? "bg-gradient-to-r from-yellow-300 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-600"
              : "bg-[#1A1A1A] text-gray-400 cursor-not-allowed"
          }`}>
          {status.status === "closed" ? "Check if you are a winner" : "Check if you are a winner (available after pool ends)"}
        </button>
      </div>

      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Conditions">
        <ol className="list-decimal list-inside space-y-2">
          {pool.terms.map((term, index) => (
            <li key={index} className="mb-2">
              {term}
            </li>
          ))}
        </ol>
      </Modal>

      <Modal isOpen={showEligibility} onClose={() => setShowEligibility(false)} title="Eligibility Criteria">
        <ol className="list-decimal list-inside space-y-2">
          {pool.eligibility.map((criteria, index) => (
            <li key={index} className="mb-2">
              {criteria}
            </li>
          ))}
        </ol>
      </Modal>

      <Modal isOpen={showRewards} onClose={() => setShowRewards(false)} title="Reward Distribution">
        <div className="space-y-4">
          {pool.priceSplit[0] &&
            Object.entries(pool.priceSplit[0]).map(([position, split]) => (
              <div key={position} className="flex justify-between items-center p-3 bg-black/40 rounded-lg">
                <span className="font-bold text-white">{position}</span>
                <span className="text-yellow-300">{split}</span>
              </div>
            ))}
        </div>
      </Modal>

      <Modal isOpen={isCheckingWinner} onClose={() => setIsCheckingWinner(false)} title="Checking Winner Status">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Checking your eligibility...</p>
        </div>
      </Modal>
    </>
  );
};

export const RewardPools = (props: RewardPoolsProps) => {
  const [searchParams] = useSearchParams();
  const poolId = searchParams.get("poolId");
  const featuredPool = poolId ? rewardPools.find((p) => p.id === poolId) : rewardPools.find((p) => p.featured);
  const otherPools = rewardPools.filter((p) => p.id !== featuredPool?.id);

  useEffect(() => {
    if (poolId) {
      setTimeout(() => {
        const poolElement = document.getElementById("featured-pool");

        if (poolElement) {
          poolElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 1000);
    }
  }, [poolId]);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-full">
        <div className="mb-10 text-center md:text-left">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            Reward Pools
          </span>
          <p className="text-center md:text-left text-lg text-white">
            Sigma Music will always reward fans as we grow! Share in platform revenue by participating in our reward pools.
          </p>
        </div>

        {featuredPool && (
          <div id="featured-pool" className="mb-12">
            <h2 className="!text-2xl font-bold text-white mb-4 text-center md:text-left">Featured Pool</h2>
            <div className="flex justify-center md:justify-start">
              <RewardPoolCard pool={featuredPool} isFeatured={true} />
            </div>
          </div>
        )}

        {otherPools.length > 0 && (
          <div>
            <h2 className="!text-2xl font-bold text-white mb-4 text-center md:text-left">Other Pools</h2>
            <div className="flex flex-col items-center md:items-start gap-6">
              {otherPools.map((pool) => (
                <RewardPoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
