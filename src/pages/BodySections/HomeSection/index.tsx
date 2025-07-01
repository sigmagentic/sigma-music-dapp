import React, { useEffect, useState, useCallback } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CAMPAIGN_WSB_CTA from "assets/img/campaigns/campaign-wsb-home-cta.png";
import { MusicPlayer } from "components/AudioPlayer/MusicPlayer";
import { MARSHAL_CACHE_DURATION_SECONDS, ALL_MUSIC_GENRES, GenreTier, isUIDebugMode } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BlobDataType, ExtendedViewDataReturnType, MusicTrack } from "libs/types";
import { getAlbumTracksFromDBViaAPI, getMusicTracksByGenreViaAPI } from "libs/utils/misc";
import { scrollToTopOnMainContentArea } from "libs/utils/ui";
import { toastClosableError } from "libs/utils/uiShared";
import { CampaignHero } from "pages/Campaigns/CampaignHero";
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
import { MyProfile } from "./MyProfile";
import { RewardPools } from "./RewardPools";
import { SendBitzPowerUp } from "./SendBitzPowerUp";
import { getFirstTrackBlobData, updateBountyBitzSumGlobalMappingWindow } from "./shared/utils";

type HomeSectionProps = {
  homeMode: string;
  campaignCodeFilter: string | undefined;
  triggerTogglePlaylistPlayback: string;
  featuredArtistDeepLinkSlug: string | undefined;
  setFeaturedArtistDeepLinkSlug: (featuredArtistDeepLinkSlug: string | undefined) => void;
  setHomeMode: (homeMode: string) => void;
  setCampaignCodeFilter: (campaignCodeFilter: string | undefined) => void;
  navigateToDeepAppView: (logicParams: any) => void;
};

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
  } = props;
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [currentDataNftIndex, setCurrentDataNftIndex] = useState(-1);
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });
  const { solBitzNfts, solMusicAssetNfts } = useNftsStore();
  const [stopPreviewPlaying, setStopPreviewPlaying] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol } = useSolanaWallet();
  const [bitzGiftingMeta, setBitzGiftingMeta] = useState<{
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null>(null);
  const [userHasNoBitzDataNftYet, setUserHasNoBitzDataNftYet] = useState(false);
  const { assetPlayIsQueued, trackPlayIsQueued, updateAssetPlayIsQueued, albumIdBeingPlayed, updateAlbumIdBeingPlayed } = useAudioPlayerStore();
  const [viewSolDataHasError, setViewSolDataHasError] = useState<boolean>(false);
  const [ownedSolDataNftNameAndIndexMap, setOwnedSolDataNftNameAndIndexMap] = useState<any>(null);
  const { artistLookupEverything } = useAppStore();
  const [genrePlaylistUpdateTimeout, setGenrePlaylistUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, creatorSlug: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined });

  // this is a copy of the bitz balances bounties are getting (inside FeaturedArtistsAndAlbums.tsx) during the users ui session
  // ... but it only get progressively loaded as the user moves between tabs to see the artist and their albums (so its not a complete state)
  const [bountyBitzSumGlobalMapping, setMusicBountyBitzSumGlobalMapping] = useState<any>({});

  // album or artis tiles view
  const [loadIntoTileView, setLoadIntoTileView] = useState(false);

  // Player state control (for both album and playlist)
  const [musicPlayerTrackListFromDb, setMusicPlayerTrackListFromDb] = useState<boolean>(false);
  const [musicPlayerAlbumTrackList, setMusicPlayerAlbumTrackList] = useState<MusicTrack[]>([]);
  const [musicPlayerPlaylistTrackList, setMusicPlayerPlaylistTrackList] = useState<MusicTrack[]>([]);
  const [musicPlayerDefaultPlaylistTrackList, setMusicPlayerDefaultPlaylistTrackList] = useState<MusicTrack[]>([]);
  const [launchPlaylistPlayer, setLaunchPlaylistPlayer] = useState(false); // control the visibility base music player in PLAYLIST play mode
  const [launchPlaylistPlayerWithDefaultTracks, setLaunchPlaylistPlayerWithDefaultTracks] = useState(false); // if we need to recover the default playlist tracks
  const [launchAlbumPlayer, setLaunchAlbumPlayer] = useState<boolean>(false); // control the visibility base music player in ALBUM play mode
  const [firstAlbumSongBlobUrl, setFirstAlbumSongBlobUrl] = useState<string | undefined>();
  const [firstPlaylistSongBlobUrl, setFirstPlaylistSongBlobUrl] = useState<string | undefined>();
  const [firstDefaultPlaylistSongBlobUrl, setFirstDefaultPlaylistSongBlobUrl] = useState<string | undefined>();
  const [loadPlaylistPlayerIntoDockedMode, setLoadPlaylistPlayerIntoDockedMode] = useState(true); // load the playlist player into docked mode?
  const [selectedPlaylistGenre, setSelectedGenreForPlaylist] = useState<string>("");
  const [musicPlayerPauseInvokeIncrement, setMusicPlayerPauseInvokeIncrement] = useState(0); // a simple method a child component can call to increment this and in turn invoke a pause effect in the main music player

  // Here, when a deep link is hard reloaded, we look for search params and then call back the setHomeMode to load the local view
  useEffect(() => {
    const isCampaignMode = searchParams.get("campaign");

    if (isCampaignMode) {
      setHomeMode(`campaigns-${isCampaignMode}-${new Date().getTime()}`);
      return;
    }

    const isFeaturedArtistDeepLink = searchParams.get("artist");

    if (isFeaturedArtistDeepLink) {
      // user reloaded into a artist deep link, all we need to do is set the home mode to artists, then the below home mode effect takes care of the rest
      setHomeMode(`artists-${new Date().getTime()}`);
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
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (genrePlaylistUpdateTimeout) {
        clearTimeout(genrePlaylistUpdateTimeout);
      }
    };
  }, [genrePlaylistUpdateTimeout]);

  useEffect(() => {
    if (homeMode.includes("artists") || homeMode.includes("campaigns")) {
      setLoadIntoTileView(true);

      const isFeaturedArtistDeepLink = searchParams.get("artist");

      if (isFeaturedArtistDeepLink) {
        setFeaturedArtistDeepLinkSlug(isFeaturedArtistDeepLink.trim());
        setLoadIntoTileView(false);
      }
    }

    if (homeMode.includes("albums")) {
      setLoadIntoTileView(true);
    }

    if (homeMode.includes("campaigns")) {
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams["campaign"] = "wsb";
      delete currentParams["section"];
      delete currentParams["poolId"];
      setSearchParams({ ...currentParams });
    }

    if (homeMode.includes("reward-pools")) {
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams["section"] = "reward-pools";
      delete currentParams["campaign"];
      delete currentParams["artist"];
      delete currentParams["tab"];
      delete currentParams["action"];
      delete currentParams["country"];
      delete currentParams["team"];
      setSearchParams({ ...currentParams });
    }

    if (homeMode.includes("xp-leaderboards")) {
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams["section"] = "xp-leaderboards";
      delete currentParams["campaign"];
      delete currentParams["artist"];
      delete currentParams["tab"];
      delete currentParams["action"];
      delete currentParams["country"];
      delete currentParams["team"];
      setSearchParams({ ...currentParams });
    }

    // dont do this if there is country or team in the search params as those sub pages look janky
    if (!searchParams.get("country") && !searchParams.get("team")) {
      scrollToTopOnMainContentArea();
    }
  }, [homeMode]);

  useEffect(() => {
    // we do this here as if we dont, when the user is in a deep link and come back home, the playlist player is stuck in a loading state
    // ... but only do it if playlist is not already playing
    if (homeMode === "home" && !launchPlaylistPlayer && Object.keys(artistLookupEverything).length > 0) {
      fetchAndLoadDefaultPersonalizedPlaylistTracks();
    }
  }, [homeMode, artistLookupEverything, launchPlaylistPlayer]);

  // user has requested a specific genre playlist
  useEffect(() => {
    if (selectedPlaylistGenre && selectedPlaylistGenre !== "") {
      (async () => {
        setFirstPlaylistSongBlobUrl(undefined);
        setMusicPlayerPlaylistTrackList([]);

        if (selectedPlaylistGenre === "foryou") {
          setLaunchPlaylistPlayer(true);
          setLaunchPlaylistPlayerWithDefaultTracks(true);
          updateAssetPlayIsQueued(false);
        } else {
          const genreTracksRes = await getMusicTracksByGenreViaAPI({ genre: selectedPlaylistGenre, pageSize: 20 });
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
      })();
    }
  }, [selectedPlaylistGenre]);

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

  const debouncedGenrePlaylistUpdate = useCallback(
    (genre: string) => {
      if (genrePlaylistUpdateTimeout) {
        clearTimeout(genrePlaylistUpdateTimeout);
      }

      const timeout = setTimeout(() => {
        setSelectedGenreForPlaylist(genre);
        setGenrePlaylistUpdateTimeout(null);
      }, 1000); // 1 second delay

      setGenrePlaylistUpdateTimeout(timeout);
    },
    [genrePlaylistUpdateTimeout]
  );

  async function fetchAndLoadDefaultPersonalizedPlaylistTracks() {
    try {
      // if we already have playlist tracks, dont fetch them again
      if (musicPlayerDefaultPlaylistTrackList.length === 0) {
        // Step 1: Get saved genres from session storage
        const savedGenres = localStorage.getItem("sig-pref-genres");
        let userSelectedGenre: string;

        if (savedGenres) {
          const parsedGenres = JSON.parse(savedGenres) as string[];
          // console.log("Saved genres:", parsedGenres);

          // Get a random genre from the saved genres
          userSelectedGenre = parsedGenres[Math.floor(Math.random() * parsedGenres.length)];
          // console.log("Random selected genre from saved genres:", userSelectedGenre);
        } else {
          // Step 2: If no saved genres, get random genre from Tier1 of ALL_MUSIC_GENRES
          const tier1Genres = ALL_MUSIC_GENRES.filter((genre) => genre.tier === GenreTier.TIER1);
          userSelectedGenre = tier1Genres[Math.floor(Math.random() * tier1Genres.length)].code;
          // console.log("All available genres:", tier1Genres);
          // console.log("Random selected genre from tier1Genres:", userSelectedGenre);
        }

        // Step 3: Get all tracks
        const allTracksRes = await getMusicTracksByGenreViaAPI({ genre: "all", pageSize: 35 }); // note that API MAY fail if too much response data is requested (35 seems to ok, 50 is too much)
        const allTracks = allTracksRes.tracks || [];
        // console.log("All tracks:", allTracks);

        // Step 4: Get tracks for selected genre
        const genreTracksRes = await getMusicTracksByGenreViaAPI({ genre: userSelectedGenre, pageSize: 20 });
        const genreTracks = genreTracksRes.tracks || [];
        // console.log("Genre tracks:", genreTracks);

        // Step 5: Merge tracks with genre tracks having priority
        const mergedTracks = [...genreTracks, ...allTracks.filter((track: any) => !genreTracks.some((genreTrack: any) => genreTrack.alId === track.alId))];
        // console.log("Merged tracks:", mergedTracks);

        // Step 6: Augment tracks with artist data
        const augmentedTracks = augmentRawPlaylistTracksWithArtistAndAlbumData(mergedTracks);

        // console.log("Augmented tracks:", augmentedTracks);

        // Set the tracks and cache the first track
        if (augmentedTracks.length > 0) {
          setMusicPlayerDefaultPlaylistTrackList([...augmentedTracks]); // keep a copy of the tracks for the default playlist (so we can go back to it if needed)
          setMusicPlayerPlaylistTrackList(augmentedTracks);

          const blobUrl = await getFirstTrackBlobData(augmentedTracks[0]);
          setFirstPlaylistSongBlobUrl(blobUrl);
          setFirstDefaultPlaylistSongBlobUrl(blobUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching playlist tracks:", error);
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
          idx: (index + 1).toString(),
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

  async function viewSolData(albumInOwnershipListIndex: number, playAlbumNowParams?: any, userOwnsAlbum?: boolean) {
    try {
      setIsFetchingDataMarshal(true);
      resetMusicPlayerState();
      setViewSolDataHasError(false);

      let _musicPlayerTrackListFromDb = false;
      let albumTracksFromDb = await getAlbumTracksFromDBViaAPI(playAlbumNowParams.artistId, playAlbumNowParams.albumId, userOwnsAlbum);
      const artistData = artistLookupEverything[playAlbumNowParams.artistId];

      albumTracksFromDb = albumTracksFromDb.map((track: MusicTrack) => ({
        ...track,
        artist: playAlbumNowParams.artistName,
        album: playAlbumNowParams.albumName,
        albumTrackId: track.alId, // the DB calls it alId, but in the app we normalize it to albumTrackId
        artistSlug: artistData.slug,
      }));

      // load the track list via the DB (@TODO: if the userOwnsAlbum, then we should have someway in the music player to capture the play stats as the marshal wont do be doing it)
      if (albumTracksFromDb.length > 0) {
        _musicPlayerTrackListFromDb = true;

        setMusicPlayerAlbumTrackList(albumTracksFromDb);
        setFirstAlbumSongBlobUrl(albumTracksFromDb[0].file);
        setIsFetchingDataMarshal(false);
        setMusicPlayerTrackListFromDb(true);
      }

      // Load the track list via the Data Marshal and Data NFT path (i.e. full web3 path)
      if (!_musicPlayerTrackListFromDb) {
        if (!publicKeySol) throw new Error("Not logged in to stream music via Data NFT");

        const dataNft = solMusicAssetNfts[albumInOwnershipListIndex];

        const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
          solPreaccessNonce,
          solPreaccessSignature,
          solPreaccessTimestamp,
          signMessage,
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
    giveBitzToWho,
    giveBitzToCampaignId,
    isLikeMode,
  }: {
    creatorIcon: string;
    creatorName: string;
    creatorSlug: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
  }) {
    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      creatorSlug,
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
    setMusicPlayerTrackListFromDb(false);
    setLaunchAlbumPlayer(false);
    setLaunchPlaylistPlayer(false);
    // clear this -- its used to carry a like content via bits session to the player so we can collect likes inside it
    setBitzGiftingMeta(null);
    setLoadPlaylistPlayerIntoDockedMode(false);
    setViewSolDataHasError(false);
    setSelectedGenreForPlaylist("");
    updateAlbumIdBeingPlayed(undefined);
  }

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === 1 ? 0 : 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full overflow-hidden md:overflow-visible">
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
                    <Slideshow
                      slides={[
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
                        {
                          image: CAMPAIGN_WSB_CTA,
                          imageCustomClass: "object-cover",
                          alt: "WSB Fan Collectibles Are Live!",
                          buttonText: "WSB Collectibles Now Live!",
                          onClick: () => setHomeMode(`campaigns-wsb-${new Date().getTime()}`),
                        },
                      ]}
                    />
                    <div className="flex flex-col flex-1 text-left align-center justify-center p-2 md:p-5">
                      <span className="text-center font-[Clash-Medium] text-2xl md:text-3xl xl:text-4xl bg-gradient-to-r from-yellow-300 via-orange-500 to-yellow-300 animate-text-gradient inline-block text-transparent bg-clip-text transition-transform cursor-default">
                        Your Music Super App for Exclusive Fan Experiences
                      </span>
                    </div>
                  </div>

                  <div className="featuredBanners flex-1">
                    <FeaturedBanners
                      selectedPlaylistGenre={selectedPlaylistGenre}
                      isMusicPlayerOpen={launchAlbumPlayer || launchPlaylistPlayer}
                      onCloseMusicPlayer={resetMusicPlayerState}
                      setLaunchPlaylistPlayer={setLaunchPlaylistPlayer}
                      setLaunchPlaylistPlayerWithDefaultTracks={setLaunchPlaylistPlayerWithDefaultTracks}
                      onPlaylistGenreUpdate={(genre: string) => {
                        setSelectedGenreForPlaylist(""); // clear any previous genre selection immediately
                        debouncedGenrePlaylistUpdate(genre); // but debounce the actual logic in case the user is click spamming the genre buttons
                      }}
                      onFeaturedArtistDeepLinkSlug={(slug: string) => {
                        setHomeMode(`artists-${new Date().getTime()}`);
                        setSearchParams({ "artist": slug });
                      }}
                      navigateToDeepAppView={navigateToDeepAppView}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {homeMode.includes("campaigns-wsb") && <CampaignHero setCampaignCodeFilter={setCampaignCodeFilter} navigateToDeepAppView={navigateToDeepAppView} />}

          {/* Artists and their Albums */}
          {(homeMode.includes("artists") || homeMode.includes("albums") || homeMode.includes("campaigns-wsb")) && (
            <>
              <div className={`w-full ${homeMode.includes("campaigns-wsb") ? "mt-0" : "mt-5"}`}>
                <FeaturedArtistsAndAlbums
                  viewSolData={viewSolData}
                  stopPreviewPlayingNow={stopPreviewPlaying}
                  featuredArtistDeepLinkSlug={featuredArtistDeepLinkSlug}
                  onFeaturedArtistDeepLinkSlug={(artistSlug: string, albumId?: string) => {
                    let slugToUse = artistSlug;

                    if (albumId) {
                      slugToUse = `${artistSlug}~${albumId}`;
                    }

                    setFeaturedArtistDeepLinkSlug(slugToUse);
                  }}
                  onPlayHappened={() => {
                    // pause the preview tracks if playing
                    setStopPreviewPlaying(false);
                    // pause the main player if playing
                    setMusicPlayerPauseInvokeIncrement(musicPlayerPauseInvokeIncrement + 1);
                  }}
                  checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
                  openActionFireLogic={(_bitzGiftingMeta?: any) => {
                    setLaunchAlbumPlayer(true);
                    setStopPreviewPlaying(true);

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
                />
              </div>
            </>
          )}

          {/* Ny Collected Music Data NFTs */}
          {homeMode === "wallet" && (
            <>
              {publicKeySol && (
                <div className="w-full mt-5">
                  <MyCollectedNFTs
                    viewSolData={viewSolData}
                    isFetchingDataMarshal={isFetchingDataMarshal}
                    viewDataRes={viewDataRes}
                    currentDataNftIndex={currentDataNftIndex}
                    dataMarshalResponse={dataMarshalResponse}
                    firstSongBlobUrl={firstAlbumSongBlobUrl}
                    setStopPreviewPlaying={setStopPreviewPlaying}
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
                      setStopPreviewPlaying(true);

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

          {homeMode === "profile" && (
            <div className="w-full mt-5">
              <MyProfile navigateToDeepAppView={navigateToDeepAppView} />
            </div>
          )}

          {homeMode === "remix" && (
            <div className="w-full mt-5">
              <Remix />
            </div>
          )}

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
                onPlayHappened={() => {
                  // stop the preview playing
                  setStopPreviewPlaying(true);
                }}
                onCloseMusicPlayer={resetMusicPlayerState}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
                viewSolDataHasError={viewSolDataHasError}
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
                onPlayHappened={() => {
                  setStopPreviewPlaying(true);
                }}
                onCloseMusicPlayer={resetMusicPlayerState}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
                viewSolDataHasError={false}
                loadIntoDockedMode={loadPlaylistPlayerIntoDockedMode}
                navigateToDeepAppView={navigateToDeepAppView}
              />
            </div>
          )}

          {/* The album play queue msg */}
          {assetPlayIsQueued && (
            <div className="fixed left-0 bottom-0 w-full z-50">
              <div className="w-full border-[1px] border-foreground/20 rounded-lg rounded-b-none border-b-0 bg-black">
                <div className="h-[100px] flex flex-col items-center justify-center px-2">
                  <Loader className="animate-spin" />
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
