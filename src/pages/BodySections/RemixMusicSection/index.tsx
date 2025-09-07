import React, { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import { Rocket, Info, Loader, Pause, Play, Pointer, RefreshCcw, FileMusicIcon } from "lucide-react";
import toast from "react-hot-toast";
import { DISABLE_BITZ_FEATURES, DISABLE_REMIX_LAUNCH_BUTTON } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { Switch } from "libComponents/Switch";
import { BountyBitzSumMapping, AiRemixLaunch, AiRemixTrackVersion, MusicTrack, Album } from "libs/types";
import { Artist, AiRemixRawTrack } from "libs/types";
import { getPaymentLogsViaAPI, getRemixLaunchesViaAPI, logStatusChangeToAPI, mergeRawAiRemixTracks, sleep, mapRawAiRemixTracksToMusicTracks } from "libs/utils";
import { SendBitzPowerUp } from "pages/BodySections/HomeSection/SendBitzPowerUp";
import { fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/BodySections/HomeSection/shared/utils";
import { updateBountyBitzSumGlobalMappingWindow } from "pages/BodySections/HomeSection/shared/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { useNftsStore } from "store/nfts";
import { LaunchMusicTrack } from "./LaunchMusicTrack";
import { routeNames } from "routes";
import { fixImgIconForRemixes } from "libs/utils/ui";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { TrackList } from "pages/BodySections/HomeSection/components/TrackList";
import { useAudioPlayerStore } from "store/audioPlayer";

const VOTES_TO_GRADUATE = 5;
// const HOURS_TO_GRADUATE = 24;

// Add this custom toast style near the top of the file after imports
const customToastStyle = {
  style: {
    maxWidth: "800px",
    padding: "16px",
    background: "#1A1A1A",
    color: "white",
    fontSize: "14px",
    lineHeight: "1.5",
    borderRadius: "10px",
    border: "1px solid #eab308",
  },
  duration: Infinity, // Make toast stay until dismissed
};

const JobsModal = ({ isOpen, onClose, jobs, onRefresh }: { isOpen: boolean; onClose: () => void; jobs: Array<any>; onRefresh: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold mr-auto">Your Jobs History</h3>
          <div
            className={`cursor-pointer flex items-center gap-2 text-sm mr-5`}
            onClick={() => {
              onRefresh();
            }}>
            <>
              <RefreshCcw className="w-5 h-5" />
              Refresh
            </>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Receipt</th>
                <th className="text-left p-2">Job</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-white/5">
                  <td className="p-2">{new Date(job.createdOn).toLocaleDateString()}</td>
                  <td className="p-2">{job.amount} XP</td>
                  <td className="p-2">
                    {job.paymentStatus === "new" || job.paymentStatus === "async_processing" ? (
                      <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-md">Pending AI Remix...</span>
                    ) : (
                      job.paymentStatus.charAt(0).toUpperCase() + job.paymentStatus.slice(1)
                    )}
                  </td>
                  <td className="p-2 text-xs">
                    <div className="relative group">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(job.tx);
                            toast.success("Transaction hash copied to clipboard!");
                          } catch (err) {
                            console.error("Failed to copy: ", err);
                            toast.error("Failed to copy to clipboard");
                          }
                        }}
                        className="text-yellow-300 hover:text-yellow-200 hover:underline cursor-pointer transition-colors">
                        {job.tx.slice(0, 4)}...{job.tx.slice(-4)}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Click to Copy
                      </div>
                    </div>
                  </td>

                  <td className="p-2">Remix Track: {job.promptParams?.refTrack_alId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

let newJobsInterval: NodeJS.Timeout | null = null;

interface RemixMusicSectionContentProps {
  navigateToDeepAppView: (e: any) => void;
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
}

export const RemixMusicSectionContent = (props: RemixMusicSectionContentProps) => {
  const { navigateToDeepAppView, onCloseMusicPlayer, viewSolData } = props;
  const { publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { publicKey: publicKeySol, walletType, isLoading: isLoadingSolanaWallet } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : publicKeySol; // Use the appropriate public key based on wallet type
  const { solBitzNfts } = useNftsStore();
  const { artistLookupEverything } = useAppStore();
  const { updateMyAiRemixRawTracks } = useAccountStore();
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();

  const [bountyBitzSumGlobalMapping, setBountyBitzSumGlobalMapping] = useState<BountyBitzSumMapping>({});
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [newLaunchesData, setNewLaunchesData] = useState<AiRemixLaunch[]>([]);
  const [graduatedLaunchesData, setGraduatedLaunchesData] = useState<AiRemixLaunch[]>([]);
  const [publishedLaunchesData, setPublishedLaunchesData] = useState<AiRemixLaunch[]>([]);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);
  const [virtualAiRemixAlbum, setVirtualAiRemixAlbum] = useState<Album | null>(null);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [focusedLaunchId, setFocusedLaunchId] = useState<string | null>(null);
  const [launchMusicMemeModalOpen, setLaunchMusicMemeModalOpen] = useState<boolean>(false);
  const [expandedLaunchIds, setExpandedLaunchIds] = useState<Set<string>>(new Set()); // Add state to track which launch cards have their "other versions" expanded
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
    isRemixVoteMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined, isRemixVoteMode: undefined }); // give bits to a bounty (power up or like)
  const [myJobsPayments, setMyJobsPayments] = useState<
    Array<{
      amount: string;
      payer: string;
      task: string;
      createdOn: number;
      tx: string;
      paymentStatus?: string;
    }>
  >([]);
  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);
  const [showPublicVotingAreaUI, setShowPublicVotingAreaUI] = useState(false); // my workspace vs public voting area view (UI throttled)
  const [showPublicVotingArea, setShowPublicVotingArea] = useState(false); // my workspace vs public voting area view
  const [showAllMusicUI, setShowAllMusicUI] = useState(false); // if it's public voting, show my music only vs all music view (UI throttled)
  const [showAllMusic, setShowAllMusic] = useState<boolean | null>(null); // if it's public voting, show my music only vs all music view
  const [switchChangeThrottled, setSwitchChangeThrottled] = useState(false);
  const [shouldRefreshData, setShouldRefreshData] = useState(false); // Add new state to track pending refreshes
  const [checkingIfNewJobsHaveCompleted, setCheckingIfNewJobsHaveCompleted] = useState(false);
  const [appViewLoaded, setAppViewLoaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debounced function to update business logic state after 2 seconds of inactivity
  const debouncedSetShowAllMusic = useCallback(
    debounce((value: boolean) => {
      setShowAllMusic(value);
      setSwitchChangeThrottled(false);
    }, 2000),
    []
  );

  const debouncedSetShowPublicVotingArea = useCallback(
    debounce((value: boolean) => {
      setShowPublicVotingArea(value);
      setSwitchChangeThrottled(false);
    }, 2000),
    []
  );

  // Handle switch change - update UI immediately, debounce business logic
  const handleSwitchChange = useCallback(
    (value: boolean) => {
      setShowAllMusicUI(value); // Update UI immediately
      setSwitchChangeThrottled(true);
      debouncedSetShowAllMusic(value); // Debounce business logic
    },
    [debouncedSetShowAllMusic]
  );

  const handleSwitchChangeWorkspace = useCallback(
    (value: boolean) => {
      setShowPublicVotingAreaUI(value); // Update UI immediately
      setSwitchChangeThrottled(true);
      debouncedSetShowPublicVotingArea(value); // Debounce business logic
    },
    [debouncedSetShowPublicVotingArea]
  );

  // Add useCallback for the debounced refresh function (to move new items to graduated if votes are enough)
  const debouncedRefreshData = useCallback(
    debounce(async () => {
      try {
        const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol || null });
        setNewLaunchesData(responseA);
        const responseB = await getRemixLaunchesViaAPI({ launchStatus: "graduated", addressSol: addressSol || null });
        setGraduatedLaunchesData(responseB);

        if ((responseA.length > 0 || responseB.length > 0) && addressSol) {
          updateMyAiRemixRawTracks(mergeRawAiRemixTracks(responseA, responseB, []));
        }
      } catch (error) {
        console.error("Error refreshing graduated data:", error);
      }
      setShouldRefreshData(false);
    }, 3000), // 3 second delay
    []
  );

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const params = new URLSearchParams(window.location.search);
    const launchId = params.get("launchId");

    if (launchId) {
      setFocusedLaunchId(launchId);
      // Remove focus after 10 seconds
      setTimeout(() => setFocusedLaunchId(null), 10000);
    }
  }, []);

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

      if (newJobsInterval) {
        clearInterval(newJobsInterval);
      }
    };
  }, []); // Empty dependency array since this only runs on unmount

  // Add effect to handle the refresh
  useEffect(() => {
    if (shouldRefreshData) {
      debouncedRefreshData();
    }
  }, [shouldRefreshData]);

  useEffect(() => {
    if (showAllMusic === null) return;

    if (showAllMusic) {
      fetchDataAllSwimLaneData({ showMyMusicOnly: false });
    } else {
      fetchDataAllSwimLaneData({ showMyMusicOnly: true });
    }
  }, [showAllMusic]);

  // Need to improve the performance of this @TODO
  // useEffect(() => {
  //   if (!showPublicVotingAreaUI || !showAllMusicUI) return;
  //   if (newLaunchesData.length > 0 || graduatedLaunchesData.length > 0) {
  //     queueBitzPowerUpsAndLikesForAllOwnedAlbums();
  //   }
  // }, [newLaunchesData, graduatedLaunchesData, showPublicVotingAreaUI, showAllMusicUI]);

  useEffect(() => {
    if (myJobsPayments.length > 0 && addressSol) {
      // if there are some jobs that are "new", then every 60 seconds, we need to recheck if they are "completed"
      newJobsInterval = setInterval(async () => {
        setCheckingIfNewJobsHaveCompleted(true);

        if (myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0) {
          const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol });
          setNewLaunchesData(responseA);

          if (responseA.length > 0 && addressSol) {
            const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, [], []);
            updateMyAiRemixRawTracks(allMyRemixes); // is this an issue? as there may be other tracks prev loaded from other swimlanes and this may override them

            const { allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);

            // merge in any new items from allMyRemixesAsMusicTracks into virtualAiRemixAlbumTracks
            // note that there will be onther tracks prev loaded from other swimlanes, so we should not replace the existing tracks
            setVirtualAiRemixAlbumTracks([...virtualAiRemixAlbumTracks, ...allMyRemixesAsMusicTracks]);
          }

          // dont clear and reload here as it break app bootup logic
          handleRefreshJobs();
        } else {
          if (newJobsInterval) {
            clearInterval(newJobsInterval);
          }
        }

        await sleep(3);
        setCheckingIfNewJobsHaveCompleted(false);
      }, 15000);
      return () => {
        if (newJobsInterval) {
          clearInterval(newJobsInterval);
        }
      };
    }
  }, [myJobsPayments, addressSol]);

  useEffect(() => {
    if (isLoadingSolanaWallet) return;

    if (addressSol) {
      setShowPublicVotingArea(false);
      setShowPublicVotingAreaUI(false);

      setShowAllMusic(false);
      setShowAllMusicUI(false);

      setAppViewLoaded(true);
    } else {
      setShowPublicVotingArea(true);
      setShowPublicVotingAreaUI(true);
      setShowAllMusic(true);
      setShowAllMusicUI(true);

      setAppViewLoaded(true);
    }
  }, [addressSol, isLoadingSolanaWallet]);

  const fetchDataAllSwimLaneData = async ({ showMyMusicOnly }: { showMyMusicOnly: boolean }) => {
    console.log("_____ fetchDataAllSwimLaneData called with showMyMusicOnly:", showMyMusicOnly);
    try {
      setIsDataLoading(true);
      setNewLaunchesData([]);
      setGraduatedLaunchesData([]);
      setPublishedLaunchesData([]);
      setVirtualAiRemixAlbumTracks([]);
      setVirtualAiRemixAlbum(null);

      const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol && showMyMusicOnly ? addressSol : null });
      setNewLaunchesData(responseA);
      const responseB = await getRemixLaunchesViaAPI({ launchStatus: "graduated", addressSol: addressSol && showMyMusicOnly ? addressSol : null });
      setGraduatedLaunchesData(responseB);
      const responseC = await getRemixLaunchesViaAPI({ launchStatus: "published", addressSol: addressSol && showMyMusicOnly ? addressSol : null });
      setPublishedLaunchesData(responseC);

      // Fetch payment logs if user is logged in
      if (showMyMusicOnly && addressSol) {
        const responseD = await getPaymentLogsViaAPI({ addressSol, byTaskFilter: "remix" });
        setMyJobsPayments(responseD);

        if (responseA.length > 0 || responseB.length > 0 || responseC.length > 0) {
          const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, responseB, responseC);

          const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);
          setVirtualAiRemixAlbum(virtualAlbum);
          setVirtualAiRemixAlbumTracks(allMyRemixesAsMusicTracks);
          updateMyAiRemixRawTracks(allMyRemixes);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleRefreshJobs = async (clearAndRefresh: boolean = false) => {
    // Fetch payment logs if user is logged in
    if (addressSol) {
      if (clearAndRefresh) {
        setMyJobsPayments([]);
      }
      await sleep(1);
      const responseD = await getPaymentLogsViaAPI({ addressSol, byTaskFilter: "remix" });
      setMyJobsPayments(responseD);
    }
  };

  async function queueBitzPowerUpsAndLikesForAllOwnedAlbums() {
    const initialMappingOfVotesForAllTrackBountyIds = [...newLaunchesData, ...graduatedLaunchesData].flatMap((launch: any) =>
      launch.versions.map((version: any) => ({
        bountyId: version.bountyId,
        creatorWallet: launch.remixedBy,
      }))
    );

    // we throttle this so that we don't overwhelm the server and also, the local state updates don't fire if they are all too close together
    for (let i = 0; i < initialMappingOfVotesForAllTrackBountyIds.length; i++) {
      const trackBounty = initialMappingOfVotesForAllTrackBountyIds[i];
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

  const formatAddress = (address: string) => {
    if (address.length < 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const extractArtistAndAlbumMetaFromAlId = (alId: string) => {
    const albumId = alId.split("-")[0];
    const artistId = albumId.split("_")[0];
    const artist: Artist = artistLookupEverything[artistId] as Artist;
    return { artistId, albumId, artistMeta: artist };
  };

  const getVotesNeededText = (votesNeeded: number) => {
    return `${votesNeeded} more XP needed`;
  };

  // Helper function to toggle expanded state for showing other versions
  const toggleExpandedVersions = (launchId: string) => {
    setExpandedLaunchIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(launchId)) {
        newSet.delete(launchId);
      } else {
        newSet.add(launchId);
      }
      return newSet;
    });
  };

  const LaunchCard = ({ item, type, idx }: { item: AiRemixLaunch; type: string; idx: number }) => {
    const isFocused = focusedLaunchId === item.launchId;
    // Helper function to separate graduated and non-graduated versions
    const getVersionGroups = () => {
      const graduatedVersions: { version: AiRemixTrackVersion; index: number }[] = [];
      const nonGraduatedVersions: { version: AiRemixTrackVersion; index: number }[] = [];

      item.versions.forEach((version, index) => {
        const hasEnoughVotes = hasGraduated({
          launchId: item.launchId,
          createdOn: item.createdOn,
          bountyId: version.bountyId,
          skipAutoStatusChangeViaAPI: type === "graduated",
        });

        if (hasEnoughVotes) {
          graduatedVersions.push({ version, index });
        } else {
          nonGraduatedVersions.push({ version, index });
        }
      });

      return { graduatedVersions, nonGraduatedVersions };
    };

    return (
      <div
        className={`bg-[#1A1A1A] rounded-lg p-4 mb-4 ${
          isFocused ? "animate-shake bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-2 border-yellow-500" : ""
        }`}>
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-[100px] h-[auto]">
              <img
                src={fixImgIconForRemixes(item.image)}
                alt={item?.promptParams?.songTitle || "LEGACY"}
                className="w-full h-full m-auto md:m-0 rounded-lg object-cover"
              />
            </div>
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{idx + 1}.</span>
                <h3 className="!text-lg font-semibold">{item?.promptParams?.songTitle || "LEGACY"}</h3>
              </div>
              <p className="text-xs text-gray-400">
                Based on music by{" "}
                <a
                  href={`/?artist=${extractArtistAndAlbumMetaFromAlId(item?.promptParams?.refTrack_alId || "").artistMeta?.slug}~${extractArtistAndAlbumMetaFromAlId(item?.promptParams?.refTrack_alId || "").albumId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-300 hover:underline">
                  {extractArtistAndAlbumMetaFromAlId(item?.promptParams?.refTrack_alId || "").artistMeta?.name}
                </a>
                , remixed by{" "}
                {item.remixedBy === addressSol ? (
                  <span className="text-yellow-300 mr-1">You</span>
                ) : (
                  <a
                    href={`https://solscan.io/account/${item.remixedBy}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-300 hover:underline mr-1">
                    {formatAddress(item.remixedBy)}
                  </a>
                )}
                on {new Date(item.createdOn).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-600">Id: {item.launchId}</p>
            </div>
          </div>

          <div className="mt-4">
            {type === "new" && (
              <>
                <div className="flex flex-col mt-2">
                  <div className="text-[10px] text-gray-400">Vote with XP to get this remix published</div>
                  {item.versions.map((version, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="votes-progress flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-full bg-gray-700 h-1 rounded-full">
                          <div
                            className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, ((bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0) / VOTES_TO_GRADUATE) * 100)}%`,
                            }}></div>
                        </div>
                        <span>
                          {hasGraduated({ launchId: item.launchId, createdOn: item.createdOn, bountyId: version.bountyId })
                            ? "Graduated!"
                            : getVotesNeededText(VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0))}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <div className="relative">
                          <button
                            className={`flex items-center gap-2 ${
                              currentPlayingId && currentPlayingId !== `${item.launchId}-${index}` ? "opacity-50 cursor-not-allowed" : "text-yellow-300"
                            }`}
                            disabled={currentPlayingId ? currentPlayingId !== `${item.launchId}-${index}` : false}
                            onClick={() => handlePlay(version.streamUrl, `${item.launchId}-${index}`)}>
                            {currentPlayingId === `${item.launchId}-${index}` ? (
                              <>
                                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                                <span className="ml-2">{currentTime} - Stop</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" style={{ animation: "playPulse 2s ease-in-out infinite" }} />
                                <span className="ml-2">Play</span>
                              </>
                            )}
                          </button>
                          {isFocused && (
                            <div className="absolute -bottom-16 left-1/2">
                              <Pointer className="w-12 h-12 text-yellow-300 animate-point" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-grow ml-4">
                          <div className="flex items-center gap-2">
                            {!DISABLE_BITZ_FEATURES && (
                              <div className="albumLikes md:w-[135px] flex flex-col items-center">
                                <div
                                  className={`${addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                                  onClick={() => {
                                    if (addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined") {
                                      handleSendBitzForMusicBounty({
                                        creatorIcon: fixImgIconForRemixes(item.image),
                                        creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                        giveBitzToWho: item.remixedBy,
                                        giveBitzToCampaignId: version.bountyId,
                                        isRemixVoteMode: true,
                                      });
                                    }
                                  }}>
                                  {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                    <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                                  ) : (
                                    <div
                                      className="p-5 md:p-0 flex items-center gap-2"
                                      title={addressSol ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                                      onClick={() => {
                                        if (addressSol) {
                                          handleSendBitzForMusicBounty({
                                            creatorIcon: fixImgIconForRemixes(item.image),
                                            creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                            giveBitzToWho: item.remixedBy,
                                            giveBitzToCampaignId: version.bountyId,
                                            isRemixVoteMode: true,
                                          });
                                        }
                                      }}>
                                      {bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum}
                                      <Rocket className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {type === "graduated" && (
              <>
                <div className="flex flex-col mt-2">
                  <div className="text-[10px] text-gray-400">Vote with more XP to get it published faster!</div>
                  {(() => {
                    const { graduatedVersions, nonGraduatedVersions } = getVersionGroups();
                    const isExpanded = expandedLaunchIds.has(item.launchId);

                    return (
                      <>
                        {/* Show graduated versions first */}
                        {graduatedVersions.map(({ version, index }) => (
                          <div key={index} className="flex flex-col gap-2">
                            <div className="votes-progress flex items-center gap-2 text-xs text-gray-400">
                              <div className="w-full bg-gray-700 h-1 rounded-full">
                                <div
                                  className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(100, ((bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0) / VOTES_TO_GRADUATE) * 100)}%`,
                                  }}></div>
                              </div>
                              <span>
                                {hasGraduated({
                                  launchId: item.launchId,
                                  createdOn: item.createdOn,
                                  bountyId: version.bountyId,
                                  skipAutoStatusChangeViaAPI: true,
                                })
                                  ? "Will be published..."
                                  : getVotesNeededText(VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0))}
                              </span>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                              <div className="relative">
                                <button
                                  className={`flex items-center gap-2 ${
                                    currentPlayingId && currentPlayingId !== `${item.launchId}-${index}` ? "opacity-50 cursor-not-allowed" : "text-yellow-300"
                                  }`}
                                  disabled={currentPlayingId ? currentPlayingId !== `${item.launchId}-${index}` : false}
                                  onClick={() => handlePlay(version.streamUrl, `${item.launchId}-${index}`)}>
                                  {currentPlayingId === `${item.launchId}-${index}` ? (
                                    <>
                                      {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                                      <span className="ml-2">{currentTime} - Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" style={{ animation: "playPulse 2s ease-in-out infinite" }} />
                                      <span className="ml-2">Play</span>
                                    </>
                                  )}
                                </button>
                                {isFocused && (
                                  <div className="absolute -bottom-16 left-1/2">
                                    <Pointer className="w-12 h-12 text-yellow-300 animate-point" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 flex-grow ml-4">
                                <div className="flex items-center gap-2">
                                  {!DISABLE_BITZ_FEATURES && (
                                    <div className="albumLikes md:w-[135px] flex flex-col items-center">
                                      <div
                                        className={`${addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                                        onClick={() => {
                                          if (addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined") {
                                            handleSendBitzForMusicBounty({
                                              creatorIcon: fixImgIconForRemixes(item.image),
                                              creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                              giveBitzToWho: item.remixedBy,
                                              giveBitzToCampaignId: version.bountyId,
                                              isRemixVoteMode: true,
                                            });
                                          }
                                        }}>
                                        {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                          <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                                        ) : (
                                          <div
                                            className="p-5 md:p-0 flex items-center gap-2"
                                            title={addressSol ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                                            onClick={() => {
                                              if (addressSol) {
                                                handleSendBitzForMusicBounty({
                                                  creatorIcon: fixImgIconForRemixes(item.image),
                                                  creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                                  giveBitzToWho: item.remixedBy,
                                                  giveBitzToCampaignId: version.bountyId,
                                                  isRemixVoteMode: true,
                                                });
                                              }
                                            }}>
                                            {bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum}
                                            <Rocket className="w-4 h-4" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show "other versions" link if there are non-graduated versions */}
                        {nonGraduatedVersions.length > 0 && (
                          <div className="mt-2">
                            <button onClick={() => toggleExpandedVersions(item.launchId)} className="text-yellow-300 hover:text-yellow-200 text-sm underline">
                              {isExpanded ? "Hide" : "Show"} other versions of this track ({nonGraduatedVersions.length})
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {nonGraduatedVersions.map(({ version, index }) => (
                                  <div key={index} className="flex flex-col gap-2 pl-4 border-l-2 border-gray-600">
                                    <div className="votes-progress flex items-center gap-2 text-xs text-gray-400">
                                      <div className="w-full bg-gray-700 h-1 rounded-full">
                                        <div
                                          className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                                          style={{
                                            width: `${Math.min(100, ((bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0) / VOTES_TO_GRADUATE) * 100)}%`,
                                          }}></div>
                                      </div>
                                      <span>
                                        {hasGraduated({
                                          launchId: item.launchId,
                                          createdOn: item.createdOn,
                                          bountyId: version.bountyId,
                                          skipAutoStatusChangeViaAPI: true,
                                        })
                                          ? "This is being published..."
                                          : getVotesNeededText(VOTES_TO_GRADUATE - (bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum || 0))}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                                      <div className="relative">
                                        <button
                                          className={`flex items-center gap-2 ${
                                            currentPlayingId && currentPlayingId !== `${item.launchId}-${index}`
                                              ? "opacity-50 cursor-not-allowed"
                                              : "text-yellow-300"
                                          }`}
                                          disabled={currentPlayingId ? currentPlayingId !== `${item.launchId}-${index}` : false}
                                          onClick={() => handlePlay(version.streamUrl, `${item.launchId}-${index}`)}>
                                          {currentPlayingId === `${item.launchId}-${index}` ? (
                                            <>
                                              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                                              <span className="ml-2">{currentTime} - Stop</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-4 h-4" style={{ animation: "playPulse 2s ease-in-out infinite" }} />
                                              <span className="ml-2">Play</span>
                                            </>
                                          )}
                                        </button>
                                        {isFocused && (
                                          <div className="absolute -bottom-16 left-1/2">
                                            <Pointer className="w-12 h-12 text-yellow-300 animate-point" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2 flex-grow ml-4">
                                        <div className="flex items-center gap-2">
                                          {!DISABLE_BITZ_FEATURES && (
                                            <div className="albumLikes md:w-[135px] flex flex-col items-center">
                                              <div
                                                className={`${addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                                                onClick={() => {
                                                  if (addressSol && typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum !== "undefined") {
                                                    handleSendBitzForMusicBounty({
                                                      creatorIcon: fixImgIconForRemixes(item.image),
                                                      creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                                      giveBitzToWho: item.remixedBy,
                                                      giveBitzToCampaignId: version.bountyId,
                                                      isRemixVoteMode: true,
                                                    });
                                                  }
                                                }}>
                                                {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                                  <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                                                ) : (
                                                  <div
                                                    className="p-5 md:p-0 flex items-center gap-2"
                                                    title={addressSol ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                                                    onClick={() => {
                                                      if (addressSol) {
                                                        handleSendBitzForMusicBounty({
                                                          creatorIcon: fixImgIconForRemixes(item.image),
                                                          creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                                          giveBitzToWho: item.remixedBy,
                                                          giveBitzToCampaignId: version.bountyId,
                                                          isRemixVoteMode: true,
                                                        });
                                                      }
                                                    }}>
                                                    {bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum}
                                                    <Rocket className="w-4 h-4" />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {type === "published" && (
              <div className="mt-2 flex items-center justify-between">
                <div className="relative">
                  <button
                    className={`flex items-center gap-2 ${
                      currentPlayingId && currentPlayingId !== `published-${item.launchId}` ? "opacity-50 cursor-not-allowed" : "text-yellow-300"
                    }`}
                    disabled={currentPlayingId ? currentPlayingId !== `published-${item.launchId}` : false}
                    onClick={() => handlePlay(item.graduatedStreamUrl || item.versions[0].streamUrl, `published-${item.launchId}`)}>
                    {currentPlayingId === `published-${item.launchId}` ? (
                      <>
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                        <span className="ml-2">{currentTime} - Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" style={{ animation: "playPulse 2s ease-in-out infinite" }} />
                        <span className="ml-2">Play</span>
                      </>
                    )}
                  </button>
                  <Button
                    className="bg-gradient-to-r from-yellow-300 to-orange-500 hover:text-black text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity mt-2 text-sm"
                    variant="outline"
                    onClick={() => {
                      const publishedAlbumSlug = item.versions.find(
                        (version) => typeof version.deepLinkSlugToTrackInAlbum === "string"
                      )?.deepLinkSlugToTrackInAlbum;
                      if (publishedAlbumSlug) {
                        window.open(`?section=artists&artist=${publishedAlbumSlug}`, "_blank");
                      }
                    }}>
                    View Published Album
                  </Button>
                  {isFocused && (
                    <div className="absolute -bottom-16 left-1/2">
                      <Pointer className="w-12 h-12 text-yellow-300 animate-point" />
                    </div>
                  )}
                </div>
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
    isRemixVoteMode,
  }: {
    creatorIcon: string;
    creatorName: string;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
    isRemixVoteMode?: boolean;
  }) {
    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      giveBitzToWho,
      giveBitzToCampaignId,
      isLikeMode,
      isRemixVoteMode,
    });
  }

  // Modify the hasGraduated function
  const hasGraduated = ({
    launchId,
    createdOn,
    bountyId,
    skipAutoStatusChangeViaAPI,
  }: {
    launchId: string;
    createdOn: number;
    bountyId: string;
    skipAutoStatusChangeViaAPI?: boolean;
  }) => {
    const currentVotes = bountyBitzSumGlobalMapping[bountyId]?.bitsSum || 0;
    const tokenGraduated = VOTES_TO_GRADUATE - currentVotes <= 0;

    if (tokenGraduated && !skipAutoStatusChangeViaAPI) {
      // Stop any playing music and reset playback state
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
      setCurrentPlayingId(null);
      setCurrentTime("0:00");

      // Make the API call
      try {
        logStatusChangeToAPI({
          launchId,
          createdOn,
          newStatus: "graduated",
          bountyId,
        });

        // Trigger a refresh of the graduated data
        setShouldRefreshData(true);
      } catch (error) {
        toast.error("Error with status change to graduated");
      }
    }

    return tokenGraduated;
  };

  const GenerateMusicMemeButton = () => {
    return (
      <Button
        disabled={DISABLE_REMIX_LAUNCH_BUTTON}
        className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%] transition ease-in-out delay-50 duration-100 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-lg text-center p-2 md:p-4 rounded-lg h-[48px]"
        onClick={() => {
          if (!addressSol) {
            window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search)}`;
            return;
          } else {
            setLaunchMusicMemeModalOpen(true);
          }
        }}>
        <div>
          <div className="flex items-center justify-center">
            <FileMusicIcon className="w-6 h-6 mr-2" />
            {DISABLE_REMIX_LAUNCH_BUTTON ? <div>Create! (Offline For Now!)</div> : !addressSol ? <div>Login to Create!</div> : <div>Create!</div>}
          </div>
        </div>
      </Button>
    );
  };

  return (
    <>
      <div className="flex flex-col min-h-screen w-full mt-3">
        <div className="flex flex-col md:flex-row items-center justify-between mb-5">
          <div>
            <h1 className="!text-2xl font-semibold text-center md:text-left">
              <span className="text-2xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                Sigma AI REMiX <span className="text-xs text-gray-500">Beta</span>
              </span>
            </h1>
            <p className="text-sm text-gray-500">Create & Publish IP-Safe AI Remixes</p>
          </div>

          <div className="flex flex-col md:flex-row md:gap-4 gap-2">
            {addressSol && showPublicVotingArea && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-300">My Music Only</span>
                <Switch checked={showAllMusicUI} onCheckedChange={handleSwitchChange} className="" />
                <span className="text-sm font-medium text-gray-300">All Music</span>
              </div>
            )}
            {addressSol && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-300">My Workspace</span>
                <Switch checked={showPublicVotingAreaUI} onCheckedChange={handleSwitchChangeWorkspace} className="" />
                <span className="text-sm font-medium text-gray-300">Public Voting Area</span>
              </div>
            )}
            {myJobsPayments.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  className="bg-gradient-to-r text-sm text-center p-2 md:p-4 rounded-lg h-[50px]"
                  onClick={() => setIsJobsModalOpen(true)}>
                  Your Remix Jobs
                </Button>
                {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-900 text-yellow-300 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length}
                  </div>
                )}
              </div>
            )}
            <GenerateMusicMemeButton />
          </div>
        </div>

        {appViewLoaded ? (
          <div>
            {/* My Workspace */}
            {addressSol && !showPublicVotingArea && (
              <>
                {!switchChangeThrottled ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-2 w-full bgx-red-900">
                    {/* First Column - Launch Music Track */}
                    <div className="">
                      <LaunchMusicTrack
                        renderInline={true}
                        onCloseModal={(refreshPaymentLogs?: boolean) => {
                          if (refreshPaymentLogs) {
                            handleRefreshJobs();
                          }
                        }}
                        navigateToDeepAppView={(e: any) => {
                          // Handle navigation if needed
                          console.log("Navigate to deep app view:", e);
                        }}
                      />
                    </div>

                    {/* Second Column - My Tracks */}
                    <div className="flex flex-col bg-white/5 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="!text-lg font-semibold">My Workspace</h2>
                        <div
                          className={`cursor-pointer flex items-center gap-2 text-sm mr-5`}
                          onClick={() => {
                            fetchDataAllSwimLaneData({ showMyMusicOnly: true });
                          }}>
                          <>
                            <RefreshCcw className="w-5 h-5" />
                            Refresh
                          </>
                        </div>
                      </div>

                      {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0 && (
                        <div className="flex flex-col items-center py-2 bg-yellow-900 text-yellow-300 rounded-md mt-2">
                          <p className="text-sm text-center m-auto">
                            <span className="mr-1">
                              {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length}
                            </span>{" "}
                            Remix Jobs Pending{" "}
                            {checkingIfNewJobsHaveCompleted && (
                              <span className="text-yellow-300 flex items-center justify-center ml-2 mt-2">
                                <Loader className="w-4 h-4 animate-spin mr-2" /> rechecking...
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      <>
                        {virtualAiRemixAlbum && virtualAiRemixAlbumTracks.length > 0 ? (
                          <div className="mx-auto md:m-[initial] p-3">
                            <TrackList
                              album={virtualAiRemixAlbum}
                              artistId={"virtual-artist-id-" + displayPublicKey?.toString()}
                              artistName={""}
                              virtualTrackList={virtualAiRemixAlbumTracks}
                              onBack={() => {
                                onCloseMusicPlayer();
                              }}
                              onPlayTrack={(album, jumpToPlaylistTrackIndex) => {
                                updateAssetPlayIsQueued(true);
                                onCloseMusicPlayer();

                                setTimeout(() => {
                                  viewSolData(
                                    0,
                                    {
                                      artistId: "virtual-artist-id-" + displayPublicKey?.toString(),
                                      albumId: virtualAiRemixAlbum.albumId,
                                      jumpToPlaylistTrackIndex: jumpToPlaylistTrackIndex,
                                    },
                                    false,
                                    virtualAiRemixAlbumTracks
                                  );

                                  updateAssetPlayIsQueued(false);
                                }, 5000);
                              }}
                              checkOwnershipOfMusicAsset={() => 0}
                              trackPlayIsQueued={false}
                              assetPlayIsQueued={false}
                              condensedView={true}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Loader className="w-10 h-10 animate-spin text-yellow-500" />
                          </div>
                        )}
                      </>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 h-[60vh]">
                      <Loader className="w-10 h-10 animate-spin text-yellow-500" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Public Voting Area */}
            {showPublicVotingArea && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* New */}
                <div className="flex flex-col bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="!text-lg font-semibold">{!showAllMusicUI ? "My Remixes" : "New Remixes - Vote Now!"}</h2>
                    <button
                      onClick={() =>
                        toast(
                          (t) => (
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <span className="text-yellow-300 font-bold text-lg">You can be a Remix Artist!</span>
                                <p>
                                  Buy a commercial IP license from a real-world artist and use Sigma's AI model to generate an IP-safe remix of the original
                                  track.
                                </p>
                                <p>You will get one remixed track and they will appear in this list for everyone to listen to.</p>
                                <p>People can use their XP to vote on each version. They can vote for both as well if they like both versions.</p>
                                <p>
                                  Once at least {VOTES_TO_GRADUATE} votes have been cast on a track, it becomes a candidate that gets included in Sigma Music's
                                  official catalog.
                                </p>
                                <p>
                                  If you don't receive enough votes, then not to worry, your track will still be available on your artist page for the public to
                                  listen to and you also get to keep it. But you will not be able to sell it or commercialize it.
                                </p>
                                <p>
                                  Once music is published in the official catalog, it can be bought by users or be available as part of the subscription
                                  service.
                                </p>
                                <p>As you are the Remix Artist who created the track, you will get a share of the revenue from the track!</p>
                                <p>The original artist will also get a share of the revenue from the new remixed track!</p>
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
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0 && (
                      <div className="flex flex-col items-center py-2 bg-yellow-900 text-yellow-300 rounded-md">
                        <p className="text-sm text-center m-auto">
                          <span className="mr-1">
                            {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length}
                          </span>{" "}
                          Remix Jobs Pending{" "}
                          {checkingIfNewJobsHaveCompleted && (
                            <span className="text-yellow-300 flex items-center justify-center ml-2 mt-2">
                              <Loader className="w-4 h-4 animate-spin mr-2" /> rechecking...
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {isDataLoading || switchChangeThrottled ? (
                      <>
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                      </>
                    ) : newLaunchesData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <p className="text-center mb-4">{!showAllMusicUI ? "No remixes created by you yet!" : "No new remixes yet!"}</p>

                        <GenerateMusicMemeButton />
                      </div>
                    ) : (
                      newLaunchesData.map((item: AiRemixLaunch, idx: number) => <LaunchCard key={idx} idx={idx} item={item} type="new" />)
                    )}
                  </div>
                </div>

                {/* Graduated */}
                <div className="flex flex-col bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="!text-lg font-semibold">{!showAllMusicUI ? "My Remixes Waiting to be Published" : "Remixes Waiting to be Published"}</h2>
                    <button
                      onClick={() =>
                        toast(
                          (t) => (
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <p className="mb-4">
                                  <strong className="text-yellow-300">The Best Remixes!</strong> New music tracks that have received enough votes to be
                                  published will appear here.
                                </p>
                                <p className="mb-4">
                                  The most voted tracks will be featured in this list and the best tracks will be selected and added to the official Sigma Music
                                  catalog.
                                </p>
                                <p>
                                  Once included in the official catalog, the track will be available for purchase (as part of a remix album) by users or be
                                  available as part of the subscription service.
                                </p>
                                <p>As you are the Remix Artist who created the track, you will get a share of the revenue from the track!</p>
                                <p>The original artist will also get a share of the revenue from the new remixed track!</p>
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
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {isDataLoading || switchChangeThrottled ? (
                      <>
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                      </>
                    ) : graduatedLaunchesData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <p className="text-center">{!showAllMusicUI ? "No remixes created by you have been voted in yet!" : "No remixes voted in yet!"}</p>
                      </div>
                    ) : (
                      graduatedLaunchesData.map((item: AiRemixLaunch, idx: number) => <LaunchCard key={idx} idx={idx} item={item} type="graduated" />)
                    )}
                  </div>
                </div>

                {/* Pump.fun Launches */}
                <div className="flex flex-col bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="!text-lg font-semibold">{!showAllMusicUI ? "My Music Live on Sigma Music" : "Live on Sigma Music"}</h2>
                    <button
                      onClick={() =>
                        toast(
                          (t) => (
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <p className="mb-4">
                                  <strong className="text-yellow-300">Published on Sigma Music:</strong> These tracks have been officially published on the
                                  Sigma Music platform.
                                </p>
                                <p className="mb-4">
                                  These tracks are available for purchase (as part of a remix album) by users or be available as part of the subscription
                                  service. If you are the remix artist you earn a share of the sales and if you are the original artist you also earn!
                                </p>
                                <p className="mb-4">These tracks also get featured and promoted on Sigma Music's social channels and our music apps.</p>
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
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {isDataLoading || switchChangeThrottled ? (
                      <>
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                      </>
                    ) : publishedLaunchesData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <p className="text-center">{!showAllMusicUI ? "No remixes created by you are published yet!" : "No remixes published yet!"}</p>
                      </div>
                    ) : (
                      publishedLaunchesData.map((item: AiRemixLaunch, idx: number) => <LaunchCard key={idx} idx={idx} item={item} type="published" />)
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 h-[60vh]">
              <Loader className="w-10 h-10 animate-spin text-yellow-500" />
            </div>
          </>
        )}

        {/* Send XP Power Up Modal */}
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
                  isRemixVoteMode: true,
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

        {/* Launch Music Track Modal */}
        <>
          {launchMusicMemeModalOpen && (
            <LaunchMusicTrack
              onCloseModal={(refreshPaymentLogs?: boolean) => {
                if (refreshPaymentLogs) {
                  handleRefreshJobs();
                }
                setLaunchMusicMemeModalOpen(false);
              }}
              navigateToDeepAppView={navigateToDeepAppView}
            />
          )}
        </>

        {/* Jobs Modal */}
        <JobsModal isOpen={isJobsModalOpen} onClose={() => setIsJobsModalOpen(false)} jobs={myJobsPayments} onRefresh={() => handleRefreshJobs(true)} />
      </div>
    </>
  );
};
