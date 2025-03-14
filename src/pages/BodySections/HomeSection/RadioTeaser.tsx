import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Loader, Music2, CircleStop, Hourglass } from "lucide-react";
import { Button } from "libComponents/Button";
import { Track } from "libs/types";
import { useAudioPlayerStore } from "store/audioPlayer";

type RadioTeaserProps = {
  radioTracks: Track[];
  radioTracksLoading: boolean;
  launchRadioPlayer: boolean;
  setLaunchRadioPlayer: (launchRadioPlayer: boolean) => void;
};

export const RadioTeaser = (props: RadioTeaserProps) => {
  const { radioTracks, radioTracksLoading, launchRadioPlayer, setLaunchRadioPlayer } = props;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { trackPlayIsQueued, albumPlayIsQueued } = useAudioPlayerStore();

  useEffect(() => {
    if (radioTracks.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % radioTracks.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(timer);
  }, [radioTracks]);

  return (
    <div className="select-none h-[200px] bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25 border-[1px] border-foreground/20 relative w-[100%] flex flex-col items-center justify-center rounded-lg mt-2 overflow-hidden">
      {radioTracksLoading || radioTracks.length === 0 ? (
        <>
          {radioTracksLoading ? (
            <span className="text-xs">
              <Loader className="w-full text-center animate-spin hover:scale-105 mb-2" />
              Free radio music service powering up...
            </span>
          ) : (
            <span className="text-xs">⚠️ Radio service unavailable</span>
          )}
        </>
      ) : (
        <div className="radioTracksTeaser relative flex flex-col items-center justify-center h-[100%] w-[100%] overflow-hidden">
          <AnimatePresence mode="wait">
            {radioTracks.map(
              (track, index) =>
                currentImageIndex === index && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0.5, scale: 1.2 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full">
                    <img src={track.cover_art_url} alt={`Radio Track ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                  </motion.div>
                )
            )}
          </AnimatePresence>

          <Button
            disabled={trackPlayIsQueued || albumPlayIsQueued}
            onClick={() => {
              if (launchRadioPlayer) {
                setLaunchRadioPlayer(false);
              } else {
                setLaunchRadioPlayer(true);
              }
            }}
            className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
            <>
              {trackPlayIsQueued || albumPlayIsQueued ? <Hourglass /> : launchRadioPlayer ? <CircleStop /> : <Music2 />}
              <span className="ml-2">{launchRadioPlayer ? "Stop Radio" : "Start Radio"}</span>
            </>
          </Button>
        </div>
      )}
    </div>
  );
};
