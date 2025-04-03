import React from "react";
import { Button } from "libComponents/Button";

export const FeaturedBanners = ({ onFeaturedArtistDeepLinkSlug }: { onFeaturedArtistDeepLinkSlug: (slug: string) => void }) => {
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
          <span className="">Featured Album Releases</span>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center w-full gap-4">
          <div
            id="featured1"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Streetz_Cover.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">YFGP's "Streetz" is Live!</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("yfgp");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
          <div
            id="featured2"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Elevated_Cover.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">YFGP's "Elevated" is Live!</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("yfgp");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
          <div
            id="featured3"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/MASTERLOOPZ_TMF_Cover_Art.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">Masterloopz's "Into The Future" is Live!</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("masterloopz-tmf");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
          <span className="">Featured Artists</span>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center w-full gap-4">
          <div
            id="featured1"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/images/artist_profile/manu.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">YFGP</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("yfgp");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
          <div
            id="featured3"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/Masterloopz_TMF_Artist_Picture.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">Masterloopz</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("masterloopz-tmf");
                }}>
                Collect & Listen
              </Button>
            </div>
          </div>
          <div
            id="featured2"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/TKO_Banner.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">TKO</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("tko");
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
