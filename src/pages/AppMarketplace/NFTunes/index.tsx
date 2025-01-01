import React, { useEffect, useState } from "react";
import { DataNft, ViewDataReturnType } from "@itheum/sdk-mx-data-nft";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useGetLoginInfo, useGetNetworkConfig, useGetAccount } from "@multiversx/sdk-dapp/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { useThrottledCallback } from "use-debounce";
import { NF_TUNES_TOKENS } from "appsConfig";
import { IS_DEVNET } from "appsConfig";
import megaphoneLight from "assets/img/nf-tunes/megaphone-light.png";
import megaphone from "assets/img/nf-tunes/megaphone.png";
import { Loader } from "components";
import { RadioPlayer } from "components/AudioPlayer/RadioPlayer";
import { SolAudioPlayer } from "components/AudioPlayer/SolAudioPlayer";
import { Modal } from "components/Modal/Modal";
import YouTubeEmbed from "components/YouTubeEmbed";
import { SHOW_NFTS_STEP, MARSHAL_CACHE_DURATION_SECONDS } from "config";
import { DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { useTheme } from "contexts/ThemeProvider";
import { useGetPendingTransactions } from "hooks";
import { viewDataViaMarshalSol, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { BlobDataType, ExtendedViewDataReturnType } from "libs/types";
import { decodeNativeAuthToken, getApiDataMarshal } from "libs/utils";
import { scrollToSection } from "libs/utils/ui";
import { toastClosableError } from "libs/utils/uiShared";
import { fetchBitSumAndGiverCountsSol } from "pages/AppMarketplace/GetBitz/GetBitzSol/GiveBitzBase";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";
import { FeaturedArtistsAndAlbums } from "./FeaturedArtistsAndAlbums";
import { MyCollectedAlbums } from "./MyCollectedAlbums";
import { SendBitzPowerUp } from "./SendBitzPowerUp";
import { GiftBitzToArtistMeta } from "./types/common";

export const NFTunes = () => {
  const { theme } = useTheme();
  const currentTheme = theme !== "system" ? theme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const { tokenLogin } = useGetLoginInfo();
  const {
    network: { chainId: chainID },
  } = useGetNetworkConfig();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [shownMvxAppDataNfts, setShownMvxAppDataNfts] = useState<DataNft[]>([]);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(true);
  const [viewDataRes, setViewDataRes] = useState<ExtendedViewDataReturnType>();
  const [currentDataNftIndex, setCurrentDataNftIndex] = useState(-1);
  const [dataMarshalResponse, setDataMarshalResponse] = useState({ "data_stream": {}, "data": [] });
  const [firstSongBlobUrl, setFirstSongBlobUrl] = useState<string>();
  const { mvxNfts, solNfts, updateIsLoadingMvx, solBitzNfts } = useNftsStore();
  const nfTunesTokens = [...NF_TUNES_TOKENS].filter((v) => mvxNfts.find((nft) => nft.collection === v.tokenIdentifier && nft.nonce === v.nonce));
  const [stopRadio, setStopRadio] = useState<boolean>(false);
  const [noRadioAutoPlay, setNoRadioAutoPlay] = useState<boolean>(true);
  const [stopPreviewPlaying, setStopPreviewPlaying] = useState<boolean>(false);
  const [radioTracksLoading, setRadioTracksLoading] = useState<boolean>(false);
  const [radioTracks, setRadioTracks] = useState<any[]>([]);
  const [featuredArtistDeepLinkSlug, setFeaturedArtistDeepLinkSlug] = useState<string | undefined>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mvxNetworkSelected, setMvxNetworkSelected] = useState<boolean>(false);
  const [shownSolAppDataNfts, setShownSolAppDataNfts] = useState<DasApiAsset[]>(solNfts.slice(0, SHOW_NFTS_STEP));
  const { publicKey: publicKeySol, signMessage } = useWallet();
  const { address: addressMvx } = useGetAccount();
  const [bitzGiftingMeta, setBitzGiftingMeta] = useState<{
    giveBitzToCampaignId: string;
    bountyBitzSum: number;
    creatorWallet: string;
  } | null>(null);
  const [userHasNoBitzDataNftYet, setUserHasNoBitzDataNftYet] = useState(false); // on solana

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  const [ownedSolDataNftNameAndIndexMap, setOwnedSolDataNftNameAndIndexMap] = useState<any>(null);
  const [ownedMvxDataNftNameAndIndexMap, setOwnedMvxDataNftNameAndIndexMap] = useState<any>(null);

  // control the visibility base level music player model
  const [launchBaseLevelMusicPlayer, setLaunchBaseLevelMusicPlayer] = useState<boolean>(false);

  // give bits to a bounty (power up or like)
  const [giveBitzForMusicBountyConfig, setGiveBitzForMusicBountyConfig] = useState<{
    creatorIcon: string | undefined;
    creatorName: string | undefined;
    giveBitzToWho: string;
    giveBitzToCampaignId: string;
    isLikeMode?: boolean | undefined;
  }>({ creatorIcon: undefined, creatorName: undefined, giveBitzToWho: "", giveBitzToCampaignId: "", isLikeMode: undefined });

  // this is a copy of the bitz balances bounties are getting (inside FeaturedArtistsAndAlbums.tsx) during the users ui session
  // ... but it only get progressively loaded as the user moves between tabs to see the atrist and their albums (so its not a complete state)
  const [bountyBitzSumGlobalMapping, setMusicBountyBitzSumGlobalMapping] = useState<any>({});

  useEffect(() => {
    if (publicKeySol) {
      setMvxNetworkSelected(false);
    }
  }, [publicKeySol]);

  useEffect(() => {
    if (addressMvx) {
      setMvxNetworkSelected(true);
    }
  }, [addressMvx]);

  useEffect(() => {
    const isFeaturedArtistDeepLink = searchParams.get("artist-profile");
    const isHlWorkflowDeepLink = searchParams.get("hl");

    if (isFeaturedArtistDeepLink) {
      scrollToSection("artist-profile", 50);
      setNoRadioAutoPlay(true); // don't auto-play radio when we deep scroll to artist as its confusing
      setFeaturedArtistDeepLinkSlug(isFeaturedArtistDeepLink.trim());
    } else if (isHlWorkflowDeepLink && isHlWorkflowDeepLink === "sigma") {
      scrollToSection("artist-profile", 50);
    } else {
      // window.scrollTo({
      //   top: 0,
      //   behavior: "smooth",
      // });
    }

    async function getRadioTracksData() {
      setRadioTracksLoading(true);

      const allRadioTracks = await getRadioStreamsData();

      setRadioTracks(allRadioTracks);
      setRadioTracksLoading(false);
    }

    getRadioTracksData();
  }, []);

  useEffect(() => {
    if (!hasPendingTransactions) {
      fetchMvxAppNfts();
    }
  }, [hasPendingTransactions, mvxNfts]);

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
    if (shownMvxAppDataNfts && shownMvxAppDataNfts.length > 0) {
      const nameToIndexMap = shownMvxAppDataNfts.reduce((t: any, mvxDataNft: DataNft, idx: number) => {
        if (mvxDataNft?.tokenIdentifier) {
          t[mvxDataNft?.tokenIdentifier] = idx;
        }
        return t;
      }, {});

      setOwnedMvxDataNftNameAndIndexMap(nameToIndexMap);
    }
  }, [shownMvxAppDataNfts]);

  useEffect(() => {
    if (solBitzNfts.length === 0) {
      setUserHasNoBitzDataNftYet(true);
    } else {
      setUserHasNoBitzDataNftYet(false);
    }
  }, [solBitzNfts]);

  // get the nfts that are able to open nfTunes app
  async function fetchMvxAppNfts(activeIsLoading = true) {
    if (activeIsLoading) {
      updateIsLoadingMvx(true);
    }

    const _nfts: DataNft[] = await DataNft.createManyFromApi(
      nfTunesTokens.slice(shownMvxAppDataNfts.length, shownMvxAppDataNfts.length + SHOW_NFTS_STEP).map((v) => ({
        nonce: v.nonce,
        tokenIdentifier: v.tokenIdentifier,
      })),
      5 * 60 * 1000
    );

    setShownMvxAppDataNfts((oldNfts) => oldNfts.concat(_nfts));

    if (activeIsLoading) {
      updateIsLoadingMvx(false);
    }
  }

  // after pressing the button to view data open modal
  async function viewMvxData(index: number) {
    try {
      if (!(index >= 0 && index < shownMvxAppDataNfts.length)) {
        toastClosableError("Data is not loaded");
        return;
      }

      setFirstSongBlobUrl(undefined);

      const dataNft = shownMvxAppDataNfts[index];
      const _owned = mvxNfts.find((nft) => nft.tokenIdentifier === dataNft.tokenIdentifier) ? true : false;

      if (_owned) {
        setIsFetchingDataMarshal(true);

        let res: any;
        if (!(tokenLogin && tokenLogin.nativeAuthToken)) {
          throw Error("No nativeAuth token");
        }

        const arg = {
          mvxNativeAuthOrigins: [decodeNativeAuthToken(tokenLogin.nativeAuthToken).origin],
          mvxNativeAuthMaxExpirySeconds: 3600,
          fwdHeaderMapLookup: {
            "authorization": `Bearer ${tokenLogin.nativeAuthToken}`,
          },
          stream: true,
          cacheDurationSeconds: MARSHAL_CACHE_DURATION_SECONDS,
        };

        setCurrentDataNftIndex(index);

        if (!dataNft.dataMarshal || dataNft.dataMarshal === "") {
          dataNft.updateDataNft({ dataMarshal: getApiDataMarshal(chainID) });
        }

        // start the request for the first song
        const firstSongResPromise: any = dataNft.viewDataViaMVXNativeAuth({
          mvxNativeAuthOrigins: [decodeNativeAuthToken(tokenLogin.nativeAuthToken).origin],
          mvxNativeAuthMaxExpirySeconds: 3600,
          fwdHeaderMapLookup: { "authorization": `Bearer ${tokenLogin?.nativeAuthToken}` },
          stream: true,
          nestedIdxToStream: 1, // get the song for the first index
          cacheDurationSeconds: MARSHAL_CACHE_DURATION_SECONDS,
        });

        // start the request for the manifest file from marshal
        res = await dataNft.viewDataViaMVXNativeAuth(arg);

        let blobDataType = BlobDataType.TEXT;

        if (!res.error) {
          if (res.contentType.search("application/json") >= 0) {
            res.data = await (res.data as Blob).text();
            res.data = JSON.stringify(JSON.parse(res.data), null, 4);
          }
        } else {
          console.error(res.error);
          toastClosableError(res.error);
        }

        const viewDataPayload: ExtendedViewDataReturnType = {
          ...res,
          blobDataType,
        };

        setDataMarshalResponse(JSON.parse(res.data));
        setViewDataRes(viewDataPayload);
        setIsFetchingDataMarshal(false);

        // await the first song response and set the firstSongBlobUrl state
        const firstSongRes: ViewDataReturnType = await firstSongResPromise;
        const blobUrl = URL.createObjectURL(firstSongRes.data);
        setFirstSongBlobUrl(blobUrl);
      }
    } catch (err) {
      console.error(err);
      toastClosableError((err as Error).message);
      setIsFetchingDataMarshal(false);
    }
  }

  async function viewSolData(index: number) {
    try {
      if (!(index >= 0 && index < shownSolAppDataNfts.length)) {
        toastClosableError("Data is not loaded");
        return;
      }

      setFirstSongBlobUrl(undefined);
      setIsFetchingDataMarshal(true);

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
          setDataMarshalResponse(data);
          setViewDataRes(viewDataPayload);
          setIsFetchingDataMarshal(false);

          // await the first song response and set the firstSongBlobUrl state
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
    let albumInOwnershipListIndex = -1; // note -1 means we don't own it

    if (!mvxNetworkSelected) {
      if (IS_DEVNET) {
        // in devnet we airdrop MUSGDEV1 the matches the "MUSG7 - Galactic Gravity" mainnet one
        if (
          album?.solNftName &&
          ownedSolDataNftNameAndIndexMap &&
          album.solNftName === "MUSG7 - Galactic Gravity" &&
          ownedSolDataNftNameAndIndexMap["MUSGDEV1"] !== "undefined"
        ) {
          albumInOwnershipListIndex = ownedSolDataNftNameAndIndexMap["MUSGDEV1 : Common"];
        }
      } else if (album?.solNftName && ownedSolDataNftNameAndIndexMap) {
        /* mark the albumInOwnershipListIndex as of the highest rarity album
        Legendary
        Rare
        Common */
        if (typeof ownedSolDataNftNameAndIndexMap[`${album.solNftName} : Legendary`] !== "undefined") {
          albumInOwnershipListIndex = ownedSolDataNftNameAndIndexMap[`${album.solNftName} : Legendary`];
        } else if (typeof ownedSolDataNftNameAndIndexMap[`${album.solNftName} : Rare`] !== "undefined") {
          albumInOwnershipListIndex = ownedSolDataNftNameAndIndexMap[`${album.solNftName} : Rare`];
        } else {
          albumInOwnershipListIndex = ownedSolDataNftNameAndIndexMap[`${album.solNftName} : Common`];
        }
      }
    } else {
      if (album?.mvxDataNftId && ownedMvxDataNftNameAndIndexMap) {
        // Data NFT-FT checks
        if (typeof ownedMvxDataNftNameAndIndexMap[album.mvxDataNftId] !== "undefined") {
          albumInOwnershipListIndex = ownedMvxDataNftNameAndIndexMap[album.mvxDataNftId];
        } else {
          // Data NFT PH Checks (mvxDataNftId is actually the entire collection and not collection-nonce like in FT)
          Object.keys(ownedMvxDataNftNameAndIndexMap).forEach((i) => {
            if (i.includes(album.mvxDataNftId)) {
              albumInOwnershipListIndex = ownedMvxDataNftNameAndIndexMap[i];
              return;
            }
          });
        }
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

  // in Radio, checkOwnershipOfAlbum get called when user clicks on play, as the radio comp is rerendering each time the progress bar moves (memo not working)
  // ... so we throttle each call by 2000 to improve some performance
  const debouncedCheckOwnershipOfAlbum = useThrottledCallback(checkOwnershipOfAlbum, 2000, { "trailing": false });

  const userLoggedInWithWallet = publicKeySol || addressMvx;

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full overflow-hidden md:overflow-visible">
        <div className="w-full h-[2px] bg-[linear-gradient(to_right,#737373,#A76262,#5D3899,#5D3899,#A76262,#737373)] animate-gradient bg-[length:200%_auto]"></div>

        <div className="flex flex-col justify-center items-center font-[Clash-Regular] w-full max-w-[100rem] pb-6 bgx-green-900">
          {/* App Header Row */}
          <div className="flex flex-col justify-center items-center xl:items-start h-[100vsh] w-[100%] pt-2 xl:pt-4 md:pl-4">
            {/* Radio */}
            <div className="flex flex-col w-full xl:w-[100%] mt-10 mb-[80px]">
              <div className="px-2">Sigma Music Radio</div>
              {radioTracksLoading || radioTracks.length === 0 ? (
                <div className="select-none h-[30%] bg-[#FaFaFa]/25 dark:bg-[#0F0F0F]/25 border-[1px] border-foreground/40 relative md:w-[100%] flex flex-col rounded-xl mt-2 p-3">
                  {radioTracksLoading ? "Radio service powering up..." : "⚠️ Radio service unavailable"}
                </div>
              ) : (
                // <RadioPlayer
                //   noAutoPlay={noRadioAutoPlay}
                //   stopRadioNow={stopRadio}
                //   onPlayHappened={(isPlaying: boolean) => {
                //     if (isPlaying) {
                //       setStopRadio(false);
                //     }

                //     if (!stopPreviewPlaying) {
                //       setStopPreviewPlaying(true);
                //     }
                //   }}
                //   radioTracks={radioTracks}
                //   checkOwnershipOfAlbum={debouncedCheckOwnershipOfAlbum}
                //   mvxNetworkSelected={mvxNetworkSelected}
                //   viewSolData={viewSolData}
                //   viewMvxData={viewMvxData}
                //   openActionFireLogic={(_bitzGiftingMeta?: any) => {
                //     setLaunchBaseLevelMusicPlayer(true);
                //     setStopRadio(true);
                //     setStopPreviewPlaying(true);

                //     if (_bitzGiftingMeta) {
                //       setBitzGiftingMeta(_bitzGiftingMeta);
                //     }
                //   }}
                //   solBitzNfts={solBitzNfts}
                //   chainID={chainID}
                //   onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                //   bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                //   setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
                //   userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
                // />
                <></>
              )}
            </div>
          </div>

          {/* Artists and their Albums */}
          <div className="w-full">
            <FeaturedArtistsAndAlbums
              mvxNetworkSelected={mvxNetworkSelected}
              viewSolData={viewSolData}
              viewMvxData={viewMvxData}
              stopPreviewPlayingNow={stopPreviewPlaying}
              featuredArtistDeepLinkSlug={featuredArtistDeepLinkSlug}
              onFeaturedArtistDeepLinkSlug={setFeaturedArtistDeepLinkSlug}
              onPlayHappened={(isPlaying: boolean) => {
                if (isPlaying) {
                  setStopPreviewPlaying(false);
                }

                if (!stopRadio) {
                  setStopRadio(true);
                }
              }}
              checkOwnershipOfAlbum={checkOwnershipOfAlbum}
              openActionFireLogic={(_bitzGiftingMeta?: any) => {
                setLaunchBaseLevelMusicPlayer(true);
                setStopRadio(true);
                setStopPreviewPlaying(true);

                if (_bitzGiftingMeta) {
                  setBitzGiftingMeta(_bitzGiftingMeta);
                }
              }}
              onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
              bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
              setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
              userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
            />
          </div>

          {/* Data NFT list shown here */}
          {userLoggedInWithWallet && (
            <MyCollectedAlbums
              mvxNetworkSelected={mvxNetworkSelected}
              viewSolData={viewSolData}
              viewMvxData={viewMvxData}
              shownMvxAppDataNfts={shownMvxAppDataNfts}
              isFetchingDataMarshal={isFetchingDataMarshal}
              setStopRadio={setStopRadio}
              viewDataRes={viewDataRes}
              tokenLogin={tokenLogin}
              currentDataNftIndex={currentDataNftIndex}
              dataMarshalResponse={dataMarshalResponse}
              firstSongBlobUrl={firstSongBlobUrl}
              setStopPreviewPlaying={setStopPreviewPlaying}
              setBitzGiftingMeta={setBitzGiftingMeta}
              shownSolAppDataNfts={shownSolAppDataNfts}
              onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
              nfTunesTokens={nfTunesTokens}
              fetchMvxAppNfts={fetchMvxAppNfts}
              bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
              checkOwnershipOfAlbum={debouncedCheckOwnershipOfAlbum}
              userHasNoBitzDataNftYet={userHasNoBitzDataNftYet}
              setMusicBountyBitzSumGlobalMapping={setMusicBountyBitzSumGlobalMapping}
              setFeaturedArtistDeepLinkSlug={(slug: string) => {
                setFeaturedArtistDeepLinkSlug(slug);
              }}
              openActionFireLogic={(_bitzGiftingMeta?: any) => {
                setLaunchBaseLevelMusicPlayer(true);
                setStopRadio(true);
                setStopPreviewPlaying(true);

                if (_bitzGiftingMeta) {
                  setBitzGiftingMeta(_bitzGiftingMeta);
                }
              }}
            />
          )}

          {/* Calling Musicians Section */}
          <div
            id="join-nf-tunes"
            className="flex flex-col gap-4 justify-center items-center bg-[#333] dark:bg-primary w-full px-[20px] py-[50px] text-center rounded-t-lg">
            <span className="text-secondary font-[Clash-Medium] text-2xl xl:text-6xl"> Calling all Indie Musicians!</span>
            <span className="xl:w-[50%] text-primary-foreground xl:text-2xl ">
              Be a true Web3 music innovator! We provide you with full support to launch your music on Sigma Music
            </span>

            <img className="w-[200px] md:w-400px" src={currentTheme === "dark" ? megaphone : megaphoneLight} alt="megaphone" />

            <div className="flex flex-col md:flex-row">
              <Link
                to={`https://api.itheumcloud.com/app_nftunes/other/nf-tunes-bizdev-deck-V2.pdf`}
                target="_blank"
                className="mt-10 md:mx-3 hover:scale-110 transition duration-700 text-sm md:text-xl text-center p-2 md:p-4 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-30% to-[#5D3899] to-95% rounded-lg md:max-w-[50%] text-white">
                Why Sigma Music? <div className="text-sm">(Perks and Benefits)</div>
              </Link>
              <Link
                to={`https://docs.google.com/forms/d/e/1FAIpQLScSnDHp7vHvj9N8mcdI4nWFle2NDY03Tf128AePwVMhnOp1ag/viewform`}
                target="_blank"
                className="flex items-center mt-5 md:mt-10 md:mx-3 hover:scale-110 transition duration-700 text-sm md:text-xl text-center p-2 md:p-4 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-30% to-[#5D3899] to-95% rounded-lg md:max-w-[50%] text-white">
                Launch Your Music!
              </Link>
            </div>
          </div>

          {/* What Musicians are saying */}
          <div className="flex flex-col gap-4 justify-center items-center bg-[#333] dark:bg-primary w-full px-[20px] md:py-[50px] text-center rounded-b-lg">
            <div className="py-8 flex flex-col w-[100%] justify-center items-center xl:items-start xl:p-12 xl:pt-0">
              <div className="flex flex-col xl:flex-row w-full items-center justify-center h-[300px]">
                <div className="flex flex-col gap-8 xl:w-[50%] justify-start items-center xl:items-start w-[330px] md:w-[auto]">
                  <div className="text-2xl xl:text-4xl text-primary-foreground">Hear what Indie Musicians are saying about Music Data NFTs and Sigma Music</div>
                </div>
                <div className="flex justify-center items-center h-[30rem] w-full xl:w-[50%]">
                  <div className="w-[380px] h-[170px] md:w-[480px] md:h-[270px]">
                    <YouTubeEmbed embedId="sDTBpwSu33I" title="Meet Manu" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The base level modal music player that children components can trigger (Solana Only) */}
        <>
          <Modal
            triggerOpen={launchBaseLevelMusicPlayer}
            triggerOnClose={() => {
              setLaunchBaseLevelMusicPlayer(false);

              // clear this -- its used to carry a like content via bits session to the player so we can collect likes inside it
              setBitzGiftingMeta(null);
            }}
            closeOnOverlayClick={false}
            title={"Music Player"}
            hasFilter={false}
            filterData={[]}
            modalClassName={""}
            titleClassName={"p-4"}>
            {isFetchingDataMarshal ? (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  minHeight: "40rem",
                }}>
                <div>
                  <Loader noText />
                  <p className="text-center text-foreground">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {!mvxNetworkSelected && viewDataRes && !viewDataRes.error && currentDataNftIndex > -1 && (
                  <SolAudioPlayer
                    dataNftToOpen={shownSolAppDataNfts[currentDataNftIndex]}
                    songs={dataMarshalResponse ? dataMarshalResponse.data : []}
                    firstSongBlobUrl={firstSongBlobUrl}
                    chainID={chainID}
                    onSendBitzForMusicBounty={handleSendBitzForMusicBounty}
                    bitzGiftingMeta={bitzGiftingMeta}
                    bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                  />
                )}
              </>
            )}
          </Modal>
        </>

        {/* The bitz power up for creators and album liks (Solana Only) */}
        {giveBitzForMusicBountyConfig.giveBitzToWho !== "" && giveBitzForMusicBountyConfig.giveBitzToCampaignId !== "" && (
          <SendBitzPowerUp
            mvxNetworkSelected={mvxNetworkSelected}
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

                _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
                setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
              }
            }}
          />
        )}
      </div>
    </>
  );
};

