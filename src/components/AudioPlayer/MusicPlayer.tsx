import { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ChevronDown,
  Heart,
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
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./AudioPlayer.css";
import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import { DISABLE_BITZ_FEATURES, MARSHAL_CACHE_DURATION_SECONDS } from "config";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BountyBitzSumMapping, MusicTrack } from "libs/types";
import { toastClosableError } from "libs/utils/uiShared";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";

let playerExplicitlyDockedByUser = false;

type MusicPlayerProps = {
  trackList: MusicTrack[];
  dataNftToOpen?: DasApiAsset;
  firstSongBlobUrl?: string;
  pauseAsOtherAudioPlaying?: number;
  bitzGiftingMeta?: {
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null;
  isRadioPlayer?: boolean;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  loadIntoDockedMode?: boolean;
  onSendBitzForMusicBounty: (e: any) => any;
  onCloseMusicPlayer: () => void;
  onPlayHappened: () => void;
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
      title: "h-8 w-64 mb-4",
      artist: "h-6 w-48",
    },
  },
  normal: {
    container: "flex-row items-center justify-center h-[200px]",
    songInfo: "w-[500px] px-10 flex-row items-center mt-5 md:mt-0",
    image: "w-[100px] h-[100px]",
    textWrapper: "xl:w-[60%] ml-2",
    title: "!text-sm !text-muted-foreground truncate md:text-left",
    artist: "text-sm text-white truncate md:text-left",
    loader: {
      container: "h-[100px] flex flex-col items-center justify-center px-2",
      icon: "w-full text-center animate-spin hover:scale-105",
      text: "text-center text-foreground text-xs mt-3",
    },
    skeleton: {
      title: "h-5 w-32 mb-2",
      artist: "h-5 w-24",
    },
  },
};

