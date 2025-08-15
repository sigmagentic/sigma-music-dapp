import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import {
  Loader,
  AudioWaveform,
  Pause,
  Play,
  ShoppingCart,
  WalletMinimal,
  Disc3,
  Hourglass,
  Rocket,
  Briefcase,
  Download,
  ExternalLink,
  X,
  Image,
  List,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ratingE from "assets/img/icons/rating-E.png";
import { StoryIPLicenseDisplay } from "components/StoryIPLicenseDisplay";
import { APP_NETWORK, DISABLE_BITZ_FEATURES, LICENSE_TERMS_MAP } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { fetchSolNfts } from "libs/sol/SolViewData";
import { AlbumSaleTypeOption, BountyBitzSumMapping } from "libs/types";
import { Artist, Album, EntitlementForMusicAsset } from "libs/types";
import {
  checkIfAlbumCanBeMintedViaAPI,
  doFastStreamOnAlbumCheckViaAPI,
  fetchMyAlbumsFromMintLogsViaAPI,
  getPaymentLogsViaAPI,
  injectXUserNameIntoTweet,
  isMostLikelyMobile,
} from "libs/utils";
import { showSuccessConfetti } from "libs/utils/uiShared";
import { routeNames } from "routes";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";
import { useNftsStore } from "store/nfts";
import { BuyAndMintAlbumUsingCC } from "./BuyAlbum/BuyAndMintAlbumUsingCC";
import { BuyAndMintAlbumUsingSOL } from "./BuyAlbum/BuyAndMintAlbumUsingSOL";
import { TrackList } from "./components/TrackList";
import { getBestBuyCtaLink } from "./types/utils";

type ArtistDiscographyProps = {
  albums: Album[];
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  artistProfile: Artist;
  isPreviewPlaying?: boolean;
  previewIsReadyToPlay?: boolean;
  previewPlayingForAlbumId?: any;
  currentTime?: string;
  inCollectedAlbumsView?: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  isMusicPlayerOpen?: boolean;
  highlightAlbumId?: string;
  setHomeMode?: (e: any) => any;
  viewSolData: (e: number, f?: any, g?: boolean) => void;
  onSendBitzForMusicBounty: (e: any) => any;
  playPausePreview?: (e: any, f: any) => any;
  checkOwnershipOfMusicAsset: (e: any, f?: boolean) => any;
  openActionFireLogic: (e: any) => any;
  setFeaturedArtistDeepLinkSlug?: (e: any) => any;
  onCloseMusicPlayer: () => void;
};

export const ArtistDiscography = (props: ArtistDiscographyProps) => {
  const {
    inCollectedAlbumsView,
    albums,
    artistProfile,
    bountyBitzSumGlobalMapping,
    isPreviewPlaying,
    previewIsReadyToPlay,
    previewPlayingForAlbumId,
    currentTime,
    dataNftPlayingOnMainPlayer,
    isMusicPlayerOpen,
    highlightAlbumId,
    setHomeMode,
    viewSolData,
    onSendBitzForMusicBounty,
    playPausePreview,
    checkOwnershipOfMusicAsset,
    openActionFireLogic,
    setFeaturedArtistDeepLinkSlug,
    onCloseMusicPlayer,
  } = props;
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const addressSol = publicKeySol?.toBase58();
  const { updateSolNfts, solMusicAssetNfts } = useNftsStore();
  const userLoggedInWithWallet = publicKeySol;
  const { updateAssetPlayIsQueued, trackPlayIsQueued, assetPlayIsQueued, albumIdBeingPlayed } = useAudioPlayerStore();
  const [queueAlbumPlay, setQueueAlbumPlay] = useState(false);
  const [albumToBuyAndMint, setAlbumToBuyAndMint] = useState<Album | undefined>();
  const [albumsWithCanBeMintedFlags, setAlbumsWithCanBeMintedFlags] = useState<Album[]>([]);
  const { updateMyRawPaymentLogs, myMusicAssetPurchases, myAlbumMintLogs, updateMyAlbumMintLogs } = useAccountStore();
  const [showEntitlementsModal, setShowEntitlementsModal] = useState(false);
  const [selectedAlbumToShowEntitlements, setSelectedAlbumToShowEntitlements] = useState<Album | null>(null);
  const [entitlementsForSelectedAlbum, setEntitlementsForSelectedAlbum] = useState<EntitlementForMusicAsset | null>(null);
  const [showSigmaExclusiveModal, setShowSigmaExclusiveModal] = useState(false);
  const [showCommercialLicenseModal, setShowCommercialLicenseModal] = useState(false);
  const [selectedAlbumForTrackList, setSelectedAlbumForTrackList] = useState<Album | null>(null);
  const [selectedLargeSizeTokenImg, setSelectedLargeSizeTokenImg] = useState<string | null>(null);
  const [ownedStoryProtocolCommercialLicense, setOwnedStoryProtocolCommercialLicense] = useState<any | null>(null);
  const [showAlbumPurchasedCongratsModal, setShowAlbumPurchasedCongratsModal] = useState(false);
  const [tweetText, setTweetText] = useState<string>("");

  useEffect(() => {
    if (artistProfile && albums.length > 0) {
      // check and attach the _buyNowMeta to each album based on a realtime call to the backend
      const isValidBuyNowMetaAfterOption2DoubleCheckApiCall = (meta: any): meta is Album["_buyNowMeta"] => {
        return (
          typeof meta === "object" &&
          meta !== null &&
          (meta.priceOption1 !== undefined || meta.priceOption2 !== undefined || meta.priceOption3 !== undefined || meta.priceOption4 !== undefined)
        );
      };

      const fetchAlbumsWithCanBeMinted = async () => {
        const albumsWithCanBeMinted = await Promise.all(
          albums.map(async (album) => {
            const meta = await checkIfAlbumCanBeMintedViaAPI(album.albumId);
            const albumCanBeFastStreamed = await doFastStreamOnAlbumCheckViaAPI(`${album.albumId}-1`); // we check if the first track is loaded and if so, we know it can be fast streamed
            return {
              ...album,
              _buyNowMeta: isValidBuyNowMetaAfterOption2DoubleCheckApiCall(meta) ? meta : undefined,
              _albumCanBeFastStreamed: Boolean(albumCanBeFastStreamed),
            };
          })
        );

        // in the above we get some live data to make sure option 2 and 3 are correct (as it needs to double check we have the NFT metadata setup in the backend)
        // .., now we augment it with some static data for option 1
        const albumsWithCanBeMintedAndStaticData = albumsWithCanBeMinted.map((album) => {
          const adjustedWithFlatPurchaseData = {
            ...album,
          };

          if (adjustedWithFlatPurchaseData._buyNowMeta) {
            if (album.albumPriceOption1 && album.albumPriceOption1 !== "") {
              adjustedWithFlatPurchaseData._buyNowMeta!.priceOption1!.priceInUSD = album.albumPriceOption1;
            }

            if (album.albumPriceOption2 && album.albumPriceOption2 !== "") {
              // here, we take the price from the database to be more accurate
              adjustedWithFlatPurchaseData._buyNowMeta!.priceOption2!.priceInUSD = album.albumPriceOption2;
            }

            if (album.albumPriceOption3 && album.albumPriceOption3 !== "") {
              adjustedWithFlatPurchaseData._buyNowMeta!.priceOption3!.priceInUSD = album.albumPriceOption3;
            }

            if (album.albumPriceOption4 && album.albumPriceOption4 !== "") {
              adjustedWithFlatPurchaseData._buyNowMeta!.priceOption4!.priceInUSD = album.albumPriceOption4;
            }
          }

          return adjustedWithFlatPurchaseData;
        });

        setAlbumsWithCanBeMintedFlags(albumsWithCanBeMintedAndStaticData);
      };

      fetchAlbumsWithCanBeMinted();
    }
  }, [artistProfile, albums]);

  useEffect(() => {
    // this effect gets called 1st when user clicks on the show entitlements button
    if (selectedAlbumToShowEntitlements && (myMusicAssetPurchases.length > 0 || solMusicAssetNfts.length > 0)) {
      const entitlementsMap: EntitlementForMusicAsset = {
        mp3TracksCanBeDownloaded: false,
        licenseTerms: {
          shortDescription: null,
          urlToLicense: null,
          ipTokenId: null,
        },
        nftAssetIdOnBlockchain: null,
      };

      const assetPurchaseThatMatches = myMusicAssetPurchases.find((assetPurchase) => assetPurchase.albumId === selectedAlbumToShowEntitlements.albumId);

      if (assetPurchaseThatMatches && assetPurchaseThatMatches.albumSaleTypeOption) {
        entitlementsMap.mp3TracksCanBeDownloaded = true;
        entitlementsMap.licenseTerms.shortDescription =
          LICENSE_TERMS_MAP[assetPurchaseThatMatches.albumSaleTypeOption as keyof typeof LICENSE_TERMS_MAP].shortDescription;
        // this is the IP license that wil apply to both priceOption3 and priceOption4 as we store the ipasset in priceOption3
        // ... (in the next effect) we check the logs for a payment made against for this iptoken
        entitlementsMap.licenseTerms.urlToLicense =
          LICENSE_TERMS_MAP[assetPurchaseThatMatches.albumSaleTypeOption as keyof typeof LICENSE_TERMS_MAP].urlToLicense;
        entitlementsMap.licenseTerms.ipTokenId = selectedAlbumToShowEntitlements._buyNowMeta?.priceOption3?.IpTokenId || null;
      } else {
        // we should NEVER get here, but old assets (Drip assets) may not have priceOptions so lets default to the first option as this is a good license
        entitlementsMap.mp3TracksCanBeDownloaded = false;
        entitlementsMap.licenseTerms.shortDescription = LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].shortDescription;
        entitlementsMap.licenseTerms.urlToLicense = LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].urlToLicense;
        entitlementsMap.nftAssetIdOnBlockchain = null;
        entitlementsMap.licenseTerms.ipTokenId = null;
      }

      // does the user have the nft collectible?
      const findMusicNft = solMusicAssetNfts.find((nft) => {
        const nftPrefix = nft.content.metadata.name.split(/[-\s]/)[0];
        const albumPrefix = selectedAlbumToShowEntitlements.solNftName.split(/[-\s]/)[0];
        // for solNftAltCodes, solNftAltCodes will be MUSSM28T1 or MUSSM28T1:MUSSM28T2 (i.e. the T1 or T2)
        return (
          nftPrefix.toLowerCase() === albumPrefix.toLowerCase() ||
          (selectedAlbumToShowEntitlements.solNftAltCodes !== "" && selectedAlbumToShowEntitlements.solNftAltCodes?.includes(nftPrefix))
        );
      });

      if (findMusicNft) {
        entitlementsMap.nftAssetIdOnBlockchain = findMusicNft.id;
      }

      setEntitlementsForSelectedAlbum(entitlementsMap);
      setShowEntitlementsModal(true);
    }
  }, [selectedAlbumToShowEntitlements, myMusicAssetPurchases, solMusicAssetNfts]);

  useEffect(() => {
    // this effect gets called 2nd when user clicks on the show entitlements button
    if (selectedAlbumToShowEntitlements && entitlementsForSelectedAlbum && entitlementsForSelectedAlbum.licenseTerms.ipTokenId && myAlbumMintLogs.length > 0) {
      // mintTemplate: "album-ar21_a3-1752833831760" so we need to check if the albumId is in the mintTemplate
      const findStoryProtocolLicense = myAlbumMintLogs.find(
        (mintLog) =>
          mintLog.ipTokenId === entitlementsForSelectedAlbum.licenseTerms.ipTokenId && mintLog.mintTemplate.includes(selectedAlbumToShowEntitlements.albumId)
      );

      if (findStoryProtocolLicense) {
        setOwnedStoryProtocolCommercialLicense(findStoryProtocolLicense);
      }
    }
  }, [entitlementsForSelectedAlbum, selectedAlbumToShowEntitlements, myAlbumMintLogs]);

  // if the user just paid for an album, we need to show a congrats modal and refres some core data
  useEffect(() => {
    if (!artistProfile || !addressSol) return;

    const currentParams = Object.fromEntries(searchParams.entries());
    const action = currentParams["action"];
    setSearchParams(currentParams);

    if (action === "justpaid") {
      // remove action from the url (as we dont want them share that on X for e.g)
      delete currentParams["action"];
      setSearchParams(currentParams);

      (async () => {
        // the user just bought an album using a credit card, lets refresh any ownership data collections from the backend
        await refreshPurchasedAlbumCollectiblesViaRPC();

        await handleRefreshMyStoryProtocolLicenses({ bypassCacheAsNewDataAdded: true });

        await refreshPurchasedLogsViaAPI();
      })();

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);

      const tweetMsg = injectXUserNameIntoTweet(
        `I just bought a new album from ${artistProfile.name} _(xUsername)_ on @SigmaXMusic and can't wait to stream it!`,
        artistProfile.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm${location.search}`)}&text=${encodeURIComponent(tweetMsg)}`);
      setShowAlbumPurchasedCongratsModal(true);
    }
  }, [addressSol, artistProfile]); // Only re-run if addressSol changes

  function thisIsPlayingOnMusicPlayer(album: any): boolean {
    if (albumIdBeingPlayed) {
      return albumIdBeingPlayed === album.albumId;
    } else {
      return !!(
        dataNftPlayingOnMainPlayer?.content.metadata.name === album?.solNftName ||
        dataNftPlayingOnMainPlayer?.content.metadata.name?.includes(album?.solNftAltCodes || "")
      );
    }
  }

  function handlePlayMusicAsset(
    album: any,
    { artistId, albumId, artistName, albumName }: { artistId?: string; albumId?: string; artistName?: string; albumName?: string } = {},
    jumpToPlaylistTrackIndex?: number
  ) {
    let playAlbumNowParams = null;
    // play now feature
    if (artistId && albumId) {
      playAlbumNowParams = {
        artistId,
        albumId,
        artistName,
        albumName,
        jumpToPlaylistTrackIndex,
      };
    }

    const albumInOwnershipListIndex = checkOwnershipOfMusicAsset(album);
    const userOwnsAlbum = albumInOwnershipListIndex > -1;

    if (userOwnsAlbum || playAlbumNowParams) {
      viewSolData(albumInOwnershipListIndex, playAlbumNowParams, userOwnsAlbum);
    }

    if (openActionFireLogic) {
      openActionFireLogic({
        giveBitzToCampaignId: album.bountyId,
        bountyBitzSum: bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum,
        creatorWallet: artistProfile.creatorWallet,
      });
    }
  }

  async function refreshPurchasedAlbumCollectiblesViaRPC() {
    const _allDataNfts = await fetchSolNfts(addressSol);

    updateSolNfts(_allDataNfts);
  }

  async function handleRefreshMyStoryProtocolLicenses({ bypassCacheAsNewDataAdded = false }: { bypassCacheAsNewDataAdded?: boolean } = {}) {
    const _albumMintLogs = await fetchMyAlbumsFromMintLogsViaAPI(addressSol!, bypassCacheAsNewDataAdded);
    updateMyAlbumMintLogs(_albumMintLogs);
  }

  // if we fetch the latest logs, the app store propogates all the music asset purchases for the user
  async function refreshPurchasedLogsViaAPI() {
    const _paymentLogs = await getPaymentLogsViaAPI({ addressSol: addressSol! });
    updateMyRawPaymentLogs(_paymentLogs);
  }

  // Reorder albums (albumsWithCanBeMintedFlags) if highlightAlbumId is present
  const orderedAlbums: Album[] = React.useMemo(() => {
    if (!highlightAlbumId) return albumsWithCanBeMintedFlags;

    return [
      ...albumsWithCanBeMintedFlags.filter((album) => album.albumId === highlightAlbumId),
      ...albumsWithCanBeMintedFlags.filter((album) => album.albumId !== highlightAlbumId),
    ];
  }, [albumsWithCanBeMintedFlags, highlightAlbumId]);

  function handlePlayAlbumNow(selectedAlbumToPlay: Album | null, jumpToPlaylistTrackIndex?: number) {
    // if the user is jumping between multiple albums, the audio player was getting into some weird state
    // .... to deal with this, we check if something is playing and then queue the next album and wait for 5 seconds
    // @TODO: we can improve UX by using some global store state to toggle "queuing" of music when tracks are loading, or are in some
    // transition state and prevent users from click spamming play buttons during this time
    if (!selectedAlbumToPlay) return;

    if (isMusicPlayerOpen) {
      setQueueAlbumPlay(true);
      updateAssetPlayIsQueued(true);
      onCloseMusicPlayer();

      setTimeout(() => {
        handlePlayMusicAsset(
          selectedAlbumToPlay,
          {
            artistId: artistProfile.artistId,
            albumId: selectedAlbumToPlay.albumId,
            artistName: artistProfile.name,
            albumName: selectedAlbumToPlay.title,
          },
          jumpToPlaylistTrackIndex
        );
        setQueueAlbumPlay(false);
        updateAssetPlayIsQueued(false);
      }, 5000);
    } else {
      handlePlayMusicAsset(
        selectedAlbumToPlay,
        {
          artistId: artistProfile.artistId,
          albumId: selectedAlbumToPlay.albumId,
          artistName: artistProfile.name,
          albumName: selectedAlbumToPlay.title,
        },
        jumpToPlaylistTrackIndex
      );
      setQueueAlbumPlay(false);
      updateAssetPlayIsQueued(false);
    }
  }

  return (
    <>
      {albums.length === 0 && (
        <div className="max-w-4xl mx-auto md:m-[initial] p-3 flex flex-col">
          <h2 className="!text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
            No Playable Content Yet
          </h2>
        </div>
      )}

      {albums.length > 0 && albumsWithCanBeMintedFlags.length === 0 && (
        <div className="h-[100px] flex items-center justify-center">
          <>
            <Loader className="animate-spin text-yellow-300" size={30} />
          </>
        </div>
      )}

      {selectedAlbumForTrackList ? (
        <div className="mx-auto md:m-[initial] p-3">
          <TrackList
            album={selectedAlbumForTrackList}
            artistId={artistProfile.artistId}
            artistName={artistProfile.name}
            onBack={() => setSelectedAlbumForTrackList(null)}
            onPlayTrack={handlePlayAlbumNow}
            checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
            trackPlayIsQueued={trackPlayIsQueued}
            assetPlayIsQueued={assetPlayIsQueued}
          />
        </div>
      ) : (
        albumsWithCanBeMintedFlags.length > 0 &&
        orderedAlbums.map((album: Album, idx: number) => (
          <div
            key={`${album.albumId}-${idx}`}
            className={`album relative flex flex-col my-3 border rounded-lg w-[100%] ${highlightAlbumId === album.albumId ? "border-yellow-500 bg-yellow-500/10 border-2" : ""}`}>
            {/* Commercial License Badge */}
            <div className="flex flex-col relative">
              {/* Sigma Exclusive Badge */}
              {album.isSigmaExclusive && album.isSigmaExclusive === "1" && (
                <>
                  <div className="absolute top-0 right-0 z-[9]">
                    <div className="relative inline-block overflow-hidden rounded-bl-lg cursor-pointer" onClick={() => setShowSigmaExclusiveModal(true)}>
                      <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-bl-lg rounded-tr-sm font-semibold text-sm shadow-lg border border-white">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          Sigma Exclusive
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sigma Exclusive Modal */}
                  {showSigmaExclusiveModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                      <div className="bg-[#1A1A1A] rounded-lg p-6  max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-bold text-white">Sigma Music Exclusive!</h3>
                          <button onClick={() => setShowSigmaExclusiveModal(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                          </button>
                        </div>
                        <div className="text-white py-2">
                          <strong className="text-red-400">Sigma Exclusive</strong> albums, EPs, and singles are <strong>ONLY</strong> available on the Sigma
                          Music platform. Listen for free, purchase as collectibles, or get commercial licenses. These are super rare!
                        </div>
                        <div className="flex justify-center mt-4">
                          <Button variant="outline" className="text-sm px-6" onClick={() => setShowSigmaExclusiveModal(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {album.albumPriceOption4 && album.albumPriceOption4 !== "" && album?._buyNowMeta?.priceOption4?.priceInUSD && (
                <>
                  <div className={`absolute top-0 ${album.isSigmaExclusive && album.isSigmaExclusive === "1" ? "right-[140px]" : "right-0"} z-[9]`}>
                    <div className="relative inline-block overflow-hidden rounded-bl-lg cursor-pointer" onClick={() => setShowCommercialLicenseModal(true)}>
                      <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-bl-lg rounded-tr-sm font-semibold text-sm shadow-lg border border-yellow-400/50">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                          Commercial License Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commercial License Modal */}
                  {showCommercialLicenseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                      <div className="bg-[#1A1A1A] rounded-lg p-6  max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-bold text-white">Commercial License Available!</h3>
                          <button onClick={() => setShowCommercialLicenseModal(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                          </button>
                        </div>
                        <div className="text-white py-2">
                          <strong className="text-yellow-400">Commercial License</strong> is available for this album. If you buy a commercical license, you can
                          AI Remix any track inside this album!
                        </div>
                        <div className="flex justify-center mt-4">
                          <Button variant="outline" className="text-sm px-6" onClick={() => setShowCommercialLicenseModal(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Rarity and Max Mints Badge */}
            {album?._buyNowMeta?.priceOption2?.canBeMinted && (
              <div className={`absolute bottom-[-7px] right-0 z-9 ${album?._buyNowMeta?.rarityGrade === "Common" ? "opacity-50" : ""}`}>
                <div className="relative inline-block overflow-hidden rounded-tl-lg">
                  <div className="relative px-3 py-1.5 rounded-tl-lg font-semibold text-sm border border-orange-400 text-orange-400">
                    <span className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      <span className="font-bold text-yellow-400">{album?._buyNowMeta?.rarityGrade}</span> Collectible •{" "}
                      {album?._buyNowMeta?.maxMints && album?._buyNowMeta?.maxMints > 0 ? `only ${album?._buyNowMeta?.maxMints} available` : "Unlimited"}
                      {album?._buyNowMeta?.rarityGrade !== "Common" && album?._buyNowMeta?.rarityGrade !== "Uncommon" && (
                        <span className="text-yellow-400 pulse">🔥</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-2 md:p-5">
              <div className="albumDetails flex flex-col items-start md:items-center md:flex-row">
                <div
                  className={`albumImg border-[0.5px] border-neutral-500/90 h-[150px] w-[150px] bg-no-repeat bg-cover rounded-lg md:m-auto relative group ${album._albumCanBeFastStreamed && !inCollectedAlbumsView ? "cursor-pointer" : ""}`}
                  style={{
                    "backgroundImage": `url(${album.img})`,
                  }}
                  onClick={() => {
                    // if there is a token image, show it in a large version
                    if (album._buyNowMeta?.priceOption2?.tokenImg) {
                      setSelectedLargeSizeTokenImg(album._buyNowMeta?.priceOption2?.tokenImg);
                    } else if (album._albumCanBeFastStreamed && !inCollectedAlbumsView) {
                      // load the track list for the album if we dont have a collectible img to show
                      setSelectedAlbumForTrackList(album);
                    }
                  }}>
                  {album._buyNowMeta?.priceOption2?.tokenImg && (
                    <>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[80%] transition-opacity duration-300 rounded-lg" />
                      <div
                        className="absolute inset-0 bg-no-repeat bg-cover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          "backgroundImage": `url(${album._buyNowMeta?.priceOption2?.tokenImg})`,
                          "backgroundPosition": "center",
                          "backgroundSize": "contain",
                        }}
                      />

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-300 pointer-events-none z-10">
                        <div
                          className="relative bg-black/90 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap before:absolute before:inset-0 before:rounded-lg before:border before:border-emerald-400/50 
                      after:absolute after:inset-0 after:rounded-lg after:border after:border-yellow-400/50">
                          The premium version of this album comes with this collectible!
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="albumText flex flex-col mt-5 md:mt-0 md:ml-5 md:pr-2 flex-1 mb-5 md:mb-0">
                  <h3 className="!text-xl mb-2 flex items-baseline">
                    <span>
                      {album.title}
                      {inCollectedAlbumsView ? (
                        <>
                          <span className="text-sm"> by</span> <span className="font-bold">{artistProfile.name.replaceAll("_", " ")}</span>
                        </>
                      ) : (
                        ""
                      )}
                    </span>
                    {album.isExplicit && album.isExplicit === "1" && (
                      <img
                        className="max-h-[20px] relative top-[2px] ml-[5px] rounded-md"
                        src={ratingE}
                        alt="Warning: Explicit Content"
                        title="Warning: Explicit Content"
                      />
                    )}
                  </h3>
                  <div className="relative">
                    <p
                      className="text-sm overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxHeight: "4.5rem", // Approximately 3 lines of text
                      }}
                      title={album.desc}>
                      {album.desc}
                    </p>
                    {/* Dark shadow overlay to indicate more content */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t ${highlightAlbumId === album.albumId ? "from-bg-yellow-500/10" : "from-[#171717]"}  to-transparent pointer-events-none`}></div>
                  </div>
                </div>

                {!DISABLE_BITZ_FEATURES && (
                  <div className="albumLikes md:w-[135px] flex flex-col items-center">
                    <div
                      className={`${userLoggedInWithWallet && typeof bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum !== "undefined" ? " hover:bg-orange-100 cursor-pointer dark:hover:text-orange-500" : ""} text-center mb-1 text-lg h-[40px] text-orange-500 dark:text-[#fde047] border border-orange-500 dark:border-yellow-300 rounded w-[100px] flex items-center justify-center`}
                      onClick={() => {
                        if (userLoggedInWithWallet && typeof bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum !== "undefined") {
                          onSendBitzForMusicBounty({
                            creatorIcon: album.img,
                            creatorName: `${artistProfile.name}'s ${album.title}`,
                            creatorSlug: artistProfile.slug,
                            creatorXLink: artistProfile.xLink,
                            giveBitzToWho: artistProfile.creatorWallet,
                            giveBitzToCampaignId: album.bountyId,
                            isLikeMode: true,
                          });
                        }
                      }}>
                      {typeof bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum === "undefined" ? (
                        <Loader className="w-full text-center animate-spin hover:scale-105 m-2" />
                      ) : (
                        <div
                          className="p-5 md:p-0 flex items-center gap-2"
                          title={userLoggedInWithWallet ? "Boost This Album With 5 XP" : "Login to Boost This Album"}
                          onClick={() => {
                            if (userLoggedInWithWallet) {
                              onSendBitzForMusicBounty({
                                creatorIcon: album.img,
                                creatorName: `${artistProfile.name}'s ${album.title}`,
                                creatorSlug: artistProfile.slug,
                                creatorXLink: artistProfile.xLink,
                                giveBitzToWho: artistProfile.creatorWallet,
                                giveBitzToCampaignId: album.bountyId,
                                isLikeMode: true,
                              });
                            }
                          }}>
                          {bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum}
                          <Rocket className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="albumActions mt-3 flex flex-wrap flex-col items-start md:items-center gap-2 lg:flex-row space-y-2 lg:space-y-0 w-full">
                {/* track list button */}
                {!inCollectedAlbumsView && album._albumCanBeFastStreamed && (
                  <Button
                    variant="outline"
                    className="text-sm px-3 py-2 cursor-pointer !text-orange-500 dark:!text-yellow-300"
                    onClick={() => setSelectedAlbumForTrackList(album)}>
                    <List className="w-4 h-4 mr-2" />
                    Track List
                  </Button>
                )}

                {!album._albumCanBeFastStreamed && album.ctaPreviewStream && !inCollectedAlbumsView && checkOwnershipOfMusicAsset(album) === -1 && (
                  <div>
                    <Button
                      disabled={(isPreviewPlaying && !previewIsReadyToPlay) || trackPlayIsQueued || assetPlayIsQueued}
                      className="text-sm mr-2 cursor-pointer !text-orange-500 dark:!text-yellow-300"
                      variant="outline"
                      onClick={() => {
                        if (playPausePreview) {
                          playPausePreview(album.ctaPreviewStream, album.albumId);
                        }
                      }}>
                      {isPreviewPlaying && previewPlayingForAlbumId === album.albumId ? (
                        <>
                          {!previewIsReadyToPlay ? <Loader className="animate-spin" /> : <Pause />}
                          <span className="ml-2"> {currentTime} - Stop Playing </span>
                        </>
                      ) : (
                        <>
                          {trackPlayIsQueued || assetPlayIsQueued ? <Hourglass /> : <Play />}
                          <span className="ml-2">Play Preview</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* when not logged in, show this to convert the wallet into user account */}
                {!publicKeySol && !album._buyNowMeta?.priceOption1 && (
                  <div className="relative w-full md:w-auto">
                    <Button
                      className="text-sm mr-2 cursor-pointer !text-orange-500 dark:!text-yellow-300 w-[222px]"
                      variant="outline"
                      onClick={() => {
                        window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search)}`;
                      }}>
                      <>
                        <WalletMinimal />
                        <span className="ml-2">Login for Full Album</span>
                      </>
                    </Button>
                  </div>
                )}

                {(album._albumCanBeFastStreamed || (publicKeySol && checkOwnershipOfMusicAsset(album) > -1)) && (
                  <>
                    <div className="relative group">
                      <Button
                        disabled={
                          (isPreviewPlaying && !previewIsReadyToPlay) ||
                          thisIsPlayingOnMusicPlayer(album) ||
                          queueAlbumPlay ||
                          trackPlayIsQueued ||
                          assetPlayIsQueued
                        }
                        variant="outline"
                        className={`!text-black text-sm px-[2.35rem] bg-gradient-to-r ${checkOwnershipOfMusicAsset(album) === -1 ? "from-yellow-300 to-orange-500 hover:bg-gradient-to-l" : "from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300"} transition ease-in-out delay-150 duration-300 cursor-pointer`}
                        onClick={() => {
                          handlePlayAlbumNow(album);
                        }}>
                        <>
                          {trackPlayIsQueued || assetPlayIsQueued ? <Hourglass /> : <AudioWaveform />}
                          <span className="ml-2">
                            {thisIsPlayingOnMusicPlayer(album)
                              ? "Playing"
                              : queueAlbumPlay
                                ? "Queued"
                                : checkOwnershipOfMusicAsset(album) > -1
                                  ? "Play Premium Album"
                                  : "Play Free Album"}
                          </span>
                        </>
                      </Button>

                      {/* Tooltip */}
                      <div
                        className="
                    absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200 delay-1000 
                    pointer-events-none 
                    w-full md:w-auto
                  ">
                        <div
                          className="
                      relative 
                      bg-black/90 
                      text-white text-sm 
                      px-3 py-1.5 
                      rounded-lg 
                      mx-2 md:mx-0
                      before:absolute before:inset-0 before:rounded-lg before:border before:border-emerald-400/50 
                      after:absolute after:inset-0 after:rounded-lg after:border after:border-yellow-400/50
                    ">
                          <div
                            className="
                        max-w-[200px] md:max-w-none 
                        break-words md:whitespace-nowrap 
                        text-center
                      ">
                            {thisIsPlayingOnMusicPlayer(album)
                              ? "This album is currently playing"
                              : queueAlbumPlay
                                ? "Album will start playing in 5 seconds"
                                : checkOwnershipOfMusicAsset(album) > -1
                                  ? "Play your premium album with bonus tracks"
                                  : "Listen for free, or purchase this album to unlock premium bonus tracks"}
                          </div>
                          <div
                            className="
                        absolute top-full left-1/2 
                        transform -translate-x-1/2 
                        border-4 border-transparent border-t-black/90
                      "></div>
                        </div>
                      </div>
                    </div>

                    {/* Entitlements Button */}
                    {checkOwnershipOfMusicAsset(album) > -1 && (
                      <Button
                        className="!text-black text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedAlbumToShowEntitlements(album);
                          setShowEntitlementsModal(true);
                        }}>
                        <Briefcase className="w-4 h-4" />
                        <span className="ml-2">Entitlements</span>
                      </Button>
                    )}
                  </>
                )}

                <>
                  {checkOwnershipOfMusicAsset(album) < 0 && (
                    <>
                      {walletType === "phantom" && getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }) && (
                        <div>
                          <Button
                            className="text-sm cursor-pointer !text-orange-500 dark:!text-yellow-300"
                            variant="outline"
                            onClick={() => {
                              window.open(getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }))?.focus();
                            }}>
                            <>
                              <ShoppingCart />
                              <span className="ml-2">Buy on NFT Market</span>
                            </>
                          </Button>
                        </div>
                      )}

                      {album._buyNowMeta?.priceOption1?.priceInUSD && !inCollectedAlbumsView && (
                        <div className={`relative group overflow-hidden rounded-lg p-[1.5px]`}>
                          {/* Animated border background */}
                          <div className="animate-border-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(from_0deg,#22c55e_0deg,#f97316_180deg,transparent_360deg)]"></div>

                          {/* Button content */}
                          <Button
                            className={`relative z-2 !text-black text-sm px-[2.35rem] w-full bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 !opacity-100`}
                            variant="outline"
                            onClick={() => {
                              if (addressSol) {
                                setAlbumToBuyAndMint(album);
                              } else {
                                let backToAlbumFocus = `artist=${artistProfile.slug}~${album.albumId}`;

                                window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + "?" + backToAlbumFocus)}`;
                              }
                            }}>
                            <>
                              <span className="ml-2">
                                {checkOwnershipOfMusicAsset(album) > -1
                                  ? "Buy More Album Copies Now"
                                  : `${addressSol ? `Buy (From $${album._buyNowMeta?.priceOption1?.priceInUSD})` : `Login to Buy (From $${album._buyNowMeta?.priceOption1?.priceInUSD})`}`}
                              </span>
                            </>
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {inCollectedAlbumsView && artistProfile && !album.isSigmaRemixAlbum && setFeaturedArtistDeepLinkSlug && setHomeMode && (
                    <div>
                      <Button
                        className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 cursor-pointer"
                        onClick={() => {
                          setFeaturedArtistDeepLinkSlug(artistProfile.slug);
                          setSearchParams({ "artist": artistProfile.slug });
                          setHomeMode(`artists-${new Date().getTime()}`);
                        }}>
                        <>
                          <Disc3 />
                          <span className="ml-2">{`View more ${!isMostLikelyMobile() ? `from ${artistProfile.name.replaceAll("_", " ")}` : "from artist"} `}</span>
                        </>
                      </Button>
                    </div>
                  )}
                </>
              </div>

              <span className="text-xs text-gray-700 ml-0 text-left mt-2 mb-[15px]">id: {album.albumId}</span>
            </div>
          </div>
        ))
      )}

      {/* Entitlements Modal */}
      {showEntitlementsModal && selectedAlbumToShowEntitlements && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Your Entitlements</h3>
              <button
                onClick={() => {
                  setShowEntitlementsModal(false);
                  setSelectedAlbumToShowEntitlements(null);
                  setEntitlementsForSelectedAlbum(null);
                }}
                className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-300 mb-4 text-sm">You have purchased this asset and these are your entitlements:</p>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Play Premium Album Section */}
                <div className="">
                  <h4 className="!text-lg font-semibold text-white">Play Premium Album</h4>
                  <Button
                    disabled={thisIsPlayingOnMusicPlayer(selectedAlbumToShowEntitlements) || queueAlbumPlay || trackPlayIsQueued || assetPlayIsQueued}
                    className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px]"
                    onClick={() => {
                      handlePlayAlbumNow(selectedAlbumToShowEntitlements);
                      setShowEntitlementsModal(false);
                      setSelectedAlbumToShowEntitlements(null);
                      setEntitlementsForSelectedAlbum(null);
                    }}>
                    <AudioWaveform className="w-4 h-4" />
                    <span className="ml-2">Play Now</span>
                  </Button>
                </div>

                {/* Download Premium Album Files Section */}
                <div className={`${entitlementsForSelectedAlbum?.mp3TracksCanBeDownloaded ? "" : "opacity-50 pointer-events-none cursor-not-allowed"}`}>
                  <h4 className="!text-lg font-semibold text-white">Download Track MP3 Files</h4>
                  <Button
                    className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[250px]"
                    onClick={() => {
                      window.open("/faq#how-to-download-tracks", "_blank");
                    }}>
                    <Download className="w-4 h-4" />
                    <span className="ml-2">How to Download Files</span>
                  </Button>
                </div>
              </div>

              {/* Usage License Section */}
              <div className="">
                <h4 className="!text-lg font-semibold text-white">Your Usage License</h4>
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <p className="text-gray-300 text-sm">{entitlementsForSelectedAlbum?.licenseTerms.shortDescription}</p>
                  <Button
                    className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px]"
                    onClick={() => {
                      if (entitlementsForSelectedAlbum?.licenseTerms.urlToLicense) {
                        window.open(entitlementsForSelectedAlbum?.licenseTerms.urlToLicense, "_blank");
                      }
                    }}>
                    <ExternalLink className="w-4 h-4" />
                    <span className="ml-2">View License Details</span>
                  </Button>
                </div>

                {ownedStoryProtocolCommercialLicense && <StoryIPLicenseDisplay license={ownedStoryProtocolCommercialLicense} />}
              </div>

              {/* View Collectible Section */}
              <div className={`${entitlementsForSelectedAlbum?.nftAssetIdOnBlockchain ? "" : "opacity-50 pointer-events-none cursor-not-allowed"}`}>
                <h4 className="!text-lg font-semibold text-white">View Collectible</h4>
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <p className="text-gray-300 text-sm">View your NFT collectible on the blockchain.</p>
                  <Button
                    className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px]"
                    onClick={() => {
                      window.open(
                        APP_NETWORK === "devnet"
                          ? `https://solscan.io/token/${entitlementsForSelectedAlbum?.nftAssetIdOnBlockchain}?cluster=devnet`
                          : `https://solana.fm/address/${entitlementsForSelectedAlbum?.nftAssetIdOnBlockchain}/transactions?cluster=mainnet-alpha`,
                        "_blank"
                      );
                    }}>
                    <Image className="w-4 h-4" />
                    <span className="ml-2">View on Blockchain</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy and Mint Album Modal */}
      <>
        {albumToBuyAndMint &&
          (walletType === "phantom" ? (
            <BuyAndMintAlbumUsingSOL
              albumToBuyAndMint={albumToBuyAndMint}
              artistProfile={artistProfile}
              onCloseModal={(isMintingSuccess: boolean) => {
                setAlbumToBuyAndMint(undefined);

                if (isMintingSuccess) {
                  refreshPurchasedAlbumCollectiblesViaRPC();

                  // if the album is a commercial license, we need to refresh the myStoryProtocolLicenses
                  if (albumToBuyAndMint._buyNowMeta?.priceOption3?.IpTokenId) {
                    handleRefreshMyStoryProtocolLicenses();
                  }
                }

                refreshPurchasedLogsViaAPI();
              }}
            />
          ) : (
            <BuyAndMintAlbumUsingCC
              albumToBuyAndMint={albumToBuyAndMint}
              artistProfile={artistProfile}
              onCloseModal={() => {
                setAlbumToBuyAndMint(undefined);
              }}
            />
          ))}
      </>

      {/* Show larger profile or token image modal */}
      {selectedLargeSizeTokenImg && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
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

      {/* Album Purchased Congrats Modal */}
      {showAlbumPurchasedCongratsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-xl w-full mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Congrats on your new purchase!</h3>
              <button
                onClick={() => {
                  setShowAlbumPurchasedCongratsModal(false);
                }}
                className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              You can now stream the full version and enjoy any other entitltements (e.g. download files, view collectible, view commercial license etc.)
            </p>

            <div className="space-y-4 flex flex-col items-center">
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  onClick={() => {
                    setShowAlbumPurchasedCongratsModal(false);
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                  Back to Artist Page
                </Button>

                <div className="bg-yellow-300 rounded-full p-[10px] -z-1">
                  <a
                    className="z-1 bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
                    href={"https://twitter.com/intent/tweet?" + tweetText}
                    data-size="large"
                    target="_blank"
                    rel="noreferrer">
                    <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                        <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                      </svg>
                    </span>
                    <p className="z-10 text-sm">Share this news on X</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