export async function getRadioStreamsData() {
  try {
    const getRadioStreamAPI = `https://api.itheumcloud.com/app_nftunes/assets/json/radioStreamData.json`;

    const tracksRes = await axios.get(getRadioStreamAPI);
    const tracksData = tracksRes.data;

    return tracksData;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// get and cache the artists and albums data locally
let _artistsAlbumsDataCachedOnWindow: any[] = [];
let _artistsAlbumsDataCachedOn: number = 0;

export async function getArtistsAlbumsData() {
  try {
    // cache for 120 seconds
    if (_artistsAlbumsDataCachedOnWindow.length > 0 && Date.now() - _artistsAlbumsDataCachedOn < 120 * 1000) {
      console.log(`&&& getArtistsAlbumsData - FROM cached`);
      return _artistsAlbumsDataCachedOnWindow;
    } else {
      console.log(`&&& getArtistsAlbumsData - NO cached`);
      const getArtistsAlbumsAPI = `https://api.itheumcloud.com/app_nftunes/assets/json/albumsAndArtistsData.json`;
      const dataRes = await axios.get(getArtistsAlbumsAPI);
      const dataset = dataRes.data;
      _artistsAlbumsDataCachedOnWindow = dataset;
      _artistsAlbumsDataCachedOn = Date.now();

      return _artistsAlbumsDataCachedOnWindow;
    }
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getNFTuneFirstTrackBlobData() {
  try {
    const firstNFTuneRadioTrackData = await getRadioStreamsData();

    if (firstNFTuneRadioTrackData && firstNFTuneRadioTrackData.length > 0) {
      const blob = await fetch(firstNFTuneRadioTrackData[0].stream).then((r) => r.blob());
      const blobUrl = URL.createObjectURL(blob);

      return blobUrl;
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

// S: GIVING BITZ FOR ARTIST POWER-UPS AND ALBUM LIKES
// as the user swaps tabs, we fetch the likes and power-up counts and cache them locally

// we use a global window state variable here as musicBountyBitzSumGlobalMapping can be updated by multiple child components at the same time (e.g. RadioPlayer and FeaturedArtistsAndAlbums)
// .. and reach state is not sync updated. But we still use setMusicBountyBitzSumGlobalMapping to update the state so we can feed the "update" effect to all the children that need it
let _bountyBitzSumGlobalMappingWindow: Record<any, any> = {};

export async function fetchBitzPowerUpsAndLikesForSelectedArtist({
  giftBitzToArtistMeta,
  addressMvx,
  chainID,
  userHasNoBitzDataNftYet,
  solBitzNfts,
  setMusicBountyBitzSumGlobalMapping,
  isSingleAlbumBounty,
}: {
  giftBitzToArtistMeta: GiftBitzToArtistMeta;
  addressMvx: any;
  chainID: any;
  userHasNoBitzDataNftYet: any;
  solBitzNfts: any;
  setMusicBountyBitzSumGlobalMapping: any;
  isSingleAlbumBounty: boolean;
}) {
  const _bountyToBitzLocalMapping: Record<any, any> = { ..._bountyBitzSumGlobalMappingWindow };
  console.log("&&& _bountyBitzSumGlobalMappingWindow", _bountyBitzSumGlobalMappingWindow);

  console.log("&&& giftBitzToArtistMeta ", giftBitzToArtistMeta);
  console.log("&&& _bountyBitzSumGlobalMappingWindow ", _bountyBitzSumGlobalMappingWindow);

  const checkInCacheSeconds = 120; // cache for 120 seconds

  if (
    !_bountyBitzSumGlobalMappingWindow[giftBitzToArtistMeta.bountyId] ||
    Date.now() - _bountyBitzSumGlobalMappingWindow[giftBitzToArtistMeta.bountyId].syncedOn > checkInCacheSeconds * 1000
  ) {
    console.log(`&&& fetchBitzPowerUpsAndLikesForSelectedArtist ${giftBitzToArtistMeta.bountyId} - is album ${isSingleAlbumBounty} - NO cached`);

    let response;
    let collectionIdToUseOnSol = "";

    collectionIdToUseOnSol = userHasNoBitzDataNftYet ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

    response = await fetchBitSumAndGiverCountsSol({
      getterAddr: giftBitzToArtistMeta?.creatorWallet || "",
      campaignId: giftBitzToArtistMeta?.bountyId || "",
      collectionId: collectionIdToUseOnSol,
    });

    _bountyToBitzLocalMapping[giftBitzToArtistMeta?.bountyId] = {
      syncedOn: Date.now(),
      bitsSum: response?.bitsSum,
    };

    if (isSingleAlbumBounty) {
      _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
      setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
      return;
    }

    // lets make a list of album bounties as well and queue it to be fetched
    const albumBountyIds = giftBitzToArtistMeta.albums.map((i: any) => i.bountyId);

    if (albumBountyIds.length > 0) {
      let albumBitzPowerUpPromises: any[] = [];

      albumBitzPowerUpPromises = albumBountyIds.map((albumBounty: any) => {
        if (
          !_bountyBitzSumGlobalMappingWindow[albumBounty] ||
          Date.now() - _bountyBitzSumGlobalMappingWindow[albumBounty].syncedOn > checkInCacheSeconds * 1000
        ) {
          console.log(`&&& fetchBitzPowerUpsAndLikesForSelectedArtist ${albumBounty} - is album ${isSingleAlbumBounty} - NO cached`);

          return fetchBitSumAndGiverCountsSol({
            getterAddr: giftBitzToArtistMeta?.creatorWallet || "",
            campaignId: albumBounty || "",
            collectionId: collectionIdToUseOnSol,
          });
        } else {
          console.log(`&&& fetchBitzPowerUpsAndLikesForSelectedArtist ${albumBounty} - is album ${isSingleAlbumBounty} - YES cached`);
          return null;
        }
      });

      console.log("&&& fetchBitzPowerUpsAndLikesForSelectedArtist albumBitzPowerUpPromises", albumBitzPowerUpPromises);

      if (albumBitzPowerUpPromises.filter((i: any) => i !== null).length > 0) {
        Promise.all(albumBitzPowerUpPromises).then((values) => {
          albumBountyIds.forEach((albumBountyId: any, idx: number) => {
            _bountyToBitzLocalMapping[albumBountyId] = {
              syncedOn: Date.now(),
              bitsSum: values[idx]?.bitsSum,
            };
          });

          _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
          setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
          // console.log({ receivedBitzSum: response.bitsSum, giverCounts: response.giverCounts });
        });
      } else {
        // if no album changes were needed, we just set the global mapping to the current state
        console.log(`&&& fetchBitzPowerUpsAndLikesForSelectedArtist - _bountyToBitzLocalMapping`, _bountyToBitzLocalMapping);
        _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
        setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
      }
    } else {
      _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
      setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
    }
  } else {
    console.log(`&&& fetchBitzPowerUpsAndLikesForSelectedArtist ${giftBitzToArtistMeta.bountyId} - is album ${isSingleAlbumBounty} - YES cached`);
    setMusicBountyBitzSumGlobalMapping(_bountyBitzSumGlobalMappingWindow);
  }
}
// E: GIVING BITZ FOR ARTIST POWER-UPS AND ALBUM LIKES
