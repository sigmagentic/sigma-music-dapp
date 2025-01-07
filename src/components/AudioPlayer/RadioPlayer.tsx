import React, { useEffect, useState, memo } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import {
  Loader,
  Pause,
  Music2,
  Play,
  RefreshCcwDot,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Gift,
  ShoppingCart,
  Heart,
  CircleX,
  Library,
  ChevronDown,
} from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./AudioPlayer.css";
import Slider from "react-slick";
import { useDebouncedCallback } from "use-debounce";
import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import ratingR from "assets/img/nf-tunes/rating-R.png";
import { DISABLE_BITZ_FEATURES } from "config";
import { Button } from "libComponents/Button";
import { BountyBitzSumMapping, GiftBitzToArtistMeta, Track } from "libs/types";
import { getApiWeb2Apps } from "libs/utils";
import { toastClosableError } from "libs/utils/uiShared";
import { fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/AppMarketplace/NFTunes";
import { getBestBuyCtaLink } from "pages/AppMarketplace/NFTunes/types/utils";

type RadioPlayerProps = {
  stopRadioNow?: boolean;
  openActionFireLogic?: any;
  solBitzNfts?: any;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  setMusicBountyBitzSumGlobalMapping: any;
  userHasNoBitzDataNftYet: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  onPlayHappened: () => void;
  checkOwnershipOfAlbum: (e: any) => any;
  viewSolData: (e: number) => void;
  onSendBitzForMusicBounty: (e: any) => any;
};

let firstInteractionWithPlayDone = false; // a simple flag so we can track usage on 1st time user clicks on play (as the usage for first track wont capture like other tracks)
let firstMusicQueueDone = false;

export const RadioPlayer = memo(function RadioPlayerBase(props: RadioPlayerProps) {
  const {
    stopRadioNow,
    openActionFireLogic,
    solBitzNfts,
    bountyBitzSumGlobalMapping,
    setMusicBountyBitzSumGlobalMapping,
    userHasNoBitzDataNftYet,
    dataNftPlayingOnMainPlayer,
    onPlayHappened,
    checkOwnershipOfAlbum,
    viewSolData,
    onSendBitzForMusicBounty,
  } = props;

  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [radioPlayerAudio] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMutedByUserAndWithPriorVolume, setIsMutedByUserAndWithPriorVolume] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("00:00");
  const [isLoaded, setIsLoaded] = useState(false);
  const [songSource, setSongSource] = useState<{ [key: number]: string }>({}); // map to keep the already fetched radioTracks
  const [radioPlayPromptHide, setRadioPlayPromptHide] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const { publicKey: publicKeySol } = useWallet();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [radioTracks, setRadioTracks] = useState<Track[]>([]);
  const [radioTracksLoading, setRadioTracksLoading] = useState(true);
  const [nfTunesRadioFirstTrackCachedBlob, setNfTunesRadioFirstTrackCachedBlob] = useState<string>("");
  const [albumActionLink, setAlbumActionLink] = useState<string>("");
  const [albumActionText, setAlbumActionText] = useState<string>("");
  const [isAlbumForFree, setIsAlbumForFree] = useState<boolean>(false);
  const [trackThatsPlaying, setTrackThatsPlaying] = useState<Track | null>(null);
  const [ownershipOfAlbumAndItsIndex, setOwnershipOfAlbumAndItsIndex] = useState<number>(-1);
  const [displayTrackList, setDisplayTrackList] = useState(false);

  const settings = {
    infinite: false,
    speed: 1000,
    slidesToShow: 4,
    responsive: [
      {
        breakpoint: 1800,
        settings: {
          slidesToShow: 3,
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

  function eventToAttachEnded() {
    setCurrentTrackIndex((prevCurrentTrackIndex) => (prevCurrentTrackIndex < radioTracks.length - 1 ? prevCurrentTrackIndex + 1 : 0));
  }

  function eventToAttachTimeUpdate() {
    updateProgress();
  }

  function eventToAttachCanPlayThrough() {
    // Audio is ready to be played
    setIsLoaded(true);
    updateProgress();
    // play the song
    if (radioPlayerAudio.currentTime == 0) {
      togglePlay();
    }
  }

  function eventToAttachPlaying() {
    setIsPlaying(true);

    onPlayHappened();
  }

  const debounced_fetchBitzPowerUpsAndLikesForSelectedArtist = useDebouncedCallback((giftBitzToArtistMeta: GiftBitzToArtistMeta) => {
    fetchBitzPowerUpsAndLikesForSelectedArtist({
      giftBitzToArtistMeta,
      userHasNoBitzDataNftYet,
      solBitzNfts,
      setMusicBountyBitzSumGlobalMapping,
      isSingleAlbumBounty: true,
    });
  }, 2500);

  useEffect(() => {
    radioPlayerAudio.addEventListener("ended", eventToAttachEnded);
    radioPlayerAudio.addEventListener("timeupdate", eventToAttachTimeUpdate);
    radioPlayerAudio.addEventListener("canplaythrough", eventToAttachCanPlayThrough);
    radioPlayerAudio.addEventListener("playing", eventToAttachPlaying);

    // get the radio tracks data
    async function getRadioTracksData() {
      setRadioTracksLoading(true);
      const allRadioTracks = await getRadioStreamsData();
      setRadioTracks(allRadioTracks);

      // cache the first track blob
      const blobUrl = await getNFTuneFirstTrackBlobData(allRadioTracks[0]);
      setNfTunesRadioFirstTrackCachedBlob(blobUrl);
      setRadioTracksLoading(false);
    }

    getRadioTracksData();

    return () => {
      firstMusicQueueDone = false; // reset it here so when user leaves app and comes back, we don't auto play again
      firstInteractionWithPlayDone = false;
      radioPlayerAudio.pause();
      radioPlayerAudio.removeEventListener("ended", eventToAttachEnded);
      radioPlayerAudio.removeEventListener("timeupdate", eventToAttachTimeUpdate);
      radioPlayerAudio.removeEventListener("canplaythrough", eventToAttachCanPlayThrough);
      radioPlayerAudio.removeEventListener("playing", eventToAttachPlaying);
    };
  }, []);

  useEffect(() => {
    if (radioTracks.length > 0 && nfTunesRadioFirstTrackCachedBlob !== "") {
      radioTracks.forEach((song: any) => {
        fetchSong(song.idx);
      });

      updateProgress();
    }
  }, [radioTracks, nfTunesRadioFirstTrackCachedBlob]);

  useEffect(() => {
    if (stopRadioNow) {
      stopPlaybackNow();

      // if the radio player is collapsed, then we need to expand it as the album player is loading
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    }
  }, [stopRadioNow]);

  useEffect(() => {
    if (radioTracks.length > 0) {
      let getAlbumActionText = null;
      let getAlbumActionLink = null;
      let getIsAlbumForFree = false;
      let checkedOwnershipOfAlbumAndItsIndex = -1;

      // the song playing is the current track in the radioTracks array
      const _trackThatsPlaying = radioTracks[currentTrackIndex];

      checkedOwnershipOfAlbumAndItsIndex = checkOwnershipOfAlbum(_trackThatsPlaying);

      const ctaBuyLink = getBestBuyCtaLink({ ctaBuy: _trackThatsPlaying?.ctaBuy, dripSet: _trackThatsPlaying?.dripSet });

      if (ctaBuyLink) {
        getAlbumActionLink = ctaBuyLink;
        getAlbumActionText = checkedOwnershipOfAlbumAndItsIndex > -1 ? "Buy More Album Copies" : "Buy Album";
      } else if (_trackThatsPlaying?.airdrop) {
        getAlbumActionLink = _trackThatsPlaying.airdrop;
        getAlbumActionText = "Get Album Airdrop!";
        getIsAlbumForFree = true;
      }

      if (getAlbumActionLink) {
        setAlbumActionLink(getAlbumActionLink);
      }

      if (getAlbumActionText) {
        setAlbumActionText(getAlbumActionText);
      }

      setOwnershipOfAlbumAndItsIndex(checkedOwnershipOfAlbumAndItsIndex);
      setIsAlbumForFree(getIsAlbumForFree);
      setTrackThatsPlaying(_trackThatsPlaying);
    }
  }, [radioTracks, currentTrackIndex]);

  useEffect(() => {
    updateProgress();
  }, [radioPlayerAudio.src]);

  useEffect(() => {
    if (!trackThatsPlaying) return;
    if (Object.keys(songSource).length === 0) return;

    radioPlayerAudio.pause();
    radioPlayerAudio.src = "";
    setIsPlaying(false);
    setIsLoaded(false);
    handleChangeSong();

    // we clone the song data here so as to no accidentally mutate things
    // we debounce this, so that - if the user is jumping tabs.. it wait until they stop at a tab for 2.5 S before running the complex logic
    // we also only get the data AFTER the track is fetched or else this gets called 2 times
    if (songSource[trackThatsPlaying.idx] && songSource[trackThatsPlaying.idx] !== "Fetching") {
      if (trackThatsPlaying.bountyId && trackThatsPlaying.creatorWallet) {
        const bounty: GiftBitzToArtistMeta = {
          bountyId: radioTracks[currentTrackIndex].bountyId!,
          creatorWallet: radioTracks[currentTrackIndex].creatorWallet!,
        };

        debounced_fetchBitzPowerUpsAndLikesForSelectedArtist(bounty);
      }
    }
  }, [currentTrackIndex, trackThatsPlaying, songSource[radioTracks[currentTrackIndex]?.idx]]);

  useEffect(() => {
    if (trackThatsPlaying) {
      // we should not do the image loading logic on until user interacts with play, or there is a race condition and 1st image stays blurred
      if (firstMusicQueueDone) {
        setImgLoading(true);
      }
    }
  }, [trackThatsPlaying]);

  // format time as minutes:seconds
  const formatTime = (_seconds: number) => {
    const minutes = Math.floor(_seconds / 60);
    const remainingSeconds = Math.floor(_seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, "0"); // Ensure two digits
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const fetchSong = async (index: number) => {
    try {
      setSongSource((prevState) => ({
        ...prevState, // keep all other key-value pairs
        [index]: "Fetching", // update the value of specific key
      }));

      let errMsg = null;
      let blobUrl = "";

      try {
        const trackIndex = index - 1;

        // if we have cached the first song blob when Explorer loaded, then just load that from the cache direct to start the playback fast
        if (trackIndex === 0 && nfTunesRadioFirstTrackCachedBlob && nfTunesRadioFirstTrackCachedBlob.trim() !== "") {
          blobUrl = nfTunesRadioFirstTrackCachedBlob;
        } else {
          console.log(`fetchSong: Track ${trackIndex} Loading [no-cache]`);
          const blob = await fetch(radioTracks[trackIndex].stream!).then((r) => r.blob());
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

        console.log(`fetchSong: Track ${index} Loaded [cache]`);
      } else {
        setSongSource((prevState) => ({
          ...prevState,
          [index]: "Error: " + errMsg,
        }));
      }
    } catch (err) {
      setSongSource((prevState) => ({
        ...prevState,
        [index]: "Error: " + (err as Error).message,
      }));

      console.error("error : ", err);
    }
  };

  const updateProgress = () => {
    setCurrentTime(radioPlayerAudio.currentTime ? formatTime(radioPlayerAudio.currentTime) : "00:00");
    setDuration(radioPlayerAudio.duration ? formatTime(radioPlayerAudio.duration) : "00:00");
    let _percentage = (radioPlayerAudio.currentTime / radioPlayerAudio.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (!radioPlayerAudio.paused) {
        radioPlayerAudio.pause();
        setIsPlaying(false);
      }
    } else {
      if (radioPlayerAudio.readyState >= 2) {
        if (!firstMusicQueueDone) {
          // its the first time the radio loaded and the first track is ready, but we don't auto play
          // ... we use a local global variable here instead of state var as its only needed once
          firstMusicQueueDone = true;
        } else {
          // Audio is loaded, play it.
          radioPlayerAudio.play();

          // once they interact with the radio play, then no longer need to show the bouncing animation
          if (!radioPlayPromptHide) {
            setRadioPlayPromptHide(true);
          }
        }
      } else {
        toastClosableError("Audio not ready yet. Waiting for loading to complete...");
        return;
      }
    }
  };

  const stopPlaybackNow = () => {
    if (isPlaying) {
      radioPlayerAudio.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    radioPlayerAudio.volume = newVolume;
    setVolume(newVolume);

    // restore the mute to default, as the user might have increased the vol during mute so we restore mute state
    if (isMutedByUserAndWithPriorVolume !== -1) {
      setIsMutedByUserAndWithPriorVolume(-1);
    }
  };

  const toggleMute = () => {
    // -1 is default state (i.e. not muted)
    if (isMutedByUserAndWithPriorVolume !== -1) {
      handleVolumeChange(isMutedByUserAndWithPriorVolume);
      setIsMutedByUserAndWithPriorVolume(-1);
    } else {
      // user muted, and we store the last volume in isMutedByUserAndWithPriorVolume so we can restore it on unmute
      setIsMutedByUserAndWithPriorVolume(volume);
      handleVolumeChange(0);
    }
  };

  const handlePrevButton = () => {
    if (currentTrackIndex <= 0) {
      setCurrentTrackIndex(radioTracks.length - 1);
      return;
    }

    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex - 1);
  };

  const handleNextButton = () => {
    if (currentTrackIndex >= radioTracks.length - 1) {
      setCurrentTrackIndex(0);
      return;
    }

    setCurrentTrackIndex((prevCurrentTrackIndex) => prevCurrentTrackIndex + 1);
  };

  const repeatTrack = () => {
    radioPlayerAudio.currentTime = 0;
    if (isPlaying) radioPlayerAudio.play();
  };

  const handleProgressChange = (newProgress: number) => {
    if (!radioPlayerAudio.duration) return;
    const newTime = (newProgress / 100) * radioPlayerAudio.duration;
    radioPlayerAudio.currentTime = newTime;
    setCurrentTime(formatTime(radioPlayerAudio.currentTime));
    setProgress(newProgress);
  };

  const handleChangeSong = () => {
    if (!trackThatsPlaying) return;

    const index = trackThatsPlaying.idx;

    if (songSource[index]) {
      // if we previously fetched the song and it was an error, show again the exact error.
      if (songSource[index].includes("Error:")) {
        console.error(songSource[index]);
        toastClosableError("Could not load song due to network error. Please try the next track");
      } else if (!(songSource[index] === "Fetching")) {
        radioPlayerAudio.src = songSource[index];
        radioPlayerAudio.load();
        updateProgress();
        radioPlayerAudio.currentTime = 0;

        // doing the radioPlayPromptHide checks makes sure track 1 usage does not get sent until user actually plays
        if (radioPlayPromptHide) {
          logTrackUsageMetrics(index);
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
    return true;
  };

  const logTrackUsageMetrics = async (trackIdx?: number) => {
    console.log(`logTrackUsageMetrics: log usage metrics for trackIdx ${trackIdx}`);

    try {
      let logMetricsAPI = `${getApiWeb2Apps()}/datadexapi/nfTunesApp/logMusicTrackStreamMetrics?trackIdx=${trackIdx}`;

      const logRes = await axios.get(logMetricsAPI);
      const logResData = logRes.data;

      if (logResData?.error) {
        console.error("Radio logTrackUsageMetrics failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  function thisIsPlayingOnMainPlayer(album: any) {
    return dataNftPlayingOnMainPlayer?.content.metadata.name === album?.solNftName;
  }

  const showPlaylist = () => {
    setDisplayTrackList(!displayTrackList);
  };

  return (
    <>
      {radioTracksLoading || radioTracks.length === 0 ? (
        <div className="select-none h-[200px] bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25 border-[1px] border-foreground/40 relative md:w-[100%] flex flex-col items-center justify-center rounded-xl mt-2 p-3">
          {radioTracksLoading ? (
            <span className="text-xs">
              <Loader className="w-full text-center animate-spin hover:scale-105 mb-2" />
              Free radio music service powering up...
            </span>
          ) : (
            <span className="text-xs">⚠️ Radio service unavailable</span>
          )}
        </div>
      ) : (
        <>
          {isCollapsed && (
            <div className="mb-3 w-full h-[200px]">
              <Button
                className="!text-black text-sm mt-5 px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 cursor-pointer"
                variant="outline"
                onClick={() => {
                  setIsCollapsed(false);
                }}>
                Restore radio player
              </Button>
            </div>
          )}

          {trackThatsPlaying && (
            <div className={`${isCollapsed ? "w-full fixed left-0 bottom-0 z-50" : "w-full"}`}>
              <div className="relative w-full border-[1px] border-foreground/40 rounded-xl bg-black">
                <div className="debug hidden  bg-yellow-500 w-full h-full text-xs">
                  nfTunesRadioFirstTrackCachedBlob = {nfTunesRadioFirstTrackCachedBlob} <br />
                  radioTracks.length = {radioTracks.length} <br />
                  albumActionLink = {albumActionLink} <br />x albumActionText = {albumActionText} <br />
                  isAlbumForFree = {isAlbumForFree.toString()} <br />
                  trackThatsPlaying = {JSON.stringify(trackThatsPlaying)} <br />
                  songSource[trackThatsPlaying] = {trackThatsPlaying ? songSource[trackThatsPlaying.idx] : "null"} <br />
                  ownershipOfAlbumAndItsIndex = {ownershipOfAlbumAndItsIndex} <br />
                  imgLoading = {imgLoading.toString()} <br />
                </div>

                {isCollapsed && displayTrackList && (
                  <div className="bg-gradient-to-t from-[#171717] to-black w-full pb-2">
                    <div className="trackList w-[300px] md:w-[93%] mt-1 pt-3 mx-auto">
                      <button
                        className="select-none absolute top-0 right-0 flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden"
                        onClick={() => setDisplayTrackList(false)}>
                        <ChevronDown className="w-6 h-6" />
                      </button>
                      <h4 className="flex justify-center select-none font-semibold text-foreground mb-3 !text-xl">
                        {`Tracklist ${radioTracks.length} songs`}{" "}
                      </h4>
                      <Slider {...settings}>
                        {radioTracks.map((song: any, index: number) => {
                          return (
                            <div key={index} className="flex items-center justify-center">
                              <div
                                onClick={() => {
                                  setCurrentTrackIndex(index);
                                }}
                                className="mx-5 select-none flex flex-row items-center justify-start rounded-xl text-foreground border-[1px] border-foreground/40 hover:opacity-60 cursor-pointer">
                                <div className="">
                                  <img
                                    src={song.cover_art_url}
                                    alt="Album Cover"
                                    className="h-20 p-2 rounded-xl m-auto"
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
                      <style>
                        {`
               /* CSS styles for Swiper navigation arrows  */
               .slick-prev:before,
               .slick-next:before {
               color: ${theme === "light" ? "black;" : "white;"},
                   }`}
                      </style>
                    </div>
                  </div>
                )}

                <div className="player flex flex-col md:flex-row select-none md:h-[200px] relative w-full border-t-[1px] border-foreground/10 animate-fade-in bgx-800">
                  {isCollapsed && (
                    <button
                      className="select-none absolute top-0 left-0 flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden"
                      onClick={() => {
                        stopPlaybackNow();
                        setIsCollapsed(false);
                      }}>
                      <CircleX className="w-6 h-6" />
                    </button>
                  )}

                  <div
                    className={`songInfo flex flex-row items-center  bgx-blue-500 ${isCollapsed ? "px-10 pt-2 md:pt-10 pb-4 md:w-[500px]" : "ml-2 padding-[20px] md:w-[250px]"} mt-5 md:mt-0`}>
                    <img
                      src={radioTracks ? trackThatsPlaying.cover_art_url : ""}
                      alt="Album Cover"
                      className={`select-none ${isCollapsed ? "w-[100px] h-[100px] md:mr-3" : "w-[130px] h-[130px] m-[auto]"} rounded-md border border-grey-900 ${imgLoading ? "blur-sm" : "blur-none"}`}
                      onLoad={() => {
                        setImgLoading(false);
                      }}
                      onError={({ currentTarget }) => {
                        currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                      }}
                    />

                    {isCollapsed && (
                      <div className="ml-2 md:ml-0 flex flex-col select-text mt-2">
                        <span className="text-sm text-muted-foreground">{trackThatsPlaying.title}</span>{" "}
                        <span className="text-sm text-white">{trackThatsPlaying.artist}</span>
                        <span className="text-xs text-muted-foreground">Track {currentTrackIndex + 1}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`songControls flex flex-col justify-center items-center  bgx-green-500 ${!isCollapsed ? "" : ""} gap-2 text-foreground select-none w-full px-2`}>
                    <div className="controlButtons flex w-full justify-around">
                      <button className="cursor-pointer" onClick={handlePrevButton}>
                        <SkipBack className="w-full hover:scale-105" />
                      </button>
                      {/* Keep the bounce animation prompt if needed */}
                      {isLoaded && !isPlaying && !radioPlayPromptHide && (
                        <div className="animate-bounce p-3 text-sm absolute w-[100px] mt-[-58px] text-center">
                          <span className="text-center">Play Radio</span>
                          <div className="m-auto mb-[2px] bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center rotate-180">
                            <FontAwesomeIcon icon={faHandPointer} />
                          </div>
                        </div>
                      )}
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/0 border border-grey-300 shadow-xl flex items-center justify-center">
                        <button
                          onClick={() => {
                            // for the first time user clicks on play only, track the usage of the first track
                            if (!firstInteractionWithPlayDone) {
                              firstInteractionWithPlayDone = true;
                              logTrackUsageMetrics(1);
                            }

                            togglePlay();

                            if (!isCollapsed && !isPlaying) {
                              setIsCollapsed(true);
                            }
                          }}
                          className="focus:outline-none"
                          disabled={!isLoaded}>
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

                    {isCollapsed && (
                      <div className="playProgressBar w-full flex justify-around">
                        <span className="w-[4rem] p-2 text-xs font-sans font-medium text-muted-foreground">{currentTime}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.01"
                          value={progress}
                          onChange={(e) => handleProgressChange(Number(e.target.value))}
                          className="accent-black dark:accent-white w-full bg-white mx-auto focus:outline-none cursor-pointer"
                        />
                        <span className="w-[4rem] p-2 text-xs font-sans font-medium text-muted-foreground">{duration}</span>
                      </div>
                    )}

                    <div className="songCategoryAndTitle flex flex-row w-full justify-center items-center">
                      {trackThatsPlaying.isExplicit && trackThatsPlaying.isExplicit === "1" && (
                        <img
                          className="max-h-[20px] inline mr-2 mt-[-4px] dark:bg-white"
                          src={ratingR}
                          alt="Warning: Explicit Content"
                          title="Warning: Explicit Content"
                        />
                      )}

                      {isCollapsed && (
                        <div className="songCategoryAndTitle flex flex-col w-full justify-center items-center">
                          <span className="text-sm text-foreground/60">Genre: {trackThatsPlaying.category}</span>
                          <span className="text-sm text-muted-foreground">Album: {trackThatsPlaying.album}</span>
                        </div>
                      )}

                      {!isCollapsed && (
                        <div className="ml-2 md:ml-0 flex flex-col select-text mt-2 w-full items-center">
                          <span className="text-sm text-muted-foreground">{trackThatsPlaying.title}</span>{" "}
                          <span className="text-sm text-white">{trackThatsPlaying.artist}</span>
                          <span className="text-sm text-muted-foreground">Album: {trackThatsPlaying.album}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isCollapsed && (
                    <div className="albumControls mb-2 md:mb-0 bgx-green-500 md:w-[500px] select-none p-2 flex items-center justify-between z-10 bgx-yellow-500">
                      <button className="cursor-pointer" onClick={repeatTrack}>
                        <RefreshCcwDot className="w-full hover:scale-105" />
                      </button>

                      <div className="ml-2 xl:pl-8 flex">
                        <div onClick={toggleMute}>{volume === 0 ? <VolumeX /> : volume >= 0.5 ? <Volume2 /> : <Volume1 />}</div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="accent-black dark:accent-white w-[70%] cursor-pointer ml-2"
                        />
                      </div>

                      <button className="mr-2  xl:pr-8" onClick={showPlaylist}>
                        <Library className="w-full hover:scale-105" />
                      </button>
                    </div>
                  )}

                  {isCollapsed && (
                    <div className="absolute right-4 top-2 flex z-10">
                      {albumActionLink && (
                        <div className="actionsLinks flex flex-grow justify-end">
                          <div className="mt-[6px] flex flex-col lg:flex-row space-y-2 lg:space-y-0">
                            {ownershipOfAlbumAndItsIndex > -1 && (
                              <Button
                                disabled={thisIsPlayingOnMainPlayer(trackThatsPlaying)}
                                className={`${isAlbumForFree ? "!text-white" : "!text-black"} text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r ${isAlbumForFree ? "from-yellow-700 to-orange-800" : "from-yellow-300 to-orange-500"} md:mr-[12px]`}
                                variant="ghost"
                                onClick={() => {
                                  const albumInOwnershipListIndex = ownershipOfAlbumAndItsIndex;

                                  if (albumInOwnershipListIndex > -1) {
                                    viewSolData(albumInOwnershipListIndex);
                                  }

                                  if (openActionFireLogic) {
                                    openActionFireLogic();
                                  }
                                }}>
                                <>
                                  <Music2 />
                                  <span className="ml-2">{thisIsPlayingOnMainPlayer(trackThatsPlaying) ? "Playing..." : "Play Album"}</span>
                                </>
                              </Button>
                            )}

                            <Button
                              className={`${isAlbumForFree ? "!text-white" : "!text-black"} text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r ${isAlbumForFree ? "from-yellow-700 to-orange-800" : "from-yellow-300 to-orange-500"}`}
                              variant="ghost"
                              onClick={() => {
                                window.open(albumActionLink)?.focus();
                              }}>
                              <>
                                {isAlbumForFree ? <Gift /> : <ShoppingCart />}
                                <span className="ml-2">{albumActionText}</span>
                              </>
                            </Button>
                          </div>
                        </div>
                      )}

                      {!DISABLE_BITZ_FEATURES && trackThatsPlaying?.bountyId && (
                        <div className={`albumLikes md:w-[135px] flex flex-col ${!albumActionLink ? "flex-grow items-end" : "items-end"}`}>
                          <div
                            className={`${publicKeySol && typeof bountyBitzSumGlobalMapping[trackThatsPlaying.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                            onClick={() => {
                              if (publicKeySol && typeof bountyBitzSumGlobalMapping[trackThatsPlaying.bountyId!]?.bitsSum !== "undefined") {
                                onSendBitzForMusicBounty({
                                  creatorIcon: trackThatsPlaying.cover_art_url,
                                  creatorName: `${trackThatsPlaying.artist}'s ${trackThatsPlaying.title}`,
                                  giveBitzToWho: trackThatsPlaying.creatorWallet,
                                  giveBitzToCampaignId: trackThatsPlaying.bountyId,
                                  isLikeMode: true,
                                });
                              }
                            }}>
                            {typeof bountyBitzSumGlobalMapping[trackThatsPlaying.bountyId]?.bitsSum === "undefined" ? (
                              <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                            ) : (
                              <div
                                className="p-5 md:p-0 flex items-center gap-2"
                                title={publicKeySol ? "Like This Album With 5 BiTz" : "Login to Like This Album"}
                                onClick={() => {
                                  if (publicKeySol) {
                                    onSendBitzForMusicBounty({
                                      creatorIcon: trackThatsPlaying.cover_art_url,
                                      creatorName: `${trackThatsPlaying.artist}'s ${trackThatsPlaying.title}`,
                                      giveBitzToWho: trackThatsPlaying.creatorWallet,
                                      giveBitzToCampaignId: trackThatsPlaying.bountyId,
                                      isLikeMode: true,
                                    });
                                  }
                                }}>
                                {bountyBitzSumGlobalMapping[trackThatsPlaying.bountyId]?.bitsSum}
                                <Heart className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});

async function getRadioStreamsData() {
  try {
    // return [
    //   {
    //     idx: 1,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/MelancholyChristmas.jpg",
    //     title: "Melancholy Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/9691.audio_MelancholyChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "https://drip.haus/itheum/set/7d3117c1-4956-428b-9e2d-d254f19a94a8",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 2,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheSilenceofChristmasTears.jpg",
    //     title: "The Silence of Christmas Tears",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96142.audio_TheSilenceofChristmasTears.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    // ];
    // return [
    //   {
    //     idx: 1,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/MelancholyChristmas.jpg",
    //     title: "Melancholy Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/9691.audio_MelancholyChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "https://drip.haus/itheum/set/7d3117c1-4956-428b-9e2d-d254f19a94a8",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 2,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheSilenceofChristmasTears.jpg",
    //     title: "The Silence of Christmas Tears",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96142.audio_TheSilenceofChristmasTears.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 3,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ChristmasRockBalladSymphony.jpg",
    //     title: "Christmas Rock Ballad Symphony",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96623.audio_ChristmasRockBalladSymphony.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 4,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/AChristmasSymphonyofLove.jpg",
    //     title: "A Christmas Symphony of Love",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96124.audio_AChristmasSymphonyofLove.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 5,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/BaskInTheGlowOfChristmas.jpg",
    //     title: "Bask In The Glow Of Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96305.audio_BaskInTheGlowOfChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 6,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/QuietDreamOfChristmasNight.jpg",
    //     title: "Quiet Dream Of Christmas Night",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96146.audio_QuietDreamOfChristmasNight.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 7,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/RomanianNewYearsEveParty2025.jpg",
    //     title: "Romanian New Years Eve Party 2025",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96677.audio_RomanianNewYearsEveParty2025.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 8,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ANewYearsLove.jpg",
    //     title: "A New Years Love",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96478.audio_ANewYearsLove.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 9,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheDreamer.jpg",
    //     title: "The Dreamer",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeigcoxwp4eco5ply73n3cop2jkjxzjbucpk5qgqj6hf76rhrwz3sg4/4501.audio_TheDreamer.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 10,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/CanYouHearMe.jpg",
    //     title: "Can You Hear Me",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeiftwf3ueqthuaukd2tpw3jynlyoqkjtsadl2ihmrazml2jctor7t4/98712.audio_CanYouHearMe.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 11,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/LifeIsAGift.jpg",
    //     title: "Life Is A Gift",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeiftwf3ueqthuaukd2tpw3jynlyoqkjtsadl2ihmrazml2jctor7t4/98373.audio_LifeIsAGift.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 12,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG13 - GritBeat - Subnautical2",
    //     artist: "GritBeat",
    //     category: "DnB, Trance, Breakbeat",
    //     album: "Subnautical II",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ToxicWaters.jpg",
    //     title: "Toxic Waters",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeienck7ahtjsof3ozjfyczovhrjmmkkkjd6yrnmvrefmv5e62v5cqq/74401.audio_ToxicWaters.Toxic Waters",
    //     ctaBuy: "https://drip.haus/itheum/set/58edad5c-eb49-4812-988c-d4baf04811b3",
    //     dripSet: "https://drip.haus/itheum/set/58edad5c-eb49-4812-988c-d4baf04811b3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar13_a1",
    //     isExplicit: "0",
    //   },
    // ];

    const getRadioStreamAPI = `https://api.itheumcloud.com/app_nftunes/assets/json/radioStreamData.json`;

    const tracksRes = await axios.get(getRadioStreamAPI);
    const tracksData = tracksRes.data;

    return tracksData;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getNFTuneFirstTrackBlobData(trackOne: Track) {
  try {
    const blob = await fetch(trackOne.stream!).then((r) => r.blob());
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (e) {
    console.error(e);
    return "";
  }
}
