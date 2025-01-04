import React, { useEffect, useState, memo } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { Loader, Pause, Music2, Play, RefreshCcwDot, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Gift, ShoppingCart, Heart, CircleX } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./AudioPlayer.css";
import { useDebouncedCallback } from "use-debounce";
import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import ratingR from "assets/img/nf-tunes/rating-R.png";
import { Button } from "libComponents/Button";
import { BountyBitzSumMapping, GiftBitzToArtistMeta, Track } from "libs/types";
import { getApiWeb2Apps } from "libs/utils";
import { toastClosableError } from "libs/utils/uiShared";
import { fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/AppMarketplace/NFTunes";
import { getBestBuyCtaLink } from "pages/AppMarketplace/NFTunes/types/utils";

type RadioPlayerProps = {
  stopRadioNow?: boolean;
  noAutoPlay?: boolean;
  onPlayHappened?: any;
  checkOwnershipOfAlbum: (e: any) => any;
  viewSolData: (e: number) => void;
  openActionFireLogic?: any;
  solBitzNfts?: any;
  onSendBitzForMusicBounty: (e: any) => any;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  setMusicBountyBitzSumGlobalMapping: any;
  userHasNoBitzDataNftYet: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
};

let firstInteractionWithPlayDone = false; // a simple flag so we can track usage on 1st time user clicks on play (as the usage for first track wont capture like other tracks)
let firstMusicQueueDone = false;

export const RadioPlayer = memo(function RadioPlayerBase(props: RadioPlayerProps) {
  const {
    stopRadioNow,
    onPlayHappened,
    checkOwnershipOfAlbum,
    viewSolData,
    openActionFireLogic,
    solBitzNfts,
    onSendBitzForMusicBounty,
    bountyBitzSumGlobalMapping,
    setMusicBountyBitzSumGlobalMapping,
    userHasNoBitzDataNftYet,
    dataNftPlayingOnMainPlayer,
  } = props;

  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [audio] = useState(new Audio());
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
    if (audio.currentTime == 0) togglePlay();
  }

  function eventToAttachPlaying() {
    setIsPlaying(true);

    if (onPlayHappened) {
      onPlayHappened(true);
    }
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
    audio.addEventListener("ended", eventToAttachEnded);
    audio.addEventListener("timeupdate", eventToAttachTimeUpdate);
    audio.addEventListener("canplaythrough", eventToAttachCanPlayThrough);
    audio.addEventListener("playing", eventToAttachPlaying);

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
      audio.pause();
      audio.removeEventListener("ended", eventToAttachEnded);
      audio.removeEventListener("timeupdate", eventToAttachTimeUpdate);
      audio.removeEventListener("canplaythrough", eventToAttachCanPlayThrough);
      audio.removeEventListener("playing", eventToAttachPlaying);
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
      let currSongObj = null;
      let getAlbumActionText = null;
      let getAlbumActionLink = null;
      let getIsAlbumForFree = false;
      let checkedOwnershipOfAlbumAndItsIndex = -1;

      if (radioTracks && radioTracks.length > 0) {
        currSongObj = radioTracks[currentTrackIndex];
        checkedOwnershipOfAlbumAndItsIndex = checkOwnershipOfAlbum(currSongObj);

        const ctaBuyLink = getBestBuyCtaLink({ ctaBuy: currSongObj?.ctaBuy, dripSet: currSongObj?.dripSet });

        if (ctaBuyLink) {
          getAlbumActionLink = ctaBuyLink;
          getAlbumActionText = checkedOwnershipOfAlbumAndItsIndex > -1 ? "Buy More Album Copies" : "Buy Album";
        } else if (currSongObj?.airdrop) {
          getAlbumActionLink = currSongObj.airdrop;
          getAlbumActionText = "Get Album Airdrop!";
          getIsAlbumForFree = true;
        }
      }

      // the song playing is the current track in the radioTracks array
      const _trackThatsPlaying = radioTracks[currentTrackIndex];

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
  }, [audio.src]);

  useEffect(() => {
    audio.pause();
    audio.src = "";
    setIsPlaying(false);
    setIsLoaded(false);
    handleChangeSong();

    // we clone the song data here so as to no accidentally mutate things
    // we debounce this, so that - if the user is jumping tabs.. it wait until they stop at a tab for 2.5 S before running the complex logic
    // we also only get the data AFTER the track is fetched or else this gets called 2 times
    if (songSource[radioTracks[currentTrackIndex]?.idx] && songSource[radioTracks[currentTrackIndex]?.idx] !== "Fetching") {
      if (radioTracks[currentTrackIndex]?.bountyId && radioTracks[currentTrackIndex]?.creatorWallet && radioTracks[currentTrackIndex]?.albums) {
        const bounty: GiftBitzToArtistMeta = {
          bountyId: radioTracks[currentTrackIndex].bountyId,
          creatorWallet: radioTracks[currentTrackIndex].creatorWallet,
          albums: radioTracks[currentTrackIndex].albums,
        };

        debounced_fetchBitzPowerUpsAndLikesForSelectedArtist(bounty);
      }
    }
  }, [currentTrackIndex, songSource[radioTracks[currentTrackIndex]?.idx]]);

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
    setCurrentTime(audio.currentTime ? formatTime(audio.currentTime) : "00:00");
    setDuration(audio.duration ? formatTime(audio.duration) : "00:00");
    let _percentage = (audio.currentTime / audio.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    } else {
      if (audio.readyState >= 2) {
        if (!firstMusicQueueDone) {
          // its the first time the radio loaded and the first track is ready, but we don't auto play
          // ... we use a local global variable here instead of state var as its only needed once
          firstMusicQueueDone = true;
        } else {
          // Audio is loaded, play it.
          audio.play();

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
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    audio.volume = newVolume;
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
    audio.currentTime = 0;
    if (isPlaying) audio.play();
  };

  const handleProgressChange = (newProgress: number) => {
    if (!audio.duration) return;
    const newTime = (newProgress / 100) * audio.duration;
    audio.currentTime = newTime;
    setCurrentTime(formatTime(audio.currentTime));
    setProgress(newProgress);
  };

  const handleChangeSong = () => {
    // we should not do the image loading logic on until user interacts with play, or there is a race condition and 1st image stays blurred
    if (firstMusicQueueDone) {
      setImgLoading(true);
    }

    const index = radioTracks[currentTrackIndex]?.idx;

    if (songSource[index]) {
      // if we previously fetched the song and it was an error, show again the exact error.
      if (songSource[index].includes("Error:")) {
        console.error(songSource[index]);
        toastClosableError("Could not load song due to network error. Please try the next track");
      } else if (!(songSource[index] === "Fetching")) {
        audio.src = songSource[index];
        audio.load();
        updateProgress();
        audio.currentTime = 0;

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

  return (
    <>
      {radioTracksLoading ||
        (radioTracks.length === 0 && (
          <div className="select-none h-[150px] bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25 border-[1px] border-foreground/40 relative md:w-[100%] flex flex-col items-center justify-center rounded-xl mt-2 p-3">
            {radioTracksLoading ? (
              <span className="text-xs">
                <Loader className="w-full text-center animate-spin hover:scale-105 mb-2" />
                Radio service powering up...
              </span>
            ) : (
              <span className="text-xs">⚠️ Radio service unavailable</span>
            )}
          </div>
        ))}

      <div className="text-2xl xl:text-3xl cursor-pointer mb-3 w-full">
        <div className="">Listen for free</div>
        {isCollapsed && (
          <Button
            className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 cursor-pointer"
            variant="outline"
            onClick={() => {
              setIsCollapsed(false);
            }}>
            Restore radio player
          </Button>
        )}
      </div>

      <div className={`${isCollapsed ? "w-full fixed left-0 bottom-0 z-50" : "w-full"}`}>
        <div className="debug bg-yellow-500 w-full h-full text-xs">
          nfTunesRadioFirstTrackCachedBlob = {nfTunesRadioFirstTrackCachedBlob} <br />
          radioTracks.length = {radioTracks.length} <br />
          albumActionLink = {albumActionLink} <br />
          albumActionText = {albumActionText} <br />
          isAlbumForFree = {isAlbumForFree.toString()} <br />
          trackThatsPlaying = {JSON.stringify(trackThatsPlaying)} <br />
          ownershipOfAlbumAndItsIndex = {ownershipOfAlbumAndItsIndex} <br />
        </div>
        <div className="relative w-full border-[1px] border-foreground/40 rounded-xl bg-black">
          <div className="player flex flex-col md:flex-row select-none md:h-[200px] bgx-red-800 relative w-full border-t-[1px] border-foreground/10">
            <button
              className="select-none absolute top-0 left-0 flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden"
              onClick={() => {
                stopPlaybackNow();
                setIsCollapsed(false);
              }}>
              <CircleX className="w-6 h-6" />
            </button>

            <div className="songInfo md:w-[500px] px-10 pt-2 md:pt-10 pb-4 flex flex-row items-center mt-5 md:mt-0">
              <img
                src={radioTracks ? radioTracks[currentTrackIndex]?.cover_art_url : ""}
                alt="Album Cover"
                className={`select-none w-[100px] h-[100px] rounded-md md:mr-6 border border-grey-900 ${imgLoading ? "blur-sm" : "blur-none"}`}
                onLoad={() => {
                  setImgLoading(false);
                }}
                onError={({ currentTarget }) => {
                  currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                }}
              />

              <div className="ml-2 md:ml-0 flex flex-col select-text mt-2">
                <div>
                  <span className="text-sm text-muted-foreground">{radioTracks[currentTrackIndex]?.title}</span>{" "}
                </div>

                <span className="text-sm text-white">{radioTracks[currentTrackIndex]?.artist}</span>
              </div>
            </div>

            <div className="songControls bgx-blue-500 gap-2 text-foreground select-none w-full flex flex-col justify-center items-center px-2">
              <div className="controlButtons flex w-full justify-around">
                <button className="cursor-pointer" onClick={handlePrevButton}>
                  <SkipBack className="w-full hover:scale-105" />
                </button>
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/0 border border-grey-300 shadow-xl flex items-center justify-center">
                  <button
                    onClick={() => {
                      // for the first time user clicks on play only, track the usage of the first track
                      if (!firstInteractionWithPlayDone) {
                        firstInteractionWithPlayDone = true;
                        logTrackUsageMetrics(1);
                      }

                      togglePlay();

                      if (!isCollapsed) {
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

              <div className="songCategoryAndTitle flex flex-row w-full justify-center items-center">
                {radioTracks[currentTrackIndex]?.isExplicit && radioTracks[currentTrackIndex]?.isExplicit === "1" && (
                  <img
                    className="max-h-[20px] inline mr-2 mt-[-4px] dark:bg-white"
                    src={ratingR}
                    alt="Warning: Explicit Content"
                    title="Warning: Explicit Content"
                  />
                )}
                <span className="text-sm text-muted-foreground">Album: {radioTracks[currentTrackIndex]?.album}</span>
              </div>

              {/* Keep the bounce animation prompt if needed */}
              {/* {isLoaded && !isPlaying && !radioPlayPromptHide && (
              <div className="animate-bounce p-3 text-sm absolute w-[100px] ml-[-18px] mt-[5px] text-center">
                <div className="m-auto mb-[2px] bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faHandPointer} />
                </div>
                <span className="text-center">Play Radio</span>
              </div>
            )} */}
            </div>

            <div className="albumControls mb-2 md:mb-0 bgx-green-500 md:w-[500px] select-none p-2 rounded-b-xl flex items-center justify-between z-10">
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
            </div>

            <div className="bg-red-500 absolute right-0 flex z-10">
              {albumActionLink && (
                <div className="actionsLinks flex flex-grow justify-end">
                  <div className="mt-[6px] flex flex-col lg:flex-row space-y-2 lg:space-y-0">
                    {ownershipOfAlbumAndItsIndex > -1 && (
                      <Button
                        disabled={thisIsPlayingOnMainPlayer(trackThatsPlaying)}
                        className={`${isAlbumForFree ? "!text-white" : "!text-black"} text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r ${isAlbumForFree ? "from-yellow-700 to-orange-800" : "from-yellow-300 to-orange-500"}  transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 md:mr-[12px]`}
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
                      className={`${isAlbumForFree ? "!text-white" : "!text-black"} text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r ${isAlbumForFree ? "from-yellow-700 to-orange-800" : "from-yellow-300 to-orange-500"}  transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100`}
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

              {trackThatsPlaying?.bountyId && (
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
          </div>
        </div>
      </div>
    </>
  );
});

async function getRadioStreamsData() {
  try {
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
