import { useEffect, useState, useRef } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ChevronDown,
  Rocket,
  Library,
  Loader,
  Pause,
  Play,
  RefreshCcwDot,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  CircleX,
  Maximize2,
  Minimize2,
  Zap,
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./AudioPlayer.css";
import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import { DISABLE_BITZ_FEATURES, LOG_STREAM_EVENT_METRIC_EVERY_SECONDS, MARSHAL_CACHE_DURATION_SECONDS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BountyBitzSumMapping, MusicTrack } from "libs/types";
import { logStreamViaAPI } from "libs/utils/api";
import { toastClosableError } from "libs/utils/uiShared";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";

type MusicPlayerProps = {
  trackList: MusicTrack[];
  trackListFromDb: boolean;
  dataNftToOpen?: DasApiAsset;
  firstSongBlobUrl?: string;
  pauseAsOtherAudioPlaying?: number;
  bitzGiftingMeta?: {
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null;
  isPlaylistPlayer?: boolean;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  loadIntoDockedMode?: boolean;
  viewSolDataHasError?: boolean;
  jumpToPlaylistTrackIndex?: number;
  onSendBitzForMusicBounty: (e: any) => any;
  onCloseMusicPlayer: () => void;
  onPlayHappened: () => void;
  navigateToDeepAppView: (logicParams: any) => void;
};

// Common style constants
const COMMON_STYLES = {
  container: "flex items-center",
  imageBase: "select-none rounded-md border border-grey-900 transition-all duration-300",
  textContainer: "flex flex-col justify-center",
  skeletonBase: "bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
};

// Screen-specific styles
const SCREEN_STYLES = {
  full: {
    container: "flex-col items-center justify-center h-full",
    songInfo: "flex-col items-center justify-center",
    image: "w-[400px] h-[400px]",
    textWrapper: "text-center mt-6",
    title: "text-xl text-muted-foreground",
    artist: "text-lg text-white mt-2",
    loader: {
      container: "flex flex-col items-center justify-center mt-12",
      icon: "w-16 h-16 animate-spin hover:scale-105",
      text: "text-center text-foreground text-lg mt-6",
    },
    skeleton: {
      title: "h-8 w-64 mb-4 ml-auto mr-auto",
      artist: "h-6 w-48 ml-auto mr-auto",
    },
  },
  normal: {
    container: "flex-row items-center justify-center h-[100px]",
    songInfo: "w-[500px] px-10 flex-row items-center md:mt-0",
    image: "w-[70px] h-[70px]",
    textWrapper: "xl:w-[60%] ml-2",
    title: "!text-sm !text-muted-foreground truncate md:text-left",
    artist: "text-sm text-white truncate md:text-left",
    loader: {
      container: "h-[100px] flex flex-col items-center justify-center px-2",
      icon: "w-full text-center animate-spin hover:scale-105",
      text: "text-center text-foreground text-xs mt-3",
    },
    skeleton: {
      title: "h-5 w-32 mb-2 ml-auto mr-auto",
      artist: "h-5 w-24 ml-auto mr-auto",
    },
  },
};

/*
we count how many seconds the user has listened to the track. (we track if they scrub or pause etc)
this is used to make sure they user listnes to at least 30 seconds before we log a "stream" event to the backend
*/
let listenTimer: NodeJS.Timeout;
let streamLogEventSentToAPI = false; // we use a global variable here to prevent the API from being accidentally called multiple times due to local effects
let playerExplicitlyDockedByUser = false;

export const MusicPlayer = (props: MusicPlayerProps) => {
  const {
    dataNftToOpen,
    trackList,
    trackListFromDb,
    firstSongBlobUrl,
    bitzGiftingMeta,
    bountyBitzSumGlobalMapping,
    pauseAsOtherAudioPlaying,
    isPlaylistPlayer,
    loadIntoDockedMode,
    viewSolDataHasError,
    jumpToPlaylistTrackIndex,
    onSendBitzForMusicBounty,
    onCloseMusicPlayer,
    onPlayHappened,
    navigateToDeepAppView,
  } = props;
  const { updateTrackPlayIsQueued, updatePlaylistTrackIndexBeingPlayed, jumpToTrackIndexInAlbumBeingPlayed } = useAudioPlayerStore();
  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [displayTrackList, setDisplayTrackList] = useState(false);
  const [musicPlayerAudio] = useState(new Audio());
  const [musicPlayerVideo] = useState(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    return video;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [timeInSecondsListenedToTrack, setTimeInSecondsListenedToTrack] = useState(0);
  const [duration, setDuration] = useState("00:00");
  const [isLoaded, setIsLoaded] = useState(false);
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();
  const [songSource, setSongSource] = useState<{ [key: string]: string }>({}); // map to keep the already fetched trackList
  const abortControllersRef = useRef<{ [key: string]: AbortController }>({}); // we use this to keep track of network requests for song blob caches and then abort them if the user clicks out
  const [imgLoading, setImgLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showBonusTrackModal, setShowBonusTrackModal] = useState(false);
  const [loggedStreamMetricForTrack, setLoggedStreamMetricForTrack] = useState(0); // a simple 1 or 0 that is linked to the logic of logging a stream event to the backend so in the UI we can reflect this for debugging
  const isSmallScreen = window.innerWidth < 768;

  const sliderSettings = {
    infinite: isPlaylistPlayer ? true : false,
    speed: 1000,
    slidesToShow: 4,
    responsive: [
      {
        breakpoint: 1800,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 980,
        settings: {
          slidesToShow: 3,
        },
      },

      {
        breakpoint: 730,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 550,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // Add helper to determine current media type
  const isCurrentTrackVideo = () => {
    return trackList[currentTrackIndex]?.category?.toLowerCase() === "video";
  };

  // Add helper to get current media element
  const getCurrentMediaElement = () => {
    return isCurrentTrackVideo() ? musicPlayerVideo : musicPlayerAudio;
  };

  useEffect(() => {
    console.log("$$ MUSIC PLAYER MOUNTING ---");

    return () => {
      console.log("$$ MUSIC PLAYER UNMOUNTING ---");
    };
  }, []);

  useEffect(() => {
    if (trackList && trackList.length > 0 && firstSongBlobUrl && firstSongBlobUrl !== "") {
      console.log("$$ trackList, firstSongBlobUrl effect MOUNTING ---");

      updateTrackPlayIsQueued(false);

      setSongSource((prevState) => ({
        ...prevState, // keep all other key-value pairs
        [trackList[0].idx]: firstSongBlobUrl, // update the value of the first index
      }));

      const mediaElement = getCurrentMediaElement();

      const handleEnded = () => {
        setCurrentTrackIndex((prevCurrentTrackIndex) => (prevCurrentTrackIndex < trackList.length - 1 ? prevCurrentTrackIndex + 1 : 0));
      };

      const handleCanPlayThrough = () => {
        setIsLoaded(true);
        updateProgress();
        if (mediaElement.currentTime === 0) {
          togglePlay();
        }
      };

      const startListenTimer = () => {
        // before we start a timer, we do a check and clean off any existing timer to make sure we don't have multiple timers running
        if (listenTimer) {
          clearInterval(listenTimer);
        }

        listenTimer = setInterval(() => {
          setTimeInSecondsListenedToTrack((prev) => prev + 1);
        }, 1000);
      };

      const stopListenTimer = () => {
        if (listenTimer) {
          clearInterval(listenTimer);
        }
      };

      // Start timer when track starts playing
      mediaElement.addEventListener("play", startListenTimer);
      // Stop timer when track is paused
      mediaElement.addEventListener("pause", stopListenTimer);
      // Stop timer when track ends
      mediaElement.addEventListener("ended", () => {
        stopListenTimer();
        handleEnded();
      });

      // Add event listeners to current media element
      mediaElement.addEventListener("timeupdate", updateProgress);
      mediaElement.addEventListener("canplaythrough", handleCanPlayThrough);

      // Queue all songs in trackList (and cache songs via pre-making the network requests)
      if (trackList && trackList.length > 0) {
        trackList.forEach((song: any) => {
          if (trackList[0].idx === song.idx) return;
          fetchMarshalForSong(song.idx);
        });

        updateProgress();
      }

      return () => {
        console.log("$$ trackList, firstSongBlobUrl effect UNMOUNTING ---");

        // Abort all pending requests when the component unmounts
        Object.values(abortControllersRef.current).forEach((controller) => {
          controller.abort();
        });
        abortControllersRef.current = {};

        stopListenTimer(); // stop the listen timer interval

        // Clean up both audio and video elements
        musicPlayerAudio.pause();
        musicPlayerVideo.pause();
        mediaElement.removeEventListener("play", startListenTimer);
        mediaElement.removeEventListener("pause", stopListenTimer);
        mediaElement.removeEventListener("timeupdate", updateProgress);
        mediaElement.removeEventListener("ended", () => {
          stopListenTimer();
          handleEnded();
        });
        mediaElement.removeEventListener("canplaythrough", handleCanPlayThrough);

        mediaElement.pause();
        mediaElement.src = "";
        mediaElement.load(); // Force reload
        mediaElement.removeAttribute("src"); // Remove src attribute
      };
    } else {
      updateTrackPlayIsQueued(true);
    }
  }, [trackList, firstSongBlobUrl]);

  useEffect(() => {
    updateProgress();
  }, [getCurrentMediaElement().src]);

  useEffect(() => {
    getCurrentMediaElement().pause();
    getCurrentMediaElement().src = "";
    setIsPlaying(false);
    setIsLoaded(false);
    handleChangeSong();
  }, [currentTrackIndex, songSource[trackList[currentTrackIndex]?.idx]]);

  useEffect(() => {
    if (pauseAsOtherAudioPlaying && pauseAsOtherAudioPlaying > 0) {
      // pauseAsOtherAudioPlaying will be an incremented number that other compos can increment to invoke the pause login, each time it goes up, we can check and pause the player if it's playing
      pauseMusicPlayer();
    }
  }, [pauseAsOtherAudioPlaying]);

  useEffect(() => {
    if (loadIntoDockedMode && isFullScreen) {
      setIsFullScreen(false);
    }
  }, [loadIntoDockedMode]);

  // Add useEffect to handle body scroll
  useEffect(() => {
    if (isFullScreen) {
      // Disable main page scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable main page scroll
      document.body.style.overflow = "auto";
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isFullScreen]);

  // Reset listen timer only when track changes
  useEffect(() => {
    if (listenTimer) {
      clearInterval(listenTimer);
    }
    setTimeInSecondsListenedToTrack(0);
    setLoggedStreamMetricForTrack(0);
    streamLogEventSentToAPI = false;

    updatePlaylistTrackIndexBeingPlayed(currentTrackIndex);
  }, [currentTrackIndex]);

  useEffect(() => {
    // we log a stream event when the user has listened to the track for 30 seconds
    if (trackList[currentTrackIndex]?.albumTrackId && timeInSecondsListenedToTrack > LOG_STREAM_EVENT_METRIC_EVERY_SECONDS && !streamLogEventSentToAPI) {
      setLoggedStreamMetricForTrack(1);
      streamLogEventSentToAPI = true;
      // 0 means its public non-logged in user stream
      console.log(
        `Saving Stream Metric Event for track alId = ${trackList[currentTrackIndex].albumTrackId} streamLogEventSentToAPI = ${streamLogEventSentToAPI}`
      );
      logStreamViaAPI({ streamerAddr: publicKey?.toBase58() || "0", albumTrackId: trackList[currentTrackIndex].albumTrackId });
    }
  }, [timeInSecondsListenedToTrack, publicKey, trackList]);

  useEffect(() => {
    if (typeof jumpToPlaylistTrackIndex === "number" && trackList.length > 0 && jumpToPlaylistTrackIndex <= trackList.length) {
      const finalTrackIndex = trackList.findIndex((track: any) => track.idx === jumpToPlaylistTrackIndex);
      setCurrentTrackIndex(finalTrackIndex);
    }
  }, [jumpToPlaylistTrackIndex]);

  useEffect(() => {
    if (typeof jumpToTrackIndexInAlbumBeingPlayed === "number" && trackList.length > 0 && jumpToTrackIndexInAlbumBeingPlayed <= trackList.length) {
      const finalTrackIndex = trackList.findIndex((track: any) => track.idx === jumpToTrackIndexInAlbumBeingPlayed);
      setCurrentTrackIndex(finalTrackIndex);
    }
  }, [jumpToTrackIndexInAlbumBeingPlayed]);

  const pauseMusicPlayer = () => {
    if (isPlaying) {
      getCurrentMediaElement().pause();
      setIsPlaying(false);
    }
  };

  // format time as minutes:seconds
  const formatTime = (_seconds: number) => {
    const minutes = Math.floor(_seconds / 60);
    const remainingSeconds = Math.floor(_seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, "0"); // Ensure two digits
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  // fetch song via Marshal or HTTP
  const fetchMarshalForSong = async (index: number) => {
    if (songSource[index] === undefined) {
      try {
        // Create a new AbortController for this specific request
        const controller = new AbortController();
        abortControllersRef.current[index] = controller;

        setSongSource((prevState) => ({
          ...prevState, // keep all other key-value pairs
          [index]: "Fetching", // update the value of specific key
        }));

        // if not previously fetched, fetch now and save the url of the blob
        if (dataNftToOpen) {
          const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
            solPreaccessNonce,
            solPreaccessSignature,
            solPreaccessTimestamp,
            signMessage,
            publicKey,
            updateSolPreaccessNonce,
            updateSolSignedPreaccess,
            updateSolPreaccessTimestamp,
          });

          const viewDataArgs = {
            headers: { "dmf-custom-sol-collection-id": dataNftToOpen.grouping[0].group_value },
            fwdHeaderKeys: ["dmf-custom-sol-collection-id"],
          };

          if (!publicKey) {
            throw new Error("Missing data for viewData");
          }

          console.log(`fetchSong (marshal): Track ${index} Loading [no-cache]`);

          const res = await viewDataViaMarshalSol(
            dataNftToOpen.id,
            usedPreAccessNonce,
            usedPreAccessSignature,
            publicKey,
            viewDataArgs.fwdHeaderKeys,
            viewDataArgs.headers,
            true,
            index,
            MARSHAL_CACHE_DURATION_SECONDS
          );

          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            setSongSource((prevState) => ({
              ...prevState, // keep all other key-value pairs
              [index]: blobUrl, // update the value of specific key
            }));

            console.log(`fetchSong (marshal): Track ${index} Loaded [cache]`);
          } else {
            setSongSource((prevState) => ({
              ...prevState,
              [index]: "Error: " + res.status + " " + res.statusText,
            }));
          }
        } else {
          /*
            if we come here, that means we are either in playlist player (prev radio) mode or in DB loaded album mode (not NFT based steaming)
          */
          let errMsg = null;
          let blobUrl = "";

          try {
            console.log(`fetchSong (HTTP): Track ${index} Loading [no-cache]`);

            const trackInPlaylist = trackList.find((track: any) => track.idx === index);

            if (!trackInPlaylist) {
              errMsg = "Track not found";
            } else {
              const songSourceUrl = trackInPlaylist.stream || trackInPlaylist.file || "hidden";

              if (songSourceUrl === "hidden") {
                blobUrl = "hidden";
              } else {
                // here we are making a fetch for all tracks, so we are making many requests
                // ... we need a way to abort any requests not complete if the component unmounts
                const response = await fetch(songSourceUrl, {
                  signal: controller.signal,
                });
                const blob = await response.blob();
                blobUrl = URL.createObjectURL(blob);
              }
            }
          } catch (error: any) {
            // Check if the error is from an aborted request
            if (error.name === "AbortError") {
              console.log(`fetchSong (HTTP): Track ${index} ABORTED (a)! [cache]`);
              return;
            }
            errMsg = error.toString();
          } finally {
            // Clean up the controller for this request
            console.log(`fetchSong (HTTP): Track ${index} abort cleared (a) [cache]`);
            delete abortControllersRef.current[index];
          }

          if (!errMsg) {
            setSongSource((prevState) => ({
              ...prevState, // keep all other key-value pairs
              [index]: blobUrl, // update the value of specific key
            }));

            console.log(`fetchSong (HTTP): Track ${index} Loaded [cache]`);
          } else {
            setSongSource((prevState) => ({
              ...prevState,
              [index]: "Error: " + errMsg,
            }));
          }
        }
      } catch (err) {
        // Check if the error is from an aborted request
        if (err instanceof Error && err.name === "AbortError") {
          console.log(`fetchSong (HTTP): Track ${index} ABORTED (b)! [cache]`);
          return;
        }

        setSongSource((prevState) => ({
          ...prevState,
          [index]: "Error: " + (err as Error).message,
        }));

        console.error("error : ", err);
      } finally {
        // Clean up the controller for this request
        console.log(`fetchSong (HTTP): Track ${index} abort cleared (b) [cache]`);
        delete abortControllersRef.current[index];
      }
    }
  };

  const updateProgress = () => {
    const mediaElement = getCurrentMediaElement();
    setCurrentTime(mediaElement.currentTime ? formatTime(mediaElement.currentTime) : "00:00");
    setDuration(mediaElement.duration ? formatTime(mediaElement.duration) : "00:00");
    let _percentage = (mediaElement.currentTime / mediaElement.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  const togglePlay = () => {
    const mediaElement = getCurrentMediaElement();
    if (isPlaying) {
      if (!mediaElement.paused) {
        mediaElement.pause();
      }
    } else {
      onPlayHappened();

      if (mediaElement.readyState >= 2) {
        // Add a check for iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // Modify the play logic to handle iOS differently
        if (isIOS) {
          // Add a small delay before playing on iOS
          setTimeout(() => {
            mediaElement.play().catch(() => {
              // alert("Play failed:" + error); // sometimes the "auto play" not allowed error comes on iOS, in that case we revert the play state so user manually has to click play
              setIsPlaying(false); // Reset UI state if play fails
            });
          }, 100);
        } else {
          mediaElement.play();
        }
      } else {
        toastClosableError("Media not ready yet. Waiting for loading to complete...");
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    const mediaElement = getCurrentMediaElement();
    mediaElement.volume = newVolume;
    setVolume(newVolume);
  };

  const handlePrevButton = () => {
    setImgLoading(true);
    if (currentTrackIndex <= 0) {
      setCurrentTrackIndex(trackList.length - 1);
      return;
    }
    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex - 1);
  };

  const handleNextButton = () => {
    setImgLoading(true);
    if (currentTrackIndex >= trackList.length - 1) {
      setCurrentTrackIndex(0);
      return;
    }
    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex + 1);
  };

  const repeatTrack = () => {
    // reset the listen timer
    if (listenTimer) {
      clearInterval(listenTimer);
    }
    setTimeInSecondsListenedToTrack(0);
    setLoggedStreamMetricForTrack(0);
    streamLogEventSentToAPI = false;

    getCurrentMediaElement().currentTime = 0;

    if (isPlaying) {
      getCurrentMediaElement().play();

      // NOTE: this is a anomoly, as play() should trigger the  mediaElement.addEventListener("play", startListenTimer); above and the
      // ... setInterval logic should attach there, but for some reason it doesn't always attach on the first play, so we add this here.
      // ... but as we clearInterval above also INSIDE the addEventListener above, worse case we should be pretected from multiple timers running
      listenTimer = setInterval(() => {
        setTimeInSecondsListenedToTrack((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement.duration) return;
    const newTime = (newProgress / 100) * mediaElement.duration;
    mediaElement.currentTime = newTime;
    setCurrentTime(formatTime(mediaElement.currentTime));
    setProgress(newProgress);
  };

  const handleChangeSong = () => {
    const index = trackList[currentTrackIndex]?.idx;
    const mediaElement = getCurrentMediaElement();

    if (songSource[index]) {
      if (songSource[index].includes("Error:")) {
        toastClosableError(`Track loading failed, error: ${songSource[index]}`);
      } else if (songSource[index] === "Fetching") {
        return false;
      } else if (songSource[index] === "hidden") {
        setShowBonusTrackModal(true);
        return false;
      } else if (!(songSource[index] === "Fetching")) {
        // Pause and reset both elements
        musicPlayerAudio.pause();
        musicPlayerVideo.pause();
        musicPlayerAudio.src = "";
        musicPlayerVideo.src = "";

        // Set source on appropriate element
        mediaElement.src = songSource[index];
        mediaElement.load();
        updateProgress();
        mediaElement.currentTime = 0;
      } else {
        return false;
      }
    } else {
      return false;
    }
    return true;
  };

  const showPlaylist = () => {
    setDisplayTrackList(!displayTrackList);
  };

  const likeAlbumWithBiTz = (song: any) => {
    if (song && bitzGiftingMeta) {
      onSendBitzForMusicBounty({
        creatorIcon: song.cover_art_url,
        creatorName: `${song.artist}'s ${song.album}`,
        creatorSlug: undefined,
        creatorXLink: undefined,
        giveBitzToWho: bitzGiftingMeta.creatorWallet,
        giveBitzToCampaignId: bitzGiftingMeta.giveBitzToCampaignId,
        isLikeMode: true,
      });
    }
  };

  // Add scroll handler for tracklist
  const handleTrackListScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const resetStateOnClosePlayer = () => {
    getCurrentMediaElement().pause();
    getCurrentMediaElement().src = "";
    setIsPlaying(false);
    setIsLoaded(false);
    setIsFullScreen(false);

    onCloseMusicPlayer();
  };

  const LoaderSection = () => {
    const styles = isFullScreen ? SCREEN_STYLES.full : SCREEN_STYLES.normal;

    return (
      <div className={styles.loader.container}>
        <Loader className={styles.loader.icon + (isSmallScreen ? " w-8 h-8 mr-12" : "")} />
        {!isSmallScreen && <p className={styles.loader.text}>hang tight, queuing music for playback</p>}

        {/* only show close button if the view sol data failed durign track load */}
        {viewSolDataHasError && (
          <button
            className={`closePlayer select-none absolute top-0 ${isFullScreen ? "left-[10px] top-[10px]" : "top-0 left-0"} flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
            onClick={() => {
              updateTrackPlayIsQueued(false);
              resetStateOnClosePlayer();
            }}>
            <CircleX className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  };

  const SkeletonLoader = () => {
    const styles = isFullScreen ? SCREEN_STYLES.full : SCREEN_STYLES.normal;

    return (
      <div className={`${COMMON_STYLES.container} ${isFullScreen ? "animate-fade-in flex-col" : "animate-fade-in"}`}>
        <div className={`${COMMON_STYLES.skeletonBase} ${styles.image}`} />
        <div className={`${COMMON_STYLES.textContainer} ${styles.textWrapper}`}>
          <div className={`${COMMON_STYLES.skeletonBase} ${styles.skeleton.title}`} />
          <div className={`${COMMON_STYLES.skeletonBase} ${styles.skeleton.artist}`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full border-[1px] border-foreground/20 rounded-lg rounded-b-none border-b-0 bg-black transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-[9999] rounded-none h-screen w-screen overflow-hidden" : ""
      }`}>
      <div className="debug hidden bg-yellow-900 p-2 w-full text-xs">
        {/* <p className="mb-2">isFullScreen = {isFullScreen.toString()}</p> */}
        {/* <p className="mb-2">loadIntoDockedMode = {loadIntoDockedMode?.toString()}</p> */}
        {/* <p className="mb-2">trackList = {JSON.stringify(trackList)}</p> */}
        {/* <p className="mb-2">firstSongBlobUrl = {firstSongBlobUrl}</p> */}
        {/* <p className="mb-2">isPlaying = {isPlaying.toString()}</p> */}
        {/* <p className="mb-2">pauseAsOtherAudioPlaying = {pauseAsOtherAudioPlaying?.toString()}</p> */}
        {/* <p className="mb-2">musicPlayerAudio.src = {musicPlayerAudio.src}</p> */}
        <p className="mb-2">jumpToPlaylistTrackIndex = {jumpToPlaylistTrackIndex}</p>
        <p className="mb-2">currentTrackIndex = {currentTrackIndex}</p>
        {trackList[currentTrackIndex]?.albumTrackId && (
          <p className="mb-2">
            isPlaying = {isPlaying.toString()} progress = {progress} timeInSecondsListenedToTrack = {timeInSecondsListenedToTrack} albumTrackId ={" "}
            {trackList[currentTrackIndex].albumTrackId}
          </p>
        )}
      </div>

      {!firstSongBlobUrl ? (
        <div className={`${COMMON_STYLES.container} ${isFullScreen ? SCREEN_STYLES.full.container : SCREEN_STYLES.normal.container}`}>
          <div className={`songInfo ${isFullScreen ? SCREEN_STYLES.full.songInfo : SCREEN_STYLES.normal.songInfo}`}>
            {trackList.length > 0 ? (
              <div className={`${COMMON_STYLES.container} ${isFullScreen ? "flex-col animate-slide-fade-in" : "animate-slide-fade-in"}`}>
                <img
                  src={trackList[currentTrackIndex]?.cover_art_url}
                  alt="Album Cover"
                  className={`${COMMON_STYLES.imageBase} ${isFullScreen ? SCREEN_STYLES.full.image : SCREEN_STYLES.normal.image} ${
                    imgLoading ? "blur-sm opacity-0" : "blur-none opacity-100"
                  }`}
                  onLoad={() => {
                    setImgLoading(false);
                  }}
                  onError={({ currentTarget }) => {
                    currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                  }}
                />
                <div className={`${COMMON_STYLES.textContainer} ${isFullScreen ? SCREEN_STYLES.full.textWrapper : SCREEN_STYLES.normal.textWrapper}`}>
                  <h6 className={isFullScreen ? SCREEN_STYLES.full.title : SCREEN_STYLES.normal.title}>{trackList[currentTrackIndex].title}</h6>
                  <p className={isFullScreen ? SCREEN_STYLES.full.artist : SCREEN_STYLES.normal.artist}>{trackList[currentTrackIndex].artist}</p>
                </div>
              </div>
            ) : (
              <SkeletonLoader />
            )}
          </div>
          <LoaderSection />
        </div>
      ) : (
        <>
          {displayTrackList && (
            <div
              className={`z-10 bg-gradient-to-t from-[#171717] to-black ${
                isFullScreen ? "fixed right-0 top-0 h-full w-[400px] overflow-y-auto" : "w-full pb-2"
              }`}
              onWheel={handleTrackListScroll}>
              <div className={`trackList ${isFullScreen ? "w-full px-4" : "w-[300px] md:w-[93%]"} mt-1 pt-3 mx-auto`}>
                {!isFullScreen && (
                  <button
                    className={`select-none absolute top-0 ${isFullScreen ? "right-1" : "right-0"} flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
                    onClick={() => setDisplayTrackList(false)}>
                    <ChevronDown className="w-6 h-6" />
                  </button>
                )}
                <h4 className="flex justify-center select-none font-semibold text-foreground !text-xl">{`Track List ${trackList.length} songs`}</h4>

                {trackListFromDb && (
                  <div className="flex justify-center items-center gap-2">
                    <div className="flex items-center gap-2 text-yellow-300">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px]">This album supports fast streaming</span>
                      </div>
                    </div>
                  </div>
                )}

                {isFullScreen ? (
                  // Vertical track list for full screen
                  <div className="flex flex-col gap-4 mt-2">
                    {trackList.map((song: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (!publicKey && song?.bonus === 1) {
                            // if user is not logged in and this is a bonus track via the DB, then we don't allow them to play it
                            // ... if they are logged in and are seeing this bonus track then they own the album so let them jump to it
                            return;
                          }
                          setCurrentTrackIndex(index);
                        }}
                        className={`select-none flex flex-row items-center justify-start p-4 rounded-lg text-foreground border-[1px] border-foreground/20 hover:opacity-60 
                          ${!publicKey && song?.bonus === 1 ? "cursor-not-allowed" : "cursor-pointer"}
                          ${song?.bonus === 1 ? "bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20" : ""}`}>
                        <img
                          src={song.cover_art_url}
                          alt="Album Cover"
                          className="h-24 w-24 rounded-lg"
                          onError={({ currentTarget }) => {
                            currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                          }}
                        />
                        <div className={`ml-4 flex flex-col ${!isFullScreen ? "ml-2" : ""}`}>
                          <h6 className="!text-lg !text-muted-foreground">{song.title}</h6>
                          <p className="text-md text-white">{song.artist}</p>
                          <div className="flex flex-row gap-2">
                            {song?.bonus === 1 && <p className="text-[10px] bg-yellow-500 rounded-md p-1 w-fit text-black">Bonus Track</p>}
                            {currentTrackIndex === index && <p className="text-[10px] border border-yellow-500 text-white rounded-md p-1 w-fit">Playing</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Existing horizontal slider for normal mode
                  <Slider {...sliderSettings}>
                    {trackList.map((song: any, index: number) => {
                      return (
                        <div key={index} className="flex items-center justify-center mt-2">
                          <div
                            onClick={() => {
                              if (!publicKey && song?.bonus === 1) {
                                // if user is not logged in and this is a bonus track via the DB, then we don't allow them to play it
                                // ... if they are logged in and are seeing this bonus track then they own the album so let them jump to it
                                return;
                              }
                              setCurrentTrackIndex(index);
                            }}
                            className={`select-none mr-2 flex flex-row items-center justify-start rounded-lg text-foreground border-[1px] border-foreground/20 hover:opacity-60 
                              ${!publicKey && song?.bonus === 1 ? "cursor-not-allowed" : "cursor-pointer"}
                              ${song?.bonus === 1 ? "bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20" : ""}`}>
                            <div className="">
                              <img
                                src={song.cover_art_url}
                                alt="Album Cover"
                                className="h-20 p-2 rounded-lg m-auto"
                                onError={({ currentTarget }) => {
                                  currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                                }}
                              />
                            </div>
                            <div className="xl:w-[60%] flex flex-col justify-center text-center">
                              <h6 className="!text-xs md:!text-sm !text-muted-foreground truncate text-left">{song.title}</h6>
                              <p className="text-xs md:text-sm text-white truncate text-left">{song.artist}</p>
                              <div className="flex flex-row gap-2">
                                {song?.bonus === 1 && <p className="text-[10px] bg-yellow-500 rounded-md p-1 w-fit text-black">Bonus Track</p>}
                                {currentTrackIndex === index && <p className="text-[10px] border border-yellow-500 text-white rounded-md p-1 w-fit">Playing</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                )}
              </div>
            </div>
          )}

          <div
            className={`player flex flex-col select-none ${
              isFullScreen
                ? `h-full justify-center items-center ${displayTrackList ? "pr-[400px]" : ""}` // Add padding when tracklist is open
                : "md:h-[110px] md:flex-row"
            } relative w-full border-t-[1px] border-foreground/10 animate-fade-in transition-all duration-300`}>
            <div className="">
              <button
                className={`expandOrDockPlayer z-[100] hidden md:flex select-none absolute top-0 ${
                  isFullScreen ? "left-[50px] top-[10px]" : "right-0 scale-75"
                } flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
                onClick={() => {
                  // a flag to indicate the user docked the player (used to "remember" the last use preference and then if they open a new album, then keep the player docked or full screen)
                  playerExplicitlyDockedByUser = !playerExplicitlyDockedByUser;

                  // when going from full screen to collapsed, we hide the track list, and when going from collapsed to full screen, we show the track list
                  if (isFullScreen) {
                    setDisplayTrackList(false);
                  } else {
                    setDisplayTrackList(true);
                  }

                  setIsFullScreen(!isFullScreen);
                }}>
                {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
              <button
                className={`closePlayer select-none absolute top-0 ${isFullScreen ? "left-[10px] top-[10px]" : "top-0 left-0 scale-75"} flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
                onClick={() => {
                  resetStateOnClosePlayer();
                }}>
                <CircleX className="w-6 h-6" />
              </button>
            </div>
            <div
              className={`songInfo px-10 flex flex-row items-center ${isFullScreen ? "mb-8 pt-3 flex-col" : "md:w-[500px] pt-2 pb-4"}`}
              style={{ minHeight: isCurrentTrackVideo() ? (isFullScreen ? "400px" : "100px") : "auto" }}>
              {isCurrentTrackVideo() ? (
                <video
                  ref={(node) => {
                    if (node) {
                      Object.assign(musicPlayerVideo, node);
                    }
                  }}
                  src={musicPlayerVideo.src}
                  className={`${isSmallScreen ? "hidden" : ""} select-none rounded-md border border-grey-900 transition-all duration-300 ${
                    isFullScreen ? "w-[400px] h-[400px]" : "w-[100px] h-[100px]"
                  }`}
                  playsInline
                  preload="auto"
                  style={{ objectFit: "contain", backgroundColor: "black" }}
                  onError={(e) => console.error("Video error:", e)}
                />
              ) : (
                <img
                  src={trackList ? trackList[currentTrackIndex]?.cover_art_url : ""}
                  alt="Album Cover"
                  className={`${isSmallScreen ? "hidden" : ""} select-none rounded-md border border-grey-900 transition-all duration-300 ${
                    isFullScreen ? "w-[400px] h-[400px]" : "w-[70px] h-[70px] ml-2"
                  } ${imgLoading ? "blur-sm" : "blur-none"}
                  ${trackList[currentTrackIndex]?.albumTrackId ? "cursor-alias" : ""}`}
                  onLoad={() => setImgLoading(false)}
                  onError={({ currentTarget }) => {
                    currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                  }}
                  onClick={() => {
                    if (trackList[currentTrackIndex]?.artistSlug && trackList[currentTrackIndex]?.albumTrackId) {
                      const albumId = trackList[currentTrackIndex]?.albumTrackId.split("-")[0]; // Extract albumId from alId (e.g., "ar24_a1-2" -> "ar24_a1")
                      navigateToDeepAppView({
                        artistSlug: trackList[currentTrackIndex]?.artistSlug,
                        albumId: albumId,
                      });
                    }
                  }}
                />
              )}
              <div
                className={`${isSmallScreen ? "hidden" : ""} flex flex-col select-text mt-4 ${isFullScreen ? "text-center" : "ml-2"} ${
                  trackList[currentTrackIndex]?.albumTrackId ? "cursor-alias" : ""
                }`}
                onClick={() => {
                  if (trackList[currentTrackIndex]?.artistSlug && trackList[currentTrackIndex]?.albumTrackId) {
                    const albumId = trackList[currentTrackIndex]?.albumTrackId.split("-")[0]; // Extract albumId from alId (e.g., "ar24_a1-2" -> "ar24_a1")
                    navigateToDeepAppView({
                      artistSlug: trackList[currentTrackIndex]?.artistSlug,
                      albumId: albumId,
                    });
                  }
                }}>
                <span className={`text-muted-foreground ${isFullScreen ? "text-xl" : "text-sm"}`}>{trackList[currentTrackIndex]?.title}</span>
                <span className={`text-white ${isFullScreen ? "text-lg" : "text-sm"}`}>{trackList[currentTrackIndex]?.artist}</span>
                <span className="text-xs text-muted-foreground">Track {currentTrackIndex + 1}</span>
              </div>
            </div>
            <div
              className={`songControls relative text-foreground select-none ${
                isFullScreen ? "w-[600px] gap-2" : "w-full md:w-[60%]"
              } flex flex-col justify-center items-center px-2`}>
              <div className={`controlButtons flex w-full justify-around ${isFullScreen ? "scale-125 mb-8" : "scale-75"}`}>
                <button className="cursor-pointer" onClick={handlePrevButton}>
                  <SkipBack className="w-full hover:scale-105" />
                </button>
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/0 border border-grey-300 shadow-xl flex items-center justify-center">
                  <button onClick={togglePlay} className="focus:outline-none" disabled={!isLoaded}>
                    {!isLoaded ? (
                      <Loader className="w-full text-center animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-full text-center hover:scale-105" />
                    ) : (
                      <Play className="w-full text-center hover:scale-105" />
                    )}
                  </button>
                </div>
                <button className="cursor-pointer" onClick={handleNextButton}>
                  <SkipForward className="w-full hover:scale-105" />
                </button>
              </div>

              <div className="playProgressBar w-full flex justify-around">
                <span className="w-[4rem] p-2 text-xs font-sans font-medium text-muted-foreground">{currentTime}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.01"
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="accent-black dark:accent-white w-full bg-white mx-auto  focus:outline-none cursor-pointer"
                />{" "}
                <span className="w-[4rem] p-2 text-xs font-sans font-medium text-muted-foreground ">
                  {duration}

                  {loggedStreamMetricForTrack === 1 && <span className="ml-2">☑️</span>}
                </span>
              </div>

              <div className={`songCategoryAndTitle flex flex-col w-full justify-center items-center ${!isFullScreen ? "hidden" : ""}`}>
                {trackList[currentTrackIndex]?.category !== "all" && (
                  <span className="text-sm text-foreground/60 capitalize">Genre: {trackList[currentTrackIndex]?.category}</span>
                )}
                <span className="text-sm text-muted-foreground">Album: {trackList[currentTrackIndex]?.album}</span>
              </div>

              <div className={`songTitleAndArtistForMobile flex flex-col w-full justify-center items-center md:hidden ${isSmallScreen ? "mb-2" : ""}`}>
                <span className="text-xs md:text-sm text-foreground/60">{trackList[currentTrackIndex]?.title}</span>
                <span className="text-xs md:text-sm text-muted-foreground">{trackList[currentTrackIndex]?.artist}</span>
              </div>
            </div>
            <div
              className={`albumControls ${isSmallScreen ? "absolute top-0 right-0" : ""}  mb-2 md:mb-0 select-none p-2 flex items-center z-10 ${
                isFullScreen ? "w-[600px] mt-4 justify-center" : "md:w-[600px] md:mt-[2.2rem] justify-center md:justify-end"
              }`}>
              {!isSmallScreen && (
                <button className="cursor-pointer" onClick={repeatTrack}>
                  <RefreshCcwDot className="w-full hover:scale-105" />
                </button>
              )}

              {!isSmallScreen && (
                <div className="ml-2 xl:pl-8 flex">
                  {volume === 0 ? <VolumeX /> : volume >= 0.5 ? <Volume2 /> : <Volume1 />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="accent-black dark:accent-white w-[70%] cursor-pointer ml-2 "></input>
                </div>
              )}

              <button className={`mr-2 ${isFullScreen ? "" : "xl:pr-8"}`} onClick={showPlaylist}>
                <Library className="w-full hover:scale-105" />
              </button>
            </div>

            {/* boost album */}
            {!DISABLE_BITZ_FEATURES && !isSmallScreen && bitzGiftingMeta && (
              <div
                className={`absolute right-2 ${isFullScreen && displayTrackList ? "md:right-[410px]" : "md:right-[50px]"} ${!isFullScreen ? "scale-75" : ""} z-10 top-4 text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center ${publicKey ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (publicKey) {
                    likeAlbumWithBiTz(trackList[currentTrackIndex]);
                  }
                }}>
                <div
                  className="p-5 md:p-0 flex items-center gap-2"
                  title={"Boost This Album With 5 XP"}
                  onClick={() => {
                    if (publicKey) {
                      likeAlbumWithBiTz(trackList[currentTrackIndex]);
                    }
                  }}>
                  {bitzGiftingMeta ? bountyBitzSumGlobalMapping[bitzGiftingMeta.giveBitzToCampaignId]?.bitsSum : 0}

                  <Rocket className="w-4 h-4" />
                </div>
              </div>
            )}

            {trackList[currentTrackIndex]?.bonus === 1 && (
              <p
                className={`${isFullScreen && displayTrackList ? "md:right-[410px] text-[10px]" : "right-[10px] md:right-[10px] text-[8px]"} z-10 bottom-4 bg-yellow-500 rounded-md p-1 w-fit text-black absolute`}>
                Bonus
              </p>
            )}
          </div>
        </>
      )}

      {/* Bonus Track Modal */}
      {showBonusTrackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative bg-[#1A1A1A] rounded-lg p-6 w-full mx-4 max-w-xl">
            {/* Close button */}
            <button
              onClick={() => {
                setShowBonusTrackModal(false);
                handleNextButton();
              }}
              className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
              ✕
            </button>

            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Bonus Track Locked</h2>
                <p className="text-muted-foreground">This track is a bonus track that requires purchasing the premium version of the album.</p>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <p>
                  <span className="font-bold text-yellow-300">What are you missing?</span> Access to exclusive bonus tracks and premium content from this album.
                </p>
                <p>
                  <span className="font-bold text-yellow-300">How to unlock:</span> Purchase the premium version of the album from the artist's profile page.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowBonusTrackModal(false);
                    handleNextButton();
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700">
                  Close and Move to Next Track
                </Button>
                <Button
                  onClick={() => {
                    if (isFullScreen) {
                      setIsFullScreen(false);
                    }
                    setShowBonusTrackModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  Buy Album from Artist Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
