import React, { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Loader } from "lucide-react";
import { DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { fetchFullXPLeaderboardViaAPI, fetchMyPlaceOnFullXPLeaderboardViaAPI } from "libs/utils/misc";
import { useNftsStore } from "store/nfts";

interface LeaderboardEntry {
  giverAddr: string;
  dataNFTId: string;
  bits: number;
  rank?: number;
}

export const Leaderboards = () => {
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { solBitzNfts } = useNftsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [myPlaceOnLeaderboard, setMyPlaceOnLeaderboard] = useState<string | "">("");

  const xpCollectionIdToUse = !addressSol || solBitzNfts.length === 0 ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const data = await fetchFullXPLeaderboardViaAPI(xpCollectionIdToUse);

        // Sort by bits and add rank
        const sortedData = data
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.bits - a.bits)
          .map((entry: LeaderboardEntry, index: number) => ({
            ...entry,
            rank: index + 1,
          }));

        setLeaderboardData(sortedData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [xpCollectionIdToUse]);

  useEffect(() => {
    if (!addressSol) return;

    const fetchMyPlaceOnLeaderboard = async () => {
      const data = await fetchMyPlaceOnFullXPLeaderboardViaAPI(xpCollectionIdToUse, addressSol || "");

      if (data?.playerRank) {
        setMyPlaceOnLeaderboard(data.playerRank);
      }
    };
    fetchMyPlaceOnLeaderboard();
  }, [addressSol]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const isCurrentUser = (address: string) => {
    return addressSol && address.toLowerCase() === addressSol.toString().toLowerCase();
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-full">
        <div className="mb-10 text-center md:text-left">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            XP Leaderboards
          </span>
          <p className="text-center md:text-left text-lg text-white">Sigma Music XP leaderboards are a great way to win rewards for being active!</p>
        </div>

        <div className="flex flex-col w-full">
          <h2 className="!text-2xl font-bold !text-yellow-300 text-center md:text-left">
            Most Generous Fans <span className="text-white text-lg"> (Fans who gave the most XP to support their favorite artists)</span>
          </h2>

          <div className="flex items-center justify-center md:justify-start space-x-2 my-4 p-4 bg-gray-800/50 rounded-lg border border-yellow-300/20">
            <div className="text-lg text-white">Your Position:</div>
            {myPlaceOnLeaderboard === "" ? (
              <div className="flex items-center space-x-2">
                <Loader className="animate-spin h-5 w-5 text-yellow-300" />
                <span className="text-yellow-300">Loading</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text text-transparent">#{myPlaceOnLeaderboard}</span>
                {parseInt(myPlaceOnLeaderboard) <= 3 && (
                  <span className="text-2xl">{parseInt(myPlaceOnLeaderboard) === 1 ? "🥇" : parseInt(myPlaceOnLeaderboard) === 2 ? "🥈" : "🥉"}</span>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="h-[100px] flex items-center justify-center">
              <Loader className="animate-spin" size={30} />
            </div>
          ) : (
            <>
              {leaderboardData.length === 0 ? (
                <div className="max-w-4xl mx-auto md:m-[initial] flex flex-col">
                  <h2 className="!text-xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
                    No XP Data Yet
                  </h2>
                </div>
              ) : (
                <div className="rounded-md border">
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
                            {isCurrentUser(entry.giverAddr) ? <span className="text-yellow-300 font-bold">YOU! 🔥</span> : truncateAddress(entry.giverAddr)}
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
          )}
        </div>
      </div>
    </div>
  );
};
