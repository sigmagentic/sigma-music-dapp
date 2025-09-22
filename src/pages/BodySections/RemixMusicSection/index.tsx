import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { Rocket, Info, Loader, Pause, Play, Pointer, RefreshCcw, FileMusicIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import { DISABLE_BITZ_FEATURES, DISABLE_REMIX_LAUNCH_BUTTON } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { Switch } from "libComponents/Switch";
import { BountyBitzSumMapping, AiRemixLaunch, AiRemixTrackVersion, MusicTrack, Album } from "libs/types";
import { Artist, AiRemixRawTrack } from "libs/types";
import {
  getPaymentLogsViaAPI,
  getRemixLaunchesViaAPI,
  logStatusChangeToAPI,
  mergeRawAiRemixTracks,
  sleep,
  mapRawAiRemixTracksToMusicTracks,
  getAlbumTracksFromDBViaAPI,
} from "libs/utils";
import { SendBitzPowerUp } from "pages/BodySections/HomeSection/SendBitzPowerUp";
import { updateBountyBitzSumGlobalMappingWindow } from "pages/BodySections/HomeSection/shared/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { LaunchAiMusicTrack } from "./LaunchAiMusicTrack";
import { routeNames } from "routes";
import { fixImgIconForRemixes, toastError, toastSuccess } from "libs/utils/ui";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { TrackList } from "pages/BodySections/HomeSection/components/TrackList";
import { useAudioPlayerStore } from "store/audioPlayer";
import { TrackListModal } from "pages/MUI/components/TrackListModal";
import { JobsModal } from "./JobsModal";
import { AlbumSelectorModal } from "./AlbumSelectorModal";
import { TrackRatingButtons } from "components/TrackRatingButtons";
import { useTrackVoting } from "hooks/useTrackVoting";

const VOTES_TO_GRADUATE = 5;

// Add this custom toast style near the top of the file after imports
const customInfoToastStyle = {
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

let newJobsInterval: NodeJS.Timeout | null = null;
let isFirstFetchOfJobsDone = false;

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
  const { artistLookupEverything } = useAppStore();
  const { updateMyAiRemixRawTracks, userArtistProfile } = useAccountStore();
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();

  const [bountyBitzSumGlobalMapping, setBountyBitzSumGlobalMapping] = useState<BountyBitzSumMapping>({});
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwimLaneDataLoading, setIsSwimLaneDataLoading] = useState(true);
  const [newLaunchesData, setNewLaunchesData] = useState<AiRemixLaunch[]>([]);
  const [publishedLaunchesData, setPublishedLaunchesData] = useState<AiRemixLaunch[]>([]);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);
  const [virtualAiRemixAlbumTracksLoading, setVirtualAiRemixAlbumTracksLoading] = useState(false);
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
  const [showPublicVotingAreaUI, setShowPublicVotingAreaUI] = useState(false); // false my workspace vs public voting area view (UI throttled)
  const [showPublicVotingArea, setShowPublicVotingArea] = useState(false); // false my workspace vs public voting area view
  const [showAllMusicUI, setShowAllMusicUI] = useState(false); // false if it's public voting, show my music only vs all music view (UI throttled)
  const [showAllMusic, setShowAllMusic] = useState<boolean | null>(null); //null if it's public voting, show my music only vs all music view
  const [switchChangeThrottled, setSwitchChangeThrottled] = useState(false);
  const [shouldRefreshSwimlaneDataOnGraduation, setShouldRefreshSwimlaneDataOnGraduation] = useState(false);
  const [checkingIfNewJobsHaveCompleted, setCheckingIfNewJobsHaveCompleted] = useState(false);
  const [weDetectedNewJobs, setWeDetectedNewJobs] = useState(false);
  const [appViewLoaded, setAppViewLoaded] = useState(false);
  const [isRemixAlertBannerVisible, setIsRemixAlertBannerVisible] = useState(true);

  // add track to album state params (from My Workspace)
  const [showEditTrackModal, setShowEditTrackModal] = useState<boolean>(false);
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<MusicTrack[]>([]);
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState<string>("");
  const [selectedAlbumImg, setSelectedAlbumImg] = useState<string>("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isLoadingTracksInSelectedAlbum, setIsLoadingTracksInSelectedAlbum] = useState(false);
  const [trackToAddToAlbum, setTrackToAddToAlbum] = useState<MusicTrack | null>(null);

  // Calculate bounty IDs for voting system - memoized to prevent re-render loops
  const bountyIds = useMemo(
    () => [
      ...newLaunchesData.flatMap((launch) => launch.versions.map((v) => v.bountyId)),
      ...publishedLaunchesData.flatMap((launch) => launch.versions.map((v) => v.bountyId)),
    ],
    [newLaunchesData, publishedLaunchesData]
  );

  // Rating system state - tracks which specific votes user has made to prevent spam
  const { userVotedOptions, setUserVotedOptions } = useTrackVoting({ bountyIds });

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

  // Add useCallback for the debounced refresh function (to move new items to graduated if votes are enough)
  const debouncedRefreshData = useCallback(
    debounce(async () => {
      try {
        setIsSwimLaneDataLoading(true);

        console.log("___ calgetRemixLaunchesViaAPI A");
        const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol || null });
        setNewLaunchesData(responseA);

        // if ((responseA.length > 0 || responseB.length > 0) && addressSol) {
        if (responseA.length > 0 && addressSol) {
          setVirtualAiRemixAlbumTracksLoading(true);
          setVirtualAiRemixAlbumTracks([]); // only clear this if we got track (we should always do -- but just in case)

          // take the new launches, and prev fetched graduated and published launches, and merge them together
          const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, [], publishedLaunchesData);
          const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);

          // it may already have been set (i.e. user had no tracks and then added one vs there are already tracks), so dont reset it
          if (!virtualAiRemixAlbum) {
            setVirtualAiRemixAlbum(virtualAlbum);
          }

          setVirtualAiRemixAlbumTracks([...allMyRemixesAsMusicTracks]);
          updateMyAiRemixRawTracks(allMyRemixes);
        }
      } catch (error) {
        console.error("Error refreshing graduated data:", error);
      } finally {
        setIsSwimLaneDataLoading(false);
        setVirtualAiRemixAlbumTracksLoading(false);
      }

      setShouldRefreshSwimlaneDataOnGraduation(false);
    }, 3000), // 3 second delay
    []
  );

  // Handle switch change - update UI immediately, debounce business logic
  const handleSwitchChangePublicVoting = useCallback(
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
    if (shouldRefreshSwimlaneDataOnGraduation) {
      debouncedRefreshData();
    }
  }, [shouldRefreshSwimlaneDataOnGraduation]);

  useEffect(() => {
    if (showAllMusic === null) return;

    console.log("___ fetchDataAllSwimLaneData showAllMusic", showAllMusic);

    if (showAllMusic) {
      fetchDataAllSwimLaneData({ showMyMusicOnly: false });
    } else {
      fetchDataAllSwimLaneData({ showMyMusicOnly: true });
    }
  }, [showAllMusic]);

  useEffect(() => {
    if (isLoadingSolanaWallet) return;

    if (addressSol) {
      setShowPublicVotingArea(false);
      setShowPublicVotingAreaUI(false);

      console.log("___ setShowAllMusic(false) call");
      setShowAllMusic(false);
      setShowAllMusicUI(false);

      setAppViewLoaded(true);
    } else {
      setShowPublicVotingArea(true);
      setShowPublicVotingAreaUI(true);
      console.log("___ setShowAllMusic(true) call");
      setShowAllMusic(true);
      setShowAllMusicUI(true);

      setAppViewLoaded(true);
    }
  }, [addressSol, isLoadingSolanaWallet]);

  // Use a interval to monitor the status of new jobs and refresh data if needed
  useEffect(() => {
    if (myJobsPayments.length > 0) {
      if (!isFirstFetchOfJobsDone) {
        isFirstFetchOfJobsDone = true;
        return;
      }

      console.log("Pending jobs monitor ____ Start");
      // if there are some jobs that are "new", then every 60 seconds, we need to recheck if they are "completed"
      newJobsInterval = setInterval(async () => {
        console.log("Pending jobs monitor ____ Interval A");

        setCheckingIfNewJobsHaveCompleted(true);

        if (myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0) {
          console.log("Pending jobs monitor ____ Interval B -- Pending jobs found!");

          // dont clear and reload here as it break app bootup logic
          // ... there are some pending jobs, so lets get them again to cechk if their are completed
          handleRefreshJobs();
          setWeDetectedNewJobs(true); // this is so we can show in UI that there is some new jobs fetched (or else in the UI we have a winder where there is no UI label)
        } else {
          console.log("Pending jobs monitor ____ Interval C -- No pending jobs found!");

          if (newJobsInterval) {
            console.log("Pending jobs monitor ____ Interval D -- Clearing interval!");
            clearInterval(newJobsInterval);
            setWeDetectedNewJobs(false);
            await refreshOnlyNewLaunchesData();
          }
        }

        await sleep(3);
        setCheckingIfNewJobsHaveCompleted(false);
      }, 15000);

      return () => {
        console.log("Pending jobs monitor ____ End A");
        if (newJobsInterval) {
          console.log("Pending jobs monitor ____ End B");

          clearInterval(newJobsInterval);
        }
      };
    }
  }, [myJobsPayments]);

  useEffect(() => {
    if (!addressSol || isLoadingSolanaWallet || isFirstFetchOfJobsDone) return;

    const handleRefreshJobsAndLaunchData = async () => {
      setVirtualAiRemixAlbumTracksLoading(true);

      // the app loaded up into my workspace, lets get any jobs the user had.
      if (appViewLoaded && myJobsPayments.length === 0) {
        await handleRefreshJobs();
        await refreshOnlyNewLaunchesData();
      }

      setVirtualAiRemixAlbumTracksLoading(false);
    };

    if (appViewLoaded) {
      handleRefreshJobsAndLaunchData();
    }
  }, [appViewLoaded, addressSol, isLoadingSolanaWallet]);

  const refreshOnlyNewLaunchesData = async () => {
    if (!addressSol) return;
    console.log("Pending jobs monitor ____ refreshOnlyNewLaunchesData called");

    setIsSwimLaneDataLoading(true);
    setNewLaunchesData([]);

    // looks like some jobs that were pending, have completed --- so lets get the new track
    console.log("___ calgetRemixLaunchesViaAPI B");
    const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol });

    // if a new item is added, can we compare responseA items to newLaunches items and mark the new item with a flag called isNewlyCreated
    const isNewlyCreated = responseA.filter((item: AiRemixLaunch) => !newLaunchesData.some((newItem) => newItem.launchId === item.launchId));
    responseA.forEach((item: AiRemixLaunch) => {
      if (isNewlyCreated.some((newItem: AiRemixLaunch) => newItem.launchId === item.launchId)) {
        item.isNewlyCreated = true;
      }
    });

    setNewLaunchesData(responseA);

    if (responseA.length > 0) {
      setVirtualAiRemixAlbumTracksLoading(true);
      setVirtualAiRemixAlbumTracks([]); // only clear this if we got track (we should always do -- but just in case)

      // take the new launches, and prev fetched graduated and published launches, and merge them together
      const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, [], publishedLaunchesData);
      const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);

      // it may already have been set (i.e. user had no tracks and then added one vs there are already tracks), so dont reset it
      if (!virtualAiRemixAlbum) {
        setVirtualAiRemixAlbum(virtualAlbum);
      }

      setVirtualAiRemixAlbumTracks([...allMyRemixesAsMusicTracks]);
      updateMyAiRemixRawTracks(allMyRemixes);
      setVirtualAiRemixAlbumTracksLoading(false);
    }

    setIsSwimLaneDataLoading(false);
  };

  const fetchDataAllSwimLaneData = async ({ showMyMusicOnly }: { showMyMusicOnly: boolean }) => {
    try {
      setIsSwimLaneDataLoading(true);
      setNewLaunchesData([]);
      setPublishedLaunchesData([]);
      setVirtualAiRemixAlbumTracksLoading(true);

      console.log("___ calgetRemixLaunchesViaAPI C");
      const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: addressSol && showMyMusicOnly ? addressSol : null });
      setNewLaunchesData(responseA);
      console.log("___ calgetRemixLaunchesViaAPI D");
      const responseC = await getRemixLaunchesViaAPI({ launchStatus: "published", addressSol: addressSol && showMyMusicOnly ? addressSol : null });
      setPublishedLaunchesData(responseC);

      // Fetch payment logs if user is logged in
      if (showMyMusicOnly && addressSol) {
        const responseD = await getPaymentLogsViaAPI({ addressSol, byTaskFilter: "remix" });
        setMyJobsPayments(responseD);

        if (responseA.length > 0 || responseC.length > 0) {
          const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, [], responseC);

          const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);
          // it may already have been set (i.e. user had no tracks and then added one vs there are already tracks), so dont reset it
          if (!virtualAiRemixAlbum) {
            setVirtualAiRemixAlbum(virtualAlbum);
          }
          setVirtualAiRemixAlbumTracks(allMyRemixesAsMusicTracks);
          updateMyAiRemixRawTracks(allMyRemixes);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toastError("Failed to load data");
    } finally {
      setIsSwimLaneDataLoading(false);
      setVirtualAiRemixAlbumTracksLoading(false);
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

      console.log("Pending jobs monitor ____ handleRefreshJobs called and data reloaded...");
      setMyJobsPayments(responseD);
    }
  };

  const handleCloseRemixAlertBanner = () => {
    setIsRemixAlertBannerVisible(false);
    // Store current timestamp in session storage
    // localStorage.setItem("sig-ux-remix-alert", Date.now().toString());
  };

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

  const toggleExpandedVersions = (launchId: string) => {
    // Helper function to toggle expanded state for showing other versions

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
    // here we set the power up object that will trigger the modal that allows a user to sent bitz to a target bounty

    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      giveBitzToWho,
      giveBitzToCampaignId,
      isLikeMode,
      isRemixVoteMode,
    });
  }

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
        setShouldRefreshSwimlaneDataOnGraduation(true);
      } catch (error) {
        toastError("Error with status change to graduated");
      }
    }

    return tokenGraduated;
  };

  const addTrackToAlbum_getCurrentTracksInAlbum = async ({
    albumId,
    albumTitle,
    albumImg,
    onlyRefresh,
  }: {
    albumId: string;
    albumTitle: string;
    albumImg: string;
    onlyRefresh: boolean;
  }) => {
    setIsLoadingTracksInSelectedAlbum(true);

    try {
      const albumTracksFromDb: MusicTrack[] = await getAlbumTracksFromDBViaAPI(userArtistProfile.artistId, albumId, true, true);

      if (albumTracksFromDb.length > 0) {
        setSelectedAlbumTracks(albumTracksFromDb);
      } else {
        setSelectedAlbumTracks([]);
      }

      // the user just added or edited a track, so we just need to refresh the track list, we don't need to open the track list modal as its already one open
      if (onlyRefresh) {
        return;
      }

      setSelectedAlbumTitle(albumTitle);
      setSelectedAlbumId(albumId);
      setSelectedAlbumImg(albumImg);
      setShowEditTrackModal(true);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracksInSelectedAlbum(false);
    }
  };

  const addTrackToAlbum_ResetToPrestine = () => {
    setShowEditTrackModal(false);
    setSelectedAlbumTracks([]);
    setSelectedAlbumTitle("");
    setSelectedAlbumImg("");
    setSelectedAlbumId("");
    setIsLoadingTracksInSelectedAlbum(false);
    setTrackToAddToAlbum(null);
  };

  const LoadingSkeletonItem = () => (
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

  const LoadingSkeleton = () => (
    <>
      {" "}
      {[...Array(3)].map((_, index) => (
        <LoadingSkeletonItem key={index} />
      ))}{" "}
    </>
  );

  const GenerateMusicMemeButton = () => {
    return (
      <>
        {DISABLE_REMIX_LAUNCH_BUTTON || !addressSol ? (
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
                {DISABLE_REMIX_LAUNCH_BUTTON ? <div>Remix! (Offline For Now!)</div> : !addressSol ? <div>Login to Remix!</div> : null}
              </div>
            </div>
          </Button>
        ) : null}
      </>
    );
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
        <div className="flex flex-col bgx-green-500">
          <div className="flex flex-col md:flex-row gap-4 bgx-green-300">
            <div className="relative w-[80px] h-[80px]">
              <img
                src={fixImgIconForRemixes(item.image, item?.promptParams?.songTitle)}
                alt={item?.promptParams?.songTitle || "LEGACY"}
                className="w-[70px] h-[70px] m-auto md:m-0 rounded-lg object-cover"
              />
            </div>
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{idx + 1}.</span>
                <h3 className="!text-lg font-semibold max-w-[200px] truncate text-ellipsis" title={item?.promptParams?.songTitle}>
                  {item?.promptParams?.songTitle || "LEGACY"}
                </h3>
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

          <div className="mt-2 bgx-green-200">
            {type === "new" && (
              <>
                <div className="flex flex-col mt-2">
                  {item.versions.map((version, index) => (
                    <div key={index} className="flex flex-col gap-2">
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
                        <div className="flex items-center gap-2">
                          <TrackRatingButtons bountyId={version.bountyId} userVotedOptions={userVotedOptions} setUserVotedOptions={setUserVotedOptions} />
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
                              <div className="flex items-center gap-2">
                                <TrackRatingButtons bountyId={version.bountyId} userVotedOptions={userVotedOptions} setUserVotedOptions={setUserVotedOptions} />
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
                                              creatorIcon: fixImgIconForRemixes(item.image, item?.promptParams?.songTitle),
                                              creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                              giveBitzToWho: item.remixedBy,
                                              giveBitzToCampaignId: version.bountyId,
                                              isRemixVoteMode: true,
                                            });
                                          }
                                        }}>
                                        {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                          <Loader className="w-full text-center animate-spin m-2" size={20} />
                                        ) : (
                                          <div
                                            className="p-5 md:p-0 flex items-center gap-2"
                                            title={addressSol ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                                            onClick={() => {
                                              if (addressSol) {
                                                handleSendBitzForMusicBounty({
                                                  creatorIcon: fixImgIconForRemixes(item.image, item?.promptParams?.songTitle),
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
                                      <div className="flex items-center gap-2">
                                        <TrackRatingButtons
                                          bountyId={version.bountyId}
                                          userVotedOptions={userVotedOptions}
                                          setUserVotedOptions={setUserVotedOptions}
                                        />
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
                                                      creatorIcon: fixImgIconForRemixes(item.image, item?.promptParams?.songTitle),
                                                      creatorName: `${item.promptParams.songTitle} AI Remix Version ${index + 1}`,
                                                      giveBitzToWho: item.remixedBy,
                                                      giveBitzToCampaignId: version.bountyId,
                                                      isRemixVoteMode: true,
                                                    });
                                                  }
                                                }}>
                                                {typeof bountyBitzSumGlobalMapping[version.bountyId]?.bitsSum === "undefined" ? (
                                                  <Loader className="w-full text-center animate-spin m-2" size={20} />
                                                ) : (
                                                  <div
                                                    className="p-5 md:p-0 flex items-center gap-2"
                                                    title={addressSol ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                                                    onClick={() => {
                                                      if (addressSol) {
                                                        handleSendBitzForMusicBounty({
                                                          creatorIcon: fixImgIconForRemixes(item.image, item?.promptParams?.songTitle),
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
            <p className="text-sm text-gray-500">Launch IP-Safe AI Remixes influenced by the music of your favorite artists</p>
          </div>

          <div className="flex flex-col md:flex-row md:gap-4 gap-2">
            {addressSol && showPublicVotingArea && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-300">My Music Only</span>
                <Switch checked={showAllMusicUI} onCheckedChange={handleSwitchChangePublicVoting} className="" />
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

            {newLaunchesData.length > 0 && <GenerateMusicMemeButton />}
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
                      <LaunchAiMusicTrack
                        renderInline={true}
                        onCloseModal={async (refreshPaymentLogs?: boolean) => {
                          if (refreshPaymentLogs) {
                            handleRefreshJobs();

                            // show a notice to the user that we are checking for new jobs
                            setCheckingIfNewJobsHaveCompleted(true);
                            await refreshOnlyNewLaunchesData();
                            await sleep(3);
                            setCheckingIfNewJobsHaveCompleted(false);
                          }
                        }}
                        navigateToDeepAppView={(e: any) => {
                          // Handle navigation if needed
                          navigateToDeepAppView(e);
                        }}
                      />
                    </div>

                    {/* Second Column - My Tracks Workspace */}
                    <div className="flex flex-col bg-white/5 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="!text-lg font-semibold">My Workspace</h2>
                        <div
                          className={`cursor-pointer flex items-center gap-2 text-sm mr-5`}
                          onClick={() => {
                            fetchDataAllSwimLaneData({ showMyMusicOnly: true });
                          }}>
                          <>
                            <RefreshCcw className="w-3 h-3" />
                            <span className="text-xs">Refresh</span>
                          </>
                        </div>
                      </div>

                      {/* We have a remix job pending */}
                      {(myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0 ||
                        weDetectedNewJobs) && (
                        <div className="flex flex-col items-center py-2 bg-yellow-900 text-yellow-300 rounded-md mt-2">
                          <p className="text-sm text-center m-auto">
                            <span className="mr-1">
                              {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length}
                            </span>{" "}
                            Remix Jobs Pending
                          </p>
                        </div>
                      )}

                      {checkingIfNewJobsHaveCompleted && (
                        <div className="flex flex-col items-center py-2 bg-yellow-900/50 text-yellow-300 rounded-md mt-1">
                          <span className="text-yellow-300 flex items-center justify-center text-sm">
                            <Loader className="animate-spin text-yellow-300 mr-2" size={20} />
                            finding your new tracks...
                          </span>
                        </div>
                      )}

                      {/* My list of tracks */}
                      {virtualAiRemixAlbumTracksLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Loader className="w-4 h-4 animate-spin text-yellow-500" />
                        </div>
                      ) : (
                        <>
                          {virtualAiRemixAlbum && virtualAiRemixAlbumTracks.length > 0 ? (
                            <div className="mx-auto md:m-[initial] p-3">
                              <TrackList
                                album={virtualAiRemixAlbum}
                                artistId={"virtual-artist-id-" + displayPublicKey?.toString()}
                                artistName={""}
                                virtualTrackList={virtualAiRemixAlbumTracks}
                                checkOwnershipOfMusicAsset={() => 0}
                                trackPlayIsQueued={false}
                                assetPlayIsQueued={false}
                                remixWorkspaceView={true}
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
                                handleTrackSelection={(selectedTrack: MusicTrack) => {
                                  // set the isSigmaAiRemix flag to 1
                                  const _selectedTrack: MusicTrack = { ...selectedTrack, isSigmaAiRemix: "1" } as MusicTrack;
                                  addTrackToAlbum_ResetToPrestine(); // best we reset to prestine here as this is the "point of entry" to add track workflow
                                  setTrackToAddToAlbum(_selectedTrack);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">No remixes found. Create one now!</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 h-[60vh]">
                      <Loader className="w-4 h-4 animate-spin text-yellow-500" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Public Voting Area */}
            {showPublicVotingArea && (
              <>
                {isRemixAlertBannerVisible && (
                  <div
                    className="relative overflow-hidden bg-gradient-to-r from-yellow-500/25 via-red-500/30 to-yellow-500/25 border-b border-red-500/40"
                    style={{
                      animation: "gradient 3s ease infinite",
                      backgroundSize: "200% 200%",
                      backdropFilter: "blur(8px)",
                    }}>
                    <div className="mx-auto px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-300 text-lg">🚨 </span>
                          <p className="text-md font-medium text-gray-100 text-sm flex items-center">
                            USD rewards for the best AI remixes based on real world artist tracks!
                            <button
                              onClick={() =>
                                toast(
                                  (t) => (
                                    <div className="flex items-start gap-4">
                                      <div className="flex-1 space-y-2">
                                        <span className="text-yellow-300 font-bold text-lg">Transform the AI Music Landscape & Earn Rewards!</span>
                                        <p>
                                          Create amazing remixes using Sigma's AI tools and licensed tracks from real artists. It's easy, legal, and rewarding!
                                        </p>
                                        <p>
                                          Here's how it works: Get votes from the community, and if your remix stands out, it could be featured on the official
                                          DJ Sigma mixtape. Both you and the original artist earn $5 USD per featured track!
                                        </p>
                                        <p>
                                          Don't worry if your track isn't selected - you can still publish it in your own album or download it for your
                                          portfolio.
                                        </p>
                                        <p>Start remixing today and be part of the next generation of music creation!</p>
                                      </div>
                                      <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-white p-1">
                                        ✕
                                      </button>
                                    </div>
                                  ),
                                  customInfoToastStyle
                                )
                              }
                              className="p-1 rounded-full hover:bg-white/10">
                              <Info className="w-5 h-5" />
                            </button>
                          </p>
                        </div>
                        <button onClick={handleCloseRemixAlertBanner} className="text-gray-400 hover:text-gray-300 transition-colors" aria-label="Close banner">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* New */}
                  <div className="flex flex-col bg-white/5 rounded-b-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="!text-lg font-semibold">{!showAllMusicUI ? "My Remixes" : "New Remixes - Vote Now!"}</h2>
                    </div>
                    <div className="space-y-4">
                      {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length > 0 && (
                        <div className="flex flex-col items-center py-2 bg-yellow-900 text-yellow-300 rounded-md">
                          <p className="text-sm text-center m-auto">
                            <span className="mr-1">
                              {myJobsPayments.filter((job) => job.paymentStatus === "new" || job.paymentStatus === "async_processing").length}
                            </span>{" "}
                            Remix Jobs Pending
                          </p>
                        </div>
                      )}
                      {checkingIfNewJobsHaveCompleted && (
                        <div className="flex flex-col items-center py-2 bg-yellow-900/50 text-yellow-300 rounded-md mt-1">
                          <span className="text-yellow-300 flex items-center justify-center text-sm">
                            <Loader className="w-4 h-4 animate-spin mr-2 text-yellow-300" />
                            finding your new tracks...
                          </span>
                        </div>
                      )}

                      {isSwimLaneDataLoading || switchChangeThrottled ? (
                        <LoadingSkeleton />
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

                  {/* Published Remixes */}
                  <div className="flex flex-col bg-white/5 rounded-b-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="!text-lg font-semibold">{!showAllMusicUI ? "My Music Published on Sigma Music" : "Remixes Published on Sigma Music"}</h2>
                    </div>
                    <div className="space-y-4">
                      {isSwimLaneDataLoading || switchChangeThrottled ? (
                        <LoadingSkeleton />
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
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 h-[60vh]">
              <Loader className="animate-spin text-yellow-300" size={20} />
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
            <LaunchAiMusicTrack
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

        {/* Album Selector Modal for adding tracks */}
        <AlbumSelectorModal
          trackToAddToAlbum={trackToAddToAlbum}
          albumTracksLoading={isLoadingTracksInSelectedAlbum}
          isOpen={trackToAddToAlbum !== null}
          onClose={() => {
            setTrackToAddToAlbum(null);
            addTrackToAlbum_ResetToPrestine(); // the entire add track to album workflow is closed -- so reset to prestine
          }}
          onViewCurrentTracks={(albumId, albumTitle, albumImg) => {
            // this will trigger the track list modal to open (once we get the existing tracks)
            addTrackToAlbum_getCurrentTracksInAlbum({ albumId, albumTitle, albumImg, onlyRefresh: false });
          }}
        />

        {/* Once Album is selected, then add track modal */}
        <TrackListModal
          isOpen={showEditTrackModal}
          isNonMUIMode={true}
          tracks={selectedAlbumTracks as any}
          albumTitle={selectedAlbumTitle}
          artistId={userArtistProfile.artistId}
          albumId={selectedAlbumId}
          albumImg={selectedAlbumImg}
          preloadExistingTrackToAlbum={trackToAddToAlbum}
          onClose={() => {
            // go back to the album selector modal
            setShowEditTrackModal(false);
          }}
          onTracksUpdated={() => {
            toastSuccess(`Track "${trackToAddToAlbum?.title || ""}" added to album "${selectedAlbumTitle}" successfully.`);

            addTrackToAlbum_ResetToPrestine();
          }}
        />
      </div>
    </>
  );
};
