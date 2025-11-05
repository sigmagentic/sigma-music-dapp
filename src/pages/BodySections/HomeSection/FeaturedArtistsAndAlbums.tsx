import React, { useEffect, useState, useRef } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { WalletMinimal, Twitter, Youtube, Link2, Globe, Droplet, Zap, CircleArrowLeft, Loader, Instagram, ChevronDown, Play } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import TikTokIcon from "assets/img/icons/tiktok-icon.png";
import ArtistAiRemixes from "components/ArtistAiRemixes/ArtistAiRemixes";
import { ArtistInnerCircle } from "components/ArtistInnerCircle/ArtistInnerCircle";
import ArtistStats from "components/ArtistStats/ArtistStats";
import { ArtistXPLeaderboard } from "components/ArtistXPLeaderboard/ArtistXPLeaderboard";
import { DEFAULT_BITZ_COLLECTION_SOL, DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { Artist, Album, AlbumWithArtist, GiftBitzToArtistMeta, BountyBitzSumMapping } from "libs/types";
import { sleep, scrollToTopOnMainContentArea, isMostLikelyMobile, injectXUserNameIntoTweet } from "libs/utils";
import { getArtistsAlbumsData, fetchBitzPowerUpsAndLikesForSelectedArtist } from "pages/BodySections/HomeSection/shared/utils";
import { routeNames } from "routes";
import { useAppStore } from "store/app";
import { useNftsStore } from "store/nfts";
import { ArtistDiscography } from "./ArtistDiscography";
import { useAudioPlayerStore } from "store/audioPlayer";

let originalSortedArtistAlbumDataset: Artist[] = []; // sorted by "Featured", this is the original "master" copy we always resort or filter from
let originalSortedAlbumsDataset: AlbumWithArtist[] = []; // sorted by "Featured", this is the original "master" copy we always resort or filter from

const filterNames = {
  featured: "Featured",
  recent_added: "Recent Added",
  recent_updated: "Recent Updated",
  with_ai_remix_licenses: "With AI Remix Licenses",
  alphabetical: "Alphabetical",
};

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
  checkOwnershipOfMusicAsset: (e: any, f?: boolean) => any;
  onSendBitzForMusicBounty: (e: any) => any;
  onFeaturedArtistDeepLinkSlug: (artistSlug: string, albumId?: string) => any;
  onCloseMusicPlayer: () => void;
  setLoadIntoTileView: (e: boolean) => void;
  navigateToDeepAppView: (e: any) => any;
  setLaunchPlaylistPlayerWithDefaultTracks: (launchPlaylistPlayerWithDefaultTracks: boolean) => void;
  setLaunchPlaylistPlayer: (launchPlaylistPlayer: boolean) => void;
  onPlaylistUpdate: (playlistCode: string) => void;
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
    checkOwnershipOfMusicAsset,
    onSendBitzForMusicBounty,
    onFeaturedArtistDeepLinkSlug,
    onCloseMusicPlayer,
    setLoadIntoTileView,
    navigateToDeepAppView,
    setLaunchPlaylistPlayerWithDefaultTracks,
    setLaunchPlaylistPlayer,
    onPlaylistUpdate,
  } = props;
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const [searchParams, setSearchParams] = useSearchParams();
  const { solBitzNfts } = useNftsStore();
  const { updateAlbumMasterLookup, updateTileDataCollectionLoadingInProgress } = useAppStore();
  const { trackPlayIsQueued, assetPlayIsQueued, updateAssetPlayIsQueued } = useAudioPlayerStore();

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
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<Artist[]>([]);
  const [albumsDataset, setAlbumsDataset] = useState<AlbumWithArtist[]>([]);
  const [artistAlbumDataLoading, setArtistAlbumDataLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("discography");
  const [tabsOrdered, setTabsOrdered] = useState<string[]>(["discography", "leaderboard", "artistStats", "fan", "aiRemixes"]);
  const [selectedLargeSizeTokenImg, setSelectedLargeSizeTokenImg] = useState<string | null>(null);
  const [tweetText, setTweetText] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("recent_added");

  const prevIsAllAlbumsModeRef = useRef<boolean | undefined>(isAllAlbumsMode);

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

    if (jumpToTab && jumpToTab === "ai-remixes") {
      setActiveTab("aiRemixes");
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
        originalSortedArtistAlbumDataset = [];
        setAlbumsDataset([]);
        originalSortedAlbumsDataset = [];
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

      if (campaignCode && campaignCode !== "" && campaignCode !== "wir") {
        // for campiagns, we jump to the fan tab
        setActiveTab("fan");
        setTabsOrdered(["fan", "leaderboard", "artistStats", "aiRemixes"]);
      } else {
        setTabsOrdered(["discography", "leaderboard", "artistStats", "fan", "aiRemixes"]);
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

      // if the section is "albums", we need to make it "artists" as user is going into a deep album link inside the artist profile view
      if (searchParams.get("section") === "albums") {
        currentParams["section"] = "artists";
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

  useEffect(() => {
    if (artistProfile) {
      const tweetMsg = injectXUserNameIntoTweet(
        `${artistProfile.name}'s _(xUsername)_Sigma Music (@SigmaXMusic) profile looks so cool! Check it out!`,
        artistProfile.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm${location.search}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [artistProfile]);

  useEffect(() => {
    if (artistAlbumDataLoading || originalSortedArtistAlbumDataset.length === 0 || originalSortedAlbumsDataset.length === 0) {
      return;
    }

    if (!isAllAlbumsMode) {
      let reSortedTileData = [...originalSortedArtistAlbumDataset];

      switch (selectedFilter) {
        case "featured":
          reSortedTileData = originalSortedArtistAlbumDataset;
          break;
        case "recent_added":
          // ONLY some artists will have .createdOn property, if so, we use this to sort the artists.. we put them on top and sort them by latest createdOn first
          reSortedTileData = reSortedTileData.sort((a, b) => {
            const aCreatedOn = parseInt(a.createdOn?.toString() || "0");
            const bCreatedOn = parseInt(b.createdOn?.toString() || "0");
            return bCreatedOn - aCreatedOn;
          });
          break;
        case "recent_updated":
          // when artists and albums get updated, the lastIndexOn gets incremented, so we sort by this value, most recent first
          reSortedTileData = reSortedTileData.sort((a, b) => {
            const aLastIndexOn = parseInt(a.lastIndexOn?.toString() || "0");
            const bLastIndexOn = parseInt(b.lastIndexOn?.toString() || "0");
            return bLastIndexOn - aLastIndexOn;
          });
          break;
        default:
          reSortedTileData = reSortedTileData.sort((a, b) => {
            const aMostRecentAlbumTimestamp = a.albums.reduce((max, album) => {
              const timestamp = parseInt(album.updatedOn?.toString() || album.timestampAlbumAdded || "0");
              return Math.max(max, timestamp);
            }, 0);
            const bMostRecentAlbumTimestamp = b.albums.reduce((max, album) => {
              const timestamp = parseInt(album.updatedOn?.toString() || album.timestampAlbumAdded || "0");
              return Math.max(max, timestamp);
            }, 0);
            return bMostRecentAlbumTimestamp - aMostRecentAlbumTimestamp;
          });
          break;
        case "with_ai_remix_licenses":
          // each items will have an albums array, and each Album inside that array will have a .albumPriceOption3 property. if this property is not empty, then we add it to the reSortedTileData
          reSortedTileData = reSortedTileData.filter((item) => item.albums.some((album) => album.albumPriceOption3 && album.albumPriceOption3 !== ""));
          break;
        case "alphabetical":
          // each item in sortedTileData will have a .name property, lets sort them alphabetically using this. from A to Z
          reSortedTileData = reSortedTileData.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      setArtistAlbumDataset(reSortedTileData);
    } else {
      let reSortedTileData = [...originalSortedAlbumsDataset];

      switch (selectedFilter) {
        case "featured":
          reSortedTileData = originalSortedAlbumsDataset;
          break;
        case "recent_added":
          // each item will have a .timestampAlbumAdded which can be "0" value (which means it's old) and a value like "1749620368" which is a unix epoch time in seconds (note that they are both in strings), we need to sort them by this value. order by most recent first
          reSortedTileData = reSortedTileData.sort((a, b) => {
            const aTimestamp = parseInt(a.updatedOn?.toString() || a.timestampAlbumAdded || "0");
            const bTimestamp = parseInt(b.updatedOn?.toString() || b.timestampAlbumAdded || "0");
            return bTimestamp - aTimestamp;
          });
          break;
        case "recent_updated":
          // when albums get updated, the lastIndexOn gets incremented, so we sort by this value, most recent first
          reSortedTileData = reSortedTileData.sort((a, b) => {
            const aLastIndexOn = parseInt(a.lastIndexOn?.toString() || "0");
            const bLastIndexOn = parseInt(b.lastIndexOn?.toString() || "0");
            return bLastIndexOn - aLastIndexOn;
          });
          break;
        case "with_ai_remix_licenses":
          // each item will have .albumPriceOption3 property, if this is not empty, then we add it to the reSortedTileData
          reSortedTileData = reSortedTileData.filter((item) => item.albumPriceOption3 && item.albumPriceOption3 !== "");
          break;
        case "alphabetical":
          // each item in sortedTileData will have a .title property, lets sort them alphabetically using this. from A to Z
          reSortedTileData = reSortedTileData.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      setAlbumsDataset(reSortedTileData);
    }
  }, [selectedFilter, isAllAlbumsMode, artistAlbumDataLoading]);

  useEffect(() => {
    const prevValue = prevIsAllAlbumsModeRef.current;
    const currentValue = isAllAlbumsMode;

    // Only run custom logic if the value has changed
    if (prevValue !== currentValue) {
      setSelectedFilter("recent_added"); // revert to the default filter if user swapped between artist and album view
    }

    // Update the ref to the current value for the next effect run
    prevIsAllAlbumsModeRef.current = currentValue;
  }, [isAllAlbumsMode]);

  useEffect(() => {
    if (searchParams.get("view") && searchParams.get("view") !== "" && searchParams.get("view") !== "featured") {
      setSelectedFilter(searchParams.get("view") as string);
    }
  }, [searchParams]);

  function updateUrlWithSelectedFilter(newFilter: string) {
    const currentParams = Object.fromEntries(searchParams.entries());

    if (newFilter !== "featured") {
      currentParams["view"] = newFilter;
    } else {
      delete currentParams["view"];
    }

    setSearchParams({ ...currentParams });

    // search params change triggers the searchParams effect above to change the setSelectedFilter which then triggers the actual data change
    // ... but for featured, we dont change the search params so we manaully change the filter here to sort the data
    if (newFilter === "featured") {
      setSelectedFilter("featured");
    }
  }

  async function fetchAndUpdateArtistAlbumDataIntoView() {
    setArtistAlbumDataLoading(true);
    updateTileDataCollectionLoadingInProgress(true);

    await sleep(0.5);

    const { albumArtistLookupData, albumArtistLookupDataOrganizedBySections } = await getArtistsAlbumsData();
    let allAlbumsData: AlbumWithArtist[] = [];

    const artistMasterCatalogueToUse =
      filterByArtistCampaignCode && filterByArtistCampaignCode !== -1
        ? albumArtistLookupDataOrganizedBySections[filterByArtistCampaignCode]?.filteredItems || []
        : albumArtistLookupData;

    allAlbumsData = artistMasterCatalogueToUse.flatMap((artist: Artist) =>
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

    setArtistAlbumDataset(artistMasterCatalogueToUse);
    originalSortedArtistAlbumDataset = artistMasterCatalogueToUse;
    setAlbumsDataset(allAlbumsData);
    originalSortedAlbumsDataset = allAlbumsData;

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
        if (metaKey === "tpos") {
          return pos || "center";
        } else {
          return pos || "intial";
        }
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

    // when we are coming into a album from the albums list view, we change the url section to "artists" so there is a link back to the artist deep link (in case they share the URL)
    // .. when if they going back to the albums list view, we change the url section back to "albums"
    if (isAllAlbumsMode) {
      currentParams["section"] = "albums";
    }

    setSearchParams(currentParams);

    // reset the featuredArtistDeepLinkSlug
    onFeaturedArtistDeepLinkSlug("");
    setLoadIntoTileView(false);
    setActiveTab("discography");
    setSelAlbumId(undefined);
    setSelArtistId(undefined);
  }

  function handleArtistPlaylistPlay() {
    onCloseMusicPlayer();

    if (isMusicPlayerOpen) {
      updateAssetPlayIsQueued(true);
      setTimeout(() => {
        onPlaylistUpdate(`artist_playlist-${selArtistId}`);
        setLaunchPlaylistPlayerWithDefaultTracks(false);
        setLaunchPlaylistPlayer(true);
        updateAssetPlayIsQueued(false);
      }, 5000);
    } else {
      onPlaylistUpdate(`artist_playlist-${selArtistId}`);
      setLaunchPlaylistPlayerWithDefaultTracks(false);
      setLaunchPlaylistPlayer(true);
      updateAssetPlayIsQueued(false);
    }
  }

  const xpCollectionIdToUse = !addressSol || solBitzNfts.length === 0 ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="relative flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
        <div
          className={`text-2xl xl:text-3xl cursor-pointer mr-auto ml-[8px] w-full ${inArtistProfileView ? "!absolute md:!relative md:h-[1px] md:left-[-15px] w-[auto] z-[1] !top-1 md:!top-auto " : ""}`}>
          <div className={`flex flex-col md:flex-row justify-between ${inArtistProfileView ? "md:w-[fit-content]" : "w-full"}`}>
            {(!filterByArtistCampaignCode || filterByArtistCampaignCode === -1) && inArtistProfileView ? (
              <div
                className={`bg-gradient-to-r from-yellow-300 to-orange-500 p-[1px] px-[2px] rounded-lg justify-center mr-2 md:opacity-80 md:hover:opacity-100 w-fit`}>
                <Button
                  className={`bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-sm h-[46px] px-[10px]`}
                  variant="outline"
                  onClick={handleBackToArtistTileView}>
                  <>
                    <CircleArrowLeft />
                  </>
                </Button>
              </div>
            ) : (
              <>
                {!filterByArtistCampaignCode ||
                  (filterByArtistCampaignCode === -1 && (
                    <div className="flex flex-row justify-between w-full">
                      <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                        {isAllAlbumsMode ? "Albums" : "Artists"}
                      </span>
                      <div className="mr-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                              {filterNames[selectedFilter as keyof typeof filterNames]}
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => updateUrlWithSelectedFilter("recent_added")} className="cursor-pointer">
                              Recently Added
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUrlWithSelectedFilter("featured")} className="cursor-pointer">
                              Featured
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUrlWithSelectedFilter("recent_updated")} className="cursor-pointer">
                              Recently Updated
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUrlWithSelectedFilter("with_ai_remix_licenses")} className="cursor-pointer">
                              With AI Remix Licenses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUrlWithSelectedFilter("alphabetical")} className="cursor-pointer">
                              Alphabetical
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-[100%] items-start">
          {artistAlbumDataLoading || artistAlbumDataset.length === 0 ? (
            <div className="flex flex-col gap-4 p-2 items-start bg-background rounded-lg min-h-[250px] w-full">
              {artistAlbumDataLoading ? (
                <div className="m-auto w-full">
                  <div className="w-full flex flex-col items-center h-[250px] md:h-[100%] md:grid md:grid-rows-[250px] md:auto-rows-[250px] md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-[10px]">
                    {[...Array(30)].map((_, index) => (
                      <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-sm animate-pulse bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {filterByArtistCampaignCode && filterByArtistCampaignCode !== -1 ? (
                    <div className="min-h-6">
                      Artist collection is coming very soon! Await ammouncement on{" "}
                      <a href="https://x.com/SigmaMusic" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-600">
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
                <div className="flex flex-col gap-4 items-start bg-background min-h-[350px] w-full">
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
                            className="relative h-[100%] w-[100%] bg-no-repeat bg-cover rounded-sm cursor-pointer group"
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
                              <>
                                <div className="bg-black absolute bottom-0 w-[100%] p-2 rounded-b-[7px]">
                                  <h2 className={`!text-lg !text-white lg:!text-lg text-nowrap text-center text-ellipsis overflow-hidden`}>
                                    {artist.name.replaceAll("_", " ")}
                                  </h2>
                                </div>
                                {artist.isVerifiedArtist && (
                                  <div
                                    title="This artist has been verified by Sigma Music"
                                    className={`absolute top-1 right-1 rounded-md text-md p-2 bg-yellow-300 text-gray-800 text-[10px]`}>
                                    ☑️ Verified Artist
                                  </div>
                                )}
                              </>
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
                          className={`img-container ${artistProfile.isVerifiedArtist ? "border-2 border-yellow-300 bg-yellow-300 rounded-sm" : "border-2 border-yellow-300/10 bg-yellow-300/10 rounded-md"} relative ${activeTab === "fan" && artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== "" ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            // if the artist has a 3D gif teaser, allow the user to click on the image to see the full size image
                            if (activeTab === "fan" && artistProfile.fanToken3DGifTeaser && artistProfile.fanToken3DGifTeaser !== "") {
                              setSelectedLargeSizeTokenImg(`https://api.itheumcloud.com/app_nftunes/assets/token_img/${artistProfile.fanToken3DGifTeaser}.gif`);
                            } else {
                              return;
                            }
                          }}>
                          <div
                            className="relative h-[320px] md:h-[320px] w-[100%] flex-1 bg-no-repeat bg-cover rounded-md"
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

                          {artistProfile.isVerifiedArtist && (
                            <div title="This artist has been verified by Sigma Music" className={`text-md p-2 bg-yellow-300 text-gray-800 text-sm`}>
                              ☑️ Verified Artist
                            </div>
                          )}
                        </div>

                        {/* artists details and power up */}
                        <div className="details-container p-2 md:p-5 pt-2 flex-1 flex flex-col md:block items-baseline">
                          <div className="flex flex-row w-full items-start bgx-red-500">
                            <div className="flex flex-col w-full items-start bgx-blue-500">
                              <h2 className={`!text-xl !text-white lg:!text-3xl text-nowrap mb-5 text-center md:text-left mt-5 md:mt-0`}>
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
                                            creatorXLink: artistProfile.xLink,
                                            giveBitzToWho: artistProfile.creatorWallet,
                                            giveBitzToCampaignId: artistProfile.bountyId,
                                          });
                                        }}>
                                        <>
                                          <Zap className="w-4 h-4" />
                                          <span className="ml-2 text-xs">Power-Up</span>
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
                                          <span className="ml-2 text-xs">Login to Power-Up</span>
                                        </>
                                      </Button>
                                    )}
                                  </div>

                                  <div
                                    className={`${publicKeySol && typeof bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum !== "undefined" ? "-ml-[12px] hover:bg-orange-100 dark:hover:text-orange-500 cursor-pointer" : "-ml-[12px]"} text-center text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 mt-0 rounded-r md:min-w-[100px] flex items-center justify-center`}>
                                    {typeof bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum === "undefined" ? (
                                      <Loader className="w-full text-center animate-spin m-2" size={20} />
                                    ) : (
                                      <div
                                        className="p-5 md:p-5"
                                        onClick={() => {
                                          if (publicKeySol) {
                                            onSendBitzForMusicBounty({
                                              creatorIcon: artistProfile.img,
                                              creatorName: artistProfile.name,
                                              creatorSlug: artistProfile.slug,
                                              creatorXLink: artistProfile.xLink,
                                              giveBitzToWho: artistProfile.creatorWallet,
                                              giveBitzToCampaignId: artistProfile.bountyId,
                                            });
                                          }
                                        }}>
                                        <span className="font-bold text-xs">Power</span>
                                        <span className="ml-1 mt-[10px] text-xs">{bountyBitzSumGlobalMapping[artistProfile.bountyId]?.bitsSum}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bgx-green-500 flex items-center justify-center">
                              {/* Large Circular Play Button */}
                              <button
                                disabled={assetPlayIsQueued || trackPlayIsQueued}
                                className={`w-16 h-16 md:w-[6rem] md:h-[4rem] rounded-full flex items-center justify-center transition-all duration-200 ${
                                  assetPlayIsQueued || trackPlayIsQueued
                                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                                    : "bg-gradient-to-r from-green-400 to-orange-500 hover:from-orange-500 hover:to-green-400 hover:scale-105 cursor-pointer"
                                }`}
                                onClick={() => handleArtistPlaylistPlay()}>
                                {assetPlayIsQueued || trackPlayIsQueued ? (
                                  <Loader className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                  <Play className="w-6 h-6 text-white ml-1" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className={`artist-bio-n-links flex flex-col items-baseline md:block`}>
                            <div className="relative">
                              <p
                                className="artist-who text-sm overflow-hidden"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  maxHeight: "4.5rem", // Approximately 3 lines of text
                                }}
                                title={artistProfile.bio}>
                                {artistProfile.bio}
                              </p>
                              {/* Dark shadow overlay to indicate more content */}
                              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#171717] to-transparent pointer-events-none"></div>
                            </div>

                            {(artistProfile.dripLink !== "" ||
                              artistProfile.xLink !== "" ||
                              artistProfile.webLink !== "" ||
                              artistProfile.ytLink !== "" ||
                              artistProfile.otherLink1 !== "" ||
                              artistProfile.instaLink !== "" ||
                              artistProfile.tikTokLink !== "" ||
                              artistProfile.sunoLink !== "" ||
                              artistProfile.bandcampLink !== "" ||
                              artistProfile.soundcloudLink !== "") && (
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
                                {artistProfile.sunoLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.sunoLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Globe className="m-auto w-5" />
                                      Suno
                                    </div>
                                  </a>
                                )}
                                {artistProfile.bandcampLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.bandcampLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Globe className="m-auto w-5" />
                                      Bandcamp
                                    </div>
                                  </a>
                                )}
                                {artistProfile.soundcloudLink && (
                                  <a className="underline hover:no-underline md:mx-2 text-sm mt-1" href={artistProfile.soundcloudLink} target="_blank">
                                    <div className="border-[0.5px] text-center p-2 ml-1 md:m-2 flex flex-col justify-center align-middle w-[100px]">
                                      <Globe className="m-auto w-5" />
                                      Soundcloud
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

                          <div className="border border-yellow-600 rounded-full p-[10px] -z-1 w-[269px] mt-5">
                            <a
                              className="z-1 text-white text-sm rounded-3xl gap-2 flex flex-row justify-center items-center"
                              href={"https://twitter.com/intent/tweet?" + tweetText}
                              data-size="large"
                              target="_blank"
                              rel="noreferrer">
                              <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                </svg>
                              </span>
                              <p className="z-10">Share this artist profile on X</p>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="artist-tabs flex flex-col p-2 items-start w-full">
                        {/* Tabs Navigation */}
                        <div className="tabs-menu w-full border-b border-gray-800 overflow-x-auto pb-5 md:pb-0">
                          <div className="flex space-x-8 whitespace-nowrap min-w-max">
                            {tabsOrdered.includes("discography") && (
                              <button
                                onClick={() => {
                                  setActiveTab("discography");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  delete currentParams["tab"];
                                  delete currentParams["action"];
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                                  ${
                                    activeTab === "fan"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Inner Circle Fan Club
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                                  ${
                                    activeTab === "leaderboard"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Fan Leaderboard
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                                  ${
                                    activeTab === "artistStats"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                Artist Insights
                              </button>
                            )}
                            {tabsOrdered.includes("aiRemixes") && (
                              <button
                                onClick={() => {
                                  setActiveTab("aiRemixes");
                                  const currentParams = Object.fromEntries(searchParams.entries());
                                  currentParams["tab"] = "ai-remixes";
                                  delete currentParams["action"];
                                  setSearchParams(currentParams);
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                                  ${
                                    activeTab === "aiRemixes"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                                AI Remixes
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
                              checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
                              viewSolData={viewSolData}
                              openActionFireLogic={openActionFireLogic}
                              onCloseMusicPlayer={onCloseMusicPlayer}
                              navigateToDeepAppView={navigateToDeepAppView}
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
                              navigateToDeepAppView={navigateToDeepAppView}
                            />
                          </div>
                        )}
                        {tabsOrdered.includes("fan") && activeTab === "fan" && (
                          <div className="artist-fan w-full">
                            <ArtistInnerCircle
                              artistName={artistProfile.name.replaceAll("_", " ")}
                              artistSlug={artistProfile.slug}
                              artistXLink={artistProfile.xLink}
                              creatorPaymentsWallet={artistProfile.creatorPaymentsWallet}
                              artistId={artistProfile.artistId}
                              filterByArtistCampaignCode={filterByArtistCampaignCode}
                              nftMarketplaceLink={artistProfile.fanTokenNftMarketplaceLink || ""}
                              artistProfile={artistProfile}
                            />
                          </div>
                        )}
                        {tabsOrdered.includes("aiRemixes") && activeTab === "aiRemixes" && (
                          <div className="artist-album-sales w-full">
                            <ArtistAiRemixes
                              artistId={artistProfile.artistId}
                              artistName={artistProfile.name}
                              setActiveTab={setActiveTab}
                              onFeaturedArtistDeepLinkSlug={onFeaturedArtistDeepLinkSlug}
                              onCloseMusicPlayer={onCloseMusicPlayer}
                              viewSolData={viewSolData}
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
        {selectedLargeSizeTokenImg && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
              <img src={selectedLargeSizeTokenImg} alt="Membership Token" className="w-[75%] h-auto m-auto rounded-lg" />
              <div>
                <button
                  onClick={() => {
                    setSelectedLargeSizeTokenImg(null);
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
