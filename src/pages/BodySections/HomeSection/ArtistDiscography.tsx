import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import {
  Gift,
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
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ratingR from "assets/img/nf-tunes/rating-R.png";
import { DISABLE_BITZ_FEATURES, ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS, LICENSE_TERMS_MAP } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { fetchSolNfts } from "libs/sol/SolViewData";
import { AlbumSaleTypeOption, BountyBitzSumMapping } from "libs/types";
import { Artist, Album, EntitlementForMusicAsset } from "libs/types";
import { checkIfAlbumCanBeMintedViaAPI, getPaymentLogsViaAPI, isMostLikelyMobile } from "libs/utils/misc";
import { routeNames } from "routes";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";
import { useNftsStore } from "store/nfts";
import { BuyAndMintAlbumUsingCC } from "./BuyAlbum/BuyAndMintAlbumUsingCC";
import { BuyAndMintAlbumUsingSOL } from "./BuyAlbum/BuyAndMintAlbumUsingSOL";
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
  checkOwnershipOfAlbum: (e: any) => any;
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
    checkOwnershipOfAlbum,
    openActionFireLogic,
    setFeaturedArtistDeepLinkSlug,
    onCloseMusicPlayer,
  } = props;
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const [, setSearchParams] = useSearchParams();
  const addressSol = publicKeySol?.toBase58();
  const { updateSolNfts } = useNftsStore();
  const userLoggedInWithWallet = publicKeySol;
  const { updateAssetPlayIsQueued, trackPlayIsQueued, assetPlayIsQueued, albumIdBeingPlayed } = useAudioPlayerStore();
  const [queueAlbumPlay, setQueueAlbumPlay] = useState(false);
  const [albumToBuyAndMint, setAlbumToBuyAndMint] = useState<Album | undefined>();
  const [albumsWithCanBeMintedFlags, setAlbumsWithCanBeMintedFlags] = useState<Album[]>([]);
  const { updateMyRawPaymentLogs, myMusicAssetPurchases } = useAccountStore();
  const [showEntitlementsModal, setShowEntitlementsModal] = useState(false);
  const [selectedAlbumToShowEntitlements, setSelectedAlbumToShowEntitlements] = useState<Album | null>(null);
  const [entitlementsForSelectedAlbum, setEntitlementsForSelectedAlbum] = useState<EntitlementForMusicAsset | null>(null);

  useEffect(() => {
    if (artistProfile && albums.length > 0) {
      // check and attach the _buyNowMeta to each album based on a realtime call to the backend
      const isValidBuyNowMetaAfterOption2DoubleCheckApiCall = (meta: any): meta is Album["_buyNowMeta"] => {
        return (
          typeof meta === "object" && meta !== null && (meta.priceOption1 !== undefined || meta.priceOption2 !== undefined || meta.priceOption3 !== undefined)
        );
      };

      const fetchAlbumsWithCanBeMinted = async () => {
        const albumsWithCanBeMinted = await Promise.all(
          albums.map(async (album) => {
            const meta = await checkIfAlbumCanBeMintedViaAPI(album.albumId);
            return {
              ...album,
              _buyNowMeta: isValidBuyNowMetaAfterOption2DoubleCheckApiCall(meta) ? meta : undefined,
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
          }

          return adjustedWithFlatPurchaseData;
        });

        setAlbumsWithCanBeMintedFlags(albumsWithCanBeMintedAndStaticData);
      };

      fetchAlbumsWithCanBeMinted();
    }
  }, [artistProfile, albums]);

  useEffect(() => {
    if (selectedAlbumToShowEntitlements && myMusicAssetPurchases.length > 0) {
      const entitlementsMap: EntitlementForMusicAsset = {
        mp3TrackUrls: [],
        licenseTerms: {
          shortDescription: null,
          urlToLicense: null,
        },
        nftAssetIdOnBlockchain: null,
      };

      const assetPurchaseThatMatches = myMusicAssetPurchases.find((assetPurchase) => assetPurchase.albumId === selectedAlbumToShowEntitlements.albumId);

      if (assetPurchaseThatMatches && assetPurchaseThatMatches.albumSaleTypeOption) {
        entitlementsMap.licenseTerms.shortDescription =
          LICENSE_TERMS_MAP[assetPurchaseThatMatches.albumSaleTypeOption as keyof typeof LICENSE_TERMS_MAP].shortDescription;
        entitlementsMap.licenseTerms.urlToLicense =
          LICENSE_TERMS_MAP[assetPurchaseThatMatches.albumSaleTypeOption as keyof typeof LICENSE_TERMS_MAP].urlToLicense;
      } else {
        // we should NEVER get here, but old assets may not have priceOptions so lets default to the first option as this is a good license
        entitlementsMap.mp3TrackUrls = [];
        entitlementsMap.licenseTerms.shortDescription = LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].shortDescription;
        entitlementsMap.licenseTerms.urlToLicense = LICENSE_TERMS_MAP[AlbumSaleTypeOption.priceOption1].urlToLicense;
        entitlementsMap.nftAssetIdOnBlockchain = null;
      }

      setEntitlementsForSelectedAlbum(entitlementsMap);
      setShowEntitlementsModal(true);
    }
  }, [selectedAlbumToShowEntitlements, myMusicAssetPurchases]);

  function thisIsPlayingOnMusicPlayer(album: any) {
    if (albumIdBeingPlayed) {
      return albumIdBeingPlayed === album.albumId;
    } else {
      return dataNftPlayingOnMainPlayer?.content.metadata.name === album?.solNftName;
    }
  }

  function handlePlayAlbum(
    album: any,
    { artistId, albumId, artistName, albumName }: { artistId?: string; albumId?: string; artistName?: string; albumName?: string } = {}
  ) {
    let playAlbumNowParams = null;
    // play now feature
    if (artistId && albumId) {
      playAlbumNowParams = {
        artistId,
        albumId,
        artistName,
        albumName,
      };
    }

    const albumInOwnershipListIndex = checkOwnershipOfAlbum(album);
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

  function handlePlayAlbumNow(selectedAlbumToPlay: Album | null) {
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
        handlePlayAlbum(selectedAlbumToPlay, {
          artistId: artistProfile.artistId,
          albumId: selectedAlbumToPlay.albumId,
          artistName: artistProfile.name,
          albumName: selectedAlbumToPlay.title,
        });
        setQueueAlbumPlay(false);
        updateAssetPlayIsQueued(false);
      }, 5000);
    } else {
      handlePlayAlbum(selectedAlbumToPlay, {
        artistId: artistProfile.artistId,
        albumId: selectedAlbumToPlay.albumId,
        artistName: artistProfile.name,
        albumName: selectedAlbumToPlay.title,
      });
      setQueueAlbumPlay(false);
      updateAssetPlayIsQueued(false);
    }
  }

  return (
    <>
      {albums.length === 0 && (
        <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
            No Playable Content Yet
          </h2>
        </div>
      )}

      {albums.length > 0 && albumsWithCanBeMintedFlags.length === 0 && (
        <div className="h-[100px] flex items-center justify-center">
          <>
            <Loader className="animate-spin" size={30} />
          </>
        </div>
      )}

      {albumsWithCanBeMintedFlags.length > 0 &&
        orderedAlbums.map((album: Album, idx: number) => (
          <div
            key={`${album.albumId}-${idx}`}
            className={`album flex flex-col my-3 p-2 md:p-5 border rounded-lg w-[100%] ${highlightAlbumId === album.albumId ? "border-yellow-500 bg-yellow-500/10 border-2" : ""}`}>
            <div className="albumDetails flex flex-col items-start md:items-center md:flex-row">
              <div
                className="albumImg bg1-red-200 border-[0.5px] border-neutral-500/90 h-[150px] w-[150px] bg-no-repeat bg-cover rounded-lg md:m-auto"
                style={{
                  "backgroundImage": `url(${album.img})`,
                }}></div>

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
                    <img className="max-h-[20px] ml-[10px] dark:bg-white" src={ratingR} alt="Warning: Explicit Content" title="Warning: Explicit Content" />
                  )}
                </h3>
                <p className="">{album.desc}</p>
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
              {!ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS.includes(album.albumId) &&
                album.ctaPreviewStream &&
                !inCollectedAlbumsView &&
                checkOwnershipOfAlbum(album) === -1 && (
                  <div>
                    <Button
                      disabled={(isPreviewPlaying && !previewIsReadyToPlay) || trackPlayIsQueued || assetPlayIsQueued}
                      className="text-sm mr-2 cursor-pointer !text-orange-500 dark:!text-yellow-300 w-[222px]"
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

              {(ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS.includes(album.albumId) || (publicKeySol && checkOwnershipOfAlbum(album) > -1)) && (
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
                      className={`!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r  ${checkOwnershipOfAlbum(album) === -1 ? "from-yellow-300 to-orange-500 hover:bg-gradient-to-l" : "from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300"} transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px] mr-2`}
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
                              : checkOwnershipOfAlbum(album) > -1
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
                              : checkOwnershipOfAlbum(album) > -1
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
                  <Button
                    className="!text-black text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer mr-2"
                    onClick={() => {
                      setSelectedAlbumToShowEntitlements(album);
                      setShowEntitlementsModal(true);
                    }}>
                    <Briefcase className="w-4 h-4" />
                    <span className="ml-2">Entitlements</span>
                  </Button>
                </>
              )}

              <>
                {checkOwnershipOfAlbum(album) < 0 && (
                  <>
                    {walletType === "phantom" && getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }) && (
                      <div>
                        <Button
                          className="text-sm cursor-pointer !text-orange-500 dark:!text-yellow-300 mr-2"
                          variant="outline"
                          onClick={() => {
                            window.open(getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }))?.focus();
                          }}>
                          <>
                            <ShoppingCart />
                            <span className="ml-2">Find On External NFT Market</span>
                          </>
                        </Button>
                      </div>
                    )}

                    {album._buyNowMeta?.priceOption1?.priceInUSD && !inCollectedAlbumsView && (
                      <div className={`relative group overflow-hidden rounded-lg p-[1.5px] ${!addressSol ? "w-[222px]" : "w-[222px]"}`}>
                        {/* Animated border background */}
                        <div className="animate-border-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(from_0deg,#22c55e_0deg,#f97316_180deg,transparent_360deg)]"></div>

                        {/* Button content */}
                        <Button
                          className={`relative z-2 !text-black text-sm px-[2.35rem] w-full bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 !opacity-100`}
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
                              {checkOwnershipOfAlbum(album) > -1
                                ? "Buy More Album Copies Now"
                                : `${addressSol ? `Buy (From  $${album._buyNowMeta?.priceOption1?.priceInUSD})` : `Login to Buy (From $${album._buyNowMeta?.priceOption1?.priceInUSD})`}`}
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
                      className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 mr-2 cursor-pointer"
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

            <span className="text-xs text-gray-700 ml-2 text-right">id: {album.albumId}</span>
          </div>
        ))}

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

            <p className="text-gray-300 mb-4">You have purchased this asset and these are your entitlements:</p>

            <div className="space-y-4">
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
              <div
                className={`${entitlementsForSelectedAlbum?.mp3TrackUrls.length && entitlementsForSelectedAlbum?.mp3TrackUrls.length > 0 ? "" : "opacity-50 pointer-events-none cursor-not-allowed"}`}>
                <h4 className="!text-lg font-semibold text-white">Download Premium Album Files</h4>
                <Button
                  className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px]"
                  onClick={() => {
                    // TODO: Implement download functionality
                    window.open(selectedAlbumToShowEntitlements.ctaBuy, "_blank");
                  }}>
                  <Download className="w-4 h-4" />
                  <span className="ml-2">Download Files</span>
                </Button>
              </div>

              {/* Usage License Section */}
              <div className="">
                <h4 className="!text-lg font-semibold text-white">Your Usage License</h4>
                <p className="text-gray-300">{entitlementsForSelectedAlbum?.licenseTerms.shortDescription}</p>
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

              {/* View Collectible Section */}
              <div className={`${entitlementsForSelectedAlbum?.nftAssetIdOnBlockchain ? "" : "opacity-50 pointer-events-none cursor-not-allowed"}`}>
                <h4 className="!text-lg font-semibold text-white">View Collectible</h4>
                <p className="text-gray-300">View your NFT collectible on the blockchain.</p>
                <Button
                  className="!text-black mt-2 text-sm px-[2.35rem] bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-orange-500 hover:to-yellow-300 transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px]"
                  onClick={() => {
                    window.open(`https://solscan.io/token/${selectedAlbumToShowEntitlements.solNftName}`, "_blank");
                  }}>
                  <Image className="w-4 h-4" />
                  <span className="ml-2">View on Blockchain</span>
                </Button>
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
    </>
  );
};
