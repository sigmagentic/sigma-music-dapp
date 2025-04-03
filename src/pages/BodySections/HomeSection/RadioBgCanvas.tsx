import React from "react";
import { MusicTrack } from "libs/types";
import { RadioTeaser } from "./RadioTeaser";

type RadioBgCanvasProps = {
  radioTracks: MusicTrack[];
  radioTracksLoading: boolean;
  launchRadioPlayer: boolean;
  setLaunchRadioPlayer: (launchRadioPlayer: boolean) => void;
};

export const RadioBgCanvas = (props: RadioBgCanvasProps) => {
  const { radioTracks, radioTracksLoading, launchRadioPlayer, setLaunchRadioPlayer } = props;

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
        <div className="flex flex-col md:flex-row w-[100%] items-start h-[100dvh]">
          <div className="w-full h-full">
            {/* radio tracks tile animation */}
            <div className="flex flex-col gap-4 p-2 items-start bg-background h-full">
              <RadioTeaser
                radioTracks={radioTracks}
                radioTracksLoading={radioTracksLoading}
                launchRadioPlayer={launchRadioPlayer}
                setLaunchRadioPlayer={setLaunchRadioPlayer}
                loadAsScreenSaver={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
