import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { Heart, Loader, Pause, Play } from "lucide-react";
import toast from "react-hot-toast";
import { AuthRedirectWrapper } from "components";
import { DISABLE_BITZ_FEATURES } from "config";
import { BountyBitzSumMapping } from "libs/types";
import { getApiWeb2Apps, sleep } from "libs/utils";
import { SendBitzPowerUp } from "pages/AppMarketplace/NFTunes/SendBitzPowerUp";
import { fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/AppMarketplace/NFTunes/shared/utils";
import { updateBountyBitzSumGlobalMappingWindow } from "pages/AppMarketplace/NFTunes/shared/utils";
import { useNftsStore } from "store/nfts";

interface Version {
  bountyId: string;
  streamUrl: string;
}

interface Launch {
  image: string;
  createdOn: number; // Unix timestamp
  remixedBy: string;
  launchId: string;
  basedOn: string;
  versions: Version[];
  title: string;
  graduated?: number;
  graduatedStreamUrl?: string;
  votes?: number; // Optional as it might not be present in all responses
  votesNeeded?: number; // Optional as it might not be present in all responses
  status?: string; // Optional, used in graduated launches
  streamUrl?: string; // Optional, used in graduated launches
}

const VOTES_TO_GRADUATE = 250;
const HOURS_TO_GRADUATE = 24;

const RemixPage = () => {
  const { publicKey: publicKeySol } = useWallet();
  const addressSol = publicKeySol?.toBase58();
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [newLaunchesData, setNewLaunchesData] = useState<Launch[]>([]);
  const [graduatedLaunchesData, setGraduatedLaunchesData] = useState<Launch[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [bountyBitzSumGlobalMapping, setBountyBitzSumGlobalMapping] = useState<BountyBitzSumMapping>({});
  const { solBitzNfts } = useNftsStore();

  // give bits to a bounty (power up or like)
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseA = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/newLaunches`);
        setNewLaunchesData(responseA.data);

        const responseB = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/graduatedLaunches`);
        setGraduatedLaunchesData(responseB.data);
      } catch (error) {
        console.error("Error fetching launch data:", error);
        toast.error("Failed to load launch data");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (newLaunchesData.length > 0) {
      queueBitzPowerUpsAndLikesForAllOwnedAlbums();
    }
  }, [newLaunchesData]);

  useEffect(() => {
    console.log("musicBountyBitzSumGlobalMapping", bountyBitzSumGlobalMapping);
  }, [bountyBitzSumGlobalMapping]);

  useEffect(() => {
    console.log("addressSol", addressSol);
  }, [addressSol]);

  async function queueBitzPowerUpsAndLikesForAllOwnedAlbums() {
    const intialMappingOfVotesForAllTrackBountyIds = newLaunchesData.flatMap((launch: any) =>
      launch.versions.map((version: any) => ({
        bountyId: version.bountyId,
        creatorWallet: launch.remixedBy,
      }))
    );

    // we throttle this so that we don't overwhelm the server and also, the local state updates dont fire if they are all too close together
    for (let i = 0; i < intialMappingOfVotesForAllTrackBountyIds.length; i++) {
      const trackBounty = intialMappingOfVotesForAllTrackBountyIds[i];
      fetchBitzPowerUpsAndLikesForSelectedArtist({
        giftBitzToArtistMeta: { bountyId: trackBounty.bountyId, creatorWallet: trackBounty.creatorWallet },
        userHasNoBitzDataNftYet: solBitzNfts.length === 0,
        solBitzNfts,
        setMusicBountyBitzSumGlobalMapping: setBountyBitzSumGlobalMapping,
        isSingleAlbumBounty: true,
      });

      await sleep(2);
    }
  }

  const handlePlay = async (streamUrl: string, versionId: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // If clicking on currently playing track
    if (currentPlayingId === versionId && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
      return;
    }

    // If another track is playing, stop it
    if (currentPlayingId && currentPlayingId !== versionId) {
      audioRef.current.pause();
    }

    try {
      setIsLoading(true);
      setCurrentPlayingId(versionId);

      audioRef.current.src = streamUrl;
      await audioRef.current.play();

      setIsPlaying(true);
      setIsLoading(false);

      // Update current time
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const minutes = Math.floor(audioRef.current.currentTime / 60);
          const seconds = Math.floor(audioRef.current.currentTime % 60);
          setCurrentTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      };

      // Handle audio ending
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
        setCurrentTime("0:00");
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsLoading(false);
      setCurrentPlayingId(null);
    }
  };

  const calculateTimeProgress = (startTimestampSeconds: number) => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const endTimeSeconds = startTimestampSeconds + HOURS_TO_GRADUATE * 60 * 60; // 24 hours in seconds
    const timeLeftSeconds = endTimeSeconds - nowSeconds;

    // Calculate progress percentage
    const progress = Math.max(0, Math.min(100, (timeLeftSeconds / (HOURS_TO_GRADUATE * 60 * 60)) * 100));

    // Format time left for display
    const hoursLeft = Math.max(0, Math.floor(timeLeftSeconds / (60 * 60)));
    const minutesLeft = Math.max(0, Math.floor((timeLeftSeconds % (60 * 60)) / 60));

    return {
      progress,
      timeLeftText: timeLeftSeconds <= 0 ? "Expired" : `${hoursLeft}h ${minutesLeft}m left`,
      isExpired: timeLeftSeconds <= 0,
    };
  };

  const formatAddress = (address: string) => {
    if (address.length < 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const LaunchCard = ({ item, type, idx }: { item: Launch; type: string; idx: number }) => {
    const [timeProgress, setTimeProgress] = useState(() => calculateTimeProgress(item.createdOn));

    // Update progress every minute
    useEffect(() => {
      if (type === "new") {
        const interval = setInterval(() => {
          setTimeProgress(calculateTimeProgress(item.createdOn));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
      }
    }, [item.createdOn, type]);

    return (
      <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
        <div className="flex flex-col">
          <div className="flex gap-4">
            <img src={item.image} alt={item.title} className="w-24 h-24 rounded-lg object-cover" />
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{idx}.</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-400">
                Based on music by {item.basedOn}, remixed by{" "}
                <a href={`https://solscan.io/account/${item.remixedBy}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                  {formatAddress(item.remixedBy)}
                </a>{" "}
                on {new Date(item.createdOn * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {type === "new" && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <div className="w-full bg-gray-700 h-1 rounded-full">
                    <div className="bg-yellow-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${timeProgress.progress}%` }}></div>
                  </div>
                  <span className={timeProgress.isExpired ? "text-red-500" : ""}>{timeProgress.timeLeftText}</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="text-xs text-gray-400">Which one do you like?</div>
                  {item.versions.map((version: Version, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <button
                        className={`flex items-center gap-2 ${
                          currentPlayingId && currentPlayingId !== `${item.launchId}-${idx}` ? "opacity-50 cursor-not-allowed" : "text-yellow-500"
                        }`}
                        disabled={currentPlayingId ? currentPlayingId !== `${item.launchId}-${idx}` : false}
                        onClick={() => handlePlay(version.streamUrl, `${item.launchId}-${idx}`)}>
                        {currentPlayingId === `${item.launchId}-${idx}` ? (
                          <>
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                            <span className="ml-2 text-xs">{currentTime} - Stop Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="ml-2">Play Version {idx + 1}</span>
                          </>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {!DISABLE_BITZ_FEATURES && (
                          <div className="albumLikes md:w-[135px] flex flex-col items-center">
                            <div
                              className={`${addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                              onClick={() => {
                                if (addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined") {
                                  handleSendBitzForMusicBounty({
                                    creatorIcon: item.image,
                                    creatorName: `${item.title} Version ${idx + 1}`,
                                    giveBitzToWho: item.remixedBy,
                                    giveBitzToCampaignId: version.bountyId,
                                  });
                                }
                              }}>
                              {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                              ) : (
                                <div
                                  className="p-5 md:p-0 flex items-center gap-2"
                                  title={addressSol ? "Like This Album With 5 BiTz" : "Login to Like This Album"}
                                  onClick={() => {
                                    if (addressSol) {
                                      handleSendBitzForMusicBounty({
                                        creatorIcon: item.image,
                                        creatorName: `${item.title} Version ${idx + 1}`,
                                        giveBitzToWho: item.remixedBy,
                                        giveBitzToCampaignId: version.bountyId,
                                      });
                                    }
                                  }}>
                                  {bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum}
                                  <Heart className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <span className="text-xs text-gray-400">
                          {VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0)} Votes To Graduate
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {type === "graduated" && (
              <div className="mt-2 flex items-center justify-between">
                <button
                  className={`flex items-center gap-2 ${
                    currentPlayingId && currentPlayingId !== `graduated-${item.launchId}` ? "opacity-50 cursor-not-allowed" : "text-yellow-500"
                  }`}
                  disabled={currentPlayingId ? currentPlayingId !== `graduated-${item.launchId}` : false}
                  onClick={() => handlePlay(item.graduatedStreamUrl || "", `graduated-${item.launchId}`)}>
                  {currentPlayingId === `graduated-${item.launchId}` ? (
                    <>
                      {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                      <span className="ml-2 text-xs">{currentTime} - Stop Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="ml-2">Version 1: {item.votes} Votes</span>
                    </>
                  )}
                </button>
                <div className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-sm text-black">
                  Fractionalize and Launch on Pump.fun
                </div>
              </div>
            )}

            {type === "fractionalized" && (
              <div className="mt-2 flex items-center justify-between">
                <button
                  className={`flex items-center gap-2 ${
                    currentPlayingId && currentPlayingId !== `fractionalized-${item.launchId}` ? "opacity-50 cursor-not-allowed" : "text-yellow-500"
                  }`}
                  disabled={currentPlayingId ? currentPlayingId !== `fractionalized-${item.launchId}` : false}
                  onClick={() => handlePlay(item.graduatedStreamUrl || "", `fractionalized-${item.launchId}`)}>
                  {currentPlayingId === `fractionalized-${item.launchId}` ? (
                    <>
                      {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                      <span className="ml-2 text-xs">{currentTime} - Stop Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="ml-2">Listen</span>
                    </>
                  )}
                </button>
                <div className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full text-sm">{item.status}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-gray-700 rounded-lg"></div>
        <div className="flex-grow">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-full"></div>
      </div>
    </div>
  );

  // here we set the power up object that will trigger the modal that allows a user to sent bitz to a target bounty
  function handleSendBitzForMusicBounty({
    creatorIcon,
    creatorName,
    giveBitzToWho,
    giveBitzToCampaignId,
    isLikeMode,
  }: {
    creatorIcon: string;
    creatorName: string;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
  }) {
    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      giveBitzToWho,
      giveBitzToCampaignId,
      isLikeMode,
    });
  }

  return (
    <>
      <div className="flex flex-col w-full min-h-screen p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Column 1 */}
          <div className="flex flex-col bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Help Curate New Launches</h2>
              <button
                onClick={() =>
                  toast(
                    "New Launches: Sigma Music AI generates 2 variations of a remix, and you can help curate the best one and graduate it so it can be fractionalzied and launched by the remixer if they want!"
                  )
                }
                className="p-1 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {isDataLoading ? (
                <>
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </>
              ) : (
                newLaunchesData.map((item: Launch, idx: number) => <LaunchCard key={idx} idx={idx} item={item} type="new" />)
              )}
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Graduated Launches</h2>
              <button
                onClick={() =>
                  toast(
                    "Graduated Launches: These curated Music NFTs can now be 'fractionalzied' by the 'remixer' and launched on pump.fun, making the music launch highly liquid! "
                  )
                }
                className="p-1 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {isDataLoading ? (
                <>
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </>
              ) : (
                graduatedLaunchesData.map((item: Launch, idx: number) => <LaunchCard key={idx} idx={idx} item={item} type="graduated" />)
              )}
            </div>
          </div>

          {/* Column 3 */}
          <div className="hidden flex flex-col bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Fractionalized Token Launches</h2>
              <button
                onClick={() =>
                  toast(
                    "Fractionalized Token Launches: These fractionalized Music NFTs are available for purchase on pump.fun. Any who owns a fraction of the token, becomes a co-owner of the music track forever."
                  )
                }
                className="p-1 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
            {/* Content for column 3 */}
            <div className="space-y-4">
              {graduatedLaunchesData.map((item: Launch, idx: number) => (
                <LaunchCard key={idx} idx={idx} item={item} type="fractionalized" />
              ))}
            </div>
          </div>
        </div>

        <>
          {/* The bitz power up for creators and album likes */}
          {giveBitzForMusicBountyConfig.giveBitzToWho !== "" && giveBitzForMusicBountyConfig.giveBitzToCampaignId !== "" && (
            <SendBitzPowerUp
              giveBitzForMusicBountyConfig={giveBitzForMusicBountyConfig}
              onCloseModal={(forceRefreshBitzCountsForBounty: any) => {
                setGiveBitzForMusicBountyConfig({
                  creatorIcon: undefined,
                  creatorName: undefined,
                  giveBitzToWho: "",
                  giveBitzToCampaignId: "",
                  isLikeMode: undefined,
                });

                // we can force refresh the bitz counts locally for the bounty
                if (forceRefreshBitzCountsForBounty) {
                  const _bountyToBitzLocalMapping: Record<any, any> = { ...bountyBitzSumGlobalMapping };
                  const currMappingVal = _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId];

                  if (typeof currMappingVal !== "undefined" && typeof currMappingVal.bitsSum !== "undefined") {
                    _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId] = {
                      bitsSum: currMappingVal.bitsSum + forceRefreshBitzCountsForBounty.bitzValToGift,
                      syncedOn: Date.now(),
                    };
                  } else {
                    _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId] = {
                      bitsSum: forceRefreshBitzCountsForBounty.bitzValToGift,
                      syncedOn: Date.now(),
                    };
                  }

                  updateBountyBitzSumGlobalMappingWindow(_bountyToBitzLocalMapping);
                  setBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
                }
              }}
            />
          )}
        </>
      </div>
    </>
  );
};

export const Remix = () => (
  <AuthRedirectWrapper>
    <RemixPage />
  </AuthRedirectWrapper>
);
