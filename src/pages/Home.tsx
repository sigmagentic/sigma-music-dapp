import * as React from "react";
import { HomeSection } from "pages/BodySections/HomeSection";
// import { routeNames } from "routes";

// export function returnRoute(routeKey: string) {
//   return (routeNames as any)[routeKey];
// }

export const Home = ({ homeMode, setHomeMode }: { homeMode: string; setHomeMode: (homeMode: string) => void }) => {
  return <HomeSection homeMode={homeMode} setHomeMode={setHomeMode} />;
};
