import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useSearchParams } from "react-router-dom";
import { DISABLE_BITZ_FEATURES, FAN_MEMBERHSIP_NFT_NAME_TO_ARTIST_SLUG_MAP } from "config";
import { BountyBitzSumMapping } from "libs/types";
import { sleep } from "libs/utils/misc";
import { scrollToSection } from "libs/utils/ui";
import { fetchBitzPowerUpsAndLikesForSelectedArtist, getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import { useNftsStore } from "store/nfts";
import { ArtistDiscography } from "./ArtistDiscography";

type MyCollectedNFTsProps = {
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
  setHomeMode: (e: any) => any;
};

export const MyCollectedNFTs = (props: MyCollectedNFTsProps) => {
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
    setHomeMode,
  } = props;
  const { isLoadingSol, solBitzNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [myCollectedArtistsAlbums, setMyCollectedArtistsAlbums] = useState<any[]>([]);
  const [allOwnedAlbums, setAllOwnedAlbums] = useState<any[]>([]);
  const [allOwnedSigmaAlbums, setAllOwnedSigmaAlbums] = useState<any[]>([]);
  const [allOwnedFanMemberships, setAllOwnedFanMemberships] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFreeDropSampleWorkflow, setIsFreeDropSampleWorkflow] = useState(false);

  useEffect(() => {
    (async () => {
      const { albumArtistLookupData } = await getArtistsAlbumsData();
      setArtistAlbumDataset(albumArtistLookupData);
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
      const isDirectFromFreeMusicGift = searchParams.get("fromFreeMusicGift");
      const isHlWorkflowDeepLink = searchParams.get("hl");

      if (isDirectFromFreeMusicGift) {
        const currentParams = Object.fromEntries(searchParams.entries());
        delete currentParams["fromFreeMusicGift"];
        setSearchParams(currentParams);
        scrollToSection("myCollectedAlbums");
      }

      if (isHlWorkflowDeepLink === "sample") {
        const currentParams = Object.fromEntries(searchParams.entries());
        delete currentParams["hl"];
        setSearchParams(currentParams);
        setIsFreeDropSampleWorkflow(true);
      }
    }
  }, [allOwnedAlbums]);

  useEffect(() => {
    if (artistAlbumDataset && artistAlbumDataset.length > 0) {
      if (shownSolAppDataNfts.length > 0) {
        (async () => {
          let _allOwnedAlbums: any[] = [];
          let _allOwnedSigmaAlbums: any[] = [];

          const filteredArtists = artistAlbumDataset
            .map((artist) => {
              // Filter the albums array for each artist
              const filteredAlbums = artist.albums.filter((album: any) =>
                shownSolAppDataNfts.some((ownedNft: DasApiAsset) => {
                  /*
                    this should match:
                    "MUSG20 - Olly'G - MonaLisa Rap" should match "MUSG20-Olly'G-MonaLisa Rap" or "MUSG20 - Olly'G-MonaLisa Rap"

                    this should NOT match:
                    "MUSG20 - Olly'G - MonaLisa Rap" should not match "MUSG19-Olly'G-MonaLisa Rap" or "MUSG21 - Olly'G-MonaLisa Rap"
                  */
                  // Get the prefix before first "-" or space from both strings
                  const nftPrefix = ownedNft.content.metadata.name.split(/[-\s]/)[0];
                  const albumPrefix = album.solNftName.split(/[-\s]/)[0];
                  return nftPrefix.toLowerCase() === albumPrefix.toLowerCase();
                })
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

          // Find unmatched NFTs
          const unmatchedNfts = shownSolAppDataNfts.filter((ownedNft: DasApiAsset) => {
            const nftPrefix = ownedNft.content.metadata.name.split(/[-\s]/)[0];
            return !_allOwnedAlbums.some((album) => album.solNftName.split(/[-\s]/)[0].toLowerCase() === nftPrefix.toLowerCase());
          });

          // Filter out fan membership NFTs
          const fanMembershipNfts = unmatchedNfts.filter((nft: DasApiAsset) => nft.content.metadata.name.includes("FAN"));
          const remainingUnmatchedNfts = unmatchedNfts.filter((nft: DasApiAsset) => !nft.content.metadata.name.includes("FAN"));

          // Process fan membership NFTs
          if (fanMembershipNfts.length > 0) {
            const fanMembershipsWithMetadata = await Promise.all(
              fanMembershipNfts.map(async (nft: DasApiAsset) => {
                try {
                  const response = await fetch(nft.content.json_uri);
                  const metadata = await response.json();

                  return {
                    solNftName: nft.content.metadata.name,
                    creatorWallet: nft.ownership.owner,
                    img: metadata.image || "https://placeholder.com/300x300",
                    title: metadata.name || nft.content.metadata.name,
                    desc: metadata.description || "Fan Membership",
                    bountyId: "fan_membership",
                    albumId: "fan_membership",
                    isFanMembership: true,
                  };
                } catch (error) {
                  console.error("Error fetching metadata for fan NFT:", error);
                  return {
                    solNftName: nft.content.metadata.name,
                    creatorWallet: nft.ownership.owner,
                    img: "https://placeholder.com/300x300",
                    title: nft.content.metadata.name,
                    desc: "Fan Membership",
                    bountyId: "",
                    albumId: nft.content.metadata.name.replaceAll(" ", "_"),
                    isFanMembership: true,
                  };
                }
              })
            );
            setAllOwnedFanMemberships(fanMembershipsWithMetadata);
          }

          if (remainingUnmatchedNfts.length > 0) {
            // Now await is allowed since we're in an async function
            const albumsWithMetadata = await Promise.all(
              remainingUnmatchedNfts.map(async (nft: DasApiAsset) => {
                try {
                  const response = await fetch(nft.content.json_uri);
                  const metadata = await response.json();

                  return {
                    solNftName: nft.content.metadata.name,
                    creatorWallet: nft.ownership.owner,
                    img: metadata.image || "https://placeholder.com/300x300",
                    title: metadata.name || nft.content.metadata.name,
                    desc: metadata.description || "AI Generated Music",
                    bountyId: "sigma_bounty",
                    albumId: "sigma_album",
                    isSigmaRemixAlbum: true,
                  };
                } catch (error) {
                  console.error("Error fetching metadata for NFT:", error);
                  // Return default values if fetch fails
                  return {
                    solNftName: nft.content.metadata.name,
                    creatorWallet: nft.ownership.owner,
                    img: "https://placeholder.com/300x300",
                    title: nft.content.metadata.name,
                    desc: "AI Generated Music",
                    bountyId: "",
                    albumId: nft.content.metadata.name.replaceAll(" ", "_"),
                    isSigmaRemixAlbum: true,
                  };
                }
              })
            );

            _allOwnedSigmaAlbums = [
              {
                name: "Sigma",
                slug: "sigma",
                creatorWallet: "sigma_wallet",
                albums: albumsWithMetadata,
              },
            ];
          }

          setMyCollectedArtistsAlbums([...filteredArtists]);
          setAllOwnedAlbums(_allOwnedAlbums);
          setAllOwnedSigmaAlbums(_allOwnedSigmaAlbums);
        })();
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
      <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
        <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            Music Collectibles
          </span>
        </div>

        <div className="flex flex-col md:flex-row w-[100%] items-start">
          <div className="flex flex-col gap-4 items-start bg-background min-h-[350px] w-[100%]">
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
                        <div className="font-bold text-2xl mb-5">
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
                                albums={artist.albums}
                                artistProfile={artist}
                                bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
                                dataNftPlayingOnMainPlayer={dataNftPlayingOnMainPlayer}
                                onSendBitzForMusicBounty={onSendBitzForMusicBounty}
                                isMusicPlayerOpen={isMusicPlayerOpen}
                                isFreeDropSampleWorkflow={isFreeDropSampleWorkflow}
                                setHomeMode={setHomeMode}
                                checkOwnershipOfAlbum={checkOwnershipOfAlbum}
                                openActionFireLogic={openActionFireLogic}
                                setFeaturedArtistDeepLinkSlug={setFeaturedArtistDeepLinkSlug}
                                viewSolData={viewSolData}
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
                            setHomeMode(`artists-${new Date().getTime()}`);
                          }}>
                          exploring artists and albums
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          </div>
        </div>
      </div>

      {allOwnedSigmaAlbums.length > 0 && (
        <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
          <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
            <span className="m-auto md:m-0">Sigma AI Albums</span>
          </div>

          <div className="flex flex-col md:flex-row w-[100%] items-start">
            <div className="flex flex-col gap-4 items-start bg-background min-h-[350px] w-[100%]">
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
                      {allOwnedSigmaAlbums.length > 0 ? (
                        <>
                          <div className="font-bold text-2xl mb-5">
                            You have collected{" "}
                            <span className="text-2xl bg-clip-text bg-gradient-to-r  from-yellow-300 to-orange-500 text-transparent font-bold">
                              {allOwnedSigmaAlbums.length} {allOwnedSigmaAlbums.length > 1 ? `albums` : `album`}
                            </span>
                          </div>
                          {allOwnedSigmaAlbums.map((artist: any, index: number) => {
                            return (
                              <div key={index} className="w-[100%]">
                                <ArtistDiscography
                                  inCollectedAlbumsView={true}
                                  albums={artist.albums}
                                  artistProfile={artist}
                                  bountyBitzSumGlobalMapping={bountyBitzSumGlobalMapping}
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

                {/* {myCollectedArtistsAlbums.length === 0 && (
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
                )} */}
              </>
            </div>
          </div>
        </div>
      )}

      {allOwnedFanMemberships.length > 0 && (
        <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
          <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
            <span className="m-auto md:m-0">Inner Circle Fan Collectibles</span>
          </div>

          <div className="flex flex-col md:flex-row w-[100%] items-start">
            <div className="flex flex-col gap-4 items-start bg-background min-h-[350px] w-[100%]">
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
                    <div className="my-2 font-bold text-2xl mb-5 ">
                      You have{" "}
                      <span className="text-2xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                        {allOwnedFanMemberships.length} {allOwnedFanMemberships.length > 1 ? `fan memberships` : `fan membership`}
                      </span>
                    </div>
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border">
                      {allOwnedFanMemberships.map((membership: any, index: number) => {
                        const mapping =
                          membership.solNftName in FAN_MEMBERHSIP_NFT_NAME_TO_ARTIST_SLUG_MAP
                            ? FAN_MEMBERHSIP_NFT_NAME_TO_ARTIST_SLUG_MAP[membership.solNftName as keyof typeof FAN_MEMBERHSIP_NFT_NAME_TO_ARTIST_SLUG_MAP]
                            : null;
                        const handleClick = () => {
                          if (mapping) {
                            const params = new URLSearchParams();
                            if ("campaignCode" in mapping) {
                              params.set("campaign", mapping.campaignCode as string);
                            }
                            params.set("artist", mapping.slug);
                            params.set("tab", "fan");
                            window.location.href = `?${params.toString()}`;
                          }
                        };
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={handleClick}>
                            <img src={membership.img} alt={membership.desc} className="h-48 w-48 object-cover rounded-lg mb-4" />
                            <div className="text-center max-w-[300px]">{membership.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
