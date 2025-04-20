import React, { useEffect, useState } from "react";
import { Button } from "libComponents/Button";
import { StreamMetricData } from "libs/types/common";
import { fetchStreamsLeaderboardAllTracksByMonthViaAPI } from "libs/utils/misc";
import { useAppStore } from "store/app";

export const FeaturedBanners = ({ onFeaturedArtistDeepLinkSlug }: { onFeaturedArtistDeepLinkSlug: (slug: string) => void }) => {
  const [streamMetricData, setStreamMetricData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { musicTrackLookup, artistLookup, albumLookup } = useAppStore();

  useEffect(() => {
    const loadStreamsData = async () => {
      try {
        const data = await fetchStreamsLeaderboardAllTracksByMonthViaAPI("0_0");
        const streamsDataWithAlbumTitle = data.map((stream: StreamMetricData) => ({
          ...stream,
          songTitle: musicTrackLookup[stream.alid]?.title,
          coverArtUrl: musicTrackLookup[stream.alid]?.cover_art_url,
        }));

        setStreamMetricData(streamsDataWithAlbumTitle);
      } catch (error) {
        console.error("Error fetching streams data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (Object.keys(musicTrackLookup).length > 0 && Object.keys(artistLookup).length > 0 && Object.keys(albumLookup).length > 0) {
      loadStreamsData();
    }
  }, [musicTrackLookup, artistLookup, albumLookup]);

  const handleOpenAlbum = (alid: string) => {
    // Extract album ID from alid (e.g., "ar24_a1-1" -> "ar24_a1")
    const albumId = alid.split("-")[0];
    const artistId = albumId.split("_")[0];
    const artistSlug = artistLookup[artistId].slug;
    onFeaturedArtistDeepLinkSlug(`${artistSlug}~${albumId}`);
  };

  const LoadingSkeleton = () => (
    <div className="relative w-full">
      <div className="pb-4 mt-5">
        <div className="flex space-x-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 h-48 bg-muted/50 rounded-lg p-6 flex flex-col justify-between relative animate-pulse">
              <div className="absolute top-2 left-4 w-8 h-8 bg-muted rounded-full"></div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-muted rounded-full"></div>
              <div className="text-center mt-6">
                <div className="h-6 w-3/4 bg-muted rounded mx-auto mb-4"></div>
                <div className="h-10 w-1/2 bg-muted rounded mx-auto"></div>
                <div className="h-4 w-1/3 bg-muted rounded mx-auto mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
          <span className="">Most Streamed Songs</span>
        </div>
        {isLoading || Object.keys(musicTrackLookup).length === 0 ? (
          <LoadingSkeleton />
        ) : streamMetricData.length === 0 ? (
          <p className="text-xl mb-10 text-center md:text-left opacity-50">No music streams data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-5
                [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {streamMetricData.map((stream, index) => (
                  <div
                    key={stream.alid}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${stream.coverArtUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616d4",
                    }}>
                    <div className="absolute top-2 left-4 text-2xl font-bold text-orange-500">#{index + 1}</div>
                    <div className="absolute top-2 right-4 text-4xl">
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white">
                        {stream.songTitle && stream.songTitle.length > 0 ? stream.songTitle : stream.alid}
                      </div>
                      <div className="text-3xl font-bold text-orange-500">{stream.streams}</div>
                      <div className="text-sm text-white/70 mb-2">Streams</div>
                      <button
                        onClick={() => handleOpenAlbum(stream.alid)}
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 rounded-full transition-colors">
                        Open Containing Album
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {streamMetricData.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
          <span className="">New Albums To Collect</span>
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
                  onFeaturedArtistDeepLinkSlug("yfgp~ar2_a5");
                }}>
                Listen & Collect
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
                  onFeaturedArtistDeepLinkSlug("yfgp~ar2_a7");
                }}>
                Listen & Collect
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
                  onFeaturedArtistDeepLinkSlug("masterloopz-tmf~a22_a1");
                }}>
                Listen & Collect
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
                Listen & Collect
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
                Listen & Collect
              </Button>
            </div>
          </div>

          <div
            id="featured3"
            className="flex md:flex-1 mt-2 min-h-[200px] md:h-[300px] bg-no-repeat bg-cover rounded-3xl w-[100%] border-[1px] border-foreground/20"
            style={{
              "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/img/ANXELS.jpg)`,
              "backgroundBlendMode": "multiply",
              "backgroundColor": "#161616a3",
            }}>
            <div className="flex flex-col h-[100%] m-auto justify-center items-center">
              <h1 className="!text-lg !text-white text-center md:!text-2xl mb-5">Anxels</h1>

              <Button
                className="!text-black text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100"
                onClick={() => {
                  onFeaturedArtistDeepLinkSlug("anxels");
                }}>
                Listen & Collect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
