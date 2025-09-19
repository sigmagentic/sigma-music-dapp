import React, { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Loader } from "lucide-react";
import { DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { fetchFullXPLeaderboardViaAPI, fetchMyPlaceOnFullXPLeaderboardViaAPI, fetchBountySnapshotViaAPI } from "libs/utils/api";
import { routeNames } from "routes";
import { useAppStore } from "store/app";
import { useNftsStore } from "store/nfts";

interface LeaderboardEntry {
  giverAddr: string;
  dataNFTId: string;
  bits: number;
  rank?: number;
}

interface ArtistLeaderboardEntry {
  artistId: string;
  name: string;
  img: string;
  bitsSum: number;
  giverCounts: number;
  rank?: number;
}

interface AlbumLeaderboardEntry {
  albumId: string;
  title: string;
  img: string;
  artistName: string;
  bitsSum: number;
  giverCounts: number;
  rank?: number;
}

export const Leaderboards = ({ navigateToDeepAppView }: { navigateToDeepAppView: (logicParams: any) => void }) => {
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { solBitzNfts } = useNftsStore();
  const { artistLookupEverything } = useAppStore();
  const [isFanXPDataLoading, setIsFanXPDataLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [myPlaceOnLeaderboard, setMyPlaceOnLeaderboard] = useState<string | "">("");
  const [artistPowerLeaderboard, setArtistPowerLeaderboard] = useState<ArtistLeaderboardEntry[]>([]);
  const [artistFansLeaderboard, setArtistFansLeaderboard] = useState<ArtistLeaderboardEntry[]>([]);
  const [albumPowerLeaderboard, setAlbumPowerLeaderboard] = useState<AlbumLeaderboardEntry[]>([]);
  const [albumFansLeaderboard, setAlbumFansLeaderboard] = useState<AlbumLeaderboardEntry[]>([]);
  const [isBountyDataLoading, setIsBountyDataLoading] = useState(true);

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
        setIsFanXPDataLoading(false);
      }
    };

    const fetchBountySnapshot = async () => {
      try {
        setIsBountyDataLoading(true);
        const data = await fetchBountySnapshotViaAPI();

        // Process artist leaderboards
        const artistEntries = data
          .filter((item: any) => item.artistId && item.bitsSum) // Filter out metadata and invalid entries
          .map((item: any) => {
            const artistData = artistLookupEverything[item.artistId];
            return {
              artistId: item.artistId,
              name: artistData?.name || "Unknown Artist",
              img: artistData?.img || "",
              bitsSum: item.bitsSum,
              giverCounts: item.giverCounts,
              artistSlug: artistData?.slug || "",
            };
          });

        // Sort and rank artist power leaderboard
        const sortedArtistPower = artistEntries
          .sort((a: ArtistLeaderboardEntry, b: ArtistLeaderboardEntry) => b.bitsSum - a.bitsSum)
          .map((entry: ArtistLeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));
        setArtistPowerLeaderboard(sortedArtistPower);

        // Sort and rank artist fans leaderboard
        const sortedArtistFans = artistEntries
          .sort((a: ArtistLeaderboardEntry, b: ArtistLeaderboardEntry) => b.giverCounts - a.giverCounts)
          .map((entry: ArtistLeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));
        setArtistFansLeaderboard(sortedArtistFans);

        // Process album leaderboards
        const albumEntries = data
          .filter((item: any) => item.artistId && item.albums)
          .flatMap((item: any) => {
            const artistData = artistLookupEverything[item.artistId];
            return item.albums.map((album: any) => ({
              albumId: album.albumId,
              title: artistData?.albums?.find((a: any) => a.albumId === album.albumId)?.title || "Unknown Album",
              img: artistData?.albums?.find((a: any) => a.albumId === album.albumId)?.img || "",
              artistName: artistData?.name || "Unknown Artist",
              bitsSum: album.bitsSum,
              giverCounts: album.giverCounts,
              artistSlug: artistData?.slug || "",
            }));
          });

        // Sort and rank album power leaderboard
        const sortedAlbumPower = albumEntries
          .sort((a: AlbumLeaderboardEntry, b: AlbumLeaderboardEntry) => b.bitsSum - a.bitsSum)
          .map((entry: AlbumLeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));
        setAlbumPowerLeaderboard(sortedAlbumPower);

        // Sort and rank album fans leaderboard
        const sortedAlbumFans = albumEntries
          .sort((a: AlbumLeaderboardEntry, b: AlbumLeaderboardEntry) => b.giverCounts - a.giverCounts)
          .map((entry: AlbumLeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));
        setAlbumFansLeaderboard(sortedAlbumFans);
      } catch (error) {
        console.error("Error fetching bounty snapshot:", error);
      } finally {
        setIsBountyDataLoading(false);
      }
    };

    if (artistLookupEverything && Object.keys(artistLookupEverything).length > 0) {
      fetchLeaderboardData();
      fetchBountySnapshot();
    }
  }, [xpCollectionIdToUse, artistLookupEverything]);

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

  const renderLeaderboardTable = (
    data: any[],
    columns: { header: string; key: string; render?: (item: any) => React.ReactNode }[],
    title: string,
    subtitle?: string
  ) => (
    <div className="flex flex-col w-full md:w-1/2 p-4">
      <h2 className="!text-xl font-bold !text-yellow-300 text-center md:text-left mb-2">
        {title}
        {subtitle && <span className="text-white text-base block">{subtitle}</span>}
      </h2>
      <div className="rounded-md border">
        {isBountyDataLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-yellow-300" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} className="px-4 py-2 text-left text-sm font-semibold">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.slice(0, 10).map((item) => (
                <tr
                  key={item.rank}
                  className={`
                    ${item.rank === 1 ? "bg-yellow-500/10" : ""}
                    ${item.rank === 2 ? "bg-gray-400/10" : ""}
                    ${item.rank === 3 ? "bg-orange-700/10" : ""}
                    hover:bg-gray-700/20 transition-colors
                  `}>
                  {columns.map((col, index) => (
                    <td key={index} className="px-4 py-2 whitespace-nowrap text-sm">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col justify-center items-center w-full mt-3">
      <div className="flex flex-col mb-8 justify-center w-full">
        <div className="mb-10 text-center md:text-left">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            XP Leaderboards
          </span>
          <p className="text-center md:text-left text-lg text-white">Sigma Music XP leaderboards are a great way to win rewards for being active!</p>
        </div>

        {/* Most Generous Fans Leaderboard */}
        <div className="flex flex-col w-full mb-8">
          <h2 className="!text-2xl font-bold !text-yellow-300 text-center md:text-left">
            Most Generous Fans <span className="text-white text-lg"> (Fans who gave the most XP to support their favorite artists)</span>
          </h2>

          <div className="flex items-center justify-center md:justify-start space-x-2 my-4 p-4 bg-black/50 rounded-lg border border-yellow-300/20">
            <div className="text-lg text-white">Your Position:</div>
            {myPlaceOnLeaderboard === "" ? (
              <div className="flex items-center space-x-2">
                {addressSol ? <Loader className="animate-spin h-5 w-5 text-yellow-300" /> : null}
                <span className="text-yellow-300">
                  {!addressSol ? (
                    <span
                      className="text-yellow-300 cursor-pointer hover:underline"
                      onClick={() => {
                        window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + "?section=xp-leaderboards")}`;
                      }}>
                      Login to see your position
                    </span>
                  ) : (
                    "Loading"
                  )}
                </span>
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

          {isFanXPDataLoading ? (
            <div className="h-[100px] flex items-center justify-center">
              <Loader className="animate-spin text-yellow-300" size={20} />
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

        {/* Artist Leaderboards Section */}
        <div className="flex flex-col w-full mb-8">
          <h2 className="!text-2xl font-bold !text-yellow-300 text-center md:text-left mb-4">Artist Leaderboards</h2>
          <div className="flex flex-wrap">
            {renderLeaderboardTable(
              artistPowerLeaderboard,
              [
                {
                  header: "Rank",
                  key: "rank",
                  render: (item) => (
                    <div className="flex items-center">
                      {item.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {item.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {item.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span className={item.rank <= 3 ? "font-bold" : ""}>#{item.rank}</span>
                    </div>
                  ),
                },
                {
                  header: "Artist",
                  key: "name",
                  render: (item) => (
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateToDeepAppView({ artistSlug: item.artistSlug })}>
                      <img src={item.img} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
                      <span>{item.name}</span>
                    </div>
                  ),
                },
                {
                  header: "Power",
                  key: "bitsSum",
                  render: (item) => (
                    <div className="flex items-center justify-end space-x-1">
                      <SparklesIcon className="h-4 w-4 text-yellow-300" />
                      <span>{item.bitsSum.toLocaleString()}</span>
                    </div>
                  ),
                },
              ],
              "Most XP-Powered Artists",
              "Artist's XP holdings that fans have given to them"
            )}

            {renderLeaderboardTable(
              artistFansLeaderboard,
              [
                {
                  header: "Rank",
                  key: "rank",
                  render: (item) => (
                    <div className="flex items-center">
                      {item.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {item.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {item.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span className={item.rank <= 3 ? "font-bold" : ""}>#{item.rank}</span>
                    </div>
                  ),
                },
                {
                  header: "Artist",
                  key: "name",
                  render: (item) => (
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateToDeepAppView({ artistSlug: item.artistSlug })}>
                      <img src={item.img} alt={item.name} className="w-8 h-8 rounded-full object-cover" />
                      <span>{item.name}</span>
                    </div>
                  ),
                },
                {
                  header: "Fans",
                  key: "giverCounts",
                  render: (item) => (
                    <div className="flex items-center justify-end space-x-1">
                      <span>👥</span>
                      <span>{item.giverCounts.toLocaleString()}</span>
                    </div>
                  ),
                },
              ],
              "Artist With Most Unique Fans Powering Them",
              "Most unique fans that have powered an artist with XP"
            )}
          </div>
        </div>

        {/* Album Leaderboards Section */}
        <div className="flex flex-col w-full">
          <h2 className="!text-2xl font-bold !text-yellow-300 text-center md:text-left mb-4">Album Leaderboards</h2>
          <div className="flex flex-wrap">
            {renderLeaderboardTable(
              albumPowerLeaderboard,
              [
                {
                  header: "Rank",
                  key: "rank",
                  render: (item) => (
                    <div className="flex items-center">
                      {item.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {item.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {item.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span className={item.rank <= 3 ? "font-bold" : ""}>#{item.rank}</span>
                    </div>
                  ),
                },
                {
                  header: "Album",
                  key: "title",
                  render: (item) => (
                    <div
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => navigateToDeepAppView({ artistSlug: item.artistSlug, albumId: item.albumId })}>
                      <img src={item.img} alt={item.title} className="w-8 h-8 rounded object-cover" />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-gray-400">{item.artistName}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Power",
                  key: "bitsSum",
                  render: (item) => (
                    <div className="flex items-center justify-end space-x-1">
                      <SparklesIcon className="h-4 w-4 text-yellow-300" />
                      <span>{item.bitsSum.toLocaleString()}</span>
                    </div>
                  ),
                },
              ],
              "Most XP-Boosted Albums",
              "Albums that have been boosted the most by fans"
            )}

            {renderLeaderboardTable(
              albumFansLeaderboard,
              [
                {
                  header: "Rank",
                  key: "rank",
                  render: (item) => (
                    <div className="flex items-center">
                      {item.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                      {item.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                      {item.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                      <span className={item.rank <= 3 ? "font-bold" : ""}>#{item.rank}</span>
                    </div>
                  ),
                },
                {
                  header: "Album",
                  key: "title",
                  render: (item) => (
                    <div
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => navigateToDeepAppView({ artistSlug: item.artistSlug, albumId: item.albumId })}>
                      <img src={item.img} alt={item.title} className="w-8 h-8 rounded object-cover" />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-gray-400">{item.artistName}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Fans",
                  key: "giverCounts",
                  render: (item) => (
                    <div className="flex items-center justify-end space-x-1">
                      <span>👥</span>
                      <span>{item.giverCounts.toLocaleString()}</span>
                    </div>
                  ),
                },
              ],
              "Album With Most Unique Fans Boosts",
              "Most unique fans that have boosted an album with XP"
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
