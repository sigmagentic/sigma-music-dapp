import React from "react";
import { Button } from "libComponents/Button";
import { scrollToSection } from "libs/utils/ui";

export const FeaturedBanners = ({ onFeaturedArtistDeepLinkSlug }: { onFeaturedArtistDeepLinkSlug: (slug: string) => void }) => {
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start">
        <div className="text-2xl xl:text-3xl cursor-pointer w-full">
          <span className="">Featured releases</span>
        </div>

        <div className="flex flex-col justify-center items-center w-full">
          <div
            id="featured1"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[330px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/Bobby_Ibo_Finding_Bliss.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">Bobby Ibo's "Finding Bliss" is Live!</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("bobby-ibo");
                  scrollToSection("artist-profile");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
          <div
            id="featured2"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[330px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/ANXELS.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">ANXELS "In the Beginning…" is Live!</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("anxels");
                  scrollToSection("artist-profile");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
