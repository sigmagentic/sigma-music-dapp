import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { ArrowUpRight, Heart, Loader, Pause, Play } from "lucide-react";
import toast from "react-hot-toast";
import { AuthRedirectWrapper } from "components";
import { DISABLE_BITZ_FEATURES, DISABLE_REMIX_LAUNCH_BUTTON, SIGMA_MEME_FEATURE_WHITELIST } from "config";
import { Button } from "libComponents/Button";
import { BountyBitzSumMapping } from "libs/types";
import { getApiWeb2Apps, sleep } from "libs/utils";
import { LaunchMusicMeme } from "pages/AppMarketplace/NFTunes/LaunchMusicMeme";
import { LaunchToPumpFun } from "pages/AppMarketplace/NFTunes/LaunchToPumpFun";
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
  assetIdOrTokenName: string;
  tweet?: string; // the tweet link that started it all
}

const VOTES_TO_GRADUATE = 20;
const HOURS_TO_GRADUATE = 24;

// Add this custom toast style near the top of the file after imports
const customToastStyle = {
  style: {
    maxWidth: "800px",
    padding: "16px",
    background: "#1A1A1A",
    color: "white",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  duration: Infinity, // Make toast stay until dismissed
};

const JobsModal = ({ isOpen, onClose, jobs, onRefresh }: { isOpen: boolean; onClose: () => void; jobs: Array<any>; onRefresh: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold mr-auto">Your Jobs History</h3>
          <Button className="mr-4" onClick={onRefresh}>
            Refresh
          </Button>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Task</th>
                <th className="text-left p-2">Launch Details</th>
                <th className="text-left p-2">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-white/5">
                  <td className="p-2">{new Date(job.createdOn).toLocaleDateString()}</td>
                  <td className="p-2">{job.amount} SOL</td>
                  <td className="p-2">{job.task === "gen" ? "Generate Music Meme" : "Launch To Pump.fun"}</td>
                  <td className="p-2">
                    {job.launchId && (
                      <a href={`/remix?launchId=${job.launchId}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                        {job.launchId}
                        {job.launchedOn && <span className="text-gray-400 text-xs ml-2">({new Date(job.launchedOn).toLocaleDateString()})</span>}
                      </a>
                    )}
                  </td>
                  <td className="p-2">
                    <a href={`https://solscan.io/tx/${job.tx}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                      {job.tx.slice(0, 4)}...{job.tx.slice(-4)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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
  const [focusedLaunchId, setFocusedLaunchId] = useState<string | null>(null);
  const [launchMusicMemeModalOpen, setLaunchMusicMemeModalOpen] = useState<boolean>(false);
  const [launchToPumpFunModalOpen, setLaunchToPumpFunModalOpen] = useState<boolean>(false);
  const [pumpFunTokenData, setPumpFunTokenData] = useState<{
    tokenImg: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDesc: string;
    tokenId: string;
    tweet?: string;
  }>({ tokenImg: "", tokenName: "", tokenSymbol: "", tokenDesc: "", tokenId: "", tweet: "" });

  // give bits to a bounty (power up or like)
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined });

  const [myJobsPayments, setMyJobsPayments] = useState<
    Array<{
      amount: string;
      payer: string;
      task: string;
      createdOn: number;
      tx: string;
    }>
  >([]);

  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const launchId = params.get("launchId");
    if (launchId) {
      setFocusedLaunchId(launchId);
      // Remove focus after 5 seconds
      setTimeout(() => setFocusedLaunchId(null), 5000);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseA = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/newLaunches`);
        setNewLaunchesData(responseA.data);

        const responseB = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/graduatedLaunches`);
        setGraduatedLaunchesData(responseB.data);

        // Fetch payment logs if user is logged in
        if (addressSol) {
          const responseC = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/paymentLogs?payer=${addressSol}`);
          setMyJobsPayments(responseC.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [addressSol]);

  useEffect(() => {
    if (newLaunchesData.length > 0 || graduatedLaunchesData.length > 0) {
      queueBitzPowerUpsAndLikesForAllOwnedAlbums();
    }
  }, [newLaunchesData, graduatedLaunchesData]);

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
      setCurrentPlayingId(null);
    };
  }, []); // Empty dependency array since this only runs on unmount

  const handleRefreshJobs = async () => {
    // Fetch payment logs if user is logged in
    if (addressSol) {
      setMyJobsPayments([]);
      await sleep(1);
      const responseC = await axios.get(`${getApiWeb2Apps()}/datadexapi/sigma/paymentLogs?payer=${addressSol}`);
      setMyJobsPayments(responseC.data);
    }
  };

  async function queueBitzPowerUpsAndLikesForAllOwnedAlbums() {
    const intialMappingOfVotesForAllTrackBountyIds = [...newLaunchesData, ...graduatedLaunchesData].flatMap((launch: any) =>
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

  const calculateTimeProgress = (startTimestampMilliSeconds: number) => {
    const nowMilliSeconds = Date.now();
    const endTimeMilliSeconds = startTimestampMilliSeconds + HOURS_TO_GRADUATE * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeLeftMilliSeconds = endTimeMilliSeconds - nowMilliSeconds;

    // Calculate progress percentage
    const progress = Math.max(0, Math.min(100, (timeLeftMilliSeconds / (HOURS_TO_GRADUATE * 60 * 60 * 1000)) * 100));

    // Format time left for display
    const hoursLeft = Math.max(0, Math.floor(timeLeftMilliSeconds / (1000 * 60 * 60)));
    const minutesLeft = Math.max(0, Math.floor((timeLeftMilliSeconds % (1000 * 60 * 60)) / (1000 * 60)));

    return {
      progress,
      timeLeftText: timeLeftMilliSeconds <= 0 ? "Expired" : `${hoursLeft}h ${minutesLeft}m left`,
      isExpired: timeLeftMilliSeconds <= 0,
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

    const isFocused = focusedLaunchId === item.launchId;

    return (
      <div
        className={`bg-[#1A1A1A] rounded-lg p-4 mb-4 ${
          isFocused ? "animate-shake bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-2 border-yellow-500" : ""
        }`}>
        <div className="flex flex-col">
          <div className="flex gap-4">
            <img src={item.image} alt={item.title} className="w-24 h-24 rounded-lg object-cover" />
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{idx + 1}.</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-400">
                Based on music by{" "}
                <a href={`/?artist-profile=${item.basedOn}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                  {item.basedOn}
                </a>
                , remixed by{" "}
                <a href={`https://solscan.io/account/${item.remixedBy}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                  {formatAddress(item.remixedBy)}
                </a>{" "}
                on {new Date(item.createdOn * 1000).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-600">Launch Id = {item.launchId}</p>
              {item.tweet && (
                <p className="text-xs text-gray-600">
                  <a href={item.tweet} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline flex items-center gap-2">
                    View Creation Tweet <ArrowUpRight className="w-4 h-4" />
                  </a>
                </p>
              )}
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
                            <span className="ml-2">{currentTime} - Stop Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="ml-2">Play Track</span>
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
                          {VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0) <= 0 ? (
                            <span className="text-green-500">🎉 Graduated... stay tuned!</span>
                          ) : (
                            `${VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0)} Votes To Graduate`
                          )}
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
                  onClick={() => handlePlay(item.graduatedStreamUrl || item.versions[0].streamUrl, `graduated-${item.launchId}`)}>
                  {currentPlayingId === `graduated-${item.launchId}` ? (
                    <>
                      {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                      <span className="ml-2">{currentTime} - Stop Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="ml-2">Play Track</span>
                    </>
                  )}
                </button>

                {!DISABLE_BITZ_FEATURES && (
                  <div className="albumLikes md:w-[135px] flex flex-col items-center">
                    <div
                      className={`${addressSol && typeof bountyBitzSumGlobalMapping[item.versions[0].bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                      onClick={() => {
                        if (addressSol && typeof bountyBitzSumGlobalMapping[item.versions[0].bountyId]?.bitsSum !== "undefined") {
                          handleSendBitzForMusicBounty({
                            creatorIcon: item.image,
                            creatorName: `${item.title} Version 1`,
                            giveBitzToWho: item.remixedBy,
                            giveBitzToCampaignId: item.versions[0].bountyId,
                          });
                        }
                      }}>
                      {typeof bountyBitzSumGlobalMapping[item.versions[0].bountyId]?.bitsSum === "undefined" ? (
                        <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                      ) : (
                        <div
                          className="p-5 md:p-0 flex items-center gap-2"
                          title={addressSol ? "Like This Album With 5 BiTz" : "Login to Like This Album"}
                          onClick={() => {
                            if (addressSol) {
                              handleSendBitzForMusicBounty({
                                creatorIcon: item.image,
                                creatorName: `${item.title} Version 1`,
                                giveBitzToWho: item.remixedBy,
                                giveBitzToCampaignId: item.versions[0].bountyId,
                              });
                            }
                          }}>
                          {bountyBitzSumGlobalMapping[item.versions[0].bountyId]?.bitsSum}
                          <Heart className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`${!addressSol || addressSol !== item.remixedBy ? "hidden" : ""}`}>
                  <Button
                    disabled={!addressSol}
                    className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%] transition ease-in-out delay-50 duration-100 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-sm text-center p-2 md:p-4 rounded-lg"
                    onClick={() => {
                      setPumpFunTokenData({
                        tokenImg: item.image,
                        tokenName: item.title,
                        tokenSymbol: `SIGMA-${item.title.toUpperCase().slice(0, 3)}${item.title.toUpperCase().slice(-3)}`,
                        tokenDesc: `Official AI Music Meme Coin to access the launch of ${item.title} of Sigma Music. Owning this token grants you fractionalized ownership of the music track forever.`,
                        tokenId: item.assetIdOrTokenName.replaceAll(" ", "_"),
                        tweet: item.tweet || "",
                      });
                      setLaunchToPumpFunModalOpen(true);
                    }}>
                    <div>Fractionalize and Launch on Pump.fun</div>
                  </Button>
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

  const isWalletWhitelisted = (wallet: string | undefined) => {
    if (!wallet || !SIGMA_MEME_FEATURE_WHITELIST) return false;
    const whitelistedAddresses = SIGMA_MEME_FEATURE_WHITELIST.split(",").map((addr) => addr.trim());
    return whitelistedAddresses.includes(wallet);
  };

  return (
    <>
      <div className="flex flex-col w-full min-h-screen p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="!text-3xl font-semibold ">
            <span className="text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">Sigma REMiX</span> : Launch AI
            Music Meme Coins!
          </h1>
          <div className="flex gap-4">
            {myJobsPayments.length > 0 && (
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-sm md:text-xl text-center p-2 md:p-4 rounded-lg"
                onClick={() => setIsJobsModalOpen(true)}>
                Your Jobs
              </Button>
            )}
            <Button
              disabled={!addressSol || DISABLE_REMIX_LAUNCH_BUTTON || !isWalletWhitelisted(addressSol)}
              className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%] transition ease-in-out delay-50 duration-100 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-sm md:text-xl text-center p-2 md:p-4 rounded-lg"
              onClick={() => {
                setLaunchMusicMemeModalOpen(true);
              }}>
              <div>
                {DISABLE_REMIX_LAUNCH_BUTTON ? (
                  <div>Launch an AI Music Meme Coin Now! (Offline For Now!)</div>
                ) : !addressSol ? (
                  <div>Launch an AI Music Meme Coin Now! Login First</div>
                ) : !isWalletWhitelisted(addressSol) ? (
                  <div>Launch an AI Music Meme Coin Now! (Whitelisted Users Only)</div>
                ) : (
                  <div>Launch an AI Music Meme Coin Now!</div>
                )}
              </div>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Column 1 */}
          <div className="flex flex-col bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="!text-2xl font-semibold">Help Curate New AI Meme Coin Candidates</h2>
              <button
                onClick={() =>
                  toast(
                    (t) => (
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="mb-4">
                            <strong className="text-yellow-500">New AI Meme Coin Candidates:</strong> 'Remixers' (anyone can be a 'Remixer' by 'Launch an AI
                            Music Meme Coin Now') use Sigma Music AI to generate a remix album based on real-world music content.
                          </p>
                          <p className="mb-4">
                            However, the music may not be ready for the mainstream since Music LLMs are not very mature and need improvement. If you see (and
                            listen to) a new candidate music NFT that sounds great, you can use your XP points to vote for it to 'graduate'.
                          </p>
                          <p>
                            This helps Sigma improve her Music LLM model by identifying content that is more attractive to human listeners. At the same time, it
                            also provides an opportunity for the 'remixers' to fractionalize this Music NFT (fractionalized NFTs solve the liquidity issues
                            regular one off NFTs have), send it to pump.fun, and make it an AI music NFT.
                          </p>
                        </div>
                        <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-white p-1">
                          ✕
                        </button>
                      </div>
                    ),
                    customToastStyle
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
              <h2 className="!text-2xl font-semibold">Graduated: Send to Pump.fun</h2>
              <button
                onClick={() =>
                  toast(
                    (t) => (
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="mb-4">
                            <strong className="text-yellow-500">Graduated Launches:</strong> These curated AI Music NFTs have received enough votes from the
                            community to graduate to this next (super interesting) launch stage.
                          </p>
                          <p className="mb-4">
                            Once graduated, these AI Music NFTs can be "fractionalized" by the "remixer" (the original user who collaborated with Sigma to
                            create the track) and launched on pump.fun, making the AI Music NFT highly liquid! This means anyone can own a piece of the music
                            track by purchasing fractional tokens on pump.fun.
                          </p>
                          <p>
                            Anyone who owns at least one of the Pump.fun fractional tokens for the graduated AI Music NFT becomes a co-owner of the AI Music
                            NFT. Co-owners can listen to the album on sigmamusic.fm or trade their tokens with others.
                          </p>
                        </div>
                        <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-white p-1">
                          ✕
                        </button>
                      </div>
                    ),
                    customToastStyle
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
              <h2 className="!text-2xl font-semibold">Fractionalized Token Launches</h2>
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

        <>
          {launchMusicMemeModalOpen && (
            <LaunchMusicMeme
              onCloseModal={() => {
                setLaunchMusicMemeModalOpen(false);
              }}
            />
          )}
        </>

        <>
          {launchToPumpFunModalOpen && (
            <LaunchToPumpFun
              tokenImg={pumpFunTokenData.tokenImg}
              tokenName={pumpFunTokenData.tokenName}
              tokenSymbol={pumpFunTokenData.tokenSymbol}
              tokenDesc={pumpFunTokenData.tokenDesc}
              tokenId={pumpFunTokenData.tokenId}
              twitterUrl={pumpFunTokenData.tweet || ""}
              onCloseModal={() => {
                setLaunchToPumpFunModalOpen(false);
                setPumpFunTokenData({ tokenImg: "", tokenName: "", tokenSymbol: "", tokenDesc: "", tokenId: "" });
              }}
            />
          )}
        </>

        <JobsModal isOpen={isJobsModalOpen} onClose={() => setIsJobsModalOpen(false)} jobs={myJobsPayments} onRefresh={handleRefreshJobs} />
      </div>
    </>
  );
};

export const Remix = () => (
  <AuthRedirectWrapper>
    <RemixPage />
  </AuthRedirectWrapper>
);
