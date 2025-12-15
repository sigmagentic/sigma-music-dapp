import React, { useEffect, useState, useCallback, useRef } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MusicPlayer } from "components/AudioPlayer/MusicPlayer";
import { MARSHAL_CACHE_DURATION_SECONDS, ALL_MUSIC_GENRES, GenreTier, isUIDebugMode } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BlobDataType, ExtendedViewDataReturnType, MusicTrack } from "libs/types";
import { getAlbumTracksFromDBViaAPI, getArtistPlaylistTracksFromDBViaAPI, getMusicTracksByGenreViaAPI } from "libs/utils/api";
import { removeAllDeepSectionParamsFromUrlExceptSection, scrollToTopOnMainContentArea } from "libs/utils/ui";
import { toastClosableError } from "libs/utils/uiShared";
import { CampaignHeroWIR } from "pages/Campaigns/CampaignHeroWIR";
import { CampaignHeroWSB } from "pages/Campaigns/CampaignHeroWSB";
import { Remix } from "pages/Remix";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { useAudioPlayerStore } from "store/audioPlayer";
import { useNftsStore } from "store/nfts";
import { Slideshow } from "./components/Slideshow";
import { FeaturedArtistsAndAlbums } from "./FeaturedArtistsAndAlbums";
import { FeaturedBanners } from "./FeaturedBanners";
import { Leaderboards } from "./Leaderboards";
import { MiniGames } from "./MiniGames";
import { MyCollectedNFTs } from "./MyCollectedNFTs";
import { MyProfile } from "./Account/MyProfile";
import { RewardPools } from "./RewardPools";
import { SendBitzPowerUp } from "./SendBitzPowerUp";
import { getArtistsAlbumsData, getFirstTrackBlobData, updateBountyBitzSumGlobalMappingWindow } from "./shared/utils";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";

type HomeSectionProps = {
  homeMode: string;
  campaignCodeFilter: string | undefined;
  triggerTogglePlaylistPlayback: string;
  featuredArtistDeepLinkSlug: string | undefined;
  setFeaturedArtistDeepLinkSlug: (featuredArtistDeepLinkSlug: string | undefined) => void;
  setHomeMode: (homeMode: string) => void;
  setCampaignCodeFilter: (campaignCodeFilter: string | undefined) => void;
  navigateToDeepAppView: (logicParams: any) => void;
  removeDeepSectionParamsFromUrl: () => void;
};

type MostRecentAlbum = {
  albumId: string;
  artistSlug: string;
  artistName: string;
  img: string;
  title: string;
};

let MOST_RECENT_ALBUMS_DATA: MostRecentAlbum[] = [];

