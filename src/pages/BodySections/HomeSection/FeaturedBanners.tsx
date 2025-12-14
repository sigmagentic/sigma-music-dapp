import React, { useEffect, useState } from "react";
import { ALL_MUSIC_GENRES, GenreTier } from "config";
import { Button } from "libComponents/Button";
import { Artist, StreamMetricData } from "libs/types/common";
import { fetchStreamsLeaderboardAllTracksByMonthViaAPI, fetchLatestCollectiblesAvailableViaAPI } from "libs/utils/api";
import { convertTokenImageUrl } from "libs/utils/ui";
import { useAppStore } from "store/app";
import { useAudioPlayerStore } from "store/audioPlayer";
import { PlaylistTile } from "./components/PlaylistTile";

interface FeaturedArtist {
  name: string;
  img: string;
  artistId: string;
  slug: string;
}

interface FeaturedAlbum {
  albumId: string;
  img: string;
  title: string;
  artistSlug: string;
  artistName: string;
}

interface LatestFanCollectibleOption {
  collectibleId: string;
  timestampAdded: string;
  priceInUSD: string;
  artistId: string;
  membershipId: string;
  perkIdsOffered: string[];
  maxMints: string;
  tokenImg: string;
  tokenName: string;
  metadataOnIpfsUrl: string;
}

interface LatestAlbumCollectibleOption {
  collectibleId: string;
  timestampAdded: string;
  priceInUSD: string;
}

