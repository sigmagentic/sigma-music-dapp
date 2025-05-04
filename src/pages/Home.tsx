import * as React from "react";
import { HomeSection } from "pages/BodySections/HomeSection";

export const Home = ({
  homeMode,
  setHomeMode,
  triggerToggleRadioPlayback,
}: {
  homeMode: string;
  setHomeMode: (homeMode: string) => void;
  triggerToggleRadioPlayback: string;
}) => {
  return <HomeSection homeMode={homeMode} setHomeMode={setHomeMode} triggerToggleRadioPlayback={triggerToggleRadioPlayback} />;
};
