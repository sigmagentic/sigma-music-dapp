import * as React from "react";
import { HomeSection } from "pages/BodySections/HomeSection";

export const Home = ({ homeMode, setHomeMode }: { homeMode: string; setHomeMode: (homeMode: string) => void }) => {
  return <HomeSection homeMode={homeMode} setHomeMode={setHomeMode} />;
};
