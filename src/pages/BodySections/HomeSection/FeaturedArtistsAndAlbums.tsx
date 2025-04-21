import React, { useEffect, useState } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { WalletMinimal, Twitter, Youtube, Link2, Globe, Droplet, Zap, CircleArrowLeft, Loader } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { ArtistInnerCircle } from "components/ArtistInnerCircle/ArtistInnerCircle";
import ArtistStats from "components/ArtistStats/ArtistStats";
import { ArtistXPLeaderboard } from "components/ArtistXPLeaderboard/ArtistXPLeaderboard";
import { DEFAULT_BITZ_COLLECTION_SOL, DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { GiftBitzToArtistMeta } from "libs/types";
import { Artist, Album, AlbumWithArtist } from "libs/types";
import { BountyBitzSumMapping } from "libs/types";
import { sleep, scrollToTopOnMainContentArea } from "libs/utils";
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
  const [isFreeDropSampleWorkflow, setIsFreeDropSampleWorkflow] = useState(false);
  const [isSigmaWorkflow, setIsSigmaWorkflow] = useState(false);
  const { solBitzNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<Artist[]>([]);
  const [albumsDataset, setAlbumsDataset] = useState<AlbumWithArtist[]>([]);
  const [artistAlbumDataLoading, setArtistAlbumDataLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("discography");
  const { updateAlbumMasterLookup } = useAppStore();

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
    scrollToTopOnMainContentArea();

    const isHlWorkflowDeepLink = searchParams.get("hl");
    const jumpToTab = searchParams.get("t");

    if (isHlWorkflowDeepLink === "sample") {
      setIsFreeDropSampleWorkflow(true);
    } else if (isHlWorkflowDeepLink === "sigma") {
      setIsSigmaWorkflow(true);
    }

    if (jumpToTab && jumpToTab === "fan") {
      setActiveTab("fan");
    }

    previewTrackAudio.addEventListener("ended", eventToAttachEnded);
    previewTrackAudio.addEventListener("timeupdate", eventToAttachTimeUpdate);
    previewTrackAudio.addEventListener("canplaythrough", eventToAttachCanPlayThrough);

    (async () => {
      await sleep(2);
      const allArtistsAlbumsData = await getArtistsAlbumsData();
      let allAlbumsData: AlbumWithArtist[] = [];

      allAlbumsData = allArtistsAlbumsData.flatMap((artist: Artist) =>
        artist.albums.map(
          (album: Album): AlbumWithArtist => ({
            ...album,
            artistId: artist.artistId,
            artistName: artist.name,
            artistSlug: artist.slug,
          })
        )
      );

      // await sleep(5);

      setArtistAlbumDataset(allArtistsAlbumsData);
      setAlbumsDataset(allAlbumsData);

      setArtistAlbumDataLoading(false);

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
    })();

    return () => {
      previewTrackAudio.pause();
      previewTrackAudio.removeEventListener("ended", eventToAttachEnded);
      previewTrackAudio.removeEventListener("timeupdate", eventToAttachTimeUpdate);
      previewTrackAudio.removeEventListener("canplaythrough", eventToAttachCanPlayThrough);
    };
  }, []);

  useEffect(
    () => () => {
      // on unmount we have to stp playing as for some reason the play continues always otherwise
      playPausePreview(); // with no params wil always go into the stop logic

      // remove the artist param from the url
      const currentParams = Object.fromEntries(searchParams.entries());
      delete currentParams["artist"];
      delete currentParams["t"];
      setSearchParams(currentParams);
    },
    []
  );

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

        // ios safari seems to not play the music so tried to use blobs like in the other Audio component like Radio
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

      if (metaKey === "pcolor") {
        return `#${pos}` || "intial";
      } else {
        return pos || "intial";
      }
    } catch {
      // Return default if URL is invalid
      return "intial";
    }
  }

  function handleBackToArtistTileView() {
    playPausePreview(); // with no params wil always go into the stop logic

    setInArtistProfileView(false);

    // remove the artist param from the url
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist"];
    delete currentParams["t"];
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
        <div className="text-2xl xl:text-3xl cursor-pointer mb-3 w-full">
          <div className="flex flex-col md:flex-row justify-between w-full">
            {inArtistProfileView ? (
              <Button
                className="!text-black text-xl px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 mx-2 cursor-pointer"
                variant="outline"
                onClick={handleBackToArtistTileView}>
                <>
                  <CircleArrowLeft />
                  <span className="ml-2">Back to All {isAllAlbumsMode ? "Albums" : "Artists"}</span>
                </>
              </Button>
            ) : (
              <span className="text-center">{isAllAlbumsMode ? "Albums" : "Artists"}</span>
            )}
          </div>
        </div>

        <div id="artist-profile" className="flex flex-col md:flex-row w-[100%] items-start">
          {artistAlbumDataLoading || artistAlbumDataset.length === 0 ? (
            <div className="flex flex-col gap-4 p-2 items-start bg-background rounded-lg min-h-[350px] w-full">
              {artistAlbumDataLoading ? (
                <div className="m-auto w-full">
                  <div className="w-full flex flex-col items-center h-[250px] md:h-[100%] md:grid md:grid-rows-[250px] md:auto-rows-[250px] md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-[10px]">
                    {[...Array(30)].map((_, index) => (
                      <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="m-auto min-h-6">⚠️ Artist section is unavailable. We are working on it!</div>
              )}
            </div>
          ) : (
            <div className="w-full">
              {/* all artists or albums tiles */}
              {!inArtistProfileView && (
                <div className="flex flex-col gap-4 p-2 items-start bg-background min-h-[350px] w-full">
                  {!isAllAlbumsMode && (
                    <div className="artist-boxes w-full flex flex-col items-center md:grid md:grid-rows-[250px] md:auto-rows-[250px] md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-[10px] ">
                      {artistAlbumDataset.map((artist: any) => (
                        <div
                          key={artist.artistId}
                          className={`flex w-[250px] h-[250px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105`}
                          onClick={() => {
                            if (artist.artistId !== selArtistId) {
                              setArtistProfile(null); // reset the artist profile (so previous selected artist clears, the next line -  onFeaturedArtistDeepLinkSlug(artist.slug) - triggers a cascading effect to select the new artist)

                              // notify the home page, which then triggers an effect to setSelArtistId
                              onFeaturedArtistDeepLinkSlug(artist.slug);

                              setUserInteractedWithTabs(true);
                              // setInArtistProfileView(true);
                              setLoadIntoTileView(false); // notify the parent that we are in the artist profile view (so that when we click on main Artists menu, we go back to the artist tile view)

                              scrollToTopOnMainContentArea();
                            }
                          }}>
                          <div
                            className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg cursor-pointer"
                            style={{
                              "backgroundImage": `url(${artist.img})`,
                              "backgroundPosition": getImagePositionMeta(artist.img, "tpos"),
                            }}>
                            <div className="bg-black absolute bottom-0 w-[100%] p-2 rounded-b-[7px]">
                              <h2 className={`!text-lg !text-white lg:!text-lg text-nowrap text-center text-ellipsis overflow-hidden`}>
                                {artist.name.replaceAll("_", " ")}
                              </h2>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAllAlbumsMode && (
                    <div className="artist-boxes w-full flex flex-col items-center md:grid md:grid-rows-[250px] md:auto-rows-[250px] md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-[10px] ">
                      {albumsDataset.map((album: AlbumWithArtist) => (
                        <div
                          key={album.albumId}
                          className={`flex w-[250px] h-[250px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105`}
                          onClick={() => {
                            if (album.artistId !== selArtistId || album.albumId !== selAlbumId) {
                              setArtistProfile(null); // reset the artist profile (so previous selected artist clears, the next line -  onFeaturedArtistDeepLinkSlug(artist.slug) - triggers a cascading effect to select the new artist)

                              // notify the home page, which then triggers an effect to setSelArtistId
                              onFeaturedArtistDeepLinkSlug(album.artistSlug, album.albumId);

                              setUserInteractedWithTabs(true);
                              // setInArtistProfileView(true);
                              setLoadIntoTileView(false); // notify the parent that we are in the artist profile view (so that when we click on main Artists menu, we go back to the artist tile view)

                              scrollToTopOnMainContentArea();
                            }
                          }}>
                          <div
                            className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg cursor-pointer"
                            style={{
                              "backgroundImage": `url(${album.img})`,
                              "backgroundPosition": getImagePositionMeta(album.img, "tpos"),
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
                    <div className="flex flex-col md:flex-row gap-4 w-full bgx-red-500">
                      <div className="artist-bio md:w-[700px] flex flex-col bgx-blue-500">
                        <div className="img-container">
                          <div
                            className="relative border-[0.5px] border-neutral-500/90 h-[320px] md:h-[320px] w-[100%] flex-1 bg-no-repeat bg-cover rounded-lg"
                            style={{
                              "backgroundImage": `url(${artistProfile.img})`,
                              "backgroundPosition": getImagePositionMeta(artistProfile.img, "ppos"),
                              "backgroundColor": getImagePositionMeta(artistProfile.img, "pcolor"),
                              "backgroundSize": getImagePositionMeta(artistProfile.img, "psize"),
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
                                {isSigmaWorkflow && (
                                  <div className="animate-bounce p-3 text-sm absolute w-[110px] ml-[-18px] mt-[12px] text-center">
                                    <div className="m-auto mb-[2px] bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
                                      <FontAwesomeIcon icon={faHandPointer} />
                                    </div>
                                    <span className="text-center">Click To Vote</span>
                                  </div>
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

                          <div className={`artist-bio-n-links flex flex-col items-baseline md:block ${isSigmaWorkflow ? "opacity-[0.1]" : ""}`}>
                            <p className="artist-who">{artistProfile.bio}</p>

                            {(artistProfile.dripLink !== "" ||
                              artistProfile.xLink !== "" ||
                              artistProfile.webLink !== "" ||
                              artistProfile.ytLink !== "" ||
                              artistProfile.otherLink1 !== "") && (
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
                                {artistProfile.otherLink1 && (
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

                      <div className="artist-tabs flex flex-col p-2 items-start bgx-green-600 w-full">
                        {/* Tabs Navigation */}
                        <div className="tabs-menu w-full border-b border-gray-600 overflow-y-auto pb-5 md:pb-0">
                          <div className="flex space-x-8">
                            <button
                              onClick={() => {
                                setActiveTab("discography");
                                const currentParams = Object.fromEntries(searchParams.entries());
                                delete currentParams["t"];
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
                            <button
                              onClick={() => {
                                setActiveTab("leaderboard");
                                const currentParams = Object.fromEntries(searchParams.entries());
                                delete currentParams["t"];
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
                            <button
                              onClick={() => {
                                setActiveTab("artistStats");
                                const currentParams = Object.fromEntries(searchParams.entries());
                                delete currentParams["t"];
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
                            <button
                              onClick={() => {
                                setActiveTab("fan");
                                const currentParams = Object.fromEntries(searchParams.entries());
                                currentParams["t"] = "fan";
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
                          </div>
                        </div>

                        {/* Tabs Content */}
                        {activeTab === "discography" && (
                          <div className="artist-discography w-full">
                            <ArtistDiscography
                              albums={artistProfile.albums}
                              artistProfile={artistProfile}
                              bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                              isPreviewPlaying={isPreviewPlaying}
                              previewIsReadyToPlay={previewIsReadyToPlay}
                              previewPlayingForAlbumId={previewPlayingForAlbumId}
                              currentTime={currentTime}
                              isFreeDropSampleWorkflow={isFreeDropSampleWorkflow}
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

                        {activeTab === "leaderboard" && (
                          <div className="artist-xp-leaderboard w-full">
                            <ArtistXPLeaderboard
                              bountyId={artistProfile.bountyId}
                              creatorWallet={artistProfile.creatorWallet}
                              xpCollectionIdToUse={xpCollectionIdToUse}
                            />
                          </div>
                        )}

                        {activeTab === "artistStats" && (
                          <div className="artist-album-sales w-full">
                            <ArtistStats
                              creatorPaymentsWallet={artistProfile.creatorPaymentsWallet}
                              artistId={artistProfile.artistId}
                              setActiveTab={setActiveTab}
                              onFeaturedArtistDeepLinkSlug={onFeaturedArtistDeepLinkSlug}
                            />
                          </div>
                        )}

                        {activeTab === "fan" && (
                          <div className="artist-fan w-full">
                            <ArtistInnerCircle
                              artistName={artistProfile.name.replaceAll("_", " ")}
                              artistSlug={artistProfile.slug}
                              creatorPaymentsWallet={artistProfile.creatorPaymentsWallet}
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
      </div>
    </div>
  );
};
