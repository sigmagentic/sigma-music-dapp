import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
// import { IS_DEVNET } from "appsConfig";
import sigmaAgent from "assets/img/sigma-banner.webp";
import { MusicPlayer } from "components/AudioPlayer/MusicPlayer";
import { SHOW_NFTS_STEP, MARSHAL_CACHE_DURATION_SECONDS } from "config";
import { Button } from "libComponents/Button";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BlobDataType, ExtendedViewDataReturnType, MusicTrack } from "libs/types";
import { filterRadioTracksByUserPreferences } from "libs/utils/misc";
import { scrollToSection } from "libs/utils/ui";
import { toastClosableError } from "libs/utils/uiShared";
import { routeNames } from "routes";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { useAudioPlayerStore } from "store/audioPlayer";
import { useNftsStore } from "store/nfts";
import { FeaturedArtistsAndAlbums } from "./FeaturedArtistsAndAlbums";
import { FeaturedBanners } from "./FeaturedBanners";
import { MiniGames } from "./MiniGames";
import { MyCollectedAlbums } from "./MyCollectedAlbums";
import { RadioBgCanvas } from "./RadioBgCanvas";
import { RadioTeaser } from "./RadioTeaser";
import { SendBitzPowerUp } from "./SendBitzPowerUp";
import { getNFTuneFirstTrackBlobData, getRadioStreamsData, updateBountyBitzSumGlobalMappingWindow } from "./shared/utils";

