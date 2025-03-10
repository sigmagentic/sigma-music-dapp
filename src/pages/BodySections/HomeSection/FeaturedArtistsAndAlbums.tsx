import React, { useEffect, useState } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMinimal, Twitter, Youtube, Link2, Globe, Droplet, Zap, CircleArrowLeft, Loader } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { DISABLE_BITZ_FEATURES } from "config";
import { Button } from "libComponents/Button";
import { GiftBitzToArtistMeta } from "libs/types";
import { BountyBitzSumMapping } from "libs/types";
import { sleep } from "libs/utils";
import { getArtistsAlbumsData, fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/BodySections/HomeSection/shared/utils";
import { routeNames } from "routes";
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
  loadIntoArtistTileView?: boolean;
  openActionFireLogic: (e: any) => any;
  viewSolData: (e: number) => void;
  onPlayHappened: () => void;
  checkOwnershipOfAlbum: (e: any) => any;
  onSendBitzForMusicBounty: (e: any) => any;
  onFeaturedArtistDeepLinkSlug: (e: string | undefined) => any;
  onCloseMusicPlayer: () => void;
  setLoadIntoArtistTileView: (e: boolean) => void;
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
    loadIntoArtistTileView,
    openActionFireLogic,
    viewSolData,
    onPlayHappened,
    checkOwnershipOfAlbum,
    onSendBitzForMusicBounty,
    onFeaturedArtistDeepLinkSlug,
    onCloseMusicPlayer,
    setLoadIntoArtistTileView,
  } = props;
  const { publicKey: publicKeySol } = useWallet();
  const [previewTrackAudio] = useState(new Audio());
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewPlayingForAlbumId, setPreviewPlayingForAlbumId] = useState<string | undefined>();
  const [previewIsReadyToPlay, setPreviewIsReadyToPlay] = useState(false);
  const [selArtistId, setSelArtistId] = useState<string | undefined>();
  const [userInteractedWithTabs, setUserInteractedWithTabs] = useState<boolean>(false);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [inArtistProfileView, setInArtistProfileView] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [progress, setProgress] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFreeDropSampleWorkflow, setIsFreeDropSampleWorkflow] = useState(false);
  const [isSigmaWorkflow, setIsSigmaWorkflow] = useState(false);
  const { solBitzNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [artistAlbumDataLoading, setArtistAlbumDataLoading] = useState<boolean>(true);

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
    const isHlWorkflowDeepLink = searchParams.get("hl");

    if (isHlWorkflowDeepLink === "sample") {
      setIsFreeDropSampleWorkflow(true);
    } else if (isHlWorkflowDeepLink === "sigma") {
      setIsSigmaWorkflow(true);
    }

    previewTrackAudio.addEventListener("ended", eventToAttachEnded);
    previewTrackAudio.addEventListener("timeupdate", eventToAttachTimeUpdate);
    previewTrackAudio.addEventListener("canplaythrough", eventToAttachCanPlayThrough);

    (async () => {
      sleep(5);
      const allArtistsAlbumsData = await getArtistsAlbumsData();
      // const allArtistsAlbumsData = dataset;
      sleep(5);
      setArtistAlbumDataset(allArtistsAlbumsData);
      setArtistAlbumDataLoading(false);
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
    },
    []
  );

  useEffect(() => {
    if (artistAlbumDataset.length === 0 || !selArtistId) {
      return;
    }

    playPausePreview(); // with no params wil always go into the stop logic

    const selDataItem = artistAlbumDataset.find((i) => i.artistId === selArtistId);

    setArtistProfile(selDataItem);

    // if we don't do the userInteractedWithTabs, then even on page load, we go update the url with artist-profile which we don't want
    if (selDataItem && selDataItem.slug && (userInteractedWithTabs || featuredArtistDeepLinkSlug)) {
      // update the deep link param
      const currentParams = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...currentParams, "artist-profile": selDataItem.slug });
    }

    // we clone selDataItem here so as to no accidentally mutate things
    // we debounce this, so that - if the user is jumping tabs.. it wait until they stop at a tab for 2.5 S before running the complex logic
    debounced_fetchBitzPowerUpsAndLikesForSelectedArtist({ ...selDataItem });
  }, [selArtistId, artistAlbumDataset]);

  useEffect(() => {
    if (artistAlbumDataset.length === 0) {
      return;
    }

    if (featuredArtistDeepLinkSlug) {
      const findArtistBySlug = artistAlbumDataset.find((i) => i.slug === featuredArtistDeepLinkSlug);

      if (findArtistBySlug) {
        setSelArtistId(findArtistBySlug.artistId);
      }

      setInArtistProfileView(true);
    }
  }, [featuredArtistDeepLinkSlug, artistAlbumDataset]);

  useEffect(() => {
    if (stopPreviewPlayingNow) {
      playPausePreview(); // with no params wil always go into the stop logic
    }
  }, [stopPreviewPlayingNow]);

  useEffect(() => {
    if (loadIntoArtistTileView && inArtistProfileView) {
      handleBackToArtistTileView();
    }
  }, [loadIntoArtistTileView]);

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

  function getImagePosition(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      const pos = url.searchParams.get("pos");
      return pos || "left";
    } catch {
      // Return default if URL is invalid
      return "left";
    }
  }

  function handleBackToArtistTileView() {
    playPausePreview(); // with no params wil always go into the stop logic

    setInArtistProfileView(false);

    // remove the artist-profile param from the url
    const currentParams = Object.fromEntries(searchParams.entries());
    delete currentParams["artist-profile"];
    setSearchParams(currentParams);

    // reset the featuredArtistDeepLinkSlug
    onFeaturedArtistDeepLinkSlug(undefined);
    setLoadIntoArtistTileView(false);
  }

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
        <div className="text-2xl xl:text-3xl cursor-pointer mb-3 w-full">
          <span className="">Artists</span>
        </div>

        <div id="artist-profile" className="flex flex-col md:flex-row w-[100%] items-start">
          {artistAlbumDataLoading || artistAlbumDataset.length === 0 ? (
            <div className="flex flex-col gap-4 p-2 items-start bg-background rounded-lg min-h-[350px] w-full">
              {artistAlbumDataLoading ? (
                <div className="m-auto w-full">
                  <div className="w-full flex flex-col items-center h-[300px] md:h-[100%] md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px]">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="m-auto min-h-6">⚠️ Popular artist section is unavailable</div>
              )}
            </div>
          ) : (
            <div className="w-full">
              {!inArtistProfileView && (
                <div className="flex flex-col gap-4 p-2 items-start bg-background min-h-[350px] w-full">
                  <div className="artist-boxes w-full flex flex-col items-center md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px] ">
                    {artistAlbumDataset.map((artist: any) => (
                      <div
                        key={artist.artistId}
                        className={`flex w-[250px] h-[250px] md:w-[300px] md:h-[300px] m-2 cursor-pointer transition-transform duration-200 hover:scale-105`}
                        onClick={() => {
                          if (artist.artistId !== selArtistId) {
                            // notify the home page, which then triggers an effect to setSelArtistId
                            onFeaturedArtistDeepLinkSlug(artist.slug);

                            setUserInteractedWithTabs(true);
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }

                          setInArtistProfileView(true);
                          setLoadIntoArtistTileView(false); // notify the parent that we are in the artist profile view (so that when we click on main Artists menu, we go back to the artist tile view)
                        }}>
                        <div
                          className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-lg cursor-pointer"
                          style={{
                            "backgroundImage": `url(${artist.img})`,
                            "backgroundPosition": getImagePosition(artist.img),
                          }}>
                          <div className="bg-black absolute bottom-0 w-[100%] p-2 rounded-b-[7px]">
                            <h2 className={`!text-lg !text-white lg:!text-xl text-nowrap text-center`}>{artist.name.replaceAll("_", " ")}</h2>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inArtistProfileView && (
                <div className="flex flex-col gap-4 p-2 items-start bg-background">
                  {!artistProfile ? (
                    <div>Loading</div>
                  ) : (
                    <>
                      {/* back to all artists  */}
                      <Button
                        className="!text-black text-xl px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 mx-2 cursor-pointer"
                        variant="outline"
                        onClick={handleBackToArtistTileView}>
                        <>
                          <CircleArrowLeft />
                          <span className="ml-2">Back to All Artists</span>
                        </>
                      </Button>

                      <div className="artist-bio w-[300px] md:w-full flex flex-col md:flex-row">
                        <div className="">
                          <div
                            className="relative border-[0.5px] border-neutral-500/90 h-[320px] md:h-[320px] w-[100%] md:w-[400px] flex-1 bg-no-repeat bg-cover rounded-lg"
                            style={{
                              "backgroundImage": `url(${artistProfile.img})`,
                            }}></div>
                        </div>

                        {/* artists details and power up */}
                        <div className="p-5 pt-2 flex-1">
                          <h2 className={`!text-xl !text-white lg:!text-3xl text-nowrap mb-5 text-center md:text-left`}>
                            {artistProfile.name.replaceAll("_", " ")}
                          </h2>

                          {!DISABLE_BITZ_FEATURES && (
                            <div className="powerUpWithBitz flex flex-col md:flex-row items-center mb-5">
                              <div className="relative">
                                {publicKeySol ? (
                                  <Button
                                    className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 mx-2 cursor-pointer rounded-none rounded-l-sm"
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
                                      <span className="ml-2">Power-Up Musician</span>
                                    </>
                                  </Button>
                                ) : (
                                  <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                                    <Button
                                      className="text-sm mx-2 cursor-pointer !text-orange-500 dark:!text-yellow-300 rounded-none rounded-l-sm"
                                      variant="outline">
                                      <>
                                        <WalletMinimal />
                                        <span className="ml-2">Login to Power-Up Musician</span>
                                      </>
                                    </Button>
                                  </Link>
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
                                className={`${publicKeySol && typeof bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum !== "undefined" ? "-ml-[12px] hover:bg-orange-100 dark:hover:text-orange-500 cursor-pointer" : "ml-0"} text-center text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 mt-2 md:mt-0 rounded-r md:min-w-[100px] flex items-center justify-center `}>
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
                                    <span className="font-bold text-sm">Total Power</span>
                                    <span className="ml-1 mt-[10px] text-sm">{bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className={`${isSigmaWorkflow ? "opacity-[0.1]" : ""}`}>
                            <p className="artist-who">{artistProfile.bio}</p>

                            {(artistProfile.dripLink !== "" ||
                              artistProfile.xLink !== "" ||
                              artistProfile.webLink !== "" ||
                              artistProfile.ytLink !== "" ||
                              artistProfile.otherLink1 !== "") && (
                              <div className="flex flex-col md:flex-row mt-5 flex-wrap">
                                {artistProfile.dripLink && (
                                  <a className="underline hover:no-underline mx-2 text-sm mt-1" href={artistProfile.dripLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 m-2 flex flex-col justify-center align-middle">
                                      <Droplet className="m-auto w-5" />
                                      Artist on Drip
                                    </div>
                                  </a>
                                )}
                                {artistProfile.xLink && (
                                  <a className="underline hover:no-underline mx-2 text-sm mt-1" href={artistProfile.xLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 m-2 flex flex-col justify-center align-middle">
                                      <Twitter className="m-auto w-5" />
                                      Artist on X
                                    </div>
                                  </a>
                                )}
                                {artistProfile.ytLink && (
                                  <a className="underline hover:no-underline mx-2 text-sm mt-1" href={artistProfile.ytLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 m-2 flex flex-col justify-center align-middle">
                                      <Youtube className="m-auto w-5" />
                                      Artist on YouTube
                                    </div>
                                  </a>
                                )}
                                {artistProfile.webLink && (
                                  <a className="underline hover:no-underline mx-2 text-sm mt-1" href={artistProfile.webLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 m-2 flex flex-col justify-center align-middle">
                                      <Globe className="m-auto w-5" />
                                      Artist Website
                                    </div>
                                  </a>
                                )}
                                {artistProfile.otherLink1 && (
                                  <a className="underline hover:no-underline mx-2 text-sm mt-1" href={artistProfile.otherLink1} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 m-2 flex flex-col justify-center align-middle">
                                      <Link2 className="m-auto w-5" />
                                      More Content
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="artist-discography w-[300px] lg:w-full">
                        <p className="mt-5 mb-5 text-xl font-bold text-center md:text-left">Discography</p>

                        <ArtistDiscography
                          albums={artistProfile.albums}
                          bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                          artistProfile={artistProfile}
                          isPreviewPlaying={isPreviewPlaying}
                          previewIsReadyToPlay={previewIsReadyToPlay}
                          previewPlayingForAlbumId={previewPlayingForAlbumId}
                          currentTime={currentTime}
                          isFreeDropSampleWorkflow={isFreeDropSampleWorkflow}
                          dataNftPlayingOnMainPlayer={dataNftPlayingOnMainPlayer}
                          onSendBitzForMusicBounty={onSendBitzForMusicBounty}
                          playPausePreview={playPausePreview}
                          checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                          viewSolData={viewSolData}
                          openActionFireLogic={openActionFireLogic}
                          isMusicPlayerOpen={isMusicPlayerOpen}
                          onCloseMusicPlayer={onCloseMusicPlayer}
                        />
                      </div>
                    </>
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
