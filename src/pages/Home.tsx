import * as React from "react";
import { routeNames } from "routes";
import { NFTunes } from "pages/AppMarketplace/NFTunes";

export function returnRoute(routeKey: string) {
  return (routeNames as any)[routeKey];
}

export const Home = () => {
  return (
    <>
      <div className="flex flex-col py-2 px-4 md:px-0">
        <NFTunes />
      </div>
    </>
  );
};
