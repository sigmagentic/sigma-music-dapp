import React from "react";
import { faHandPointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { Gift, Heart, Loader, Music2, Pause, Play, ShoppingCart, WalletMinimal, Disc3 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ratingR from "assets/img/nf-tunes/rating-R.png";
import { DISABLE_BITZ_FEATURES } from "config";
import { Button } from "libComponents/Button";
import { BountyBitzSumMapping } from "libs/types";
import { isMostLikelyMobile } from "libs/utils/misc";
import { scrollToSection } from "libs/utils/ui";
import { routeNames } from "routes";
import { getBestBuyCtaLink } from "./types/utils";

type ArtistDiscographyProps = {
  albums: any[];
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  artistProfile: any;
  isPreviewPlaying?: boolean;
  previewIsReadyToPlay?: boolean;
  previewPlayingForAlbumId?: any;
  currentTime?: string;
  isFreeDropSampleWorkflow?: boolean;
  inCollectedAlbumsView?: boolean;
  artist?: any;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  viewSolData: (e: number) => void;
  onSendBitzForMusicBounty: (e: any) => any;
  playPausePreview?: (e: any, f: any) => any;
  checkOwnershipOfAlbum: (e: any) => any;
  openActionFireLogic: (e: any) => any;
  setFeaturedArtistDeepLinkSlug?: (e: any) => any;
};

export const ArtistDiscography = (props: ArtistDiscographyProps) => {
  const {
    inCollectedAlbumsView,
    artist,
    albums,
    bountyBitzSumGlobalMapping,
    artistProfile,
    isPreviewPlaying,
    previewIsReadyToPlay,
    previewPlayingForAlbumId,
    currentTime,
    isFreeDropSampleWorkflow,
    onSendBitzForMusicBounty,
    checkOwnershipOfAlbum,
    viewSolData,
    playPausePreview,
    openActionFireLogic,
    setFeaturedArtistDeepLinkSlug,
    dataNftPlayingOnMainPlayer,
  } = props;
  const { publicKey: publicKeySol } = useWallet();
  const [, setSearchParams] = useSearchParams();

  const userLoggedInWithWallet = publicKeySol;

  function thisIsPlayingOnMainPlayer(album: any) {
    return dataNftPlayingOnMainPlayer?.content.metadata.name === album?.solNftName;
  }

  return (
    <>
      {albums.map((album: any, idx: number) => (
        <div key={album.albumId} className="album flex flex-col h-[100%] mb-3 p-2 md:p-5 border w-[100%]">
          <div className="albumDetails flex flex-col md:flex-row">
            <div
              className="albumImg bg1-red-200 border-[0.5px] border-neutral-500/90 h-[150px] w-[150px] bg-no-repeat bg-cover rounded-xl m-auto"
              style={{
                "backgroundImage": `url(${album.img})`,
              }}></div>

            <div className="albumText flex flex-col mt-5 md:mt-0 md:ml-5 md:pr-2 flex-1 mb-5 md:mb-0">
              <h3 className="!text-xl mb-2 flex items-baseline">
                {!inCollectedAlbumsView && <span className="text-3xl mr-1 opacity-50">{`${idx + 1}. `}</span>}
                <span>
                  {album.title}{" "}
                  {inCollectedAlbumsView ? (
                    <>
                      <span className="text-sm">by</span> <span className="font-bold">{artist.name}</span>
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
                      title={userLoggedInWithWallet ? "Like This Album With 5 BiTz" : "Login to Like This Album"}
                      onClick={() => {
                        if (userLoggedInWithWallet) {
                          onSendBitzForMusicBounty({
                            creatorIcon: album.img,
                            creatorName: `${artistProfile.name}'s ${album.title}`,
                            giveBitzToWho: artistProfile.creatorWallet,
                            giveBitzToCampaignId: album.bountyId,
                            isLikeMode: true,
                          });
                        }
                      }}>
                      {bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum}
                      <Heart className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="albumActions mt-3 flex flex-wrap flex-col items-center gap-2 lg:flex-row space-y-2 lg:space-y-0 w-full">
            {album.ctaPreviewStream && !inCollectedAlbumsView && (
              <div>
                <Button
                  disabled={isPreviewPlaying && !previewIsReadyToPlay}
                  className="!text-white text-sm mx-2 bg-gradient-to-br from-[#737373] from-5% via-[#A76262] via-30% to-[#5D3899] to-95% cursor-pointer"
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
                      <Play />
                      <span className="ml-2">Play Preview</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* when not logged in, show this to convert the wallet into user account */}
            {!publicKeySol && (
              <div className="relative w-full md:w-auto">
                <Link to={routeNames.login} state={{ from: `${location.pathname}${location.search}` }}>
                  <Button className="text-sm mx-2 cursor-pointer !text-orange-500 dark:!text-yellow-300" variant="outline">
                    <>
                      <WalletMinimal />
                      <span className="ml-2">Login to Check Ownership</span>
                    </>
                  </Button>
                </Link>

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

            <>
              {checkOwnershipOfAlbum(album) > -1 && (
                <div className="relative">
                  <Button
                    disabled={(isPreviewPlaying && !previewIsReadyToPlay) || thisIsPlayingOnMainPlayer(album)}
                    className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 cursor-pointer"
                    onClick={() => {
                      const albumInOwnershipListIndex = checkOwnershipOfAlbum(album);

                      if (albumInOwnershipListIndex > -1) {
                        viewSolData(albumInOwnershipListIndex);
                      }

                      if (openActionFireLogic) {
                        openActionFireLogic({
                          giveBitzToCampaignId: album.bountyId,
                          bountyBitzSum: bountyBitzSumGlobalMapping[album.bountyId]?.bitsSum,
                          creatorWallet: artistProfile.creatorWallet,
                        });
                      }
                    }}>
                    <>
                      <Music2 />
                      <span className="ml-2">{thisIsPlayingOnMainPlayer(album) ? "Playing..." : "Play Album"}</span>
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

              {getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }) && (
                <div>
                  <Button
                    className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 md:mx-2 cursor-pointer"
                    onClick={() => {
                      window.open(getBestBuyCtaLink({ ctaBuy: album.ctaBuy, dripSet: album.dripSet }))?.focus();
                    }}>
                    <>
                      <ShoppingCart />
                      <span className="ml-2">{checkOwnershipOfAlbum(album) > -1 ? "Buy More Album Copies" : "Buy Album"}</span>
                    </>
                  </Button>
                </div>
              )}

              {album.ctaAirdrop && (
                <div>
                  <Button
                    className="!text-white text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-700 to-orange-800 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 mx-2 cursor-pointer"
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

              {inCollectedAlbumsView && artist && (
                <div>
                  <Button
                    className="!text-black text-sm px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 md:mx-2 cursor-pointer"
                    onClick={() => {
                      if (setFeaturedArtistDeepLinkSlug) {
                        setFeaturedArtistDeepLinkSlug(artist.slug);
                      }

                      setSearchParams({ "artist-profile": artist.slug });
                      scrollToSection("artist-profile");
                    }}>
                    <>
                      <Disc3 />
                      <span className="ml-2">{`View more ${!isMostLikelyMobile() ? `from ${artist.name}` : "from artist"} `}</span>
                    </>
                  </Button>
                </div>
              )}
            </>
          </div>
        </div>
      ))}
    </>
  );
};
