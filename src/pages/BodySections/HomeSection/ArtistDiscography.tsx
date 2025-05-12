import React, { useEffect, useState } from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Gift, Heart, Loader, AudioWaveform, AudioLines, Pause, Play, ShoppingCart, WalletMinimal, Disc3, Hourglass, Rocket } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ratingR from "assets/img/nf-tunes/rating-R.png";
import { DISABLE_BITZ_FEATURES, ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { fetchSolNfts } from "libs/sol/SolViewData";
import { BountyBitzSumMapping } from "libs/types";
import { Artist, Album } from "libs/types";
import { checkIfAlbumCanBeMintedViaAPI, isMostLikelyMobile } from "libs/utils/misc";
import { routeNames } from "routes";
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
  isFreeDropSampleWorkflow?: boolean;
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
    isFreeDropSampleWorkflow,
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
  const { updateAlbumPlayIsQueued, trackPlayIsQueued, albumPlayIsQueued } = useAudioPlayerStore();
  const [queueAlbumPlay, setQueueAlbumPlay] = useState(false);
  const [albumToBuyAndMint, setAlbumToBuyAndMint] = useState<Album | undefined>();
  const [albumsWithCanBeMintedFlags, setAlbumsWithCanBeMintedFlags] = useState<Album[]>([]);

  useEffect(() => {
    if (artistProfile && albums.length > 0) {
      // check and attach the _buyNowMeta (canBeMinted flag and priceInUSD) to each album based on a realtime call to the backend
      const fetchAlbumsWithCanBeMinted = async () => {
        const albumsWithCanBeMinted = await Promise.all(
          albums.map(async (album) => ({ ...album, _buyNowMeta: await checkIfAlbumCanBeMintedViaAPI(album.albumId) }))
        );

        setAlbumsWithCanBeMintedFlags(albumsWithCanBeMinted);
      };

      fetchAlbumsWithCanBeMinted();
    }
  }, [artistProfile, albums]);

  function thisIsPlayingOnMainPlayer(album: any) {
    return dataNftPlayingOnMainPlayer?.content.metadata.name === album?.solNftName;
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

  async function refreshPurchasedAlbums() {
    const _allDataNfts = await fetchSolNfts(addressSol);

    updateSolNfts(_allDataNfts);
  }

  // Reorder albums (albumsWithCanBeMintedFlags) if highlightAlbumId is present
  const orderedAlbums: Album[] = React.useMemo(() => {
    if (!highlightAlbumId) return albumsWithCanBeMintedFlags;

    return [
      ...albumsWithCanBeMintedFlags.filter((album) => album.albumId === highlightAlbumId),
      ...albumsWithCanBeMintedFlags.filter((album) => album.albumId !== highlightAlbumId),
    ];
  }, [albumsWithCanBeMintedFlags, highlightAlbumId]);

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
                    <span className="text-sm text-gray-500 ml-2">id: {album.albumId}</span>
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
              {album.ctaPreviewStream && !inCollectedAlbumsView && checkOwnershipOfAlbum(album) === -1 && (
                <div>
                  <Button
                    disabled={(isPreviewPlaying && !previewIsReadyToPlay) || trackPlayIsQueued || albumPlayIsQueued}
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
                        {trackPlayIsQueued || albumPlayIsQueued ? <Hourglass /> : <Play />}
                        <span className="ml-2">Play Preview</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* when not logged in, show this to convert the wallet into user account */}
              {!publicKeySol && !album._buyNowMeta?.canBeMinted && (
                <div className="relative w-full md:w-auto">
                  <Button
                    className="text-sm mr-2 cursor-pointer !text-orange-500 dark:!text-yellow-300 w-[222px]"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search)}`;
                    }}>
                    <>
                      <WalletMinimal />
                      <span className="ml-2">Login for Premium Album</span>
                    </>
                  </Button>

                  {isFreeDropSampleWorkflow && (
                    <div className="animate-bounce p-3 text-sm absolute w-[110px] ml-[-18px] mt-[12px] text-center">
                      <div className="m-auto mb-[2px] bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faHandPointer} />
                      </div>
                      <span className="text-center">Click To Play</span>
                    </div>
                  )}
                </div>
              )}

              {(ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS.includes(album.albumId) || (publicKeySol && checkOwnershipOfAlbum(album) > -1)) && (
                <>
                  <div className="relative group">
                    <Button
                      disabled={
                        (isPreviewPlaying && !previewIsReadyToPlay) ||
                        thisIsPlayingOnMainPlayer(album) ||
                        queueAlbumPlay ||
                        trackPlayIsQueued ||
                        albumPlayIsQueued
                      }
                      className={`!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r  ${checkOwnershipOfAlbum(album) === -1 ? "from-yellow-300 to-orange-500 hover:bg-gradient-to-l" : "from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300"} transition ease-in-out delay-150 duration-300 cursor-pointer w-[232px] mr-2`}
                      onClick={() => {
                        // if the user is jumping between multiple albums, the audio player was getting into some weird state
                        // .... to deal with this, we check if something is playing and then queue the next album and wait for 5 seconds
                        // @TODO: we can improve UX by using some global store state to toggle "queuing" of music when tracks are loading, or are in some
                        // transition state and prevent users from click spamming play buttons during this time
                        if (isMusicPlayerOpen) {
                          setQueueAlbumPlay(true);
                          updateAlbumPlayIsQueued(true);
                          onCloseMusicPlayer();

                          setTimeout(() => {
                            handlePlayAlbum(album, {
                              artistId: artistProfile.artistId,
                              albumId: album.albumId,
                              artistName: artistProfile.name,
                              albumName: album.title,
                            });
                            setQueueAlbumPlay(false);
                            updateAlbumPlayIsQueued(false);
                          }, 5000);
                        } else {
                          handlePlayAlbum(album, {
                            artistId: artistProfile.artistId,
                            albumId: album.albumId,
                            artistName: artistProfile.name,
                            albumName: album.title,
                          });
                          setQueueAlbumPlay(false);
                          updateAlbumPlayIsQueued(false);
                        }
                      }}>
                      <>
                        {trackPlayIsQueued || albumPlayIsQueued ? <Hourglass /> : <AudioWaveform />}
                        <span className="ml-2">
                          {thisIsPlayingOnMainPlayer(album)
                            ? "Playing..."
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
                          {thisIsPlayingOnMainPlayer(album)
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

                    {isFreeDropSampleWorkflow && (
                      <div className="animate-bounce p-3 text-sm absolute w-[110px] ml-[-18px] mt-[12px] text-center">
                        <div className="m-auto mb-[2px] bg-white dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faHandPointer} />
                        </div>
                        <span className="text-center">Click To Play</span>
                      </div>
                    )}
                  </div>
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

                    {album._buyNowMeta?.canBeMinted && album._buyNowMeta?.priceInUSD && !inCollectedAlbumsView && (
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
                                : `${addressSol ? `Buy Now $ ${album._buyNowMeta?.priceInUSD} USD` : `Login to Buy Now $ ${album._buyNowMeta?.priceInUSD} USD`}`}
                            </span>
                          </>
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {album.ctaAirdrop && (
                  <div>
                    <Button
                      className="!text-white text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-700 to-orange-800 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 mr-2 cursor-pointer"
                      onClick={() => {
                        window.open(album.ctaAirdrop)?.focus();
                      }}>
                      <>
                        <Gift />
                        <span className="ml-2">Get Album Airdrop!</span>
                      </>
                    </Button>
                  </div>
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
          </div>
        ))}

      <>
        {albumToBuyAndMint &&
          (walletType === "phantom" ? (
            <BuyAndMintAlbumUsingSOL
              albumToBuyAndMint={albumToBuyAndMint}
              artistProfile={artistProfile}
              onCloseModal={(isMintingSuccess: boolean) => {
                setAlbumToBuyAndMint(undefined);

                if (isMintingSuccess) {
                  refreshPurchasedAlbums();
                }
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
