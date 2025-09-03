import * as React from "react";
import { RemixMusicSectionContent } from "pages/BodySections/RemixMusicSection";
// import { routeNames } from "routes";

// export function returnRoute(routeKey: string) {
//   return (routeNames as any)[routeKey];
// }

export const Remix = ({ navigateToDeepAppView }: { navigateToDeepAppView: (e: any) => void }) => {
  return <RemixMusicSectionContent navigateToDeepAppView={navigateToDeepAppView} />;
};