export const HomeSection = ({ homeMode, setHomeMode }: { homeMode: string; setHomeMode: (homeMode: string) => void }) => {
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [currentDataNftIndex, setCurrentDataNftIndex] = useState(-1);
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });
  const [firstSongBlobUrl, setFirstSongBlobUrl] = useState<string | undefined>();
  const { solNfts, solBitzNfts } = useNftsStore();
  const [stopPreviewPlaying, setStopPreviewPlaying] = useState<boolean>(false);
  const [featuredArtistDeepLinkSlug, setFeaturedArtistDeepLinkSlug] = useState<string | undefined>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shownSolAppDataNfts, setShownSolAppDataNfts] = useState<DasApiAsset[]>(solNfts.slice(0, SHOW_NFTS_STEP));
  const { publicKey: publicKeySol, signMessage } = useWallet();
  const [bitzGiftingMeta, setBitzGiftingMeta] = useState<{
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null>(null);
  const [userHasNoBitzDataNftYet, setUserHasNoBitzDataNftYet] = useState(false);
  const [musicPlayerTrackList, setMusicPlayerTrackList] = useState<MusicTrack[]>([]);
  const { albumPlayIsQueued } = useAudioPlayerStore();
  const navigate = useNavigate();

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  const [ownedSolDataNftNameAndIndexMap, setOwnedSolDataNftNameAndIndexMap] = useState<any>(null);

  // control the visibility base level music player model
  const [launchMusicPlayer, setLaunchMusicPlayer] = useState<boolean>(false);

  // give bits to a bounty (power up or like)
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined });

  // this is a copy of the bitz balances bounties are getting (inside FeaturedArtistsAndAlbums.tsx) during the users ui session
  // ... but it only get progressively loaded as the user moves between tabs to see the artist and their albums (so its not a complete state)
  const [bountyBitzSumGlobalMapping, setMusicBountyBitzSumGlobalMapping] = useState<any>({});

  const [musicPlayerPauseInvokeIncrement, setMusicPlayerPauseInvokeIncrement] = useState(0); // a simple method a child component can call to increment this and in turn invoke a pause effect in the main music player

  // Radio Player state
  const [radioTracksSorted, setRadioTracksSorted] = useState<MusicTrack[]>([]);
  const [radioTracksOriginal, setRadioTracksOriginal] = useState<MusicTrack[]>([]);
  const [radioTracksLoading, setRadioTracksLoading] = useState(true);
  const [launchRadioPlayer, setLaunchRadioPlayer] = useState(false);
  const [nfTunesRadioFirstTrackCachedBlob, setNfTunesRadioFirstTrackCachedBlob] = useState<string>("");
  const [loadRadioPlayerIntoDockedMode, setLoadRadioPlayerIntoDockedMode] = useState(true); // load the radio player into docked mode?
  const [loadIntoArtistTileView, setLoadIntoArtistTileView] = useState(false);

  // Mini Games
  const [loadMiniGames, setLoadMiniGames] = useState(false);

  // Genres
  const { updateRadioGenres, radioGenresUpdatedByUserSinceLastRadioTracksRefresh, updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh } = useAppStore();

  useEffect(() => {
    const isFeaturedArtistDeepLink = searchParams.get("artist-profile");

    if (isFeaturedArtistDeepLink) {
      // user reloaded into a artist deep link, all we need to do is set the home mode to artists, then the below home mode effect takes care of the rest
      setHomeMode(`artists-${new Date().getTime()}`);
    }

    fetchAndUpdateRadioTracks();
  }, []);

  useEffect(() => {
    if (homeMode === "radio" && !launchRadioPlayer) {
      setLaunchRadioPlayer(true);
      setLoadRadioPlayerIntoDockedMode(true);
    }

    if (homeMode.includes("artists")) {
      setLoadIntoArtistTileView(true);

      const isFeaturedArtistDeepLink = searchParams.get("artist-profile");

      if (isFeaturedArtistDeepLink) {
        setFeaturedArtistDeepLinkSlug(isFeaturedArtistDeepLink.trim());
        setLoadIntoArtistTileView(false);
      }
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [homeMode]);

  useEffect(() => {
    if (launchRadioPlayer) {
      setHomeMode("radio");
    }
  }, [launchRadioPlayer]);

  useEffect(() => {
    if (publicKeySol && solNfts.length > 0) {
      setShownSolAppDataNfts(
        solNfts.filter((nft: DasApiAsset) => {
          if (nft.content.metadata.name.includes("MUS") || nft.content.metadata.name.includes("POD")) {
            return true;
          } else {
            return false;
          }
        })
      );
    }
  }, [solNfts, publicKeySol]);

  useEffect(() => {
    if (shownSolAppDataNfts && shownSolAppDataNfts.length > 0) {
      const nameToIndexMap = shownSolAppDataNfts.reduce((t: any, solDataNft: DasApiAsset, idx: number) => {
        if (solDataNft?.content?.metadata?.name) {
          // find rarity if it exists or default it to "Common"
          const rarity = solDataNft.content.metadata.attributes?.find((attr: any) => attr.trait_type === "Rarity")?.value || "Common";

          t[`${solDataNft.content.metadata.name} : ${rarity}`] = idx;
        }
        return t;
      }, {});

      setOwnedSolDataNftNameAndIndexMap(nameToIndexMap);
    }
  }, [shownSolAppDataNfts]);

  useEffect(() => {
    if (solBitzNfts.length === 0) {
      setUserHasNoBitzDataNftYet(true);
    } else {
      setUserHasNoBitzDataNftYet(false);
    }
  }, [solBitzNfts]);

  // user changed their radio genres, so we need to reorder the radio tracks
  useEffect(() => {
    if (radioGenresUpdatedByUserSinceLastRadioTracksRefresh) {
      (async () => {
        setRadioTracksLoading(true);
        setRadioTracksSorted([]);
        setNfTunesRadioFirstTrackCachedBlob("");

        // we always reorder the master list of radio tracks (not the already sorted previous list)
        const _radioTracksSorted: MusicTrack[] = await reorderRadioTracksAndCacheFirstTrackBlob(radioTracksOriginal);
        setRadioTracksSorted(_radioTracksSorted);
        setRadioTracksLoading(false);
        updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh(false);
      })();
    }
  }, [radioGenresUpdatedByUserSinceLastRadioTracksRefresh]);

  /*
    when the app boots, we get the master radio tracks from the server
    we then create a list of available genres from the master list
    we then check if the user has some preference in session storage and then sort the list based on the user's preferences
  */
  async function fetchAndUpdateRadioTracks() {
    try {
      setRadioTracksLoading(true);
      setRadioTracksSorted([]);
      setNfTunesRadioFirstTrackCachedBlob("");

      const allRadioTracks = (await getRadioStreamsData()) as MusicTrack[];
      setRadioTracksOriginal([...allRadioTracks]); // this is the master list of radio tracks as we got from the server

      // Extract and normalize unique categories
      const uniqueGenres = new Set<string>();
      allRadioTracks.forEach((track: MusicTrack) => {
        if (track.category) {
          // Split by comma and trim each category
          const categories = track.category.split(",").map((cat: string) => cat.trim().toLowerCase());
          categories.forEach((cat: string) => uniqueGenres.add(cat));
        }
      });

      // Convert Set to array and update store for available radio stream genres
      updateRadioGenres(Array.from(uniqueGenres));

      const _radioTracksSorted: MusicTrack[] = await reorderRadioTracksAndCacheFirstTrackBlob(allRadioTracks);

      setRadioTracksSorted(_radioTracksSorted);

      setTimeout(() => {
        setRadioTracksLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching radio tracks:", error);
    }
  }

  async function reorderRadioTracksAndCacheFirstTrackBlob(allRadioTracks: MusicTrack[]) {
    const _radioTracksSorted: MusicTrack[] = filterRadioTracksByUserPreferences(allRadioTracks);

    // cache the first track blob
    const blobUrl = await getNFTuneFirstTrackBlobData(_radioTracksSorted[0]);
    setNfTunesRadioFirstTrackCachedBlob(blobUrl);

    return _radioTracksSorted;
  }

  async function viewSolData(index: number) {
    try {
      if (!(index >= 0 && index < shownSolAppDataNfts.length)) {
        toastClosableError("You music data nft catalog has not loaded");
        return;
      }

      setIsFetchingDataMarshal(true);
      resetAudioPlayerState();

      const dataNft = shownSolAppDataNfts[index];

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

      if (!publicKeySol) throw new Error("Missing data for viewData");
      setCurrentDataNftIndex(index);

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

      // start the request for the manifest file from marshal
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

          // this is the data that feeds the player with the album data
          setDataMarshalResponse(data);
          setMusicPlayerTrackList(data.data);
          setViewDataRes(viewDataPayload);

          setIsFetchingDataMarshal(false);

          // await the first song response and set the firstSongBlobUrl state (so that first song plays faster)
          const firstSongRes = await firstSongResPromise;
          const blobUrl = URL.createObjectURL(await firstSongRes.blob());
          setFirstSongBlobUrl(blobUrl);
        }
      } else {
        console.error(res.status + " " + res.statusText);
        toastClosableError(res.status + " " + res.statusText);
      }
    } catch (err) {
      console.error(err);
      toastClosableError((err as Error).message);
      setIsFetchingDataMarshal(false);
    }
  }

  function checkOwnershipOfAlbum(album: any) {
    // console.log("---- checkOwnershipOfAlbum album", album);
    let albumInOwnershipListIndex = -1; // note -1 means we don't own it

    // if (IS_DEVNET) {
    //   // devnet logic remains unchanged
    //   if (
    //     album?.solNftName &&
    //     ownedSolDataNftNameAndIndexMap &&
    //     album.solNftName === "MUSG7 - Galactic Gravity" &&
    //     ownedSolDataNftNameAndIndexMap["MUSGDEV1"] !== "undefined"
    //   ) {
    //     albumInOwnershipListIndex = ownedSolDataNftNameAndIndexMap["MUSGDEV1 : Common"];
    //   }
    // } else if (album?.solNftName && ownedSolDataNftNameAndIndexMap) {

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
    }

    return albumInOwnershipListIndex;
  }

  // here we set the power up object that will trigger the modal that allows a user to sent bitz to a target bounty
  function handleSendBitzForMusicBounty({
    creatorIcon,
    creatorName,
    giveBitzToWho,
    giveBitzToCampaignId,
    isLikeMode,
  }: {
    creatorIcon: string;
    creatorName: string;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean;
  }) {
    setGiveBitzForMusicBountyConfig({
      creatorIcon,
      creatorName,
      giveBitzToWho,
      giveBitzToCampaignId,
      isLikeMode,
    });
  }

  function resetAudioPlayerState() {
    setFirstSongBlobUrl(undefined);
    setDataMarshalResponse({ "data_stream": {}, "data": [] });
    setCurrentDataNftIndex(-1);
    setMusicPlayerTrackList([]);
    setLaunchMusicPlayer(false);
    // clear this -- its used to carry a like content via bits session to the player so we can collect likes inside it
    setBitzGiftingMeta(null);
  }

  function handleCloseRadioPlayer() {
    setLaunchRadioPlayer(false);
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full overflow-hidden md:overflow-visible">
        <div className="flex flex-col justify-center items-center font-[Clash-Regular] w-full pb-6">
          {/* Radio and main app header CTAs */}
          {homeMode === "home" && (
            <div className="w-full mt-5">
              <div className="flex flex-col-reverse md:flex-row justify-center items-center xl:items-start w-[100%]">
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-col-reverse md:flex-row gap-4">
                    <div className="radioTeaser flex flex-col md:mt-0 flex-1">
                      <RadioTeaser
                        radioTracks={radioTracksSorted}
                        radioTracksLoading={radioTracksLoading}
                        launchRadioPlayer={launchRadioPlayer}
                        setLaunchRadioPlayer={setLaunchRadioPlayer}
                      />
                    </div>
                    <div className="flex flex-col flex-1 text-left bgx-red-500 align-center justify-center p-5">
                      <span className="text-center md:text-left font-[Clash-Medium] text-3xl xl:text-5xl bg-gradient-to-r from-yellow-200 via-orange-500 to-yellow-200 animate-text-gradient inline-block text-transparent bg-clip-text transition-transform cursor-default">
                        Sigma Music is a Music Super App built around Unique Fan Experiences
                      </span>
                    </div>
                  </div>

                  <div className="featuredBanners flex-1">
                    <FeaturedBanners
                      onFeaturedArtistDeepLinkSlug={(slug: string) => {
                        setHomeMode(`artists-${new Date().getTime()}`);
                        setSearchParams({ "artist-profile": slug });
                      }}
                    />
                  </div>
                </div>

                <div className="hidden flex flex-col w-full gap-4">
                  <div className="helloSigma flex-1">
                    <div className="text-2xl xl:text-3xl mb-3 w-full text-center bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 inline-block text-transparent bg-clip-text">
                      hi, i'm sigma, your AI music agent
                    </div>

                    <a href="https://x.com/SigmaXMusic" target="_blank">
                      <div className="text-sm text-center mb-5">
                        Click to interact with me on <FaXTwitter className="inline-block text-xl" />
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 justify-center items-center cursor-pointer">
                        <div
                          className="border-[0.5px] border-neutral-500/90 h-[400px] bg-no-repeat bg-cover rounded-lg animate-float bg-bottom xl:bg-top w-full md:w-[90%]"
                          style={{
                            "backgroundImage": `url(${sigmaAgent})`,
                            "backgroundBlendMode": "darken",
                            "backgroundColor": "#fcc73d",
                          }}></div>
                      </div>
                    </a>
                  </div>
                  <div className="coCreateWithSigma flex-1 flex flex-col justify-center items-center text-center rounded-lg">
                    <div className="text-2xl xl:text-3xl bg-gradient-to-r from-yellow-300 to-orange-500 inline-block text-transparent bg-clip-text mt-4">
                      Create with Sigma
                    </div>
                    <div>Bringing humans and music AI agents together to create music.</div>

                    <div className="flex flex-col gap-4 mt-4">
                      <div>
                        <Button
                          onClick={() => {
                            navigate(routeNames.remix);
                          }}
                          className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%]  transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-sm md:text-xl text-center p-2 md:p-4 rounded-lg w-[500px]">
                          <div>Launch AI Music Meme Coins with REMiX</div>
                        </Button>
                        <div className="text-sm mt-2">For Everyone</div>
                      </div>

                      <div>
                        <Button
                          className="animate-gradient bg-gradient-to-r from-yellow-300 to-orange-500 bg-[length:200%_200%]  transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 text-sm md:text-xl text-center p-2 md:p-4 rounded-lg w-[500px]"
                          onClick={() => {
                            scrollToSection("join-nf-tunes");
                          }}>
                          <div>Launch Your Music with Sigma</div>
                        </Button>
                        <div className="text-sm mt-2">For Indie Musicians</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Artists and their Albums */}
          {(homeMode.includes("artists") || homeMode === "albums") && (
            <>
              <div className="w-full mt-5">
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

                    // pause the radio if playing
                    if (launchRadioPlayer) {
                      setLaunchRadioPlayer(false);
                    }

                    // pause the main player if playing
                    setMusicPlayerPauseInvokeIncrement(musicPlayerPauseInvokeIncrement + 1);
                  }}
                  checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                  openActionFireLogic={(_bitzGiftingMeta?: any) => {
                    setLaunchMusicPlayer(true);
                    setStopPreviewPlaying(true);

                    if (_bitzGiftingMeta) {
                      setBitzGiftingMeta(_bitzGiftingMeta);
                    }
                  }}
                  onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                  bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                  setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
                  userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
                  dataNftPlayingOnMainPlayer={shownSolAppDataNfts[currentDataNftIndex]}
                  onCloseMusicPlayer={resetAudioPlayerState}
                  isMusicPlayerOpen={launchMusicPlayer}
                  loadIntoArtistTileView={loadIntoArtistTileView}
                  setLoadIntoArtistTileView={setLoadIntoArtistTileView}
                  isAllAlbumsMode={homeMode === "albums"}
                />
              </div>
            </>
          )}

          {homeMode === "radio" && (
            <>
              <div className="w-full mt-5">
                <RadioBgCanvas
                  radioTracks={radioTracksSorted}
                  radioTracksLoading={radioTracksLoading}
                  launchRadioPlayer={launchRadioPlayer}
                  setLaunchRadioPlayer={setLaunchRadioPlayer}
                />
              </div>
            </>
          )}

          {/* Data NFT list shown here */}
          {homeMode === "wallet" && (
            <>
              {publicKeySol && (
                <div className="w-full mt-5">
                  <MyCollectedAlbums
                    viewSolData={viewSolData}
                    isFetchingDataMarshal={isFetchingDataMarshal}
                    viewDataRes={viewDataRes}
                    currentDataNftIndex={currentDataNftIndex}
                    dataMarshalResponse={dataMarshalResponse}
                    firstSongBlobUrl={firstSongBlobUrl}
                    setStopPreviewPlaying={setStopPreviewPlaying}
                    setBitzGiftingMeta={setBitzGiftingMeta}
                    shownSolAppDataNfts={shownSolAppDataNfts}
                    onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                    bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                    checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                    userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
                    setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
                    setFeaturedArtistDeepLinkSlug={(slug: string) => {
                      setFeaturedArtistDeepLinkSlug(slug);
                    }}
                    openActionFireLogic={(_bitzGiftingMeta?: any) => {
                      setLaunchMusicPlayer(true);
                      setStopPreviewPlaying(true);

                      if (_bitzGiftingMeta) {
                        setBitzGiftingMeta(_bitzGiftingMeta);
                      }
                    }}
                    dataNftPlayingOnMainPlayer={shownSolAppDataNfts[currentDataNftIndex]}
                    onCloseMusicPlayer={resetAudioPlayerState}
                    isMusicPlayerOpen={launchMusicPlayer}
                  />
                </div>
              )}
            </>
          )}

          {/* Calling Musicians Section */}
          {homeMode === "home" && (
            <div className="w-full mt-5">
              <div id="join-sigma" className="flex flex-col md:flex-row 3xl:flex-col gap-4 py-[40px] px-[20px] text-center rounded-t-lg">
                <div className="flex flex-col flex-1 text-left">
                  <span className="text-center md:text-left font-[Clash-Medium] text-2xl xl:text-5xl bg-gradient-to-r from-orange-400 to-orange-500 dark:from-yellow-300 dark:to-orange-500 inline-block text-transparent bg-clip-text">
                    Calling all Musicians!
                  </span>
                  <span className="text-center md:text-left xl:text-2xl">
                    Launch your music with Sigma Music. Create die-hard fans that share in your success.
                  </span>
                </div>

                <div className="flex flex-col flex-1 md:flex-row justify-center items-center">
                  <Link
                    to={`https://api.itheumcloud.com/app_nftunes/other/nf-tunes-bizdev-deck-V2.pdf`}
                    target="_blank"
                    className="mt-10 md:mx-3 text-sm md:text-xl text-center p-2 md:p-4 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-lg md:max-w-[50%] !text-black transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
                    Perks and Benefits
                  </Link>
                  <Link
                    to={`https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform`}
                    target="_blank"
                    className="mt-10 md:mx-3 text-sm md:text-xl text-center p-2 md:p-4 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-lg md:max-w-[50%] !text-black transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
                    Launch Your Music!
                  </Link>
                </div>
              </div>
            </div>
          )}

          {homeMode === "games" && (
            <div className="w-full mt-10">
              <MiniGames radioTracks={radioTracksSorted} appMusicPlayerIsPlaying={launchMusicPlayer || launchRadioPlayer} />
            </div>
          )}

          {/* The album player footer bar */}
          {launchMusicPlayer && (
            <div className="w-full fixed left-0 bottom-0 z-50">
              <MusicPlayer
                dataNftToOpen={shownSolAppDataNfts[currentDataNftIndex]}
                trackList={musicPlayerTrackList}
                firstSongBlobUrl={firstSongBlobUrl}
                onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                bitzGiftingMeta={bitzGiftingMeta}
                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                onPlayHappened={() => {
                  // stop the preview playing
                  setStopPreviewPlaying(true);

                  // stop the radio playing
                  if (launchRadioPlayer) {
                    setLaunchRadioPlayer(false);
                  }
                }}
                onCloseMusicPlayer={resetAudioPlayerState}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
              />
            </div>
          )}

          {/* The radio player footer bar */}
          {launchRadioPlayer && (
            <div className="w-full fixed left-0 bottom-0 z-40">
              <MusicPlayer
                trackList={radioTracksSorted}
                isRadioPlayer={true}
                firstSongBlobUrl={nfTunesRadioFirstTrackCachedBlob}
                onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                bitzGiftingMeta={bitzGiftingMeta}
                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                onPlayHappened={() => {
                  setStopPreviewPlaying(true);

                  // close the main player if playing
                  resetAudioPlayerState();
                }}
                onCloseMusicPlayer={handleCloseRadioPlayer}
                pauseAsOtherAudioPlaying={musicPlayerPauseInvokeIncrement}
                loadIntoDockedMode={loadRadioPlayerIntoDockedMode}
              />
            </div>
          )}

          {/* The album play queue msg */}
          {albumPlayIsQueued && (
            <div className="fixed left-0 bottom-0 w-full z-50">
              <div className="w-full border-[1px] border-foreground/20 rounded-lg rounded-b-none border-b-0 bg-black">
                <div className="h-[200px] flex flex-col items-center justify-center px-2">
                  <Loader className="animate-spin" />
                  <p className="text-foreground text-xs mt-3">hold tight, queuing album for playback</p>
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
