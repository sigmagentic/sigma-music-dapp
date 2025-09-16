import * as React from "react";
import { RemixMusicSectionContent } from "pages/BodySections/RemixMusicSection";
import { MusicTrack } from "libs/types";
// import { routeNames } from "routes";

// export function returnRoute(routeKey: string) {
//   return (routeNames as any)[routeKey];
// }

interface RemixContentProps {
  navigateToDeepAppView: (e: any) => void;
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
}

export const Remix = (props: RemixContentProps) => {
  const { navigateToDeepAppView, onCloseMusicPlayer, viewSolData } = props;
  return <RemixMusicSectionContent navigateToDeepAppView={navigateToDeepAppView} onCloseMusicPlayer={onCloseMusicPlayer} viewSolData={viewSolData} />;
};