export const MusicPlayer = (props: MusicPlayerProps) => {
  const {
    dataNftToOpen,
    trackList,
    firstSongBlobUrl,
    bitzGiftingMeta,
    bountyBitzSumGlobalMapping,
    pauseAsOtherAudioPlaying,
    isRadioPlayer,
    loadIntoDockedMode,
    onSendBitzForMusicBounty,
    onCloseMusicPlayer,
    onPlayHappened,
  } = props;
  const { updateTrackPlayIsQueued } = useAudioPlayerStore();
  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [displayTrackList, setDisplayTrackList] = useState(window.innerWidth >= 768);
  const [musicPlayerAudio] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("00:00");
  const [isLoaded, setIsLoaded] = useState(false);
  const { publicKey, signMessage } = useWallet();
  const [songSource, setSongSource] = useState<{ [key: string]: string }>({}); // map to keep the already fetched trackList
  const settings = {
    infinite: isRadioPlayer ? true : false,
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
  const [imgLoading, setImgLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(!playerExplicitlyDockedByUser && window.innerWidth >= 768);

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  useEffect(() => {
    if (trackList && trackList.length > 0 && firstSongBlobUrl && firstSongBlobUrl !== "") {
      if (firstSongBlobUrl) {
        setSongSource((prevState) => ({
          ...prevState, // keep all other key-value pairs
          [trackList[0].idx]: firstSongBlobUrl, // update the value of the first index
        }));
      }

      musicPlayerAudio.addEventListener("ended", function () {
        setCurrentTrackIndex((prevCurrentTrackIndex) => (prevCurrentTrackIndex < trackList.length - 1 ? prevCurrentTrackIndex + 1 : 0));
      });

      musicPlayerAudio.addEventListener("timeupdate", updateProgress);

      musicPlayerAudio.addEventListener("canplaythrough", function () {
        // Audio is ready to be played
        setIsLoaded(true);
        updateProgress();
        // play the song
        if (musicPlayerAudio.currentTime == 0) {
          togglePlay();
        }
      });

      // here we queue all the songs in the trackList by advanced fetching them from Marshal
      if (trackList && trackList.length > 0) {
        trackList.forEach((song: any) => {
          // const trackIdx = parseInt(song.idx, 10);
          if (trackList[0].idx === song.idx) return; // the first song in the playlist will be cached by the firstSongBlobUrl

          fetchMarshalForSong(song.idx);
        });

        updateProgress();
      }

      return () => {
        musicPlayerAudio.pause();
        musicPlayerAudio.removeEventListener("timeupdate", updateProgress);
        musicPlayerAudio.removeEventListener("canplaythrough", function () {
          setIsLoaded(false);
        });
      };
    }

    // if the user swapped to new album...
    if (trackList && trackList.length === 0) {
      // hide the track list as it will be empty
      if (displayTrackList) {
        setDisplayTrackList(false);
      }
    } else {
      if (!displayTrackList && window.innerWidth >= 768) {
        setDisplayTrackList(true);
      }
    }
  }, [trackList, firstSongBlobUrl]);

  useEffect(() => {
    updateProgress();
  }, [musicPlayerAudio.src]);

  useEffect(() => {
    if (firstSongBlobUrl && trackList && trackList.length > 0) {
      updateTrackPlayIsQueued(false);
      setSongSource((prevState) => ({
        ...prevState, // keep all other key-value pairs
        [trackList[0].idx]: firstSongBlobUrl, // update the value of the first index
      }));
    } else {
      updateTrackPlayIsQueued(true);
    }
  }, [trackList, firstSongBlobUrl]);

  useEffect(() => {
    musicPlayerAudio.pause();
    musicPlayerAudio.src = "";
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

  const pauseMusicPlayer = () => {
    if (isPlaying) {
      musicPlayerAudio.pause();
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

  // fetch song from Marshal
  const fetchMarshalForSong = async (index: number) => {
    if (songSource[index] === undefined) {
      try {
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
          let errMsg = null;
          let blobUrl = "";

          try {
            console.log(`fetchSong (HTTP): Track ${index} Loading [no-cache]`);

            const trackInRadioList = trackList.find((track: any) => track.idx === index);

            if (!trackInRadioList) {
              errMsg = "Track not found";
            } else {
              const blob = await fetch(trackInRadioList.stream!).then((r) => r.blob());
              blobUrl = URL.createObjectURL(blob);
            }
          } catch (error: any) {
            errMsg = error.toString();
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
        setSongSource((prevState) => ({
          ...prevState,
          [index]: "Error: " + (err as Error).message,
        }));

        console.error("error : ", err);
      }
    }
  };

  const updateProgress = () => {
    setCurrentTime(musicPlayerAudio.currentTime ? formatTime(musicPlayerAudio.currentTime) : "00:00");
    setDuration(musicPlayerAudio.duration ? formatTime(musicPlayerAudio.duration) : "00:00");
    let _percentage = (musicPlayerAudio.currentTime / musicPlayerAudio.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (!musicPlayerAudio.paused) {
        musicPlayerAudio.pause();
      }
    } else {
      onPlayHappened();

      if (musicPlayerAudio.readyState >= 2) {
        // Audio is loaded, play it.
        musicPlayerAudio.play();
      } else {
        toastClosableError("Audio not ready yet. Waiting for loading to complete...");
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    musicPlayerAudio.volume = newVolume;
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
    musicPlayerAudio.currentTime = 0;
    if (isPlaying) musicPlayerAudio.play();
  };

  const handleProgressChange = (newProgress: number) => {
    if (!musicPlayerAudio.duration) return;
    const newTime = (newProgress / 100) * musicPlayerAudio.duration;
    musicPlayerAudio.currentTime = newTime;
    setCurrentTime(formatTime(musicPlayerAudio.currentTime));
    setProgress(newProgress);
  };

  const handleChangeSong = () => {
    const index = trackList[currentTrackIndex]?.idx;

    if (songSource[index]) {
      // if we previously fetched the song and it was an error, show again the exact error.
      if (songSource[index].includes("Error:")) {
        toastClosableError(songSource[index]);
      } else if (songSource[index] === "Fetching") {
        return false;
      } else if (!(songSource[index] === "Fetching")) {
        musicPlayerAudio.src = songSource[index];
        musicPlayerAudio.load();
        updateProgress();
        musicPlayerAudio.currentTime = 0;
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

  // Component render section
  const LoaderSection = () => {
    const styles = isFullScreen ? SCREEN_STYLES.full : SCREEN_STYLES.normal;

    return (
      <div className={styles.loader.container}>
        <Loader className={styles.loader.icon} />
        <p className={styles.loader.text}>hold tight, streaming music from the blockchain</p>
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

  const isSmallScreen = window.innerWidth < 768;

  return (
    <div
      className={`relative w-full border-[1px] border-foreground/20 rounded-lg rounded-b-none border-b-0 bg-black transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-[9999] rounded-none h-screen w-screen overflow-hidden" : ""
      }`}>
      <div className="debug hidden bg-yellow-400 text-black p-2 w-full text-xs">
        <p className="mb-2">isFullScreen = {isFullScreen.toString()}</p>
        <p className="mb-2">loadIntoDockedMode = {loadIntoDockedMode?.toString()}</p>
        {/* <p className="mb-2">trackList = {JSON.stringify(trackList)}</p> */}
        {/* <p className="mb-2">firstSongBlobUrl = {firstSongBlobUrl}</p> */}
        <p className="mb-2">isPlaying = {isPlaying.toString()}</p>
        <p className="mb-2">pauseAsOtherAudioPlaying = {pauseAsOtherAudioPlaying?.toString()}</p>
        <p className="mb-2">musicPlayerAudio.src = {musicPlayerAudio.src}</p>
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
                <h4 className="flex justify-center select-none font-semibold text-foreground mb-3 !text-xl">{`Tracklist ${trackList.length} songs`}</h4>
                {isFullScreen ? (
                  // Vertical track list for full screen
                  <div className="flex flex-col gap-4">
                    {trackList.map((song: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => setCurrentTrackIndex(index)}
                        className="select-none flex flex-row items-center justify-start p-4 rounded-lg text-foreground border-[1px] border-foreground/20 hover:opacity-60 cursor-pointer">
                        <img
                          src={song.cover_art_url}
                          alt="Album Cover"
                          className="h-24 w-24 rounded-lg"
                          onError={({ currentTarget }) => {
                            currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                          }}
                        />
                        <div className="ml-4 flex flex-col">
                          <h6 className="!text-lg !text-muted-foreground">{song.title}</h6>
                          <p className="text-md text-white">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Existing horizontal slider for normal mode
                  <Slider {...settings}>
                    {trackList.map((song: any, index: number) => {
                      return (
                        <div key={index} className="flex items-center justify-center">
                          <div
                            onClick={() => {
                              setCurrentTrackIndex(index);
                            }}
                            className="mx-5 select-none flex flex-row items-center justify-start rounded-lg text-foreground border-[1px] border-foreground/20 hover:opacity-60 cursor-pointer">
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
                              <h6 className="!text-sm !text-muted-foreground truncate md:text-left">{song.title}</h6>
                              <p className="text-sm text-white truncate md:text-left">{song.artist}</p>
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
                : "md:h-[200px] md:flex-row"
            } relative w-full border-t-[1px] border-foreground/10 animate-fade-in transition-all duration-300`}>
            <div className="">
              <button
                className={`expandOrDockPlayer z-[100] hidden md:flex select-none absolute top-0 ${
                  isFullScreen ? "left-[50px] top-[10px]" : "right-0"
                } flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
                onClick={() => {
                  // a flag to indicate the user docked the player (used to "remember" the last use preference and then if they open a new album, then keep the player docked or full screen)
                  playerExplicitlyDockedByUser = !playerExplicitlyDockedByUser;

                  setIsFullScreen(!isFullScreen);
                }}>
                {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
              <button
                className={`closePlayer select-none absolute top-0 ${isFullScreen ? "left-[10px] top-[10px]" : "top-0 left-0"} flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden`}
                onClick={() => {
                  musicPlayerAudio.pause();
                  musicPlayerAudio.src = "";
                  setIsPlaying(false);
                  setIsLoaded(false);
                  setIsFullScreen(false);
                  onCloseMusicPlayer();
                }}>
                <CircleX className="w-6 h-6" />
              </button>
            </div>
            <div className={`songInfo px-10 flex flex-col items-center ${isFullScreen ? "mb-8 pt-3" : "md:w-[500px] pt-2 md:pt-10 pb-4 flex-row"}`}>
              <img
                src={trackList ? trackList[currentTrackIndex]?.cover_art_url : ""}
                alt="Album Cover"
                className={`${isSmallScreen ? "hidden" : ""} select-none rounded-md border border-grey-900 transition-all duration-300 ${
                  isFullScreen ? "w-[400px] h-[400px]" : "w-[100px] h-[100px]"
                } ${imgLoading ? "blur-sm" : "blur-none"}`}
                onLoad={() => setImgLoading(false)}
                onError={({ currentTarget }) => {
                  currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                }}
              />
              <div className={`${isSmallScreen ? "hidden" : ""} flex flex-col select-text mt-4 ${isFullScreen ? "text-center" : "ml-2 md:ml-0"}`}>
                <span className={`text-muted-foreground ${isFullScreen ? "text-xl" : "text-sm"}`}>{trackList[currentTrackIndex]?.title}</span>
                <span className={`text-white ${isFullScreen ? "text-lg" : "text-sm"}`}>{trackList[currentTrackIndex]?.artist}</span>
                <span className="text-xs text-muted-foreground">Track {currentTrackIndex + 1}</span>
              </div>
            </div>
            <div
              className={`songControls gap-2 text-foreground select-none ${
                isFullScreen ? "w-[600px]" : "w-full"
              } flex flex-col justify-center items-center px-2`}>
              <div className={`controlButtons flex w-full justify-around ${isFullScreen ? "scale-125 mb-8" : ""}`}>
                <button className="cursor-pointer" onClick={handlePrevButton}>
                  <SkipBack className="w-full hover:scale-105" />
                </button>
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/0 border border-grey-300 shadow-xl flex items-center justify-center">
                  <button onClick={togglePlay} className="focus:outline-none" disabled={!isLoaded}>
                    {!isLoaded ? (
                      <Loader className="w-full text-center animate-spin hover:scale-105" />
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
                <span className="w-[4rem] p-2 text-xs font-sans font-medium text-muted-foreground ">{duration}</span>
              </div>

              <div className="songCategoryAndTitle flex flex-col w-full justify-center items-center">
                <span className="text-sm text-foreground/60">Genre: {trackList[currentTrackIndex]?.category}</span>
                <span className="text-sm text-muted-foreground">Album: {trackList[currentTrackIndex]?.album}</span>
              </div>
            </div>
            <div
              className={`albumControls mb-2 md:mb-0 select-none p-2 flex items-center justify-between z-10 ${
                isFullScreen ? "w-[600px] mt-4" : "md:w-[500px]"
              }`}>
              <button className="cursor-pointer" onClick={repeatTrack}>
                <RefreshCcwDot className="w-full hover:scale-105" />
              </button>

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

              <button className={`mr-2 ${isFullScreen ? "" : "xl:pr-8"}`} onClick={showPlaylist}>
                <Library className="w-full hover:scale-105" />
              </button>
            </div>
            {/* like album */}
            {!DISABLE_BITZ_FEATURES && bitzGiftingMeta && (
              <div
                className={`absolute right-2 ${isFullScreen && displayTrackList ? "md:right-[410px]" : "md:right-[50px]"} z-10 top-4 text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center cursor-pointer`}
                onClick={() => {
                  likeAlbumWithBiTz(trackList[currentTrackIndex]);
                }}>
                <div
                  className="p-5 md:p-0 flex items-center gap-2"
                  title={"Like This Album With 5 XP"}
                  onClick={() => {
                    likeAlbumWithBiTz(trackList[currentTrackIndex]);
                  }}>
                  {bitzGiftingMeta ? bountyBitzSumGlobalMapping[bitzGiftingMeta.giveBitzToCampaignId]?.bitsSum : 0}

                  <Heart className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