export const FeaturedBanners = ({
  onFeaturedArtistDeepLinkSlug,
  selectedCodeForPlaylist,
  isMusicPlayerOpen,
  onPlaylistUpdate,
  navigateToDeepAppView,
  onCloseMusicPlayer,
  setLaunchPlaylistPlayer,
  setLaunchPlaylistPlayerWithDefaultTracks,
  handleLatestAlbumsReceived,
}: {
  onFeaturedArtistDeepLinkSlug: (slug: string) => void;
  selectedCodeForPlaylist: string;
  isMusicPlayerOpen: boolean;
  onPlaylistUpdate: (genre: string) => void;
  navigateToDeepAppView: (logicParams: any) => void;
  onCloseMusicPlayer: () => void;
  setLaunchPlaylistPlayer: (launchPlaylistPlayer: boolean) => void;
  setLaunchPlaylistPlayerWithDefaultTracks: (launchPlaylistPlayerWithDefaultTracks: boolean) => void;
  handleLatestAlbumsReceived: (latestAlbums: FeaturedAlbum[]) => void;
}) => {
  const [streamMetricData, setStreamMetricData] = useState<any[]>([]);
  const [isLoadingMostStreamedTracks, setIsLoadingMostStreamedTracks] = useState(true);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [latestArtists, setLatestArtists] = useState<FeaturedArtist[]>([]);
  const [recentlyUpdatedArtists, setRecentlyUpdatedArtists] = useState<FeaturedArtist[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<FeaturedAlbum[]>([]);
  const [latestAlbums, setLatestAlbums] = useState<FeaturedAlbum[]>([]);
  const [isLoadingFeaturedAlbumsAndArtists, setIsLoadingFeaturedAlbumsAndArtists] = useState(true);
  const { musicTrackLookup, artistLookup, albumLookup, artistLookupEverything, mintsLeaderboard } = useAppStore();
  const [latestInnerCircleOptions, setLatestInnerCircleOptions] = useState<LatestFanCollectibleOption[]>([]);
  const [latestAlbumOptions, setLatestAlbumOptions] = useState<LatestAlbumCollectibleOption[]>([]);
  const [aiRemixReadyAlbums, setAiRemixReadyAlbums] = useState<LatestAlbumCollectibleOption[]>([]);
  const [isLoadingLatestInnerCircleOptions, setIsLoadingLatestInnerCircleOptions] = useState(true);
  const [isLoadingLatestAlbumOptions, setIsLoadingLatestAlbumOptions] = useState(true);
  const [lastClickedGenreForPlaylist, setLastClickedGenreForPlaylist] = useState<string>("");
  const { assetPlayIsQueued, updateAssetPlayIsQueued } = useAudioPlayerStore();

  useEffect(() => {
    if (Object.keys(musicTrackLookup).length === 0 || Object.keys(artistLookup).length === 0 || Object.keys(albumLookup).length === 0) {
      return;
    }

    // Process featured artists
    const featuredArtists = Object.entries(artistLookup)
      .filter(([_, artist]) => artist.isArtistFeatured === "1")
      .map(([artistId, artist]) => ({
        name: artist.name,
        img: artist.img,
        artistId,
        slug: artist.slug,
      }));

    // top 30 latest artists
    const latestArtists = Object.entries(artistLookup)
      .sort((a, b) => {
        const aCreatedOn = parseInt(a[1].createdOn?.toString() || "0");
        const bCreatedOn = parseInt(b[1].createdOn?.toString() || "0");
        return bCreatedOn - aCreatedOn;
      })
      .slice(0, 30)
      .map(([artistId, artist]) => ({
        artistId,
        name: artist.name,
        img: artist.img,
        slug: artist.slug,
      }));

    // top 30 recently updated artists
    const recentlyUpdatedArtists = Object.entries(artistLookup)
      .sort((a, b) => {
        const aLastIndexOn = parseInt(a[1].lastIndexOn?.toString() || "0");
        const bLastIndexOn = parseInt(b[1].lastIndexOn?.toString() || "0");
        return bLastIndexOn - aLastIndexOn;
      })
      .slice(0, 30)
      .map(([artistId, artist]) => ({
        artistId,
        name: artist.name,
        img: artist.img,
        slug: artist.slug,
      }));

    // Process featured albums
    const featuredAlbums = Object.entries(albumLookup)
      .filter(([_, album]) => album.isFeatured === "1")
      .map(([albumId, album]) => ({
        albumId,
        artistSlug: artistLookup[albumId.split("_")[0]].slug,
        artistName: artistLookup[albumId.split("_")[0]].name,
        img: album.img,
        title: album.title,
      }));

    // top 30 latest albums
    const latestAlbums = Object.entries(albumLookup)
      .filter(([_, album]) => album.createdOn && album.createdOn !== "0" && album.isPublished === "1")
      .sort((a, b) => {
        const aTimestamp = parseInt(a[1].createdOn || "0");
        const bTimestamp = parseInt(b[1].createdOn || "0");
        return bTimestamp - aTimestamp;
      })
      .slice(0, 30)
      .map(([albumId, album]) => ({
        albumId,
        artistSlug: artistLookup[albumId.split("_")[0]].slug,
        artistName: artistLookup[albumId.split("_")[0]].name,
        img: album.img,
        title: album.title,
      }));

    setFeaturedArtists(featuredArtists);
    setLatestArtists(latestArtists);
    setFeaturedAlbums(featuredAlbums);
    setLatestAlbums(latestAlbums);
    handleLatestAlbumsReceived(latestAlbums);
    setRecentlyUpdatedArtists(recentlyUpdatedArtists);

    setTimeout(() => {
      setIsLoadingFeaturedAlbumsAndArtists(false);
    }, 2000);
  }, [artistLookup, albumLookup]);

  useEffect(() => {
    const loadStreamsData = async () => {
      try {
        const data = await fetchStreamsLeaderboardAllTracksByMonthViaAPI("0_0", 20);
        const streamsDataWithAlbumTitle = data.map((stream: StreamMetricData) => ({
          ...stream,
          songTitle: musicTrackLookup[stream.alId]?.title,
          coverArtUrl: musicTrackLookup[stream.alId]?.cover_art_url,
          artistName: artistLookup[stream.alId.split("_")[0]]?.name,
        }));

        setStreamMetricData(streamsDataWithAlbumTitle);
      } catch (error) {
        console.error("Error fetching streams data:", error);
      } finally {
        setIsLoadingMostStreamedTracks(false);
      }
    };

    if (Object.keys(musicTrackLookup).length > 0 && Object.keys(artistLookup).length > 0 && Object.keys(albumLookup).length > 0) {
      loadStreamsData();
    }
  }, [musicTrackLookup, artistLookup, albumLookup]);

  useEffect(() => {
    const loadInnerCircleOptions = async () => {
      try {
        const latestInnerCircleOptionsData = await fetchLatestCollectiblesAvailableViaAPI("fan", 20);
        setLatestInnerCircleOptions(latestInnerCircleOptionsData);

        const latestAlbumOptionsData = await fetchLatestCollectiblesAvailableViaAPI("album", 20);
        const latestAlbumsFromEnv = await fetchLatestCollectiblesAvailableViaAPI("album", 100, false);

        // let filter out any items that have a _t2 substring in the collectibleId
        const filteredLatestAlbumOptionsData = latestAlbumOptionsData.filter((item: any) => !item.collectibleId.includes("_t2"));

        // items with t2 can be saves as aiRemixReadyAlbums
        const _aiRemixReadyAlbums = latestAlbumsFromEnv.filter((item: any) => item.collectibleId.includes("_t2"));

        setLatestAlbumOptions(filteredLatestAlbumOptionsData);
        setAiRemixReadyAlbums(_aiRemixReadyAlbums);
      } catch (error) {
        console.error("Error fetching Inner Circle collectible options:", error);
      } finally {
        setIsLoadingLatestInnerCircleOptions(false);
        setIsLoadingLatestAlbumOptions(false);
      }
    };

    if (Object.keys(artistLookupEverything).length > 0) {
      loadInnerCircleOptions();
    }
  }, [artistLookupEverything]);

  useEffect(() => {
    if (selectedCodeForPlaylist && selectedCodeForPlaylist !== "") {
      setLastClickedGenreForPlaylist(""); // we only use it as a "loading" state until the debounce logic kicks in so we can clear it here
    }
  }, [selectedCodeForPlaylist]);

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

  const tier1Genres = ALL_MUSIC_GENRES.filter((genre: any) => genre.tier === GenreTier.TIER1).map((genre: any) => genre.code);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* Tier 1 Genre Playlists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-2">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Editorial Playlists</span>
        </div>
        <div className="relative w-full">
          <div
            className="overflow-x-auto pb-2 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <div className="flex space-x-4 min-w-max px-[8px] py-[4px] pb-[1px]">
              <PlaylistTile
                genre={{
                  code: "foryou",
                  label: "24/7 Radio",
                  tier: null,
                  tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Wen_Summer_Cover.jpg",
                }}
                color={"#fddb45"}
                hoverBgColor={"#fcb535"}
                selectedCodeForPlaylist={selectedCodeForPlaylist}
                lastClickedGenreForPlaylist={lastClickedGenreForPlaylist}
                assetPlayIsQueued={assetPlayIsQueued}
                onCloseMusicPlayer={onCloseMusicPlayer}
                setLastClickedGenreForPlaylist={setLastClickedGenreForPlaylist}
                isMusicPlayerOpen={isMusicPlayerOpen}
                updateAssetPlayIsQueued={updateAssetPlayIsQueued}
                onPlaylistUpdate={onPlaylistUpdate}
                setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
              />
              {tier1Genres.map((genreCode, idx) => {
                const genreObj = ALL_MUSIC_GENRES.find((g) => g.code === genreCode);
                if (!genreObj) return null;
                return (
                  <PlaylistTile
                    key={genreObj.code}
                    genre={genreObj}
                    color={"#fddb45"}
                    hoverBgColor={"#fcb535"}
                    selectedCodeForPlaylist={selectedCodeForPlaylist}
                    lastClickedGenreForPlaylist={lastClickedGenreForPlaylist}
                    assetPlayIsQueued={assetPlayIsQueued}
                    onCloseMusicPlayer={onCloseMusicPlayer}
                    setLastClickedGenreForPlaylist={setLastClickedGenreForPlaylist}
                    isMusicPlayerOpen={isMusicPlayerOpen}
                    updateAssetPlayIsQueued={updateAssetPlayIsQueued}
                    onPlaylistUpdate={onPlaylistUpdate}
                    setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                    setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Most streamed songs */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Most Streamed Songs</span>
        </div>
        {isLoadingMostStreamedTracks || Object.keys(musicTrackLookup).length === 0 ? (
          <LoadingSkeleton />
        ) : streamMetricData.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No music streams data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
                [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {streamMetricData.map((stream, index) => (
                  <div
                    key={stream.alId}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${stream.coverArtUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616d4",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="absolute top-2 left-4 text-2xl font-bold text-yellow-500">#{index + 1}</div>
                    <div className="absolute top-2 right-4 text-4xl">
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-md font-semibold mb-1 text-white text-ellipsis overflow-hidden text-nowrap mt-2">
                        {stream.songTitle && stream.songTitle.length > 0 ? stream.songTitle : stream.alId}
                      </div>
                      {/* <div className="text-3xl font-bold text-orange-500">{stream.streams}</div>
                      <div className="text-sm text-white/70 mb-2">Streams</div> */}
                      <div className="text-xs text-white/70 mb-1">By {stream.artistName}</div>
                      <Button
                        onClick={() => {
                          const artistId = stream.alId.split("_")[0];
                          const albumId = stream.alId.split("-")[0];

                          navigateToDeepAppView({
                            artistSlug: `${artistLookup[artistId].slug}~${albumId}`,
                            toAction: "tracklist",
                            toTrackIdForDeepLink: stream.alId,
                          });
                        }}
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors">
                        Open Track
                      </Button>
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

      {/* Latest artists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Latest Artists</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : latestArtists.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No latest artists data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {latestArtists.map((artist, index) => (
                  <div
                    key={artist.artistId}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${artist.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616a3",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{artist.name}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(artist.slug);
                        }}>
                        Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {latestArtists.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Recently updated artists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Recently Active Artists</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : recentlyUpdatedArtists.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No recently active artists data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {recentlyUpdatedArtists.map((artist, index) => (
                  <div
                    key={artist.artistId}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${artist.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616a3",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{artist.name}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(artist.slug);
                        }}>
                        Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {recentlyUpdatedArtists.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Featured artists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Featured Artists</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : featuredArtists.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No featured artists data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {featuredArtists.map((artist, index) => (
                  <div
                    key={artist.artistId}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${artist.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616a3",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{artist.name}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(artist.slug);
                        }}>
                        Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {featuredArtists.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Latest albums */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Latest Albums</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : latestAlbums.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No latest albums data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {latestAlbums.map((album, index) => (
                  <div
                    key={`${album.albumId}-${index}`}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${album.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616d4",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-1 text-white text-ellipsis overflow-hidden text-nowrap">{album.title}</div>
                      <div className="text-xs text-white/70 mb-1">By {album.artistName}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                        onClick={() => {
                          navigateToDeepAppView({
                            artistSlug: `${album.artistSlug}~${album.albumId}`,
                            toAction: "tracklist",
                          });
                        }}>
                        Listen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {latestAlbums.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Featured albums */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Featured Albums</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : featuredAlbums.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No featured albums data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {featuredAlbums.map((album, index) => (
                  <div
                    key={album.albumId}
                    className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${album.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "multiply",
                      backgroundColor: "#161616d4",
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-1 text-white text-ellipsis overflow-hidden text-nowrap">{album.title}</div>
                      <div className="text-xs text-white/70 mb-1">By {album.artistName}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(`${album.artistSlug}~${album.albumId}`);
                        }}>
                        Listen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {featuredAlbums.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* AI Remix Ready Albums */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">AI Remix Ready Albums</span>
        </div>
        {isLoadingLatestAlbumOptions ? (
          <LoadingSkeleton />
        ) : aiRemixReadyAlbums.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No AI remix ready albums available</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {aiRemixReadyAlbums.map((option) => {
                  // e.g. collectibleId: "ar21_a3_t2"
                  const artistId = option.collectibleId.split("_")[0];
                  const albumId = `${artistId}_${option.collectibleId.split("_")[1]}`;
                  const artistInfo = artistLookupEverything[artistId];
                  const albumInfo = artistInfo?.albums?.find((album: { albumId: string }) => album.albumId === albumId);

                  return (
                    <div
                      key={option.collectibleId}
                      className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        backgroundImage: `url(${albumInfo?.img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundBlendMode: "multiply",
                        backgroundColor: "#161616d4",
                        backgroundRepeat: "no-repeat",
                      }}>
                      <div className="text-center">
                        <div className="text-lg font-semibold mb-1 text-white text-ellipsis overflow-hidden text-nowrap">
                          {albumInfo?.title || "Unknown Album"}
                        </div>
                        <div className="text-xs text-white/70 mb-1">By {artistInfo?.name || "Unknown Artist"}</div>
                        <div className="text-sm text-orange-500 mb-2">${option.priceInUSD}</div>
                        <Button
                          className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                          onClick={() => {
                            if (artistInfo?.slug) {
                              onFeaturedArtistDeepLinkSlug(`${artistInfo.slug}~${albumId}`);
                            }
                          }}>
                          Buy License
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {aiRemixReadyAlbums.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Latest Music Collectible For Sale */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Featured Music Collectibles</span>
        </div>
        {isLoadingLatestAlbumOptions ? (
          <LoadingSkeleton />
        ) : latestAlbumOptions.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No new music collectibles available</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {latestAlbumOptions.map((option) => {
                  const [artistId] = option.collectibleId.split("_");
                  const artistInfo = artistLookupEverything[artistId];
                  const albumInfo = artistInfo?.albums?.find((album: { albumId: string }) => album.albumId === option.collectibleId);

                  return (
                    <div
                      key={option.collectibleId}
                      className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        backgroundImage: `url(${albumInfo?.img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundBlendMode: "multiply",
                        backgroundColor: "#161616d4",
                        backgroundRepeat: "no-repeat",
                      }}>
                      <div className="text-center">
                        <div className="text-lg font-semibold mb-1 text-white text-ellipsis overflow-hidden text-nowrap">
                          {albumInfo?.title || "Unknown Album"}
                        </div>
                        <div className="text-xs text-white/70 mb-1">By {artistInfo?.name || "Unknown Artist"}</div>
                        <div className="text-sm text-orange-500 mb-2">${option.priceInUSD}</div>
                        <Button
                          className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                          onClick={() => {
                            if (artistInfo?.slug) {
                              onFeaturedArtistDeepLinkSlug(`${artistInfo.slug}~${option.collectibleId}`);
                            }
                          }}>
                          Collect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {latestAlbumOptions.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Latest Artist Fan Clubs */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-7">
        <div className="text-xl cursor-pointer w-full">
          <span className="text-lg text-white/70">Featured Artist Fan Clubs</span>
        </div>
        {isLoadingLatestInnerCircleOptions ? (
          <LoadingSkeleton />
        ) : latestInnerCircleOptions.length === 0 ? (
          <p className="text-md mb-10 text-center md:text-left opacity-50">No new Inner Circle collectible available</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-1
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
              <div className="flex space-x-4 min-w-max">
                {latestInnerCircleOptions.map((option) => {
                  const artistInfo = artistLookupEverything[option.artistId];
                  return (
                    <div
                      key={option.collectibleId}
                      className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        backgroundImage: `url(${convertTokenImageUrl(option.tokenImg)})`,
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        backgroundBlendMode: "multiply",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "#16161682",
                      }}>
                      <div className="text-center mt-4">
                        <div className="text-lg font-semibold mb-2 text-white text-ellipsis overflow-hidden text-nowrap">
                          {artistInfo?.name || "Unknown Artist"}
                          <div className="text-sm text-orange-500 mb-2">${option.priceInUSD}</div>
                        </div>
                        <Button
                          className="mt-2 px-3 py-1 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-full transition-colors"
                          onClick={() => {
                            if (artistInfo?.slug) {
                              if (artistInfo?.artistCampaignCode && artistInfo?.artistCampaignCode !== "0") {
                                const campaign = artistInfo?.artistCampaignCode;
                                const country = artistInfo?.artistSubGroup1Code;
                                const team = artistInfo?.artistSubGroup2Code;

                                navigateToDeepAppView({
                                  artistCampaignCode: campaign,
                                  artistSubGroup1Code: country,
                                  artistSubGroup2Code: team,
                                  artistSlug: artistInfo?.slug,
                                });
                              } else {
                                navigateToDeepAppView({
                                  artistSlug: artistInfo?.slug,
                                  artistProfileTab: "fan",
                                });
                              }
                            }
                          }}>
                          Join Fan Club
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {latestInnerCircleOptions.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
