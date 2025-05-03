import React, { useEffect, useState } from "react";
import { Button } from "libComponents/Button";
import { StreamMetricData } from "libs/types/common";
import { fetchStreamsLeaderboardAllTracksByMonthViaAPI } from "libs/utils/misc";
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

export const FeaturedBanners = ({
  onFeaturedArtistDeepLinkSlug,
  onGenreUpdate,
}: {
  onFeaturedArtistDeepLinkSlug: (slug: string) => void;
  onGenreUpdate: () => void;
}) => {
  const [streamMetricData, setStreamMetricData] = useState<any[]>([]);
  const [isLoadingMostStreamedTracks, setIsLoadingMostStreamedTracks] = useState(true);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<FeaturedAlbum[]>([]);
  const [isLoadingFeaturedAlbumsAndArtists, setIsLoadingFeaturedAlbumsAndArtists] = useState(true);
  const { musicTrackLookup, artistLookup, albumLookup, radioGenres, updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh } = useAppStore();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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
        setIsLoadingMostStreamedTracks(false);
      }
    };

    if (Object.keys(musicTrackLookup).length > 0 && Object.keys(artistLookup).length > 0 && Object.keys(albumLookup).length > 0) {
      loadStreamsData();
    }
  }, [musicTrackLookup, artistLookup, albumLookup]);

  // Load saved genres from session storage
  useEffect(() => {
    const savedGenres = sessionStorage.getItem("sig-pref-genres");
    if (savedGenres) {
      setSelectedGenres(JSON.parse(savedGenres));
    } else {
      // If no saved preferences, preselect "I LOVE EVERYTHING"
      setSelectedGenres(["I LOVE EVERYTHING"]);
    }
  }, []);

  // Handle genre selection/deselection
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (genre === "I LOVE EVERYTHING") {
        // If "I LOVE EVERYTHING" is selected, clear all other selections and session storage
        sessionStorage.removeItem("sig-pref-genres");
        return ["I LOVE EVERYTHING"];
      } else {
        // If selecting a specific genre, remove "I LOVE EVERYTHING" if it exists
        const newGenres = prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev.filter((g) => g !== "I LOVE EVERYTHING"), genre];
        sessionStorage.setItem("sig-pref-genres", JSON.stringify(newGenres));
        return newGenres;
      }
    });
  };

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
      <div></div>

      {/* most streamed songs */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
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

      {/* Genre Selection Section */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
          <span>Music Genres I Like</span>
        </div>
        <div className="relative w-full">
          <div
            className="overflow-x-auto pb-4 mt-5
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <div className="flex space-x-4 min-w-max">
              {/* I Love Everything Tile */}
              <div
                key="I LOVE EVERYTHING"
                onClick={() => {
                  toggleGenre("I LOVE EVERYTHING");
                  onGenreUpdate();
                }}
                className={`flex-shrink-0 w-48 h-32 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                  selectedGenres.includes("I LOVE EVERYTHING")
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
                    : "bg-gradient-to-br from-[#171717] to-[#1a1a1a] hover:from-[#1c1c1c] hover:to-[#1f1f1f]"
                }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-center relative z-10">
                  <div className={`text-lg font-bold mb-2 ${selectedGenres.includes("I LOVE EVERYTHING") ? "text-black" : "text-white"}`}>
                    I LOVE EVERYTHING
                  </div>
                  <div className={`text-sm ${selectedGenres.includes("I LOVE EVERYTHING") ? "text-black/70" : "text-gray-400"}`}>
                    {selectedGenres.includes("I LOVE EVERYTHING") ? "Selected" : "Click to select all"}
                  </div>
                </div>
                {selectedGenres.includes("I LOVE EVERYTHING") && (
                  <div className="absolute top-2 right-2 text-black/20">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {radioGenres.map((genre) => (
                <div
                  key={genre}
                  onClick={() => {
                    toggleGenre(genre);
                    onGenreUpdate();
                  }}
                  className={`flex-shrink-0 w-48 h-32 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    selectedGenres.includes(genre)
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
                      : "bg-gradient-to-br from-[#171717] to-[#1a1a1a] hover:from-[#1c1c1c] hover:to-[#1f1f1f]"
                  }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-center relative z-10">
                    <div className={`text-lg font-bold mb-2 ${selectedGenres.includes(genre) ? "text-black" : "text-white"}`}>
                      {genre.toLocaleUpperCase().trim()}
                    </div>
                    <div className={`text-sm ${selectedGenres.includes(genre) ? "text-black/70" : "text-gray-400"}`}>
                      {selectedGenres.includes(genre) ? "Selected" : "Click to select"}
                    </div>
                  </div>
                  {selectedGenres.includes(genre) && (
                    <div className="absolute top-2 right-2 text-black/20">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {radioGenres.length > 3 && (
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* featured albums */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
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
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{album.title}</div>
                      <div className="text-sm text-white/70 mb-2">By {album.artistName}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 rounded-full transition-colors"
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

      {/* featured artists */}
      <div className="flex flex-col justify-center w-[100%] items-center xl:items-start mt-10">
        <div className="text-xl xl:text-2xl cursor-pointer w-full">
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
                    }}>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">{artist.name}</div>
                      <Button
                        className="mt-2 px-3 py-1 text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 rounded-full transition-colors"
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
