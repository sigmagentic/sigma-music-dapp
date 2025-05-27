import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { ALL_MUSIC_GENRES, GenreTier } from "config";
import { Button } from "libComponents/Button";
import { StreamMetricData } from "libs/types/common";
import { fetchStreamsLeaderboardAllTracksByMonthViaAPI, fetchLatestCollectiblesAvailableViaAPI } from "libs/utils/misc";
import { convertTokenImageUrl } from "libs/utils/ui";
import { useAppStore } from "store/app";

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
  selectedPlaylistGenre,
  onPlaylistGenreUpdate,
  navigateToDeepAppView,
}: {
  onFeaturedArtistDeepLinkSlug: (slug: string) => void;
  selectedPlaylistGenre: string;
  onPlaylistGenreUpdate: (genre: string) => void;
  navigateToDeepAppView: (logicParams: any) => void;
}) => {
  const [streamMetricData, setStreamMetricData] = useState<any[]>([]);
  const [isLoadingMostStreamedTracks, setIsLoadingMostStreamedTracks] = useState(true);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<FeaturedAlbum[]>([]);
  const [isLoadingFeaturedAlbumsAndArtists, setIsLoadingFeaturedAlbumsAndArtists] = useState(true);
  const { musicTrackLookup, artistLookup, albumLookup, artistLookupEverything, mintsLeaderboard } = useAppStore();
  const [latestInnerCircleOptions, setLatestInnerCircleOptions] = useState<LatestFanCollectibleOption[]>([]);
  const [latestAlbumOptions, setLatestAlbumOptions] = useState<LatestAlbumCollectibleOption[]>([]);
  const [isLoadingLatestInnerCircleOptions, setIsLoadingLatestInnerCircleOptions] = useState(true);
  const [isLoadingLatestAlbumOptions, setIsLoadingLatestAlbumOptions] = useState(true);
  const [lastClickedGenreForPlaylist, setLastClickedGenreForPlaylist] = useState<string>("");

  useEffect(() => {
    if (Object.keys(musicTrackLookup).length === 0 || Object.keys(artistLookup).length === 0 || Object.keys(albumLookup).length === 0) {
      return;
    }

    // Process featured artists
    const artists = Object.entries(artistLookup)
      .filter(([_, artist]) => artist.isArtistFeatured === "1")
      .map(([artistId, artist]) => ({
        name: artist.name,
        img: artist.img,
        artistId,
        slug: artist.slug,
      }));

    setFeaturedArtists(artists);

    // Process featured albums
    const albums = Object.entries(albumLookup)
      .filter(([_, album]) => album.isFeatured === "1")
      .map(([albumId, album]) => ({
        albumId,
        artistSlug: artistLookup[albumId.split("_")[0]].slug,
        artistName: artistLookup[albumId.split("_")[0]].name,
        img: album.img,
        title: album.title,
      }));

    setFeaturedAlbums(albums);

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
          songTitle: musicTrackLookup[stream.alid]?.title,
          coverArtUrl: musicTrackLookup[stream.alid]?.cover_art_url,
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
        setLatestAlbumOptions(latestAlbumOptionsData);
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
    if (selectedPlaylistGenre && selectedPlaylistGenre !== "") {
      setLastClickedGenreForPlaylist(""); // we only use it as a "loading" state until the debounce logic kicks in so we can clear it here
    }
  }, [selectedPlaylistGenre]);

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

  const tier1Genres = ALL_MUSIC_GENRES.filter((genre: any) => genre.tier === GenreTier.TIER1).map((genre: any) => genre.code);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* Tier 1 Genre Playlists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span>Exclusive Playlists</span>
        </div>
        <div className="relative w-full">
          <div
            className="overflow-x-auto pb-4 mt-5
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <div className="flex space-x-4 min-w-max">
              {tier1Genres.map((genre) => (
                <div
                  key={genre}
                  onClick={() => {
                    setLastClickedGenreForPlaylist(genre);
                    onPlaylistGenreUpdate(genre);
                  }}
                  className={`flex-shrink-0 w-48 h-32 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    selectedPlaylistGenre === genre
                      ? "bg-gradient-to-br from-yellow-300 to-orange-500 shadow-lg shadow-orange-500/20"
                      : "bg-gradient-to-br from-[#171717] to-[#1a1a1a] hover:from-[#1c1c1c] hover:to-[#1f1f1f]"
                  }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-center relative z-2">
                    <div className={`text-lg font-bold mb-2 ${selectedPlaylistGenre === genre ? "text-black" : "text-white"}`}>
                      {genre.toLocaleUpperCase().trim()}
                    </div>
                    {selectedPlaylistGenre === "" && lastClickedGenreForPlaylist === genre && (
                      <div className="flex justify-center items-center">
                        <Loader className="animate-spin" />
                      </div>
                    )}
                    <div className={`text-sm ${selectedPlaylistGenre === genre ? "text-black/70" : "text-gray-400"}`}>
                      {selectedPlaylistGenre === genre ? "Playing" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Most sold collectibles */}
      {mintsLeaderboard.length > 0 && (
        <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
          <div className="text-xl cursor-pointer w-full">
            <span className="">Most Sold Collectibles</span>
          </div>
          {isLoadingLatestInnerCircleOptions ? (
            <LoadingSkeleton />
          ) : mintsLeaderboard.length === 0 ? (
            <p className="text-xl mb-10 text-center md:text-left opacity-50">No collectibles purchased yet</p>
          ) : (
            <div className="relative w-full">
              <div
                className="overflow-x-auto pb-4 mt-5
                [&::-webkit-scrollbar]:h-2
                dark:[&::-webkit-scrollbar-track]:bg-neutral-700
                dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                <div className="flex space-x-4 min-w-max">
                  {mintsLeaderboard.map((item, idx) => {
                    const artistInfo = artistLookupEverything[item.arId];
                    return (
                      <div
                        key={item.mintTemplatePrefix}
                        className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                        style={{
                          backgroundImage: `url(${artistInfo?.img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundBlendMode: "multiply",
                          backgroundColor: "#161616d4",
                          backgroundRepeat: "no-repeat",
                        }}>
                        {/* NFT type label, rotated on the left */}
                        <div className="absolute left-0 top-10 flex items-center" style={{ height: "100%" }}>
                          <span
                            className="text-xs font-bold text-orange-500 bg-black/40 px-2 py-1 rounded-r-lg"
                            style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(-180deg)",
                              letterSpacing: "0.1em",
                              marginLeft: "-0.5rem",
                              opacity: 0.8,
                            }}>
                            {item.nftType === "fan" ? "Fan Collectible" : "Album Collectible"}
                          </span>
                        </div>
                        {/* Ranking and Medal */}
                        <div className="absolute top-2 left-4 text-2xl font-bold text-orange-500">#{idx + 1}</div>
                        <div className="absolute top-2 right-4 text-4xl">
                          {idx === 0 && <span>🥇</span>}
                          {idx === 1 && <span>🥈</span>}
                          {idx === 2 && <span>🥉</span>}
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-lg font-semibold mb-2 text-white text-ellipsis overflow-hidden text-nowrap">
                            {artistInfo?.name || "Unknown Artist"}
                          </div>
                          <div className="text-3xl font-bold text-orange-500">{item.mints}</div>
                          <div className="text-sm text-white/70 mb-2">Sold</div>
                          <Button
                            className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors"
                            onClick={() => {
                              if (artistInfo?.slug) {
                                if (item.nftType === "album") {
                                  onFeaturedArtistDeepLinkSlug(artistInfo.slug);
                                } else {
                                  const campaign = artistInfo?.artistCampaignCode;
                                  const country = artistInfo?.artistSubGroup1Code;
                                  const team = artistInfo?.artistSubGroup2Code;

                                  navigateToDeepAppView({
                                    artistCampaignCode: campaign,
                                    artistSubGroup1Code: country,
                                    artistSubGroup2Code: team,
                                    artistSlug: artistInfo?.slug,
                                  });
                                }
                              }
                            }}>
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {mintsLeaderboard.length > 3 && (
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Most streamed songs */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span className="">Most Streamed Songs</span>
        </div>
        {isLoadingMostStreamedTracks || Object.keys(musicTrackLookup).length === 0 ? (
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
                      backgroundRepeat: "no-repeat",
                    }}>
                    <div className="absolute top-2 left-4 text-2xl font-bold text-orange-500">#{index + 1}</div>
                    <div className="absolute top-2 right-4 text-4xl">
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">
                        {stream.songTitle && stream.songTitle.length > 0 ? stream.songTitle : stream.alid}
                      </div>
                      <div className="text-3xl font-bold text-orange-500">{stream.streams}</div>
                      <div className="text-sm text-white/70 mb-2">Streams</div>
                      <button
                        onClick={() => handleOpenAlbum(stream.alid)}
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors">
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

      {/* Latest Artist Fan Clubs For Sale */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span className="">Latest Artist Fan Clubs For Sale</span>
        </div>
        {isLoadingLatestInnerCircleOptions ? (
          <LoadingSkeleton />
        ) : latestInnerCircleOptions.length === 0 ? (
          <p className="text-xl mb-10 text-center md:text-left opacity-50">No new Inner Circle collectible available</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-5
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
                          className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors"
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

      {/* Latest Music Collectible For Sale */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span className="">Latest Music Collectibles For Sale</span>
        </div>
        {isLoadingLatestAlbumOptions ? (
          <LoadingSkeleton />
        ) : latestAlbumOptions.length === 0 ? (
          <p className="text-xl mb-10 text-center md:text-left opacity-50">No new music collectibles available</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-5
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
                        <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">
                          {albumInfo?.title || "Unknown Album"}
                        </div>
                        <div className="text-sm text-white/70 mb-2">By {artistInfo?.name || "Unknown Artist"}</div>
                        <div className="text-sm text-orange-500 mb-2">${option.priceInUSD}</div>
                        <Button
                          className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors"
                          onClick={() => {
                            if (artistInfo?.slug) {
                              onFeaturedArtistDeepLinkSlug(`${artistInfo.slug}~${option.collectibleId}`);
                            }
                          }}>
                          Listen & Collect
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

      {/* Featured albums */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span className="">Featured Albums</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : featuredAlbums.length === 0 ? (
          <p className="text-xl mb-10 text-center md:text-left opacity-50">No featured albums data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-5
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
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{album.title}</div>
                      <div className="text-sm text-white/70 mb-2">By {album.artistName}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(`${album.artistSlug}~${album.albumId}`);
                        }}>
                        Listen & Collect
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

      {/* Featured artists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl cursor-pointer w-full">
          <span className="">Featured Artists</span>
        </div>
        {isLoadingFeaturedAlbumsAndArtists ? (
          <LoadingSkeleton />
        ) : featuredArtists.length === 0 ? (
          <p className="text-xl mb-10 text-center md:text-left opacity-50">No featured artists data yet</p>
        ) : (
          <div className="relative w-full">
            <div
              className="overflow-x-auto pb-4 mt-5
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
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors"
                        onClick={() => {
                          onFeaturedArtistDeepLinkSlug(artist.slug);
                        }}>
                        Listen & Collect
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
    </div>
  );
};
