import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CAMPAIGN_WIR_HERO from "assets/img/campaigns/campaign-wir-hero.png";
import SIGMA_MUSIC_LOGO from "assets/img/campaigns/wir/sigmamusic-logo.png";
import TUSKY_LOGO from "assets/img/campaigns/wir/tusky-logo.jpg";
import WALRUS_INK_LOGO from "assets/img/campaigns/wir/walrus-logo.jpg";
import { Button } from "libComponents/Button";
import { StreamMetricData } from "libs/types/common";
import { fetchStreamsLeaderboardByArtistViaAPI } from "libs/utils/api";
import { useAppStore } from "store/app";
import { useAudioPlayerStore } from "store/audioPlayer";
import { PlaylistTile } from "../BodySections/HomeSection/components/PlaylistTile";

type CampaignHeroProps = {
  setCampaignCodeFilter: (campaignCode: string | undefined) => void;
  navigateToDeepAppView: (logicParams: any) => void;
  selectedPlaylistGenre: string;
  onCloseMusicPlayer: () => void;
  isMusicPlayerOpen: boolean;
  onPlaylistGenreUpdate: (genre: string) => void;
  setLaunchPlaylistPlayerWithDefaultTracks: (value: boolean) => void;
  setLaunchPlaylistPlayer: (value: boolean) => void;
};

interface FeaturedAlbum {
  albumId: string;
  img: string;
  title: string;
  artistSlug: string;
  artistName: string;
}

