import { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, Heart, Library, Loader, Pause, Play, RefreshCcwDot, SkipBack, SkipForward, Volume1, Volume2, VolumeX, CircleX } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./AudioPlayer.css";
import DEFAULT_SONG_IMAGE from "assets/img/audio-player-image.png";
import DEFAULT_SONG_LIGHT_IMAGE from "assets/img/audio-player-light-image.png";
import { MARSHAL_CACHE_DURATION_SECONDS } from "config";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { toastClosableError } from "libs/utils/uiShared";
import { useAccountStore } from "store/account";

type SolAudioPlayerFooterBarProps = {
  dataNftToOpen?: DasApiAsset;
  trackList: any[];
  firstSongBlobUrl?: string;
  onSendBitzForMusicBounty: (e: any) => any;
  bitzGiftingMeta?: {
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null;
  bountyBitzSumGlobalMapping?: any;
  onClosePlayer: () => void;
};

export const SolAudioPlayerFooterBar = (props: SolAudioPlayerFooterBarProps) => {
  const { dataNftToOpen, trackList, firstSongBlobUrl, onSendBitzForMusicBounty, bitzGiftingMeta, bountyBitzSumGlobalMapping, onClosePlayer } = props;
  const theme = localStorage.getItem("explorer-ui-theme");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [displayTrackList, setDisplayTrackList] = useState(false);
  const [audio] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("00:00");
  const [isLoaded, setIsLoaded] = useState(false);
  const { publicKey, signMessage } = useWallet();
  const [songSource, setSongSource] = useState<{ [key: number]: string }>({}); // map to keep the already fetched trackList
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
  const [imgLoading, setImgLoading] = useState(false);

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  useEffect(() => {
    if (trackList && trackList.length > 0 && firstSongBlobUrl && firstSongBlobUrl !== "") {
      if (firstSongBlobUrl) {
        setSongSource((prevState) => ({
          ...prevState, // keep all other key-value pairs
          [1]: firstSongBlobUrl, // update the value of the first index
        }));
      }

      audio.addEventListener("ended", function () {
        setCurrentTrackIndex((prevCurrentTrackIndex) => (prevCurrentTrackIndex < trackList.length - 1 ? prevCurrentTrackIndex + 1 : 0));
      });

      audio.addEventListener("timeupdate", updateProgress);

      audio.addEventListener("canplaythrough", function () {
        // Audio is ready to be played
        setIsLoaded(true);
        updateProgress();
        // play the song
        if (audio.currentTime == 0) {
          togglePlay();
        }
      });

      // here we queue all the songs in the trackList by advanced fetching them from Marshal
      if (trackList && trackList.length > 0) {
        trackList.forEach((song: any) => {
          if (song.idx === 1) return; // the first some will be cached by the firstSongBlobUrl
          fetchMarshalForSong(song.idx);
        });
        updateProgress();
      }

      return () => {
        audio.pause();
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("canplaythrough", function () {
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
    }
  }, [trackList, firstSongBlobUrl]);

  useEffect(() => {
    updateProgress();
  }, [audio.src]);

  useEffect(() => {
    if (firstSongBlobUrl)
      setSongSource((prevState) => ({
        ...prevState, // keep all other key-value pairs
        [1]: firstSongBlobUrl, // update the value of the first index
      }));
  }, [firstSongBlobUrl]);

  useEffect(() => {
    audio.pause();
    audio.src = "";
    setIsPlaying(false);
    setIsLoaded(false);
    handleChangeSong();
  }, [currentTrackIndex, songSource[trackList[currentTrackIndex]?.idx]]);

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
          } else {
            setSongSource((prevState) => ({
              ...prevState,
              [index]: "Error: " + res.status + " " + res.statusText,
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
      }
    } else {
      if (audio.readyState >= 2) {
        // Audio is loaded, play it.
        audio.play();
      } else {
        toastClosableError("Audio not ready yet. Waiting for loading to complete...");
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    audio.volume = newVolume;
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
    const index = trackList[currentTrackIndex]?.idx;

    if (songSource[index]) {
      // if we previously fetched the song and it was an error, show again the exact error.
      if (songSource[index].includes("Error:")) {
        toastClosableError(songSource[index]);
      } else if (!(songSource[index] === "Fetching")) {
        audio.src = songSource[index];
        audio.load();
        updateProgress();
        audio.currentTime = 0;
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

  return (
    <div className="relative w-full border-[1px] border-foreground/40 rounded-xl bg-black">
      <div className="debug hidden bg-yellow-400 text-black p-2 w-full text-xs">
        <p className="mb-2">trackList = {JSON.stringify(trackList)}</p>
        <p className="mb-2">firstSongBlobUrl = {firstSongBlobUrl}</p>
        <p className="mb-2">isPlaying = {isPlaying.toString()}</p>
      </div>

      {!firstSongBlobUrl ? (
        <div className="flex flex-col items-center justify-center h-[200px]">
          <Loader className="w-full text-center animate-spin hover:scale-105" />
          <p className="text-center text-foreground text-xs mt-3">hold tight, streaming music from the blockchain...</p>
        </div>
      ) : (
        <>
          {displayTrackList && (
            <div className="trackList w-[300px] md:w-[93%] mt-1 mb-2 pt-3 mx-auto bgx-green-500">
              <button
                className="select-none absolute top-0 right-0 flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden"
                onClick={() => setDisplayTrackList(false)}>
                <ChevronDown className="w-6 h-6" />
              </button>
              <h4 className="flex justify-center select-none font-semibold text-foreground mb-3 !text-xl">{`Tracklist ${trackList.length} songs`} </h4>
              <Slider {...settings}>
                {trackList.map((song: any, index: number) => {
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
          )}

          <div className="player flex flex-col md:flex-row select-none md:h-[200px] bgx-red-800 relative w-full border-t-[1px] border-foreground/10">
            <button
              className="select-none absolute top-0 left-0 flex flex-col items-center justify-center md:flex-row bg-[#fafafa]/50 dark:bg-[#0f0f0f]/25 p-2 gap-2 text-xs cursor-pointer transition-shadow rounded-2xl overflow-hidden"
              onClick={() => onClosePlayer()}>
              <CircleX className="w-6 h-6" />
            </button>

            <div className="songInfo md:w-[500px] px-10 pt-2 md:pt-10 pb-4 flex flex-row items-center mt-5 md:mt-0">
              <img
                src={trackList ? trackList[currentTrackIndex]?.cover_art_url : ""}
                alt="Album Cover"
                className={`select-none w-[100px] h-[100px] rounded-md md:mr-6 border border-grey-900 ${imgLoading ? "blur-sm" : "blur-none"}`}
                onLoad={() => {
                  setImgLoading(false);
                }}
                onError={({ currentTarget }) => {
                  currentTarget.src = theme === "light" ? DEFAULT_SONG_LIGHT_IMAGE : DEFAULT_SONG_IMAGE;
                }}
              />
              <div className="ml-2 flex flex-col select-text mt-2">
                <div>
                  <span className="text-sm text-muted-foreground">{trackList[currentTrackIndex]?.title}</span>{" "}
                </div>

                <span className="text-sm text-white">{trackList[currentTrackIndex]?.artist}</span>
              </div>
            </div>

            <div className="songControls bgx-blue-500 gap-2 text-foreground select-none w-full flex flex-col justify-center items-center px-2">
              <div className="controlButtons flex w-full justify-around">
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

              <div className="flex flex-col w-full justify-center items-center">
                <span className="text-sm text-foreground/60">{trackList[currentTrackIndex]?.category}</span>
                <span className="text-sm text-muted-foreground">Album: {trackList[currentTrackIndex]?.album}</span>
              </div>
            </div>

            <div className="albumControls mb-2 md:mb-0 bgx-green-500 md:w-[500px] select-none p-2 rounded-b-xl flex items-center justify-between z-10">
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

              <button className="mr-2  xl:pr-8" onClick={showPlaylist}>
                <Library className="w-full hover:scale-105" />
              </button>
            </div>

            {/* like album */}
            {bitzGiftingMeta && (
              <div
                className={`absolute right-2 top-4 text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center cursor-pointer`}
                onClick={() => {
                  likeAlbumWithBiTz(trackList[currentTrackIndex]);
                }}>
                <div
                  className="p-5 md:p-0 flex items-center gap-2"
                  title={"Like This Album With 5 BiTz"}
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
