import React, { useMemo } from "react";
import { Track } from "libs/types";
import { RadioTeaser } from "./RadioTeaser";

type RadioBgCanvasProps = {
  radioTracks: Track[];
  radioTracksLoading: boolean;
  launchRadioPlayer: boolean;
  setLaunchRadioPlayer: (launchRadioPlayer: boolean) => void;
};

export const RadioBgCanvas = (props: RadioBgCanvasProps) => {
  const { radioTracks, radioTracksLoading, launchRadioPlayer, setLaunchRadioPlayer } = props;

  // Create a shuffled version of the tracks using Fisher-Yates shuffle
  const shuffledTracks = useMemo(() => {
    const shuffled = [...radioTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [radioTracks]);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
        <div className="text-2xl xl:text-3xl cursor-pointer mb-3 w-full">
          <div className="flex flex-col md:flex-row justify-between w-full">
            <span className="text-center">Radio</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-[100%] items-start">
          <div className="w-full">
            {/* radio tracks tile animation */}
            <div className="flex flex-col gap-4 p-2 items-start bg-background min-h-[350px] w-full">
              <RadioTeaser
                radioTracks={radioTracks}
                radioTracksLoading={radioTracksLoading}
                launchRadioPlayer={launchRadioPlayer}
                setLaunchRadioPlayer={setLaunchRadioPlayer}
              />
              <div className="track-boxes w-full flex-col items-center grid grid-rows-[150px] auto-rows-[150px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px] ">
                {shuffledTracks.map((radioTrack: Track) => (
                  <div
                    key={radioTrack.idx}
                    className={`flex w-[150px] h-[150px] md:w-[150px] md:h-[150px] m-2 transition-transform duration-200 hover:scale-105 animate-pulse-random`}
                    style={{
                      animationDelay: `${Math.random() * 10}s`,
                      animationDuration: `${8 + Math.random() * 4}s`,
                    }}>
                    <div
                      className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg"
                      style={{
                        backgroundImage: `url(${radioTrack.cover_art_url})`,
                      }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