export const CampaignHeroWIR = (props: CampaignHeroProps) => {
  const {
    setCampaignCodeFilter,
    navigateToDeepAppView,
    selectedPlaylistGenre,
    onCloseMusicPlayer,
    isMusicPlayerOpen,
    onPlaylistGenreUpdate,
    setLaunchPlaylistPlayerWithDefaultTracks,
    setLaunchPlaylistPlayer,
  } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedArtist, setSelectedArtist] = useState<string | null>("ar135");
  const [streamMetricData, setStreamMetricData] = useState<StreamMetricData[]>([]);
  const { albumLookup, musicTrackLookup, artistLookup } = useAppStore();
  const [isLoadingFeaturedAlbumsAndArtists, setIsLoadingFeaturedAlbumsAndArtists] = useState(true);
  const [isLoadingMostStreamedSongs, setIsLoadingMostStreamedSongs] = useState(true);
  const [featuredAlbums, setFeaturedAlbums] = useState<FeaturedAlbum[]>([]);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [lastClickedGenreForPlaylist, setLastClickedGenreForPlaylist] = useState<string>("");
  const { assetPlayIsQueued, updateAssetPlayIsQueued } = useAudioPlayerStore();

  useEffect(() => {
    const campaign = searchParams.get("campaign");

    if (campaign) {
      setCampaignCodeFilter(campaign);
    }

    setCampaignCodeFilter("wir");

    return () => {
      setCampaignCodeFilter(undefined);
      // Clear URL parameters when component unmounts
      const currentParams = Object.fromEntries(searchParams.entries());
      delete currentParams["campaign"];
      setSearchParams(currentParams);
    };
  }, []);

  useEffect(() => {
    const artist = searchParams.get("artist");
    if (artist) {
      const currentParams = Object.fromEntries(searchParams.entries());
      delete currentParams["artist"];
      setSearchParams(currentParams);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        setIsLoadingMostStreamedSongs(true);
        const [_streamsData] = await Promise.all([fetchStreamsLeaderboardByArtistViaAPI(selectedArtist ?? "")]);

        const streamsDataWithAlbumTitle = _streamsData.map((stream: StreamMetricData) => ({
          ...stream,
          songTitle: musicTrackLookup[stream.alid]?.title,
          coverArtUrl: musicTrackLookup[stream.alid]?.cover_art_url,
        }));

        setStreamMetricData(streamsDataWithAlbumTitle);

        setTimeout(() => {
          setIsLoadingMostStreamedSongs(false);
        }, 2000);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      }
    };

    if (Object.keys(musicTrackLookup).length > 0) {
      loadArtistData();
    }
  }, [musicTrackLookup]);

  useEffect(() => {
    if (Object.keys(musicTrackLookup).length === 0 || Object.keys(artistLookup).length === 0 || Object.keys(albumLookup).length === 0 || !selectedArtist) {
      return;
    }

    setFeaturedAlbums([
      {
        albumId: "ar135_a1",
        artistSlug: artistLookup[selectedArtist].slug,
        artistName: artistLookup[selectedArtist].name,
        img: albumLookup["ar135_a1"].img,
        title: albumLookup["ar135_a1"].title,
      },
      {
        albumId: "ar135_a2",
        artistSlug: artistLookup[selectedArtist].slug,
        artistName: artistLookup[selectedArtist].name,
        img: albumLookup["ar135_a2"].img,
        title: albumLookup["ar135_a2"].title,
      },
      {
        albumId: "ar135_a3",
        artistSlug: artistLookup[selectedArtist].slug,
        artistName: artistLookup[selectedArtist].name,
        img: albumLookup["ar135_a3"].img,
        title: albumLookup["ar135_a3"].title,
      },
    ]);

    setTimeout(() => {
      setIsLoadingFeaturedAlbumsAndArtists(false);
    }, 2000);
  }, [artistLookup, albumLookup, selectedArtist]);

  const handleOpenAlbumFromAlId = (alid: string) => {
    // Extract album ID from alid (e.g., "ar24_a1-1" -> "ar24_a1")
    const albumId = alid.split("-")[0];
    const artistSlug = artistLookup[selectedArtist ?? ""].slug;

    navigateToDeepAppView({
      artistSlug,
      albumId,
    });
  };

  const LoadingSkeleton = () => (
    <div className="relative w-full">
      <div className="pb-4 mt-5">
        <div className="flex space-x-4 overflow-x-auto">
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

  const VotingBox = ({ index }: { index: number }) => (
    <div
      className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
      style={{
        backgroundImage: `url(${CAMPAIGN_WIR_HERO})`,
        backgroundSize: "initial",
        backgroundPosition: "bottom",
        backgroundBlendMode: "multiply",
        backgroundColor: "#161616d4",
        backgroundRepeat: "no-repeat",
      }}>
      <div className="text-center mt-4">
        <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">Next Track Loading...</div>
        <Button className="pointer-events-none opacity-50 mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors">
          Vote with XP
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* the hero and country and team selection */}
      <div className="w-full mt-5">
        <div className="hero-section flex flex-col md:flex-row justify-center items-center xl:items-start w-full h-full md:h-[350px]">
          <div className="flex flex-col w-full md:w-1/2 h-full">
            <div
              className="campaign-banner h-[250px] md:h-full bg-left md:bg-center bg-no-repeat bg-black"
              style={{ backgroundImage: `url(${CAMPAIGN_WIR_HERO})`, backgroundSize: "contain" }}
            />
          </div>
          <div className="flex flex-col w-full md:w-1/2 h-full p-4 md:p-6 bg-black">
            <h1 className="!text-2xl !md:text-3xl font-bold !text-yellow-300 mb-2">Walrus.INK Records</h1>
            <h2 className="!text-xl font-bold !md:mb-4">
              A micro-label for web3 music artists using Walrus storage technology to store, own and distribute their music.
            </h2>

            <div className="mt-4">
              <PlaylistTile
                genre={{
                  code: "CP_wir",
                  label: "Walrus.INK Radio",
                  tier: null,
                  tileImgBg: "https://walrus.tusky.io/2W2hZjxCruJCFgFilvBH4s-hwa1m7BhWxs636FWsHbE",
                }}
                color={"#161616d4"}
                hoverBgColor={"yellow-300"}
                selectedPlaylistGenre={selectedPlaylistGenre}
                lastClickedGenreForPlaylist={lastClickedGenreForPlaylist}
                assetPlayIsQueued={assetPlayIsQueued}
                isMusicPlayerOpen={isMusicPlayerOpen}
                extendTileToFullWidth={true}
                showClickToPlay={true}
                onCloseMusicPlayer={onCloseMusicPlayer}
                setLastClickedGenreForPlaylist={setLastClickedGenreForPlaylist}
                updateAssetPlayIsQueued={updateAssetPlayIsQueued}
                onPlaylistGenreUpdate={onPlaylistGenreUpdate}
                setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
              />
            </div>
          </div>
        </div>

        <div className="body-section flex flex-col space-y-12">
          <div className="how-it-works-section mt-12">
            <h2 className="!text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">How It Works</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Step 1 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6 h-full hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg">
                    1
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-3">Submit Your Tracks</h3>
                    <p className="text-white/70 text-sm mb-4">Upload your music for community voting and feedback</p>
                    <button
                      onClick={() =>
                        setModalContent({
                          title: "Submit Your Tracks for Public Voting",
                          content:
                            "Share your original music with our community. All tracks go through a public voting process where fans and fellow artists can listen, rate, and provide feedback. This ensures only the best tracks make it to our compilation albums.",
                        })
                      }
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6 h-full hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg">
                    2
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-3">Community Compilation</h3>
                    <p className="text-white/70 text-sm mb-4">Top tracks get featured in our Young Tusk compilation albums</p>
                    <button
                      onClick={() =>
                        setModalContent({
                          title: "Most Popular Tracks Get Bundled",
                          content:
                            "The most popular tracks from community voting get bundled and launched in our next 'Young Tusk: Community Vibes' mix tape album. <a href='?artist=young-tusk' target='_blank' class='text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors'>Check out our already launched albums</a> to see the quality and variety of music we're curating.",
                        })
                      }
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6 h-full hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg">
                    3
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-3">Earn Revenue</h3>
                    <p className="text-white/70 text-sm mb-4">Sell as digital collectibles or launch for free</p>
                    <button
                      onClick={() =>
                        setModalContent({
                          title: "Commercial Rights & Revenue",
                          content:
                            "If your music is original and you have commercial rights, the album will be sold as a digital collectible NFT and you earn up to 80% of all sales. Alternatively, you can launch it for free just for fun and to build your reputation in the community.",
                        })
                      }
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6 h-full hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg">
                    4
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-white mb-3">Bonus Rewards</h3>
                    <p className="text-white/70 text-sm mb-4">Earn additional rewards from our sponsors</p>
                    <button
                      onClick={() =>
                        setModalContent({
                          title: "Earn Bonus Rewards",
                          content:
                            "Beyond album sales, earn bonus rewards from our sponsors including payouts, promotional opportunities, and more. Our partners are committed to supporting emerging artists in the web3 music ecosystem.",
                        })
                      }
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black p-6 md:p-10 rounded-lg">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
              Artist, ready to have your music published via Walrus.INK records?
            </h2>
            <div className="text-center md:text-left mb-6">
              <p className="text-base md:text-lg text-white/80 leading-relaxed">
                You can launch commercial music (if you have the original rights to the music) and earn up to 80% of the sales, or you can launch non-commercial
                music for fun and free (just use it to build cred).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button
                className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform", "_blank")}>
                Launch Commercial Music
              </Button>
              <Button
                className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold bg-transparent border-2 border-orange-500 hover:bg-orange-500/10 text-orange-500 hover:text-orange-400 rounded-lg transition-all duration-300 transform hover:scale-105"
                onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform", "_blank")}>
                Launch Free Music
              </Button>
            </div>
          </div>

          <div className="most-streamed-songs">
            <h2 className="!text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
              Most Streamed Label Tracks
            </h2>
            <div>
              {isLoadingMostStreamedSongs ? (
                <LoadingSkeleton />
              ) : streamMetricData.length === 0 ? (
                <p className="mb-10 text-center md:text-left opacity-50">No music streams data yet</p>
              ) : (
                <div className="relative w-full">
                  <div
                    className="overflow-x-auto pb-4 mt-5 2xl:max-w-full
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
                          <div className="text-center mt-2">
                            <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">
                              {stream.songTitle && stream.songTitle.length > 0 ? stream.songTitle : stream.alid}
                            </div>
                            <div className="text-3xl font-bold text-orange-500">{stream.streams}</div>
                            <div className="text-sm text-white/70 mb-2">Streams</div>
                            <button
                              onClick={() => handleOpenAlbumFromAlId(stream.alid)}
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
          </div>

          <div className="label-discography">
            <h2 className="!text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
              Label Discography
            </h2>
            <div>
              {isLoadingFeaturedAlbumsAndArtists ? (
                <LoadingSkeleton />
              ) : featuredAlbums.length === 0 ? (
                <p className="text-xl mb-10 text-center md:text-left opacity-50">No albums data yet</p>
              ) : (
                <div className="relative w-full">
                  <div
                    className="overflow-x-auto pb-4 mt-5
              [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                    <div className="flex space-x-4 min-w-max">
                      {featuredAlbums.map((album) => (
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
                                navigateToDeepAppView({
                                  artistSlug: album.artistSlug,
                                  albumId: album.albumId,
                                });
                              }}>
                              Listen & Collect
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div
                        key={"coming-soon"}
                        className="flex-shrink-0 w-64 h-48 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
                        style={{
                          backgroundImage: `url(${CAMPAIGN_WIR_HERO})`,
                          backgroundSize: "initial",
                          backgroundPosition: "bottom",
                          backgroundBlendMode: "multiply",
                          backgroundColor: "#161616d4",
                          backgroundRepeat: "no-repeat",
                        }}>
                        <div className="text-center mt-4">
                          <div className="text-lg font-semibold mb-4 text-white text-ellipsis overflow-hidden text-nowrap">Next Album Coming</div>
                          <div className="text-sm text-white/70 mb-2">By Young Tusk</div>
                          <Button className="pointer-events-none opacity-50 mt-2 px-3 py-1 text-sm bg-orange-500/50 hover:bg-orange-500/30 text-orange-200 rounded-full transition-colors">
                            Your Music Could Be Here
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {featuredAlbums.length > 3 && (
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="vote-for-next-album">
            <h2 className="!text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
              Vote for Next Album
            </h2>
            <div className="flex flex-col gap-4">
              <p className="text-lg text-white/80">Vote for the track you want to hear in the next album</p>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {[1, 2, 3].map((index) => (
                  <VotingBox key={index} index={index} />
                ))}
              </div>
            </div>
          </div>

          <div className="sponsored-by">
            <h2 className="!text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Sponsored by</h2>
            <div className="flex flex-col gap-6">
              <p className="text-lg text-white/80 text-left">Walrus.INK is made possible by the support of our sponsors:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Walrus Sponsor */}
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-6 md:p-8 hover:border-orange-500/50 transition-all duration-300 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <img src={WALRUS_INK_LOGO} alt="Walrus" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">Walrus</h3>
                  </div>
                </div>

                {/* Tusky Sponsor */}
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-6 md:p-8 hover:border-orange-500/50 transition-all duration-300 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <img src={TUSKY_LOGO} alt="Tusky" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">Tusky</h3>
                  </div>
                </div>

                {/* Sigma Music Sponsor */}
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-6 md:p-8 hover:border-orange-500/50 transition-all duration-300 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <img src={SIGMA_MUSIC_LOGO} alt="Sigma Music" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">Sigma Music</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="faq">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col gap-4">
              {/* FAQ Item 1 */}
              <div className="border border-orange-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                  className="w-full px-6 py-4 text-left bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all duration-300 flex justify-between items-center">
                  <span className="font-semibold text-white">Can I launch AI generated music?</span>
                  <span className="text-orange-400 text-xl transition-transform duration-300">{openFAQ === 1 ? "−" : "+"}</span>
                </button>
                {openFAQ === 1 && (
                  <div className="px-6 py-4 bg-black/50 border-t border-orange-500/20">
                    <p className="text-white/80 leading-relaxed">
                      Yes, of course! You can launch any type of music (e.g., using Suno). However, if you want to commercially sell any music via this label,
                      make sure you own the rights to the music you create. For example, if you use Suno, make sure you have a paid account, otherwise you DON'T
                      own any rights to the music.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="border border-orange-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                  className="w-full px-6 py-4 text-left bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all duration-300 flex justify-between items-center">
                  <span className="font-semibold text-white">Do you prefer AI generated or human generated music?</span>
                  <span className="text-orange-400 text-xl transition-transform duration-300">{openFAQ === 2 ? "−" : "+"}</span>
                </button>
                {openFAQ === 2 && (
                  <div className="px-6 py-4 bg-black/50 border-t border-orange-500/20">
                    <p className="text-white/80 leading-relaxed">
                      We find that nothing beats pure human music, and fans prefer music from human artists. However, AI generated or AI augmented music is also
                      a fast-growing segment, so we encourage you to launch any type of music that resonates with you and your audience.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 3 */}
              <div className="border border-orange-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                  className="w-full px-6 py-4 text-left bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all duration-300 flex justify-between items-center">
                  <span className="font-semibold text-white">How does the community vote for my music?</span>
                  <span className="text-orange-400 text-xl transition-transform duration-300">{openFAQ === 3 ? "−" : "+"}</span>
                </button>
                {openFAQ === 3 && (
                  <div className="px-6 py-4 bg-black/50 border-t border-orange-500/20">
                    <p className="text-white/80 leading-relaxed">
                      Once a track is submitted, users of Sigma can vote for it using their XP. The tracks with the most XP graduate to be included in the next
                      album that gets launched.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 4 */}
              <div className="border border-orange-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                  className="w-full px-6 py-4 text-left bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all duration-300 flex justify-between items-center">
                  <span className="font-semibold text-white">If my track is selected, what happens next?</span>
                  <span className="text-orange-400 text-xl transition-transform duration-300">{openFAQ === 4 ? "−" : "+"}</span>
                </button>
                {openFAQ === 4 && (
                  <div className="px-6 py-4 bg-black/50 border-t border-orange-500/20">
                    <p className="text-white/80 leading-relaxed">
                      It gets included in the next "Young Tusk: Community Vibes" mix tape album. Some of these albums will be "commercial" if the artists
                      included own the rights to the music, and some of these albums are free if there is uncertainty on the commercial rights of the music.
                      Commercial albums will also include a payment tier which includes a "digital music album collectible" and also Story Protocol powered
                      licensing for IPFi (IP Finance opportunities).{" "}
                      <a href="/?artist=yfgp" target="_blank" className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                        Check out YFGP's Discography
                      </a>{" "}
                      to see all the ways you can monetize music on the Sigma Platform.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 5 */}
              <div className="border border-orange-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === 5 ? null : 5)}
                  className="w-full px-6 py-4 text-left bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all duration-300 flex justify-between items-center">
                  <span className="font-semibold text-white">What do sponsors do?</span>
                  <span className="text-orange-400 text-xl transition-transform duration-300">{openFAQ === 5 ? "−" : "+"}</span>
                </button>
                {openFAQ === 5 && (
                  <div className="px-6 py-4 bg-black/50 border-t border-orange-500/20">
                    <p className="text-white/80 leading-relaxed">
                      Our sponsors provide you with extra perks and rewards, ranging from bonus payouts to promotional opportunities and more. More details on
                      our sponsor perks will be announced soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for How It Works details */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-orange-500/30 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{modalContent.title}</h3>
              <button onClick={() => setModalContent(null)} className="text-white/70 hover:text-white text-2xl font-bold">
                ×
              </button>
            </div>
            <p className="text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: modalContent.content }} />
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setModalContent(null)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
