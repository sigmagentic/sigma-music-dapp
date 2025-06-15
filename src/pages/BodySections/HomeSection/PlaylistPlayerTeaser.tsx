import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Loader, Music2, CircleStop, Hourglass } from "lucide-react";
import { Button } from "libComponents/Button";
import { MusicTrack } from "libs/types";
import { useAudioPlayerStore } from "store/audioPlayer";

type PlaylistPlayerTeaserProps = {
  playlistTracks: MusicTrack[];
  playlistTracksLoading: boolean;
  loadAsScreenSaver?: boolean;
  isMusicPlayerOpen: boolean;
  setLaunchPlaylistPlayer: (launchPlaylistPlayer: boolean) => void;
  onCloseMusicPlayer: () => void;
  setLaunchPlaylistPlayerWithDefaultTracks: (launchPlaylistPlayerWithDefaultTracks: boolean) => void;
};

export const PlaylistPlayerTeaser = (props: PlaylistPlayerTeaserProps) => {
  const {
    playlistTracks,
    playlistTracksLoading,
    loadAsScreenSaver,
    isMusicPlayerOpen,
    setLaunchPlaylistPlayer,
    onCloseMusicPlayer,
    setLaunchPlaylistPlayerWithDefaultTracks,
  } = props;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { assetPlayIsQueued, updateAssetPlayIsQueued } = useAudioPlayerStore();

  useEffect(() => {
    if (playlistTracks.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % playlistTracks.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(timer);
  }, [playlistTracks]);

  return (
    <div
      className={`select-none ${loadAsScreenSaver ? "min-h-[100dvh]" : "h-[200px]"} bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25 border-[1px] border-foreground/20 relative w-[100%] flex flex-col items-center justify-center rounded-lg mt-2 overflow-hidden`}>
      {playlistTracksLoading || playlistTracks.length === 0 ? (
        <>
          {playlistTracksLoading ? (
            <span className="text-xs">
              <Loader className="w-full text-center animate-spin hover:scale-105 mb-2" />
              Music player powering up
            </span>
          ) : (
            <>{assetPlayIsQueued ? <span className="text-xs">⌛ Music tracks queued</span> : <span className="text-xs">⚠️ Music player unavailable</span>}</>
          )}
        </>
      ) : (
        <div className="playlistTracksTeaser relative flex flex-col items-center justify-center h-[100%] w-[100%] overflow-hidden">
          <AnimatePresence mode="wait">
            {playlistTracks.map(
              (track, index) =>
                currentImageIndex === index && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0.5, scale: 1.2 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full">
                    <img src={track.cover_art_url} alt={`Playlist Track ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                  </motion.div>
                )
            )}
          </AnimatePresence>

          {!loadAsScreenSaver && (
            <Button
              disabled={assetPlayIsQueued}
              onClick={() => {
                if (isMusicPlayerOpen) {
                  updateAssetPlayIsQueued(true);
                  onCloseMusicPlayer();

                  setTimeout(() => {
                    setLaunchPlaylistPlayer(true);
                    setLaunchPlaylistPlayerWithDefaultTracks(true);
                    updateAssetPlayIsQueued(false);
                  }, 5000);
                } else {
                  setLaunchPlaylistPlayer(false);
                  setLaunchPlaylistPlayerWithDefaultTracks(true);
                  updateAssetPlayIsQueued(false);
                }
              }}
              className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:bg-gradient-to-l">
              <>
                {assetPlayIsQueued ? <Hourglass /> : isMusicPlayerOpen ? <CircleStop /> : <Music2 />}
                <span className="ml-2">{isMusicPlayerOpen ? "Stop Music" : assetPlayIsQueued ? "Queued" : "Listen Now"}</span>
              </>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
