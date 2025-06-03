import React, { useEffect, useState } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { WalletMinimal, Twitter, Youtube, Link2, Globe, Droplet, Zap, CircleArrowLeft, Loader, Instagram } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import TikTokIcon from "assets/img/icons/tiktok-icon.png";
import { ArtistInnerCircle } from "components/ArtistInnerCircle/ArtistInnerCircle";
import ArtistStats from "components/ArtistStats/ArtistStats";
import { ArtistXPLeaderboard } from "components/ArtistXPLeaderboard/ArtistXPLeaderboard";
import { DEFAULT_BITZ_COLLECTION_SOL, DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { GiftBitzToArtistMeta } from "libs/types";
import { Artist, Album, AlbumWithArtist } from "libs/types";
import { BountyBitzSumMapping } from "libs/types";
import { sleep, scrollToTopOnMainContentArea, isMostLikelyMobile } from "libs/utils";
import { getArtistsAlbumsData, fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/BodySections/HomeSection/shared/utils";
import { routeNames } from "routes";
import { useAppStore } from "store/app";
import { useNftsStore } from "store/nfts";
import { ArtistDiscography } from "./ArtistDiscography";

type FeaturedArtistsAndAlbumsProps = {
  stopPreviewPlayingNow?: boolean;
  featuredArtistDeepLinkSlug?: string;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  setMusicBountyBitzSumGlobalMapping: any;
  userHasNoBitzDataNftYet: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  isMusicPlayerOpen?: boolean;
  loadIntoTileView?: boolean;
  isAllAlbumsMode?: boolean;
  filterByArtistCampaignCode?: string | number;
  openActionFireLogic: (e: any) => any;
  viewSolData: (e: number, f?: any) => void;
  onPlayHappened: () => void;
  checkOwnershipOfAlbum: (e: any) => any;
  onSendBitzForMusicBounty: (e: any) => any;
  onFeaturedArtistDeepLinkSlug: (artistSlug: string, albumId?: string) => any;
  onCloseMusicPlayer: () => void;
  setLoadIntoTileView: (e: boolean) => void;
};

export const FeaturedArtistsAndAlbums = (props: FeaturedArtistsAndAlbumsProps) => {
  const {
    stopPreviewPlayingNow,
    featuredArtistDeepLinkSlug,
    bountyBitzSumGlobalMapping,
    setMusicBountyBitzSumGlobalMapping,
    userHasNoBitzDataNftYet,
    dataNftPlayingOnMainPlayer,
    isMusicPlayerOpen,
    loadIntoTileView,
    isAllAlbumsMode,
    filterByArtistCampaignCode,
    openActionFireLogic,
    viewSolData,
    onPlayHappened,
    checkOwnershipOfAlbum,
    onSendBitzForMusicBounty,
    onFeaturedArtistDeepLinkSlug,
    onCloseMusicPlayer,
    setLoadIntoTileView,
  } = props;
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const [previewTrackAudio] = useState(new Audio());
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewPlayingForAlbumId, setPreviewPlayingForAlbumId] = useState<string | undefined>();
  const [previewIsReadyToPlay, setPreviewIsReadyToPlay] = useState(false);
  const [selArtistId, setSelArtistId] = useState<string | undefined>();
  const [selAlbumId, setSelAlbumId] = useState<string | undefined>();
  const [userInteractedWithTabs, setUserInteractedWithTabs] = useState<boolean>(false);
  const [artistProfile, setArtistProfile] = useState<Artist | null>(null);
  const [inArtistProfileView, setInArtistProfileView] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [progress, setProgress] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { solBitzNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<Artist[]>([]);
  const [albumsDataset, setAlbumsDataset] = useState<AlbumWithArtist[]>([]);
  const [artistAlbumDataLoading, setArtistAlbumDataLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("discography");
  const { updateAlbumMasterLookup, updateTileDataCollectionLoadingInProgress } = useAppStore();
  const [tabsOrdered, setTabsOrdered] = useState<string[]>(["discography", "leaderboard", "artistStats", "fan"]);
  const [selectedLargeSizeProfileImg, setSelectedLargeSizeProfileImg] = useState<string | null>(null);

  function eventToAttachEnded() {
    previewTrackAudio.src = "";
    previewTrackAudio.currentTime = 0;
    previewTrackAudio.pause();
    setPreviewIsReadyToPlay(false);
    setIsPreviewPlaying(false);
    setPreviewPlayingForAlbumId(undefined);
  }

  function eventToAttachTimeUpdate() {
    updateProgress();
  }

  function eventToAttachCanPlayThrough() {
    // Audio is ready to be played
    setPreviewIsReadyToPlay(true);
    // play the song
    if (previewTrackAudio.currentTime == 0) {
      previewTrackAudio.play();
    }
  }

  const debounced_fetchBitzPowerUpsAndLikesForSelectedArtist = useDebouncedCallback((giftBitzToArtistMeta: GiftBitzToArtistMeta) => {
    fetchBitzPowerUpsAndLikesForSelectedArtist({
      giftBitzToArtistMeta,
      userHasNoBitzDataNftYet,
      solBitzNfts,
      setMusicBountyBitzSumGlobalMapping,
      isSingleAlbumBounty: false,
    });
  }, 2500);

  useEffect(() => {
    console.log("FEATURED ARTISTS AND ALBUMS LOADED", filterByArtistCampaignCode);

    scrollToTopOnMainContentArea();

    const jumpToTab = searchParams.get("tab");

    if (jumpToTab && jumpToTab === "fan") {
      setActiveTab("fan");
    }

    previewTrackAudio.addEventListener("ended", eventToAttachEnded);
    previewTrackAudio.addEventListener("timeupdate", eventToAttachTimeUpdate);
    previewTrackAudio.addEventListener("canplaythrough", eventToAttachCanPlayThrough);

    fetchAndUpdateArtistAlbumDataIntoView();

    return () => {
      previewTrackAudio.pause();
      previewTrackAudio.removeEventListener("ended", eventToAttachEnded);
      previewTrackAudio.removeEventListener("timeupdate", eventToAttachTimeUpdate);
      previewTrackAudio.removeEventListener("canplaythrough", eventToAttachCanPlayThrough);

      handleBackToArtistTileView(); // user is leaving the page so we need to reset the view to prestine tile for the next entry
    };
  }, []);

  useEffect(
    () => () => {
      // on unmount we have to stp playing as for some reason the play continues always otherwise
      playPausePreview(); // with no params wil always go into the stop logic

      // remove the artist param from the url
      const currentParams = Object.fromEntries(searchParams.entries());
      delete currentParams["artist"];
      delete currentParams["tab"];
      delete currentParams["action"];
      setSearchParams(currentParams);
    },
    []
  );

  useEffect(() => {
    console.log("FEATURED ARTISTS AND ALBUMS CHANGED", filterByArtistCampaignCode);

    if (filterByArtistCampaignCode) {
      // the user maybe looking at an artist, we need to revert to the tile page
      setLoadIntoTileView(true);

      fetchAndUpdateArtistAlbumDataIntoView();
    } else {
      // -1 means we are NOT in a campaign mode so we clear any data if the filterByArtistCampaignCode was not given
      if (filterByArtistCampaignCode !== -1) {
        setArtistAlbumDataLoading(true);
        updateTileDataCollectionLoadingInProgress(true);
        setArtistAlbumDataset([]);
        setAlbumsDataset([]);
        setArtistAlbumDataLoading(false);
        updateTileDataCollectionLoadingInProgress(false);
      }
    }
  }, [filterByArtistCampaignCode]);

  // if this is triggered, then we are in the artist profile view
  useEffect(() => {
    if (featuredArtistDeepLinkSlug && featuredArtistDeepLinkSlug !== "") {
      console.log("SLUG CHANGED", featuredArtistDeepLinkSlug);

      const campaignCode = searchParams.get("campaign") || "";

      if (campaignCode && campaignCode !== "") {
        // for campiagns, we jump to the fan tab
        setActiveTab("fan");
        setTabsOrdered(["fan", "leaderboard", "artistStats"]);
      } else {
        setTabsOrdered(["discography", "leaderboard", "artistStats", "fan"]);
      }

      // on mobile, we scroll to the top of the page as the user navigates to the various artist profile pages
      if (isMostLikelyMobile())
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
    }
  }, [featuredArtistDeepLinkSlug]);

  useEffect(() => {
    if (artistAlbumDataset.length === 0) {
      return;
    }

    if (featuredArtistDeepLinkSlug && featuredArtistDeepLinkSlug !== "") {
      let artistIdInSlug = featuredArtistDeepLinkSlug;
      let albumIdInSlug = undefined;

      if (featuredArtistDeepLinkSlug.includes("~")) {
        artistIdInSlug = featuredArtistDeepLinkSlug.split("~")[0];
        albumIdInSlug = featuredArtistDeepLinkSlug.split("~")[1];
      }

      const findArtistBySlug = artistAlbumDataset.find((i) => i.slug === artistIdInSlug);

      if (findArtistBySlug) {
        setSelArtistId(findArtistBySlug.artistId);

        if (albumIdInSlug) {
          setSelAlbumId(albumIdInSlug);
        }
      }

      setInArtistProfileView(true);
    }
  }, [featuredArtistDeepLinkSlug, artistAlbumDataset]);

  useEffect(() => {
    if (artistAlbumDataset.length === 0 || !selArtistId) {
      return;
    }

    playPausePreview(); // with no params wil always go into the stop logic

    const selDataItem: Artist | undefined = artistAlbumDataset.find((i) => i.artistId === selArtistId);

    if (!selDataItem) {
      return;
    }

    setArtistProfile(selDataItem);

    // if we don't do the userInteractedWithTabs, then even on page load, we go update the url with artist which we don't want
    if (selDataItem && (userInteractedWithTabs || (featuredArtistDeepLinkSlug && featuredArtistDeepLinkSlug !== ""))) {
      // update the deep link param
      const currentParams = Object.fromEntries(searchParams.entries());

      if (featuredArtistDeepLinkSlug && featuredArtistDeepLinkSlug !== "") {
        currentParams["artist"] = featuredArtistDeepLinkSlug;
      } else {
        currentParams["artist"] = selDataItem.slug;
      }

      setSearchParams({ ...currentParams });
    }

    // we clone selDataItem here so as to no accidentally mutate things
    // we debounce this, so that - if the user is jumping tabs.. it wait until they stop at a tab for 2.5 S before running the complex logic
    debounced_fetchBitzPowerUpsAndLikesForSelectedArtist({ ...selDataItem });
  }, [selArtistId, selAlbumId, artistAlbumDataset]);

  useEffect(() => {
    if (stopPreviewPlayingNow) {
      playPausePreview(); // with no params wil always go into the stop logic
    }
  }, [stopPreviewPlayingNow]);

  useEffect(() => {
    if (loadIntoTileView && inArtistProfileView) {
      handleBackToArtistTileView();
    }
  }, [loadIntoTileView]);

  async function fetchAndUpdateArtistAlbumDataIntoView() {
    setArtistAlbumDataLoading(true);
    updateTileDataCollectionLoadingInProgress(true);

    await sleep(0.5);

    const { albumArtistLookupData, albumArtistLookupDataOrganizedBySections } = await getArtistsAlbumsData();
    let allAlbumsData: AlbumWithArtist[] = [];

    const artistDataToUse =
      filterByArtistCampaignCode && filterByArtistCampaignCode !== -1
        ? albumArtistLookupDataOrganizedBySections[filterByArtistCampaignCode]?.filteredItems || []
        : albumArtistLookupData;

    allAlbumsData = artistDataToUse.flatMap((artist: Artist) =>
      artist.albums.map(
        (album: Album): AlbumWithArtist => ({
          ...album,
          artistId: artist.artistId,
          artistName: artist.name,
          artistSlug: artist.slug,
        })
      )
    );

    // in some views, we make directly be ina  profile page and then we move out (e.g. "Back to Countries" in WSB camoaign).
    // In this situation it's best we double check if we are in a profile view and if so, we go back to the tile view
    if (inArtistProfileView) {
      handleBackToArtistTileView();
    }

    // await sleep(2);

    setArtistAlbumDataset(artistDataToUse);
    setAlbumsDataset(allAlbumsData);

    // update the album master lookup
    updateAlbumMasterLookup(
      allAlbumsData.reduce(
        (acc, album) => {
          acc[album.albumId] = album;
          return acc;
        },
        {} as Record<string, AlbumWithArtist>
      )
    );

    setArtistAlbumDataLoading(false);
    updateTileDataCollectionLoadingInProgress(false);
  }

  async function playPausePreview(previewStreamUrl?: string, albumId?: string) {
    if (previewStreamUrl && albumId && (!isPreviewPlaying || previewPlayingForAlbumId !== albumId)) {
      onPlayHappened(); // inform parent to stop any other playing streams on its ui

      resetPreviewPlaying();
      // await sleep(0.1); // this seems to help when some previews overlapped (took it out as it did not seem to do much when testing)

      setPreviewIsReadyToPlay(false);
      setIsPreviewPlaying(true);
      setPreviewPlayingForAlbumId(albumId);

      try {
        const blob = await fetch(previewStreamUrl).then((r) => r.blob());
        let blobUrl = URL.createObjectURL(blob);

        // ios safari seems to not play the music so tried to use blobs like in the other Audio component like Playlist Player
        // but still does not play -- need to debug more (see https://corevo.io/the-weird-case-of-video-streaming-in-safari/)
        previewTrackAudio.src = blobUrl;
      } catch (e) {
        previewTrackAudio.src = previewStreamUrl; // this fetches the data, but it may not be ready to play yet until canplaythrough fires
      }

      previewTrackAudio.load();
      updateProgress();
      previewTrackAudio.currentTime = 0;
    } else {
      resetPreviewPlaying();
    }
  }

  function resetPreviewPlaying() {
    previewTrackAudio.src = "";
    previewTrackAudio.currentTime = 0;
    previewTrackAudio.pause();
    setPreviewIsReadyToPlay(false);
    setIsPreviewPlaying(false);
    setPreviewPlayingForAlbumId(undefined);
  }

  const updateProgress = () => {
    setCurrentTime(previewTrackAudio.currentTime ? formatTime(previewTrackAudio.currentTime) : "00:00");
    setDuration(previewTrackAudio.duration ? formatTime(previewTrackAudio.duration) : "00:00");
    let _percentage = (previewTrackAudio.currentTime / previewTrackAudio.duration) * 100;
    if (isNaN(_percentage)) _percentage = 0;
    setProgress(_percentage);
  };

  const formatTime = (_seconds: number) => {
    const minutes = Math.floor(_seconds / 60);
    const remainingSeconds = Math.floor(_seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, "0"); // Ensure two digits
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  function getImagePositionMeta(imageUrl: string, metaKey: string): string {
    try {
      const url = new URL(imageUrl);
      const pos = url.searchParams.get(metaKey);

      if (metaKey === "pcolor" || metaKey === "tcolor") {
        return `#${pos}` || "intial";
      } else {
        return pos || "intial";
      }
    } catch {
      // Return default if URL is invalid
      return "intial";
    }
  }

  function showTargettedArtistImg(imageUrl: string, fanToken3DGifTeaser?: string): string {
    try {
      // if user is on the fan tab and there is a fan token 3d gif teaser, then return the gif teaser
      if ((!inArtistProfileView || activeTab === "fan") && fanToken3DGifTeaser && fanToken3DGifTeaser !== "") {
        return `https://api.itheumcloud.com/app_nftunes/assets/token_img/${fanToken3DGifTeaser}.gif`;
      } else {
        return imageUrl;
      }
    } catch {
      // Return default if URL is invalid
      return imageUrl;
    }
  }

  function handleBackToArtistTileView() {
    playPausePreview(); // with no params wil always go into the stop logic

    setInArtistProfileView(false);

    // remove the artist param from the url
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist"];
    delete currentParams["tab"];
    delete currentParams["action"];
    setSearchParams(currentParams);

    // reset the featuredArtistDeepLinkSlug
    onFeaturedArtistDeepLinkSlug("");
    setLoadIntoTileView(false);
    setActiveTab("discography");
    setSelAlbumId(undefined);
    setSelArtistId(undefined);
  }

  const xpCollectionIdToUse = !addressSol || solBitzNfts.length === 0 ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
        <div className="text-2xl xl:text-3xl cursor-pointer mb-3 mr-auto ml-[8px]">
          <div className="flex flex-col md:flex-row justify-between">
            {(!filterByArtistCampaignCode || filterByArtistCampaignCode === -1) && inArtistProfileView ? (
              <div className={`bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center mr-2`}>
                <Button
                  className={`bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-sm h-[46px] px-[10px]`}
                  variant="outline"
                  onClick={handleBackToArtistTileView}>
                  <>
                    <CircleArrowLeft />
                    <span className="ml-2">Back to All {isAllAlbumsMode ? "Albums" : "Artists"}</span>
                  </>
                </Button>
              </div>
            ) : (
              <>
                {!filterByArtistCampaignCode ||
                  (filterByArtistCampaignCode === -1 && (
                    <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                      {isAllAlbumsMode ? "Albums" : "Artists"}
                    </span>
                  ))}
              </>
            )}
          </div>
        </div>

        <div id="artist-profile" className="flex flex-col md:flex-row w-[100%] items-start">
          {artistAlbumDataLoading || artistAlbumDataset.length === 0 ? (
            <div className="flex flex-col gap-4 p-2 items-start bg-background rounded-lg min-h-[250px] w-full">
              {artistAlbumDataLoading ? (
                <div className="m-auto w-full">
                  <div className="w-full flex flex-col items-center h-[250px] md:h-[100%] md:grid md:grid-rows-[250px] md:auto-rows-[250px] md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-[10px]">
                    {[...Array(30)].map((_, index) => (
                      <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {filterByArtistCampaignCode && filterByArtistCampaignCode !== -1 ? (
                    <div className="min-h-6">
                      Artist collection is coming very soon! Await ammouncement on{" "}
                      <a href="https://x.com/SigmaMusic" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-600">
                        Sigma Music's X Account
                      </a>
                    </div>
                  ) : (
                    <div className="min-h-6">⚠️ Artist section is unavailable. Check back later!</div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="w-full">
              {/* all artists or albums tiles */}
              {!inArtistProfileView && (
                <div className="flex flex-col gap-4 p-2 items-start bg-background min-h-[350px] w-full">
                  {!isAllAlbumsMode && (
                    <div className="artist-boxes w-full flex flex-col items-center md:items-start md:grid md:grid-auto-flow-column md:grid-cols-[repeat(auto-fill,250px)] md:gap-[10px]">
                      {artistAlbumDataset.map((artist: any) => (
                        <div
                          key={artist.artistId}
                          className={`flex w-[300px] h-[300px] md:w-[250px] md:h-[250px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105`}
                          onClick={() => {
                            if (artist.artistId !== selArtistId) {
                              setArtistProfile(null); // reset the artist profile (so previous selected artist clears, the next line -  onFeaturedArtistDeepLinkSlug(artist.slug) - triggers a cascading effect to select the new artist)

                              // notify the home page, which then triggers an effect to setSelArtistId
                              onFeaturedArtistDeepLinkSlug(artist.slug);

                              setUserInteractedWithTabs(true);
                              setLoadIntoTileView(false); // notify the parent that we are in the artist profile view (so that when we click on main Artists menu, we go back to the artist tile view)

                              if (filterByArtistCampaignCode === -1) {
                                scrollToTopOnMainContentArea();
                              }
                            }
                          }}>
                          <div
                            className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg cursor-pointer group"
                            style={{
                              "backgroundImage": `url(${artist.img})`,
                              "backgroundPosition": getImagePositionMeta(artist.img, "tpos"),
                              "backgroundColor": getImagePositionMeta(artist.img, "tcolor"),
                              "backgroundSize": getImagePositionMeta(artist.img, "tsize"),
                            }}>
                            {artist.fanToken3DGifTeaser && artist.fanToken3DGifTeaser !== "" && (
                              <>
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[80%] transition-opacity duration-300 rounded-lg" />
                                <div
                                  className="absolute inset-0 bg-no-repeat bg-cover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                  style={{
                                    "backgroundImage": `url(https://api.itheumcloud.com/app_nftunes/assets/token_img/${artist.fanToken3DGifTeaser}.gif)`,
                                    "backgroundPosition": "center",
                                    "backgroundSize": "contain",
                                  }}
                                />
                              </>
                            )}
                            {(!filterByArtistCampaignCode || filterByArtistCampaignCode === -1) && (
                              <div className="bg-black absolute bottom-0 w-[100%] p-2 rounded-b-[7px]">
                                <h2 className={`!text-lg !text-white lg:!text-lg text-nowrap text-center text-ellipsis overflow-hidden`}>
                                  {artist.name.replaceAll("_", " ")}
                                </h2>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAllAlbumsMode && (
                    <div className="artist-boxes w-full flex flex-col items-center md:items-start md:grid md:grid-auto-flow-column md:grid-cols-[repeat(auto-fill,250px)] md:gap-[10px]">
                      {albumsDataset.map((album: AlbumWithArtist) => (
                        <div
                          key={album.albumId}
                          className={`flex w-[300px] h-[300px] md:w-[250px] md:h-[250px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105`}
                          onClick={() => {
                            if (album.artistId !== selArtistId || album.albumId !== selAlbumId) {
                              setArtistProfile(null); // reset the artist profile (so previous selected artist clears, the next line -  onFeaturedArtistDeepLinkSlug(artist.slug) - triggers a cascading effect to select the new artist)

                              // notify the home page, which then triggers an effect to setSelArtistId
                              onFeaturedArtistDeepLinkSlug(album.artistSlug, album.albumId);

                              setUserInteractedWithTabs(true);
                              setLoadIntoTileView(false); // notify the parent that we are in the artist profile view (so that when we click on main Artists menu, we go back to the artist tile view)

                              scrollToTopOnMainContentArea();
                            }
                          }}>
                          <div
                            className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg cursor-pointer"
                            style={{
                              "backgroundImage": `url(${album.img})`,
                              "backgroundPosition": getImagePositionMeta(album.img, "tpos"),
                              "backgroundColor": getImagePositionMeta(album.img, "tcolor"),
                              "backgroundSize": getImagePositionMeta(album.img, "tsize"),
                            }}>
                            <div className="bg-black absolute bottom-0 w-[100%] p-2 rounded-b-[7px]">
                              <h2 className={`!text-lg !text-white lg:!text-lg text-nowrap text-center text-ellipsis overflow-hidden`}>
                                {album.title.replaceAll("_", " ")}
                              </h2>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* artist profile view */}
              {inArtistProfileView && (
                <div className="flex flex-col gap-4 p-2 items-start bg-background">
                  {!artistProfile ? (
                    <div>Loading</div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <div className="artist-bio md:w-[700px] flex flex-col md:sticky md:top-4 md:self-start">
                        <div
                          className={`img-container relative ${activeTab === "fan" && artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== "" ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            // if the artist has a 3D gif teaser, allow the user to click on the image to see the full size image
                            if (activeTab === "fan" && artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== "") {
                              setSelectedLargeSizeProfileImg(
                                `https://api.itheumcloud.com/app_nftunes/assets/token_img/${artistProfile.fanToken3DGifTeaser}.gif`
                              );
                            } else {
                              return;
                            }
                          }}>
                          <div
                            className="relative border-[0.5px] border-neutral-500/90 h-[320px] md:h-[320px] w-[100%] flex-1 bg-no-repeat bg-cover rounded-lg"
                            style={{
                              "backgroundImage": `url(${showTargettedArtistImg(artistProfile.img, artistProfile.fanToken3DGifTeaser)})`,
                              "backgroundPosition":
                                artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== ""
                                  ? "center"
                                  : getImagePositionMeta(artistProfile.img, "ppos"),
                              "backgroundColor": getImagePositionMeta(artistProfile.img, "pcolor"),
                              "backgroundSize":
                                artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== ""
                                  ? "contain"
                                  : getImagePositionMeta(artistProfile.img, "psize"),
                            }}></div>
                        </div>

                        {/* artists details and power up */}
                        <div className="details-container p-2 md:p-5 pt-2 flex-1 flex flex-col md:block items-baseline">
                          <h2 className={`!text-xl !text-white lg:!text-3xl text-nowrap mb-5 text-center md:text-left mt-5`}>
                            {artistProfile.name.replaceAll("_", " ")}
                          </h2>

                          {!DISABLE_BITZ_FEATURES && (
                            <div className="powerUpWithBitz flex flex-row items-center mb-5 w-full md:w-auto">
                              <div className="relative">
                                {publicKeySol ? (
                                  <Button
                                    className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 cursor-pointer rounded-none rounded-l-sm mr-2"
                                    disabled={!publicKeySol}
                                    onClick={() => {
                                      onSendBitzForMusicBounty({
                                        creatorIcon: artistProfile.img,
                                        creatorName: artistProfile.name,
                                        creatorSlug: artistProfile.slug,
                                        giveBitzToWho: artistProfile.creatorWallet,
                                        giveBitzToCampaignId: artistProfile.bountyId,
                                      });
                                    }}>
                                    <>
                                      <Zap className="w-4 h-4" />
                                      <span className="ml-2">Power-Up</span>
                                    </>
                                  </Button>
                                ) : (
                                  <Button
                                    className="!text-black text-sm px-[1rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 cursor-pointer rounded-none rounded-l-sm mr-2"
                                    onClick={() => {
                                      window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search)}`;
                                    }}>
                                    <>
                                      <WalletMinimal />
                                      <span className="ml-2">Login to Power-Up</span>
                                    </>
                                  </Button>
                                )}
                              </div>

                              <div
                                className={`${publicKeySol && typeof bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum !== "undefined" ? "-ml-[12px] hover:bg-orange-100 dark:hover:text-orange-500 cursor-pointer" : "-ml-[12px]"} text-center text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 mt-0 rounded-r md:min-w-[100px] flex items-center justify-center `}>
                                {typeof bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum === "undefined" ? (
                                  <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                                ) : (
                                  <div
                                    className="p-10 md:p-10"
                                    onClick={() => {
                                      if (publicKeySol) {
                                        onSendBitzForMusicBounty({
                                          creatorIcon: artistProfile.img,
                                          creatorName: artistProfile.name,
                                          creatorSlug: artistProfile.slug,
                                          giveBitzToWho: artistProfile.creatorWallet,
                                          giveBitzToCampaignId: artistProfile.bountyId,
                                        });
                                      }
                                    }}>
                                    <span className="font-bold text-sm">Power</span>
                                    <span className="ml-1 mt-[10px] text-sm">{bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className={`artist-bio-n-links flex flex-col items-baseline md:block`}>
                            <p className="artist-who">{artistProfile.bio}</p>

                            {(artistProfile.dripLink !== "" ||
                              artistProfile.xLink !== "" ||
                              artistProfile.webLink !== "" ||
                              artistProfile.ytLink !== "" ||
                              artistProfile.otherLink1 !== "" ||
                              artistProfile.instaLink !== "" ||
                              artistProfile.tikTokLink !== "") && (
                              <div className="flex flex-row mt-5 flex-wrap">
                                {artistProfile.dripLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.dripLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Droplet className="m-auto w-5" />
                                      Drip
                                    </div>
                                  </a>
                                )}
                                {artistProfile.xLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.xLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Twitter className="m-auto w-5" />X
                                    </div>
                                  </a>
                                )}
                                {artistProfile.ytLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.ytLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Youtube className="m-auto w-5" />
                                      YouTube
                                    </div>
                                  </a>
                                )}
                                {artistProfile.webLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.webLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Globe className="m-auto w-5" />
                                      Website
                                    </div>
                                  </a>
                                )}
                                {artistProfile.instaLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.instaLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Instagram className="m-auto w-5" />
                                      Instagram
                                    </div>
                                  </a>
                                )}
                                {artistProfile.tikTokLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.tikTokLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <img src={TikTokIcon} alt="TikTok" className="m-auto w-[24px] h-[24px]" />
                                      TikTok
                                    </div>
                                  </a>
                                )}
                                {artistProfile.otherLink1 && filterByArtistCampaignCode === -1 && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.otherLink1} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Link2 className="m-auto w-5" />
                                      More
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="artist-tabs flex flex-col p-2 items-start w-full">
                        {/* Tabs Navigation */}
                        <div className="tabs-menu w-full border-b border-gray-600 overflow-y-auto pb-5 md:pb-0">
                          <div className="flex space-x-8">
                            {tabsOrdered.includes("discography") && (
                              <button
                                onClick={() => {
                                  setActiveTab("discography");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  delete currentParams["tab"];
                                  delete currentParams["action"];
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "discography"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Discography
                              </button>
                            )}
                            {tabsOrdered.includes("fan") && (
                              <button
                                onClick={() => {
                                  setActiveTab("fan");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  currentParams["tab"] = "fan";
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "fan"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Inner Circle Fan Membership
                              </button>
                            )}
                            {tabsOrdered.includes("leaderboard") && (
                              <button
                                onClick={() => {
                                  setActiveTab("leaderboard");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  delete currentParams["tab"];
                                  delete currentParams["action"];
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "leaderboard"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Power-Up Leaderboard
                              </button>
                            )}
                            {tabsOrdered.includes("artistStats") && (
                              <button
                                onClick={() => {
                                  setActiveTab("artistStats");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  delete currentParams["tab"];
                                  delete currentParams["action"];
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "artistStats"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Artist Insights
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Tabs Content */}
                        {tabsOrdered.includes("discography") && activeTab === "discography" && (
                          <div className="artist-discography w-full">
                            <ArtistDiscography
                              albums={artistProfile.albums}
                              artistProfile={artistProfile}
                              bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                              isPreviewPlaying={isPreviewPlaying}
                              previewIsReadyToPlay={previewIsReadyToPlay}
                              previewPlayingForAlbumId={previewPlayingForAlbumId}
                              currentTime={currentTime}
                              dataNftPlayingOnMainPlayer={dataNftPlayingOnMainPlayer}
                              isMusicPlayerOpen={isMusicPlayerOpen}
                              highlightAlbumId={selAlbumId}
                              onSendBitzForMusicBounty={onSendBitzForMusicBounty}
                              playPausePreview={playPausePreview}
                              checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                              viewSolData={viewSolData}
                              openActionFireLogic={openActionFireLogic}
                              onCloseMusicPlayer={onCloseMusicPlayer}
                            />
                          </div>
                        )}
                        {tabsOrdered.includes("leaderboard") && activeTab === "leaderboard" && (
                          <div className="artist-xp-leaderboard w-full">
                            <ArtistXPLeaderboard
                              bountyId={artistProfile.bountyId}
                              creatorWallet={artistProfile.creatorWallet}
                              xpCollectionIdToUse={xpCollectionIdToUse}
                              loggedInAddress={addressSol ? addressSol : ""}
                            />
                          </div>
                        )}
                        {tabsOrdered.includes("artistStats") && activeTab === "artistStats" && (
                          <div className="artist-album-sales w-full">
                            <ArtistStats
                              creatorPaymentsWallet={artistProfile.creatorPaymentsWallet}
                              artistId={artistProfile.artistId}
                              setActiveTab={setActiveTab}
                              onFeaturedArtistDeepLinkSlug={onFeaturedArtistDeepLinkSlug}
                            />
                          </div>
                        )}
                        {tabsOrdered.includes("fan") && activeTab === "fan" && (
                          <div className="artist-fan w-full">
                            <ArtistInnerCircle
                              artistName={artistProfile.name.replaceAll("_", " ")}
                              artistSlug={artistProfile.slug}
                              creatorPaymentsWallet={artistProfile.creatorPaymentsWallet}
                              artistId={artistProfile.artistId}
                              filterByArtistCampaignCode={filterByArtistCampaignCode}
                              nftMarketplaceLink={artistProfile.otherLink1 || ""}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show larger profile or token image modal */}
        {selectedLargeSizeProfileImg && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
              <img src={selectedLargeSizeProfileImg} alt="Membership Token" className="w-[75%] h-auto m-auto rounded-lg" />
              <div>
                <button
                  onClick={() => {
                    setSelectedLargeSizeProfileImg(null);
                  }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
