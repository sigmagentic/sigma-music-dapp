import React, { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Loader } from "lucide-react";
import { getApiWeb2Apps } from "libs/utils/api";

interface LeaderboardEntry {
  dataNFTIdAndGetter: string;
  giverAddr: string;
  bits: number;
  rank?: number;
}

interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_DURATION_20_SECONDS = 20 * 1000; // 20 seconds in milliseconds

interface ArtistXPLeaderboardProps {
  bountyId: string;
  creatorWallet: string;
  xpCollectionIdToUse: string;
  loggedInAddress?: string;
}

export const ArtistXPLeaderboard: React.FC<ArtistXPLeaderboardProps> = ({ bountyId, creatorWallet, xpCollectionIdToUse, loggedInAddress }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const fetchLeaderboardData = async () => {
      try {
        // Check cache first
        const now = Date.now();
        const cacheEntry = cache[bountyId];

        if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_20_SECONDS) {
          // Use cached data if it's still valid
          setLeaderboardData(cacheEntry.data);
          setIsLoading(false);
          return;
        }

        // Start the delay timer
        const delayPromise = new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 3000);
        });

        try {
          // Wait for the delay
          await delayPromise;
        } catch (error) {
          // If we get here, it means the delay was aborted
          return;
        }

        // If we've been aborted during the delay, don't proceed with the fetch
        if (abortController.signal.aborted) {
          return;
        }

        const callConfig = {
          headers: {
            "fwd-tokenid": xpCollectionIdToUse,
          },
          signal: abortController.signal,
        };

        const response = await fetch(
          `${getApiWeb2Apps()}/datadexapi/xpGamePrivate/getterLeaderBoard?getterAddr=${creatorWallet}&campaignId=${bountyId}`,
          callConfig
        );

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }

        const data: LeaderboardEntry[] = await response.json();

        // Sort by bits and add rank
        const sortedData = data
          .sort((a, b) => b.bits - a.bits)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        // Cache the sorted data
        cache[bountyId] = {
          data: sortedData,
          timestamp: Date.now(),
        };

        setLeaderboardData(sortedData);
      } catch (error) {
        // Only log error if it's not an abort error
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching leaderboard data:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();

    // Cleanup function to abort any ongoing requests and clear the timeout
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [bountyId, creatorWallet, xpCollectionIdToUse]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="h-[100px] flex items-center justify-center">
        <Loader className="animate-spin text-yellow-300" size={20} />
      </div>
    );
  }

  return (
    <>
      {leaderboardData.length === 0 && (
        <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
          <h2 className="!text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
            No Power-Ups Yet
          </h2>
        </div>
      )}

      {leaderboardData.length > 0 && (
        <div className="rounded-md border mt-5">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Wallet</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  <div className="flex items-center justify-end space-x-1">
                    <SparklesIcon className="h-5 w-5 text-yellow-300" />
                    <span>Power</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leaderboardData.map((entry) => (
                <tr
                  key={entry.giverAddr}
                  className={`
                ${entry.rank === 1 ? "bg-yellow-500/10" : ""}
                ${entry.rank === 2 ? "bg-gray-400/10" : ""}
                ${entry.rank === 3 ? "bg-orange-700/10" : ""}
                hover:bg-gray-700/20 transition-colors
              `}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span
                        className={`
                    ${entry.rank && entry.rank <= 3 ? "font-bold" : ""}
                  `}>
                        #{entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {loggedInAddress && entry.giverAddr.toLowerCase() === loggedInAddress.toLowerCase() ? (
                      <span className="text-yellow-300 font-bold">YOU! 🔥</span>
                    ) : (
                      truncateAddress(entry.giverAddr)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <SparklesIcon className="h-4 w-4 text-yellow-300" />
                      <span>{entry.bits.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