export const HomeSection = (props: HomeSectionProps) => {
  const {
    homeMode,
    setHomeMode,
    triggerTogglePlaylistPlayback,
    campaignCodeFilter,
    setCampaignCodeFilter,
    navigateToDeepAppView,
    featuredArtistDeepLinkSlug,
    setFeaturedArtistDeepLinkSlug,
    removeDeepSectionParamsFromUrl,
  } = props;

  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const { solBitzNfts, solMusicAssetNfts } = useNftsStore();
  const { artistLookupEverything, updateArtistLookupEverything, updateArtistLookup, updateAlbumLookup } = useAppStore();

  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });
  const [currentDataNftIndex, setCurrentDataNftIndex] = useState(-1);
  const [bitzGiftingMeta, setBitzGiftingMeta] = useState<{
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null>(null);
  const [userHasNoBitzDataNftYet, setUserHasNoBitzDataNftYet] = useState(false);
  const {
    assetPlayIsQueued,
    trackPlayIsQueued,
    updateAssetPlayIsQueued,
    albumIdBeingPlayed,
    updateAlbumIdBeingPlayed,
    updateArtistIdBeingPlayedInPlaylist,
    updatePlaylistTrackIndexBeingPlayed,
    updateJumpToTrackIndexInAlbumBeingPlayed,
  } = useAudioPlayerStore();
  const [viewSolDataHasError, setViewSolDataHasError] = useState<boolean>(false);
  const [ownedSolDataNftNameAndIndexMap, setOwnedSolDataNftNameAndIndexMap] = useState<any>(null);
  const [playlistUpdateTimeout, setPlaylistUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [heroSlideshowContent, setHeroSlideshowContent] = useState<any[]>([]);
  const [mostRecentAlbumsFetched, setMostRecentAlbumsFetched] = useState<boolean>(false);
  const [dynamicHeroContentAdded, setDynamicHeroContentAdded] = useState<boolean>(false);

  // Animated text rotation words
  const rotatingWords = [
    "New",
    "Future-Ready",
    "AI",
    "Web3",
    "Innovative",
    "IP-Secure",
    "Story Protocol",
    "Agentic",
    "Tokenized",
    "DeFi",
    "Exclusive",
    "Fan-First",
    "Mind-Blowing",
    "Sigma",
  ];
  const { currentWord, isTransitioning, startTextRotation, stopTextRotation, isRunning } = useAnimatedTextRotation(rotatingWords, 3000);

  // Cached Signature Store Items
  const {
    solPreaccessNonce,
    solPreaccessSignature,
    solPreaccessTimestamp,
    updateSolPreaccessNonce,
    updateSolPreaccessTimestamp,
    updateSolSignedPreaccess,
    myMusicAssetPurchases,
  } = useAccountStore();

  // give bits to a bounty (power up or like)
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    creatorSlug: string | undefined;
    creatorXLink: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({
    creatorIcon: undefined,
    creatorName: undefined,
    creatorSlug: undefined,
    creatorXLink: undefined,
    giveBitzToWho: "",
    giveBitzToCampaignId: "",
    isLikeMode: undefined,
  });

  // this is a copy of the bitz balances bounties are getting (inside FeaturedArtistsAndAlbums.tsx) during the users ui session
  // ... but it only get progressively loaded as the user moves between tabs to see the artist and their albums (so its not a complete state)
  const [bountyBitzSumGlobalMapping, setMusicBountyBitzSumGlobalMapping] = useState<any>({});

  // album or artis tiles view
  const [loadIntoTileView, setLoadIntoTileView] = useState(false);

  // Player state control (for both album and playlist)
  const [musicPlayerTrackListFromDb, setMusicPlayerTrackListFromDb] = useState<boolean>(false);
  const [musicPlayerAlbumTrackList, setMusicPlayerAlbumTrackList] = useState<MusicTrack[]>([]);
  const [jumpToPlaylistTrackIndex, setJumpToPlaylistTrackIndex] = useState<number | undefined>(undefined);
  const [musicPlayerPlaylistTrackList, setMusicPlayerPlaylistTrackList] = useState<MusicTrack[]>([]);
  const [musicPlayerDefaultPlaylistTrackList, setMusicPlayerDefaultPlaylistTrackList] = useState<MusicTrack[]>([]);
  const [defaultPlaylistTrackListLoading, setDefaultPlaylistTrackListLoading] = useState<boolean>(true);
  const [launchPlaylistPlayer, setLaunchPlaylistPlayer] = useState(false); // control the visibility base music player in PLAYLIST play mode
  const [launchPlaylistPlayerWithDefaultTracks, setLaunchPlaylistPlayerWithDefaultTracks] = useState(false); // if we need to recover the default playlist tracks
  const [launchAlbumPlayer, setLaunchAlbumPlayer] = useState<boolean>(false); // control the visibility base music player in ALBUM play mode
  const [firstAlbumSongBlobUrl, setFirstAlbumSongBlobUrl] = useState<string | undefined>();
  const [firstPlaylistSongBlobUrl, setFirstPlaylistSongBlobUrl] = useState<string | undefined>();
  const [firstDefaultPlaylistSongBlobUrl, setFirstDefaultPlaylistSongBlobUrl] = useState<string | undefined>();
  const [loadPlaylistPlayerIntoDockedMode, setLoadPlaylistPlayerIntoDockedMode] = useState(true); // load the playlist player into docked mode?
  const [selectedCodeForPlaylist, setSelectedCodeForPlaylist] = useState<string>("");
  const [musicPlayerPauseInvokeIncrement, setMusicPlayerPauseInvokeIncrement] = useState(0); // a simple method a child component can call to increment this and in turn invoke a pause effect in the main music player

  // Here, when a deep link is hard reloaded, we look for search params and then call back the setHomeMode to load the local view
  useEffect(() => {
    const isCampaignMode = searchParams.get("campaign");

    if (isCampaignMode) {
      setHomeMode(`campaigns-${isCampaignMode}-${new Date().getTime()}`);
      return;
    }

    const isSectionMode = searchParams.get("section");

    if (isSectionMode && isSectionMode === "reward-pools") {
      setHomeMode(`reward-pools-${new Date().getTime()}`);
      return;
    }

    if (isSectionMode && isSectionMode === "xp-leaderboards") {
      setHomeMode(`xp-leaderboards-${new Date().getTime()}`);
      return;
    }

    if (isSectionMode && isSectionMode === "ai-remix") {
      setHomeMode(`ai-remix-${new Date().getTime()}`);
      return;
    }

    if (isSectionMode && isSectionMode === "profile") {
      setHomeMode(`profile-${new Date().getTime()}`);
      return;
    }

    if (isSectionMode && isSectionMode === "wallet") {
      setHomeMode(`wallet-${new Date().getTime()}`);
      return;
    }

    if (isSectionMode && isSectionMode === "albums") {
      setHomeMode(`albums-${new Date().getTime()}`);
      return;
    }

    const isFeaturedArtistDeepLink = searchParams.get("artist");

    if (isFeaturedArtistDeepLink || (isSectionMode && isSectionMode === "artists")) {
      // user reloaded into a artist deep link, all we need to do is set the home mode to artists, then the below home mode effect takes care of the rest
      setHomeMode(`artists-${new Date().getTime()}`);
      return;
    }

    // load the base slides
    setHeroSlideshowContent([
      {
        image: "https://api.itheumcloud.com/app_nftunes/assets/img/Bobby_Ibo_Underdogs.JPG",
        imageCustomClass: "object-none",
        alt: "New EP by Bobby Ibo is Live!",
        buttonText: "New EP by Bobby Ibo is Live!",
        onClick: () => {
          navigateToDeepAppView({
            artistSlug: "bobby-ibo",
            albumId: "ar20_a2",
          });
        },
      },
      {
        image: "https://api.itheumcloud.com/app_nftunes/assets/img/OLLYG_Avatar_Cover.jpeg",
        imageCustomClass: "bg-top",
        alt: "Olly'G Drops a Sigma Exclusive EP!",
        buttonText: "Olly'G Drops a Sigma Exclusive EP!",
        onClick: () => {
          navigateToDeepAppView({
            artistSlug: "olly-g",
            albumId: "ar14_a5",
          });
        },
      },
      {
        image: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Cereals.png",
        imageCustomClass: "bg-top",
        alt: "YFGP Drops a Sigma Exclusive EP!",
        buttonText: "YFGP Drops a Sigma Exclusive EP!",
        onClick: () => {
          navigateToDeepAppView({
            artistSlug: "yfgp",
            albumId: "ar2_a9",
          });
        },
      },
      {
        image: "https://api.itheumcloud.com/app_nftunes/assets/img/April_Four_Amendment_Cover.jpg",
        imageCustomClass: "bg-center",
        alt: "Artist Spotlight on April Four",
        buttonText: "Artist Spotlight on April Four",
        onClick: () => {
          navigateToDeepAppView({
            artistSlug: "april-four",
            albumId: "ar23",
          });
        },
      },
      {
        image: "https://api.itheumcloud.com/app_nftunes/assets/img/DuoDo.jpg",
        imageCustomClass: "object-none",
        alt: "New Music By Dúo Dø is Live!",
        buttonText: "New Music By Dúo Dø is Live!",
        onClick: () => {
          navigateToDeepAppView({
            artistSlug: "dúo-dø",
          });
        },
      },
    ]);
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (playlistUpdateTimeout) {
        clearTimeout(playlistUpdateTimeout);
      }
    };
  }, [playlistUpdateTimeout]);

  useEffect(() => {
    if (homeMode.includes("artists") || homeMode.includes("campaigns")) {
      setLoadIntoTileView(true);

      const isFeaturedArtistDeepLink = searchParams.get("artist");

      if (isFeaturedArtistDeepLink) {
        setFeaturedArtistDeepLinkSlug(isFeaturedArtistDeepLink.trim());
        setLoadIntoTileView(false);
      }

      if (homeMode.includes("artists")) {
        const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("artists", searchParams);
        setSearchParams({ ...newSearchParams });
      }
    }

    if (homeMode.includes("albums")) {
      setLoadIntoTileView(true);

      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("albums", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    if (homeMode.includes("campaigns")) {
      const currentParams = Object.fromEntries(searchParams.entries());

      if (homeMode.includes("campaigns-wsb")) {
        currentParams["campaign"] = "wsb";
      } else if (homeMode.includes("campaigns-wir")) {
        currentParams["campaign"] = "wir";
      }

      delete currentParams["section"];
      delete currentParams["poolId"];

      setSearchParams({ ...currentParams });
    }

    if (homeMode.includes("reward-pools")) {
      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("reward-pools", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    if (homeMode.includes("xp-leaderboards")) {
      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("xp-leaderboards", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    if (homeMode.includes("ai-remix")) {
      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("ai-remix", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    if (homeMode !== "home") {
      // Stop the animated text rotation when we are not in home mode or the interval runs in the BG
      stopTextRotation();
    } else if (homeMode === "home" && !isRunning) {
      // Restart the animation when returning to home mode
      startTextRotation();
    }

    if (homeMode.includes("wallet")) {
      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("wallet", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    if (homeMode.includes("profile")) {
      const newSearchParams = removeAllDeepSectionParamsFromUrlExceptSection("profile", searchParams);
      setSearchParams({ ...newSearchParams });
    }

    // dont do this if there is country or team in the search params as those sub pages look janky
    if (!searchParams.get("country") && !searchParams.get("team")) {
      scrollToTopOnMainContentArea();
    }
  }, [homeMode]);

  useEffect(() => {
    // we do this here as if we dont, when the user is in a deep link and come back home, the playlist player is stuck in a loading state
    // ... but only do it if playlist is not already playing and only do this once for the app session
    if (
      homeMode === "home" &&
      !launchPlaylistPlayer &&
      Object.keys(artistLookupEverything).length > 0 &&
      mostRecentAlbumsFetched &&
      musicPlayerDefaultPlaylistTrackList.length === 0
    ) {
      fetchAndLoadDefaultPersonalizedPlaylistTracks();
    }
  }, [homeMode, artistLookupEverything, launchPlaylistPlayer, mostRecentAlbumsFetched]);

  // user has requested a specific playlist
  useEffect(() => {
    if (selectedCodeForPlaylist && selectedCodeForPlaylist !== "") {
      (async () => {
        setFirstPlaylistSongBlobUrl(undefined);
        setMusicPlayerPlaylistTrackList([]);

        // are we playing an artist playlist or a genre playlist?
        let isArtistPlaylist = false;
        if (selectedCodeForPlaylist.includes("artist_playlist-")) {
          isArtistPlaylist = true;
        }

        if (!isArtistPlaylist) {
          if (selectedCodeForPlaylist === "foryou") {
            setLaunchPlaylistPlayer(true);
            setLaunchPlaylistPlayerWithDefaultTracks(true);
            updateAssetPlayIsQueued(false);
          } else {
            const genreTracksRes = await getMusicTracksByGenreViaAPI({ genre: selectedCodeForPlaylist, pageSize: 20 });
            const genreTracks = genreTracksRes.tracks || [];
            const augmentedTracks = augmentRawPlaylistTracksWithArtistAndAlbumData(genreTracks);

            if (genreTracks.length > 0) {
              setMusicPlayerPlaylistTrackList(augmentedTracks);
              const blobUrl = await getFirstTrackBlobData(augmentedTracks[0]);
              setFirstPlaylistSongBlobUrl(blobUrl);

              setTimeout(() => {
                setLaunchPlaylistPlayer(true);
                setLoadPlaylistPlayerIntoDockedMode(true);
              }, 1000);
            } else {
              // it's unlikely we hit here, can only happen is there is some API issue OR the genre has no tracks
              setTimeout(() => {
                setLaunchPlaylistPlayer(true);
                setLoadPlaylistPlayerIntoDockedMode(false);
              }, 1000);
            }
          }
        } else {
          const artistId = selectedCodeForPlaylist.split("artist_playlist-")[1];
          const artistPlaylistTracksRes = await getArtistPlaylistTracksFromDBViaAPI(artistId);
          const artistPlaylistTracks = artistPlaylistTracksRes || [];
          const augmentedTracks = augmentRawPlaylistTracksWithArtistAndAlbumData(artistPlaylistTracks);

          if (artistPlaylistTracks.length > 0) {
            const blobUrl = await getFirstTrackBlobData(augmentedTracks[0]);
            setMusicPlayerPlaylistTrackList(augmentedTracks);
            setFirstPlaylistSongBlobUrl(blobUrl);
            updateArtistIdBeingPlayedInPlaylist(artistId);
          } else {
            // for whatever reason, the artist playlist has no tracks, so we reset the artistIdBeingPlayedInPlaylist state
            updateArtistIdBeingPlayedInPlaylist(undefined);
          }

          setTimeout(() => {
            setLaunchPlaylistPlayer(true);
            setLoadPlaylistPlayerIntoDockedMode(false);
          }, 1000);
        }
      })();
    }
  }, [selectedCodeForPlaylist]);

  useEffect(() => {
    if (solMusicAssetNfts && solMusicAssetNfts.length > 0) {
      const nameToIndexMap = solMusicAssetNfts.reduce((t: any, solDataNft: DasApiAsset, idx: number) => {
        if (solDataNft?.content?.metadata?.name) {
          // find rarity if it exists or default it to "Common"
          const rarity = solDataNft.content.metadata.attributes?.find((attr: any) => attr.trait_type === "Rarity")?.value || "Common";

          t[`${solDataNft.content.metadata.name} : ${rarity}`] = idx;
        }
        return t;
      }, {});

      setOwnedSolDataNftNameAndIndexMap(nameToIndexMap);
    }
  }, [solMusicAssetNfts]);

  useEffect(() => {
    if (triggerTogglePlaylistPlayback !== "") {
      // we may be toggling (on to off or vice versa) but lets clear any playlist state that maybe have been active, so that we can start fresh
      const someAssetIsPlaying = launchPlaylistPlayer || launchAlbumPlayer;

      if (someAssetIsPlaying) {
        resetMusicPlayerState();
      } else {
        // some asset is playing, so let's queue the next asset (playlist)
        updateAssetPlayIsQueued(true);

        setTimeout(() => {
          setLaunchPlaylistPlayer(true);
          setLaunchPlaylistPlayerWithDefaultTracks(true);
          updateAssetPlayIsQueued(false);
        }, 5000);
      }
    }
  }, [triggerTogglePlaylistPlayback]);

  useEffect(() => {
    if (solBitzNfts.length === 0) {
      setUserHasNoBitzDataNftYet(true);
    } else {
      setUserHasNoBitzDataNftYet(false);
    }
  }, [solBitzNfts]);

  const debouncedPlaylistUpdate = useCallback(
    (playlistCode: string) => {
      if (playlistUpdateTimeout) {
        clearTimeout(playlistUpdateTimeout);
      }

      const timeout = setTimeout(() => {
        setSelectedCodeForPlaylist(playlistCode);
        setPlaylistUpdateTimeout(null);
      }, 1000); // 1 second delay

      setPlaylistUpdateTimeout(timeout);
    },
    [playlistUpdateTimeout]
  );

  /*
  @TODO: this funcion call the API multiple times. EVEN IF the user never clicked on the radio tile. This is not good! We should have a radio API
  */
  async function fetchAndLoadDefaultPersonalizedPlaylistTracks() {
    try {
      setDefaultPlaylistTrackListLoading(true);
      // if we already have playlist tracks, dont fetch them again
      if (musicPlayerDefaultPlaylistTrackList.length === 0) {
        // Step 1: Get saved genres from session storage
        const userPreferenceGenres = localStorage.getItem("sig-pref-genres");
        let userPreferenceGenre: string;

        if (userPreferenceGenres) {
          const parsedGenres = JSON.parse(userPreferenceGenres) as string[];
          // console.log("Saved genres:", parsedGenres);

          // Get a random genre from the saved genres
          userPreferenceGenre = parsedGenres[Math.floor(Math.random() * parsedGenres.length)];
          // console.log("Random selected genre from saved genres:", userPreferenceGenre);
        } else {
          // Step 2: If no saved genres, get random genre from Tier1 of ALL_MUSIC_GENRES
          const tier1Genres = ALL_MUSIC_GENRES.filter((genre) => genre.tier === GenreTier.TIER1);
          userPreferenceGenre = tier1Genres[Math.floor(Math.random() * tier1Genres.length)].code;
        }

        // Step 3: Get all tracks
        const allTracksRes = await getMusicTracksByGenreViaAPI({ genre: "all", pageSize: 35 }); // note that API MAY fail if too much response data is requested (35 seems to ok, 50 is too much)
        const allTracks = allTracksRes.tracks || [];

        // Step 4: Get tracks for selected genre
        const genreTracksRes = await getMusicTracksByGenreViaAPI({ genre: userPreferenceGenre, pageSize: 20 });
        const genreTracks = genreTracksRes.tracks || [];

        // Step 5: Merge tracks with genre tracks having priority
        let mergedTracks = [...genreTracks, ...allTracks.filter((track: any) => !genreTracks.some((genreTrack: any) => genreTrack.alId === track.alId))];
        console.log("mergedTracks A >>>>", mergedTracks);

        // Step 6: Find latest 3 albums and get their tracks and give them the higest priority (for now)
        console.log("MOST_RECENT_ALBUMS_DATA >>>>", MOST_RECENT_ALBUMS_DATA);

        let mostRecentAlbumTracks = [];
        for (const album of MOST_RECENT_ALBUMS_DATA) {
          const albumTracks = await getAlbumTracksFromDBViaAPI(album.albumId.split("_")[0], album.albumId);
          mostRecentAlbumTracks.push(...albumTracks);
        }
        console.log("mostRecentAlbumTracks >>>>", mostRecentAlbumTracks);

        // shuffle the most recent album tracks using Fisher-Yates algorithm
        for (let i = mostRecentAlbumTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mostRecentAlbumTracks[i], mostRecentAlbumTracks[j]] = [mostRecentAlbumTracks[j], mostRecentAlbumTracks[i]];
        }

        mergedTracks = [...mostRecentAlbumTracks, ...mergedTracks];

        console.log("mergedTracks B >>>>", mergedTracks);

        // Step 7: Augment tracks with artist data
        const augmentedTracks = augmentRawPlaylistTracksWithArtistAndAlbumData(mergedTracks);

        console.log("augmentedTracks >>>", augmentedTracks);
        // Step 8: remove any items that have "isExplicit" set to "1", note that isExplicit sometime wont be present, in which case we can assume it's not explicit
        // ... also remove any items that have "hideOrDelete" set to "1" or "2"
        // ... also remove any that have bonus set to 1
        const finalDefaultPlaylistTracks = augmentedTracks
          .filter((track: any) => track.isExplicit !== "1")
          .filter((track: any) => track.hideOrDelete !== "1" && track.hideOrDelete !== "2")
          .filter((track: any) => track.bonus !== 1); // this will be numeric field

        console.log("finalDefaultPlaylistTracks >>>", finalDefaultPlaylistTracks);

        // Set the tracks and cache the first track
        if (finalDefaultPlaylistTracks.length > 0) {
          setMusicPlayerDefaultPlaylistTrackList([...finalDefaultPlaylistTracks]); // keep a copy of the tracks for the default playlist (so we can go back to it if needed)
          setMusicPlayerPlaylistTrackList(finalDefaultPlaylistTracks);

          const blobUrl = await getFirstTrackBlobData(finalDefaultPlaylistTracks[0]);
          setFirstPlaylistSongBlobUrl(blobUrl);
          setFirstDefaultPlaylistSongBlobUrl(blobUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching playlist tracks:", error);
    } finally {
      setDefaultPlaylistTrackListLoading(false);
    }
  }

  function augmentRawPlaylistTracksWithArtistAndAlbumData(tracks: any[]) {
    // Step 6: Augment tracks with artist data
    const augmentedTracks = tracks
      .map((track: any, index: number) => {
        const artistId = track.arId;
        const albumId = track.alId.split("-")[0]; // Extract albumId from alId (e.g., "ar24_a1-2" -> "ar24_a1")

        const artistData = artistLookupEverything[artistId];

        if (!artistData) {
          console.warn(`No artist data found for artistId: ${artistId}`);
          return null;
        }

        const albumData = artistData.albums.find((album: any) => album.albumId === albumId);

        if (!albumData) {
          console.warn(`No album data found for albumId: ${albumId}`);
          return null;
        }

        const musicTrack: MusicTrack = {
          idx: index + 1,
          artist: artistData.name,
          category: track.category, // note that we get "all" here for "foryou" playlist on some tracks. This needs to be fixed in the db
          album: albumData.title,
          cover_art_url: track.cover_art_url,
          title: track.title,
          stream: track.file,
          creatorWallet: artistData.creatorPaymentsWallet,
          bountyId: albumData.bountyId,
          isExplicit: albumData.isExplicit,
          albumTrackId: track.alId,
          artistSlug: artistData.slug,
        };

        return musicTrack;
      })
      .filter((track): track is MusicTrack => track !== null)
      .filter((track) => !track.title.includes("DEMO"));

    return augmentedTracks;
  }

  async function viewSolData(albumInOwnershipListIndex: number, playAlbumNowParams?: any, userOwnsAlbum?: boolean, virtualTrackList?: MusicTrack[]) {
    try {
      setIsFetchingDataMarshal(true);
      resetMusicPlayerState();
      setViewSolDataHasError(false);

      let _musicPlayerTrackListFromDb = false;

      if (virtualTrackList && virtualTrackList.length > 0) {
        setMusicPlayerAlbumTrackList(virtualTrackList);
        setFirstAlbumSongBlobUrl(virtualTrackList[0].stream);
        setIsFetchingDataMarshal(false);
        setMusicPlayerTrackListFromDb(true);
        updateAlbumIdBeingPlayed(playAlbumNowParams.albumId);
        setLaunchPlaylistPlayerWithDefaultTracks(false); // reset this value in-case user was listening to a default playlist before playing an album

        if (playAlbumNowParams?.jumpToPlaylistTrackIndex) {
          setJumpToPlaylistTrackIndex(playAlbumNowParams.jumpToPlaylistTrackIndex);
        }

        setLaunchAlbumPlayer(true);
        return;
      }

      let albumTracksFromDb = await getAlbumTracksFromDBViaAPI(playAlbumNowParams.artistId, playAlbumNowParams.albumId, userOwnsAlbum);
      let artistData = artistLookupEverything[playAlbumNowParams.artistId];

      // S: there is a chance that it's a brand NEW artist, so if artistData is not found maybe it just didnt get indexed into the app yet. so lets try again by refreshing some core data into the store
      const { albumArtistLookupData, albumArtistLookupDataEverything } = await getArtistsAlbumsData();

      const artistLookupMapLatest = albumArtistLookupData.reduce(
        (acc, artist) => {
          acc[artist.artistId] = artist;
          return acc;
        },
        {} as Record<string, any>
      );

      // Create album lookup
      const albumLookupMapLatest = albumArtistLookupData.reduce(
        (acc, artist) => {
          artist.albums.forEach((album: any) => {
            acc[album.albumId] = album;
          });
          return acc;
        },
        {} as Record<string, any>
      );

      const artistLookupEverythingMapLatest = albumArtistLookupDataEverything.reduce(
        (acc, artist) => {
          acc[artist.artistId] = artist;
          return acc;
        },
        {} as Record<string, any>
      );

      updateArtistLookup(artistLookupMapLatest);
      updateAlbumLookup(albumLookupMapLatest);
      updateArtistLookupEverything(artistLookupEverythingMapLatest);
      // E: there is a chance that it's a ....

      artistData = artistLookupEverythingMapLatest[playAlbumNowParams.artistId];

      if (!artistData) {
        throw new Error("No artist data found for artist. Please refresh the page and try again.");
      }

      // filter out any hidden or deleted tracks first...
      albumTracksFromDb = albumTracksFromDb
        .filter((track: MusicTrack) => track.hideOrDelete !== "2" && track.hideOrDelete !== "1")
        .map((track: MusicTrack) => ({
          ...track,
          artist: playAlbumNowParams.artistName,
          album: playAlbumNowParams.albumName,
          albumTrackId: track.alId, // the DB calls it alId, but in the app we normalize it to albumTrackId
          artistSlug: artistData.slug,
        }));

      // load the track list via the DB (@TODO: if the userOwnsAlbum, then we should have someway in the music player to capture the play stats as the marshal wont do be doing it)
      if (albumTracksFromDb.length > 0) {
        _musicPlayerTrackListFromDb = true;

        // find the first track that has a file (as a bonus track wont have a file)
        // and if playAlbumNowParams is NOT given, then we also set playAlbumNowParams.jumpToPlaylistTrackIndex to the track with a file
        const firstTrackWithFile = albumTracksFromDb.find((track: MusicTrack) => track.file);
        if (firstTrackWithFile) {
          setFirstAlbumSongBlobUrl(firstTrackWithFile.file);
          if (playAlbumNowParams && typeof playAlbumNowParams.jumpToPlaylistTrackIndex === "undefined") {
            playAlbumNowParams.jumpToPlaylistTrackIndex = firstTrackWithFile.idx;
          }
        }

        // setFirstAlbumSongBlobUrl(albumTracksFromDb[0].file);
        setMusicPlayerAlbumTrackList(albumTracksFromDb);
        setIsFetchingDataMarshal(false);
        setMusicPlayerTrackListFromDb(true);
      }

      // Load the track list via the Data Marshal and Data NFT path (i.e. full web3 path)
      if (!_musicPlayerTrackListFromDb) {
        if (!publicKeySol) throw new Error("Not logged in to stream music via Data NFT");

        const dataNft = solMusicAssetNfts[albumInOwnershipListIndex];

        if (!dataNft) throw new Error("No data NFT found for album");

        const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
          solPreaccessNonce,
          solPreaccessSignature,
          solPreaccessTimestamp,
          signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
          publicKey: publicKeySol,
          updateSolPreaccessNonce,
          updateSolSignedPreaccess,
          updateSolPreaccessTimestamp,
        });

        const viewDataArgs = {
          headers: {
            "dmf-custom-sol-collection-id": dataNft.grouping[0].group_value,
          },
          fwdHeaderKeys: ["dmf-custom-sol-collection-id"],
        };

        // start the request for the first song
        const firstSongResPromise = viewDataViaMarshalSol(
          dataNft.id,
          usedPreAccessNonce,
          usedPreAccessSignature,
          publicKeySol,
          viewDataArgs.fwdHeaderKeys,
          viewDataArgs.headers,
          true,
          1,
          MARSHAL_CACHE_DURATION_SECONDS
        );

        // start the request for the manifest file from marshal (i.e. play list)
        const res = await viewDataViaMarshalSol(
          dataNft.id,
          usedPreAccessNonce,
          usedPreAccessSignature,
          publicKeySol,
          viewDataArgs.fwdHeaderKeys,
          viewDataArgs.headers,
          false,
          undefined,
          MARSHAL_CACHE_DURATION_SECONDS
        );

        let blobDataType = BlobDataType.TEXT;

        if (res.ok) {
          const contentType = res.headers.get("content-type") ?? "";

          if (contentType.search("application/json") >= 0) {
            const data = await res.json();
            const viewDataPayload: ExtendedViewDataReturnType = {
              data,
              contentType,
              blobDataType,
            };

            // await the first song response and set the firstAlbumSongBlobUrl state (so that first song plays faster)
            const firstSongRes = await firstSongResPromise;
            const blobUrl = URL.createObjectURL(await firstSongRes.blob());

            // this is the data that feeds the player with the album data
            setCurrentDataNftIndex(albumInOwnershipListIndex);
            setDataMarshalResponse(data);
            setMusicPlayerAlbumTrackList(data.data);
            setViewDataRes(viewDataPayload);
            setIsFetchingDataMarshal(false);
            setFirstAlbumSongBlobUrl(blobUrl);
            setMusicPlayerTrackListFromDb(false);
          }
        } else {
          console.error(res.status + " " + res.statusText);
          toastClosableError("On-chain data loading failed, error: " + res.status + " " + res.statusText);
          setIsFetchingDataMarshal(false);
          setViewSolDataHasError(true);
          return { error: true };
        }
      }

      // save in global state the albumId being played
      updateAlbumIdBeingPlayed(playAlbumNowParams.albumId);
      setLaunchPlaylistPlayerWithDefaultTracks(false); // reset this value in-case user was listening to a default playlist before playing an album

      // set the jumpToPlaylistTrackIndex to the first track if it exists
      if (playAlbumNowParams.jumpToPlaylistTrackIndex) {
        setJumpToPlaylistTrackIndex(playAlbumNowParams.jumpToPlaylistTrackIndex);
      }
    } catch (err) {
      console.error(err);
      toastClosableError("Generic error via on-chain data loading, error: " + (err as Error).message);
      setIsFetchingDataMarshal(false);
      setViewSolDataHasError(true);
      return { error: true };
    }
  }

  function checkOwnershipOfMusicAsset(album: any, onlyCheckInCollectibleNftHolding?: boolean) {
    /*
    the user can own the music asset in 2 ways:

    1. the album id is in myMusicAssetPurchases from the store (IF NOT.. move to next)
    2. they own the collectible NFT in their wallet

    Note that they can match for both 1 and 2 if they have bought the NFT colelctible, but we dont need to check both
    */

    let doesUserOwnMusicAsset = -1; // -1 is no and anything more is yes

    // 1. the album id is in myMusicAssetPurchases from the store (IF NOT.. move to next)
    const assetPurchaseThatMatches = myMusicAssetPurchases.find((assetPurchase) => assetPurchase.albumId === album.albumId);

    if (assetPurchaseThatMatches && !onlyCheckInCollectibleNftHolding) {
      doesUserOwnMusicAsset = 0; // this means we own it
    } else {
      // 2. they own the collectible NFT in their wallet?
      let albumInOwnershipListIndex = -1; // note -1 means we don't own it

      if (album?.solNftName && ownedSolDataNftNameAndIndexMap) {
        /* mark the albumInOwnershipListIndex as of the highest rarity album
        Legendary
        Rare
        Common */

        // Normalize the album name
        const normalizeString = (str: string) => str.replace(/[^0-9a-zA-Z]/g, "").toLowerCase();

        // Create normalized map
        const normalizedMap = Object.entries(ownedSolDataNftNameAndIndexMap).reduce(
          (acc, [key, value]) => {
            const normalizedKey = normalizeString(key);
            acc[normalizedKey] = value as number;
            return acc;
          },
          {} as Record<string, number>
        );

        // Normalize the album name we're looking for
        // @TODO: we need to normalize the album name with the solNftName as well (not sure of impact if we dont)
        const normalizedAlbumName = normalizeString(album.solNftName);

        // Check for ownership across rarities
        // we normalize the values as the drip album and the extra bonus mint album names might not exactly match
        // ... e.g. we convert key "MUSG20 - Olly'G - MonaLisa Rap - Common" to "musg20ollygmonalisarapcommon"
        if (typeof normalizedMap[`${normalizedAlbumName}legendary`] !== "undefined") {
          albumInOwnershipListIndex = normalizedMap[`${normalizedAlbumName}legendary`];
        } else if (typeof normalizedMap[`${normalizedAlbumName}rare`] !== "undefined") {
          albumInOwnershipListIndex = normalizedMap[`${normalizedAlbumName}rare`];
        } else if (typeof normalizedMap[`${normalizedAlbumName}common`] !== "undefined") {
          albumInOwnershipListIndex = normalizedMap[`${normalizedAlbumName}common`];
        }

        doesUserOwnMusicAsset = albumInOwnershipListIndex; // the number here is the index of the album in the ownedSolDataNftNameAndIndexMap
      }
    }

    return doesUserOwnMusicAsset;
  }

  // here we set the power up object that will trigger the modal that allows a user to sent bitz to a target bounty
  function handleSendBitzForMusicBounty({
    creatorIcon,
    creatorName,
    creatorSlug,
    creatorXLink,
    giveBitzToWho,
    giveBitzToCampaignId,
    isLikeMode,
  }: {
    creatorIcon: string;
    creatorName: string;
    creatorSlug: string | undefined;
    creatorXLink: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
  }) {
    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      creatorSlug,
      creatorXLink,
      giveBitzToWho,
      giveBitzToCampaignId,
      isLikeMode,
    });
  }

  function resetMusicPlayerState() {
    setFirstAlbumSongBlobUrl(undefined);
    setFirstPlaylistSongBlobUrl(undefined);
    setDataMarshalResponse({ "data_stream": {}, "data": [] });
    setCurrentDataNftIndex(-1);
    setMusicPlayerPlaylistTrackList([]);
    setMusicPlayerAlbumTrackList([]);
    setJumpToPlaylistTrackIndex(undefined);
    setMusicPlayerTrackListFromDb(false);
    setLaunchAlbumPlayer(false);
    setLaunchPlaylistPlayer(false);
    // clear this -- its used to carry a like content via bits session to the player so we can collect likes inside it
    setBitzGiftingMeta(null);
    setLoadPlaylistPlayerIntoDockedMode(false);
    setViewSolDataHasError(false);
    setSelectedCodeForPlaylist("");
    updateAlbumIdBeingPlayed(undefined);
    updateArtistIdBeingPlayedInPlaylist(undefined);
    updatePlaylistTrackIndexBeingPlayed(undefined); // reset it here, but the index is actually set in the music player
    updateJumpToTrackIndexInAlbumBeingPlayed(undefined); // reset it here, but the index is actually set in the music player
  }

  function returnBackToHomeMode() {
    setHomeMode("home");
    removeDeepSectionParamsFromUrl();
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full">
        <div className="flex flex-col justify-center items-center font-[Clash-Regular] w-full pb-6">
          <div className={`debug flex flex-row w-full pb-6 text-xs mt-2 bg-yellow-900 p-3 space-x-2 ${isUIDebugMode() ? "block" : "hidden"}`}>
            <p>
              launchPlaylistPlayerWithDefaultTracks={" "}
              {launchPlaylistPlayerWithDefaultTracks ? <span className="text-green-500">true</span> : <span className="text-red-500">false</span>} <br />
              launchAlbumPlayer = {launchAlbumPlayer ? <span className="text-green-500">true</span> : <span className="text-red-500">false</span>} <br />
              launchPlaylistPlayer = {launchPlaylistPlayer ? <span className="text-green-500">true</span> : <span className="text-red-500">false</span>}
            </p>
            <p>
              trackPlayIsQueued = {trackPlayIsQueued ? <span className="text-green-500">true</span> : <span className="text-red-500">false</span>} <br />
              assetPlayIsQueued = {assetPlayIsQueued ? <span className="text-green-500">true</span> : <span className="text-red-500">false</span>} <br />
              albumIdBeingPlayed = {albumIdBeingPlayed}
            </p>
          </div>

          {/* Playlist Player and main app header CTAs */}
          {homeMode === "home" && (
            <div className="w-full mt-5">
              <div className="flex flex-col-reverse md:flex-row justify-center items-center xl:items-start w-[100%]">
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-col-reverse md:flex-row gap-4">
                    <Slideshow slides={heroSlideshowContent} />
                    <div className="flex flex-col flex-1 text-left align-center justify-center p-2 md:p-5">
                      <span className="md:text-right font-[Clash-Medium] text-3xl md:text-5xl xl:text-5xl bg-gradient-to-r from-yellow-300 via-orange-500 to-yellow-300 animate-text-gradient inline-block text-transparent bg-clip-text transition-transform cursor-default">
                        <p className="mb-2">Monetize Your Music in</p>
                        <p
                          style={{
                            display: "inline-block",
                            minWidth: "fit-content",
                            textAlign: "center",
                            opacity: isTransitioning ? 0 : 1,
                            transform: isTransitioning ? "scale(0.9) translateY(2px)" : "scale(1) translateY(0px)",
                            transition: "all 800ms ease-in-out",
                            textShadow: isTransitioning ? "none" : "1px 1px 1px rgba(251, 191, 36, 1",
                          }}>
                          {currentWord}
                        </p>
                        <p className="mt-[7px]">Ways</p>
                      </span>
                    </div>
                  </div>

                  <div className="featuredBanners flex-1">
                    <FeaturedBanners
                      selectedCodeForPlaylist={selectedCodeForPlaylist}
                      isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer}
                      defaultPlaylistTrackListLoading={defaultPlaylistTrackListLoading}
                      onCloseMusicPlayer={resetMusicPlayerState}
                      setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
                      setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                      onPlaylistUpdate={(genreCode: string) => {
                        setSelectedCodeForPlaylist(""); // clear any previous genre selection immediately
                        debouncedPlaylistUpdate(genreCode); // but debounce the actual logic in case the user is click spamming the genre buttons
                      }}
                      onFeaturedArtistDeepLinkSlug={(slug: string) => {
                        setHomeMode(`artists-${new Date().getTime()}`);
                        setSearchParams({ "artist": slug });
                      }}
                      navigateToDeepAppView={navigateToDeepAppView}
                      handleLatestAlbumsReceived={(latestAlbums: any[]) => {
                        if (dynamicHeroContentAdded) return;

                        const currentHeroSlideshowContent = [...heroSlideshowContent];
                        const mostRecentLatestAlbums = latestAlbums.slice(0, 3).map((album) => ({
                          image: album.img,
                          alt: album.title,
                          buttonText: "New Music by " + album.artistName + " just dropped!",
                          onClick: () => {
                            navigateToDeepAppView({ artistSlug: `${album.artistSlug}~${album.albumId}`, toAction: "tracklist" });
                          },
                        }));

                        // push the top 3 albums to the hero slideshow content
                        setHeroSlideshowContent([...mostRecentLatestAlbums, ...currentHeroSlideshowContent]);

                        // no need to save the following data in state, as it is only received once every for app session
                        MOST_RECENT_ALBUMS_DATA = latestAlbums.slice(0, 3);
                        setMostRecentAlbumsFetched(true);

                        setDynamicHeroContentAdded(true); // if we dont do this, it keep addign content each time we come back to this view
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Sections */}
          <>
            {homeMode.includes("campaigns-wsb") && (
              <CampaignHeroWSB setCampaignCodeFilter={setCampaignCodeFilter} navigateToDeepAppView={navigateToDeepAppView} />
            )}

            {homeMode.includes("campaigns-wir") && (
              <CampaignHeroWIR
                setCampaignCodeFilter={setCampaignCodeFilter}
                navigateToDeepAppView={navigateToDeepAppView}
                selectedCodeForPlaylist={selectedCodeForPlaylist}
                isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer}
                onCloseMusicPlayer={resetMusicPlayerState}
                setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
                setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                onPlaylistUpdate={(genreCode: string) => {
                  setSelectedCodeForPlaylist(""); // clear any previous genre selection immediately
                  debouncedPlaylistUpdate(genreCode); // but debounce the actual logic in case the user is click spamming the genre buttons
                }}
              />
            )}

            {/* Artists and their Albums */}
            {(homeMode.includes("artists") || homeMode.includes("albums") || homeMode.includes("campaigns-wsb")) && (
              <>
                <div className={`w-full ${homeMode.includes("campaigns-wsb") ? "mt-0" : "mt-5"}`}>
                  <FeaturedArtistsAndAlbums
                    viewSolData={viewSolData}
                    featuredArtistDeepLinkSlug={featuredArtistDeepLinkSlug}
                    onFeaturedArtistDeepLinkSlug={(artistSlug: string, albumId?: string) => {
                      let slugToUse = artistSlug;

                      if (albumId) {
                        slugToUse = `${artistSlug}~${albumId}`;
                      }

                      setFeaturedArtistDeepLinkSlug(slugToUse);
                    }}
                    onPlayHappened={() => {
                      // pause the main player if playing
                      setMusicPlayerPauseInvokeIncrement(musicPlayerPauseInvokeIncrement + 1);
                    }}
                    checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
                    openActionFireLogic={(_bitzGiftingMeta?: any) => {
                      setLaunchAlbumPlayer(true);

                      if (_bitzGiftingMeta) {
                        setBitzGiftingMeta(_bitzGiftingMeta);
                      }
                    }}
                    onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                    bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                    setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
                    userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
                    dataNftPlayingOnMainPlayer={solMusicAssetNfts[currentDataNftIndex]}
                    onCloseMusicPlayer={resetMusicPlayerState}
                    isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer}
                    loadIntoTileView={loadIntoTileView}
                    setLoadIntoTileView={setLoadIntoTileView}
                    isAllAlbumsMode={homeMode.includes("albums")}
                    filterByArtistCampaignCode={homeMode.includes("campaigns-wsb") ? campaignCodeFilter : -1}
                    navigateToDeepAppView={navigateToDeepAppView}
                    setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                    setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
                    onPlaylistUpdate={(artistCode: string) => {
                      setSelectedCodeForPlaylist(""); // clear any previous playlist selection immediately
                      debouncedPlaylistUpdate(artistCode); // but debounce the actual logic in case the user is click spamming the playlist button
                    }}
                    returnBackToHomeMode={returnBackToHomeMode}
                  />
                </div>
              </>
            )}

            {/* Ny Collected Music Data NFTs */}
            {homeMode.includes("wallet") && (
              <>
                {publicKeySol && (
                  <div className="w-full mt-5">
                    <MyCollectedNFTs
                      viewSolData={viewSolData}
                      setBitzGiftingMeta={setBitzGiftingMeta}
                      onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                      bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                      checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
                      userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
                      setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
                      setFeaturedArtistDeepLinkSlug={(slug: string) => {
                        setFeaturedArtistDeepLinkSlug(slug);
                      }}
                      openActionFireLogic={(_bitzGiftingMeta?: any) => {
                        setLaunchAlbumPlayer(true);

                        if (_bitzGiftingMeta) {
                          setBitzGiftingMeta(_bitzGiftingMeta);
                        }
                      }}
                      dataNftPlayingOnMainPlayer={solMusicAssetNfts[currentDataNftIndex]}
                      onCloseMusicPlayer={resetMusicPlayerState}
                      isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer}
                      setHomeMode={setHomeMode}
                      navigateToDeepAppView={navigateToDeepAppView}
                    />
                  </div>
                )}
              </>
            )}

            {homeMode === "games" && (
              <div className="w-full mt-5">
                <MiniGames playlistTracks={musicPlayerPlaylistTrackList} isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer} />
              </div>
            )}

            {homeMode.includes("reward-pools") && (
              <div className="w-full mt-5">
                <RewardPools />
              </div>
            )}

            {homeMode.includes("xp-leaderboards") && (
              <div className="w-full mt-5">
                <Leaderboards navigateToDeepAppView={navigateToDeepAppView} />
              </div>
            )}

            {homeMode.includes("profile") && (
              <div className="w-full mt-5">
                <MyProfile
                  navigateToDeepAppView={navigateToDeepAppView}
                  viewSolData={viewSolData}
                  onCloseMusicPlayer={resetMusicPlayerState}
                  setHomeMode={setHomeMode}
                />
              </div>
            )}

            {homeMode.includes("ai-remix") && (
              <div className="w-full mt-5">
                <Remix navigateToDeepAppView={navigateToDeepAppView} onCloseMusicPlayer={resetMusicPlayerState} viewSolData={viewSolData} />
              </div>
            )}
          </>

          {/* The album player footer bar */}
          {launchAlbumPlayer && (
            <div className="w-full fixed left-0 bottom-0 z-50">
              <MusicPlayer
                dataNftToOpen={solMusicAssetNfts[currentDataNftIndex]}
                trackList={musicPlayerAlbumTrackList}
                trackListFromDb={musicPlayerTrackListFromDb}
                isPlaylistPlayer={false}
                firstSongBlobUrl={firstAlbumSongBlobUrl}
                onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                bitzGiftingMeta={bitzGiftingMeta}
                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                onPlayHappened={() => {}}
                onCloseMusicPlayer={resetMusicPlayerState}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
                viewSolDataHasError={viewSolDataHasError}
                jumpToPlaylistTrackIndex={jumpToPlaylistTrackIndex}
                loadIntoDockedMode={false}
                navigateToDeepAppView={navigateToDeepAppView}
              />
            </div>
          )}

          {/* The playlist player footer bar */}
          {launchPlaylistPlayer && (
            <div className="w-full fixed left-0 bottom-0 z-50">
              <MusicPlayer
                dataNftToOpen={undefined}
                trackList={launchPlaylistPlayerWithDefaultTracks ? musicPlayerDefaultPlaylistTrackList : musicPlayerPlaylistTrackList}
                trackListFromDb={false}
                isPlaylistPlayer={true}
                firstSongBlobUrl={launchPlaylistPlayerWithDefaultTracks ? firstDefaultPlaylistSongBlobUrl : firstPlaylistSongBlobUrl}
                onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                bitzGiftingMeta={bitzGiftingMeta}
                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                onPlayHappened={() => {}}
                onCloseMusicPlayer={resetMusicPlayerState}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
                viewSolDataHasError={false}
                jumpToPlaylistTrackIndex={jumpToPlaylistTrackIndex}
                loadIntoDockedMode={loadPlaylistPlayerIntoDockedMode}
                navigateToDeepAppView={navigateToDeepAppView}
              />
            </div>
          )}

          {/* The album play queue msg */}
          {assetPlayIsQueued && (
            <div className="fixed left-0 bottom-0 w-full z-50">
              <div className="w-full md:w-auto border-[1px] border-foreground/20 rounded-lg bg-[#2d2719] md:m-[10px]">
                <div className="h-[100px] flex flex-col items-center justify-center px-2">
                  <Loader className="animate-spin text-yellow-300" size={20} />
                  <p className="text-foreground text-xs mt-3">hang tight, queuing music for playback</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* The bitz power up for creators and album likes */}
        {giveBitzForMusicBountyConfig.giveBitzToWho !== "" && giveBitzForMusicBountyConfig.giveBitzToCampaignId !== "" && (
          <SendBitzPowerUp
            giveBitzForMusicBountyConfig={giveBitzForMusicBountyConfig}
            onCloseModal={(forceRefreshBitzCountsForBounty: any) => {
              setGiveBitzForMusicBountyConfig({
                creatorIcon: undefined,
                creatorName: undefined,
                creatorSlug: undefined,
                creatorXLink: undefined,
                giveBitzToWho: "",
                giveBitzToCampaignId: "",
                isLikeMode: undefined,
              });

              // we can force refresh the bitz counts locally for the bounty
              if (forceRefreshBitzCountsForBounty) {
                const _bountyToBitzLocalMapping: Record<any, any> = { ...bountyBitzSumGlobalMapping };
                const currMappingVal = _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId];

                if (typeof currMappingVal !== "undefined" && typeof currMappingVal.bitsSum !== "undefined") {
                  _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId] = {
                    bitsSum: currMappingVal.bitsSum + forceRefreshBitzCountsForBounty.bitzValToGift,
                    syncedOn: Date.now(),
                  };
                } else {
                  _bountyToBitzLocalMapping[forceRefreshBitzCountsForBounty.giveBitzToCampaignId] = {
                    bitsSum: forceRefreshBitzCountsForBounty.bitzValToGift,
                    syncedOn: Date.now(),
                  };
                }

                updateBountyBitzSumGlobalMappingWindow(_bountyToBitzLocalMapping);
                setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
              }
            }}
          />
        )}
      </div>
    </>
  );
};

// Custom hook for animated text rotation
const useAnimatedTextRotation = (words: string[], intervalMs: number = 3000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      // console.log("Starting transition...");
      setIsTransitioning(true);

      // Wait for transition animation to complete before changing word
      setTimeout(() => {
        // console.log("Changing word from", words[currentIndex], "to", words[(currentIndex + 1) % words.length]);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsTransitioning(false);
      }, 800); // Longer transition to make it more visible
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        // console.log("Clearing animated text rotation interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [words.length, intervalMs, currentIndex, isRunning]);

  return { currentWord: words[currentIndex], isTransitioning, startTextRotation: start, stopTextRotation: stop, isRunning };
};
