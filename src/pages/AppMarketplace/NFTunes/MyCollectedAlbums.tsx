import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { LibraryBig } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DISABLE_BITZ_FEATURES } from "config";
import { Button } from "libComponents/Button";
import { BountyBitzSumMapping } from "libs/types";
import { isMostLikelyMobile, sleep } from "libs/utils/misc";
import { scrollToSection } from "libs/utils/ui";
import { fetchBitzPowerUpsAndLikesForSelectedArtist, getArtistsAlbumsData } from "pages/AppMarketplace/NFTunes/shared/utils";
import { useNftsStore } from "store/nfts";
import { ArtistDiscography } from "./ArtistDiscography";

type MyCollectedAlbumsProps = {
  isFetchingDataMarshal: boolean;
  viewDataRes: any;
  currentDataNftIndex: any;
  dataMarshalResponse: any;
  firstSongBlobUrl: any;
  setStopPreviewPlaying: any;
  setBitzGiftingMeta: any;
  shownSolAppDataNfts: any;
  onSendBitzForMusicBounty: any;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  setMusicBountyBitzSumGlobalMapping: any;
  userHasNoBitzDataNftYet: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  isMusicPlayerOpen?: boolean;
  checkOwnershipOfAlbum: (e: any) => any;
  setFeaturedArtistDeepLinkSlug: (e: any) => any;
  openActionFireLogic: (e: any) => any;
  viewSolData: (e: number) => void;
  onCloseMusicPlayer: () => void;
};

export const MyCollectedAlbums = (props: MyCollectedAlbumsProps) => {
  const {
    shownSolAppDataNfts,
    onSendBitzForMusicBounty,
    bountyBitzSumGlobalMapping,
    setMusicBountyBitzSumGlobalMapping,
    userHasNoBitzDataNftYet,
    dataNftPlayingOnMainPlayer,
    isMusicPlayerOpen,
    checkOwnershipOfAlbum,
    openActionFireLogic,
    setFeaturedArtistDeepLinkSlug,
    viewSolData,
    onCloseMusicPlayer,
  } = props;
  const { isLoadingSol, solBitzNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [myCollectedArtistsAlbums, setMyCollectedArtistsAlbums] = useState<any[]>([]);
  const [allOwnedAlbums, setAllOwnedAlbums] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const allArtistsAlbumsData = await getArtistsAlbumsData();
      setArtistAlbumDataset(allArtistsAlbumsData);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (DISABLE_BITZ_FEATURES) {
        return;
      }

      if (allOwnedAlbums.length > 0) {
        queueBitzPowerUpsAndLikesForAllOwnedAlbums();
      }
    })();
  }, [allOwnedAlbums]);

  useEffect(() => {
    if (allOwnedAlbums.length > 0) {
      // only scroll direct to focus on my collected albums of the user just came from login
      const isDirectFromLogin = searchParams.get("fromLogin");

      if (isDirectFromLogin) {
        const currentParams = Object.fromEntries(searchParams.entries());
        delete currentParams["fromLogin"];
        setSearchParams(currentParams);
        scrollToSection("myCollectedAlbums");
      }
    }
  }, [allOwnedAlbums]);

  useEffect(() => {
    if (artistAlbumDataset && artistAlbumDataset.length > 0) {
      if (shownSolAppDataNfts.length > 0) {
        let _allOwnedAlbums: any[] = [];
        const filteredArtists = artistAlbumDataset
          .map((artist) => {
            // Filter the albums array for each artist
            const filteredAlbums = artist.albums.filter((album: any) =>
              shownSolAppDataNfts.some((ownedNft: DasApiAsset) => ownedNft.content.metadata.name === album.solNftName)
            );

            // we need the creatorWallet from the album level on the album so the bitz can be fetched
            filteredAlbums.forEach((album: any) => {
              album.creatorWallet = artist.creatorWallet;
            });

            _allOwnedAlbums = [..._allOwnedAlbums, ...filteredAlbums];

            // Return artist data with only the filtered albums
            return {
              ...artist,
              albums: filteredAlbums,
            };
          })
          .filter((artist) => artist.albums.length > 0); // Only keep artists that have matching albums

        setMyCollectedArtistsAlbums(filteredArtists);
        setAllOwnedAlbums(_allOwnedAlbums);
      }
    }
  }, [artistAlbumDataset, shownSolAppDataNfts]);

  async function queueBitzPowerUpsAndLikesForAllOwnedAlbums() {
    // we throttle this so that we don't overwhelm the server and also, the local state updates dont fire if they are all too close together
    for (let i = 0; i < allOwnedAlbums.length; i++) {
      fetchBitzPowerUpsAndLikesForSelectedArtist({
        giftBitzToArtistMeta: { ...allOwnedAlbums[i] },
        userHasNoBitzDataNftYet,
        solBitzNfts,
        setMusicBountyBitzSumGlobalMapping,
        isSingleAlbumBounty: true,
      });

      await sleep(2);
    }
  }

  return (
    <div id="myCollectedAlbums" className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col mb-16 xl:mb-32 justify-center w-[100%] items-center xl:items-start">
        <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
          <span className="m-auto md:m-0">My collected albums</span>
        </div>

        <div id="data-nfts" className="flex flex-col md:flex-row w-[100%] items-start">
          <div className="flex flex-col gap-4 p-2 md:p-8 items-start bg-background rounded-lg border border-primary/50 min-h-[350px] w-[100%]">
            <>
              <div className="flex flex-col justify-center w-[100%]">
                {isLoadingSol ? (
                  <div className="m-auto w-full">
                    <div className="w-full flex flex-col items-center h-[300px] md:h-[100%] md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px]">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {myCollectedArtistsAlbums.length > 0 ? (
                      <>
                        <div className="my-2 font-bold text-2xl mb-5">
                          You have collected{" "}
                          <span className="text-2xl bg-clip-text bg-gradient-to-r  from-yellow-300 to-orange-500 text-transparent font-bold">
                            {allOwnedAlbums.length} {allOwnedAlbums.length > 1 ? `albums` : `album`}
                          </span>
                        </div>
                        {myCollectedArtistsAlbums.map((artist: any, index: number) => {
                          return (
                            <div key={index} className="w-[100%]">
                              <ArtistDiscography
                                inCollectedAlbumsView={true}
                                artist={artist}
                                albums={artist.albums}
                                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                                artistProfile={artist}
                                checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                                openActionFireLogic={openActionFireLogic}
                                setFeaturedArtistDeepLinkSlug={setFeaturedArtistDeepLinkSlug}
                                dataNftPlayingOnMainPlayer={dataNftPlayingOnMainPlayer}
                                onSendBitzForMusicBounty={onSendBitzForMusicBounty}
                                viewSolData={viewSolData}
                                isMusicPlayerOpen={isMusicPlayerOpen}
                                onCloseMusicPlayer={onCloseMusicPlayer}
                              />
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="">
                        ⚠️ You have not collected any albums. Let's fix that!
                        <span className="hidden">Get your </span>
                        <span
                          className="hidden text-primary cursor-pointer text-yellow-300 hover:text-[#f97316]"
                          onClick={() => {
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}>
                          free airdrop on top of this page (if you are eligible)
                        </span>{" "}
                        Get some by{" "}
                        <span
                          className="text-primary cursor-pointer text-yellow-300 hover:text-[#f97316]"
                          onClick={() => {
                            scrollToSection("artist-profile");
                          }}>
                          exploring artists and albums
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {myCollectedArtistsAlbums.length === 0 && (
                <Button
                  className="text-lg mb-2 cursor-pointer"
                  variant="outline"
                  onClick={() => {
                    scrollToSection("artist-profile");
                  }}>
                  <>
                    <LibraryBig />
                    <span className="ml-2">{isMostLikelyMobile() ? "View All Artists" : "View All Artists & Collect More Albums"}</span>
                  </>
                </Button>
              )}
            </>
          </div>
        </div>
      </div>
    </div>
  );
};
