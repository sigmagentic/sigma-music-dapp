import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Loader, RefreshCcw } from "lucide-react";
import { StoryIPLicenseDisplay } from "components/StoryIPLicenseDisplay";
import { DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Album, BountyBitzSumMapping } from "libs/types";
import { fetchMyAlbumsFromMintLogsViaAPI, sleep } from "libs/utils";
import { fetchBitzPowerUpsAndLikesForSelectedArtist, getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { useNftsStore } from "store/nfts";
import { ArtistDiscography } from "./ArtistDiscography";

type MyCollectedNFTsProps = {
  setBitzGiftingMeta: any;
  onSendBitzForMusicBounty: any;
  bountyBitzSumGlobalMapping: BountyBitzSumMapping;
  setMusicBountyBitzSumGlobalMapping: any;
  userHasNoBitzDataNftYet: boolean;
  dataNftPlayingOnMainPlayer?: DasApiAsset;
  isMusicPlayerOpen?: boolean;
  checkOwnershipOfMusicAsset: (e: any, f?: boolean) => any;
  setFeaturedArtistDeepLinkSlug: (e: any) => any;
  openActionFireLogic: (e: any) => any;
  viewSolData: (e: number) => void;
  onCloseMusicPlayer: () => void;
  setHomeMode: (e: any) => any;
  navigateToDeepAppView: (e: any) => any;
};

export const MyCollectedNFTs = (props: MyCollectedNFTsProps) => {
  const {
    onSendBitzForMusicBounty,
    bountyBitzSumGlobalMapping,
    setMusicBountyBitzSumGlobalMapping,
    userHasNoBitzDataNftYet,
    dataNftPlayingOnMainPlayer,
    isMusicPlayerOpen,
    checkOwnershipOfMusicAsset,
    openActionFireLogic,
    setFeaturedArtistDeepLinkSlug,
    viewSolData,
    onCloseMusicPlayer,
    setHomeMode,
    navigateToDeepAppView,
  } = props;
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { isSolCoreLoading, solBitzNfts, solMusicAssetNfts, solFanMembershipNfts } = useNftsStore();
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [myCollectedArtistsAlbums, setMyCollectedArtistsAlbums] = useState<any[]>([]);
  const [allOwnedAlbums, setAllOwnedAlbums] = useState<any[]>([]);
  const [allOwnedFanMemberships, setAllOwnedFanMemberships] = useState<any[]>([]);
  const { artistLookupEverything } = useAppStore();
  const [dataLoaded, setDataLoaded] = useState(false);
  const { myAlbumMintLogs, updateMyAlbumMintLogs } = useAccountStore();
  const [isLoadingStoryLicenses, setIsLoadingStoryLicenses] = useState(false);
  const [myStoryProtocolLicenses, setMyStoryProtocolLicenses] = useState<any[]>([]);
  const [mostLikelyHaveMultipleCopiesOfTheSameAlbum, setMostLikelyHaveMultipleCopiesOfTheSameAlbum] = useState(false);

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
    if (artistAlbumDataset && artistAlbumDataset.length > 0 && Object.keys(artistLookupEverything).length > 0) {
      if (solMusicAssetNfts.length > 0 || solFanMembershipNfts.length > 0) {
        (async () => {
          setDataLoaded(false);
          let _allOwnedAlbums: any[] = [];

          const filteredArtists = artistAlbumDataset
            .map((artist) => {
              // Filter the albums array for each artist
              const filteredAlbums = artist.albums.filter((album: any) =>
                solMusicAssetNfts.some((ownedNft: DasApiAsset) => {
                  /*
                    this should match:
                    "MUSG20 - Olly'G - MonaLisa Rap" should match "MUSG20-Olly'G-MonaLisa Rap" or "MUSG20 - Olly'G-MonaLisa Rap"

                    this should NOT match:
                    "MUSG20 - Olly'G - MonaLisa Rap" should not match "MUSG19-Olly'G-MonaLisa Rap" or "MUSG21 - Olly'G-MonaLisa Rap"
                  */
                  // Get the prefix before first "-" or space from both strings
                  const nftPrefix = ownedNft.content.metadata.name.split(/[-\s]/)[0];
                  const albumPrefix = !album.solNftName ? "" : album.solNftName.split(/[-\s]/)[0];
                  // for solNftAltCodes, solNftAltCodes will be MUSSM28T1 or MUSSM28T1:MUSSM28T2 (i.e. the T1 or T2)
                  return nftPrefix.toLowerCase() === albumPrefix.toLowerCase() || (album.solNftAltCodes !== "" && album.solNftAltCodes?.includes(nftPrefix));
                })
              );

              // @TODO: we need to add the number of copies of the album to the album object

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

          // Process fan membership NFTs
          if (solFanMembershipNfts.length > 0) {
            const fanMembershipsWithMetadata = await Promise.all(
              solFanMembershipNfts.map(async (nft: DasApiAsset) => {
                try {
                  const response = await fetch(nft.content.json_uri);
                  const metadata = await response.json();

                  return {
                    solNftName: nft.content.metadata.name,
                    creatorWallet: nft.ownership.owner,
                    img: metadata.image,
                    title: metadata.name || nft.content.metadata.name,
                    desc: metadata.description || "Fan Membership",
                    bountyId: "fan_membership",
                    albumId: "fan_membership",
                    isFanMembership: true,
                    tryExtractFanToken3DGifTeaser: tryExtractFanToken3DGifTeaserFromTokenImgUrl(metadata.image) || null,
                  };
                } catch (error) {
                  console.error("Error fetching metadata for fan NFT:", error);
                }
              })
            );

            // let's pull out the attributed slug and artistCampaignCode from artistLookupEverything by matching on tryExtractFanToken3DGifTeaser and fanToken3DGifTeaser from artistLookupEverything
            const fanMembershipsWithAttributedSlugAndArtistCampaignCode = fanMembershipsWithMetadata.map((fanMembership: any) => {
              if (!fanMembership?.tryExtractFanToken3DGifTeaser) {
                return fanMembership;
              }

              const matchedItem = Object.values(artistLookupEverything).find(
                (artist) => artist.fanToken3DGifTeaser === fanMembership.tryExtractFanToken3DGifTeaser
              );

              if (!matchedItem) {
                return fanMembership;
              }

              const artistSlug = matchedItem.slug;
              const artistCampaignCode = matchedItem.artistCampaignCode;
              return { ...fanMembership, slug: artistSlug, campaignCode: artistCampaignCode };
            });

            setAllOwnedFanMemberships(fanMembershipsWithAttributedSlugAndArtistCampaignCode);
          }

          console.log("_allOwnedAlbums", _allOwnedAlbums);
          console.log("solMusicAssetNfts", solMusicAssetNfts);

          if (_allOwnedAlbums.length !== solMusicAssetNfts.length) {
            setMostLikelyHaveMultipleCopiesOfTheSameAlbum(true);
          }

          setMyCollectedArtistsAlbums([...filteredArtists]);
          setAllOwnedAlbums(_allOwnedAlbums);
          setDataLoaded(true);
        })();
      } else {
        setDataLoaded(true);
      }
    }
  }, [artistAlbumDataset, solMusicAssetNfts, artistLookupEverything, solFanMembershipNfts]);

  useEffect(() => {
    if (myAlbumMintLogs.length > 0 && artistAlbumDataset.length > 0) {
      const _myStoryProtocolLicenses = myAlbumMintLogs
        .filter((log) => log.ipTokenId)
        .map((log) => ({
          ipTokenId: log.ipTokenId,
          storyProtocolLicenseMintingSQSMessageId: log.storyProtocolLicenseMintingSQSMessageId,
          storyProtocolLicenseTokenId: log.storyProtocolLicenseTokenId,
          storyProtocolLicenseMintingTxHash: log.storyProtocolLicenseMintingTxHash,
          createdOnTS: log.createdOnTS,
          updatedOnTS: log.updatedOnTS,
          mintTemplate: log.mintTemplate,
        }));

      // e.g. mintTemplate: "album-ar21_a3-1752833831760"
      // we need to extract the albumId from the mintTemplate and then get the album name and image from the albumArtistLookupData
      const _myStoryProtocolLicensesWithAlbumDetails = _myStoryProtocolLicenses.map((log) => {
        const albumId = log.mintTemplate.split("-")[1];
        const album = artistAlbumDataset
          .map((artist) => artist.albums)
          .flat()
          .find((_album: Album) => _album.albumId === albumId);
        return {
          ...log,
          albumId: albumId,
          albumName: album?.title,
          albumImage: album?.img,
        };
      });

      setMyStoryProtocolLicenses(_myStoryProtocolLicensesWithAlbumDetails);
    }
  }, [myAlbumMintLogs, artistAlbumDataset]);

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

  function tryExtractFanToken3DGifTeaserFromTokenImgUrl(imgUrl: string) {
    // imgUrl will be like this: https://gateway.lighthouse.storage/ipfs/bafybeidn4zspev7ewj3zjuaxlt6masdl4kdzt2os2lfgog6riaytfwjvy4/925_WsbFgcThabangT1.gif
    // we need to extract WsbFgcThabangT1 out of it
    // we also need to support URLs like https://gateway.lighthouse.storage/ipfs/bafybeifgfrjg6coehbibxfjirbesc4a3ex6ztxsv7jrrgwhlz3rfq6a24a/5242_img_WsbNzlRzkArohaT1.gif

    try {
      if (imgUrl.includes("img_")) {
        const match = imgUrl.match(/(\d+)_img_(.*)\.gif/);
        if (match) {
          return match[2];
        }
      } else {
        const match = imgUrl.match(/(\d+)_(.*)\.gif/);
        if (match) {
          return match[2];
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting fan token 3D gif teaser from token img url:", error);
      return null;
    }
  }

  async function handleRefreshMyStoryProtocolLicenses() {
    setIsLoadingStoryLicenses(true);

    const _albumMintLogs = await fetchMyAlbumsFromMintLogsViaAPI(addressSol!);
    updateMyAlbumMintLogs(_albumMintLogs);

    setIsLoadingStoryLicenses(false);
  }

  return (
    <div id="myCollectedAlbums" className="flex flex-col justify-center items-center w-full mt-3">
      <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
        <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            Music Collectibles
          </span>
        </div>

        {dataLoaded ? (
          <div className="flex flex-col md:flex-row w-[100%] items-start">
            <div className="flex flex-col gap-4 items-start bg-background min-h-[200px] w-[100%]">
              <>
                <div className="flex flex-col justify-center w-[100%]">
                  {isSolCoreLoading ? (
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
                          <div className="font-bold text-xl">
                            You have collected{" "}
                            <span className="text-xl bg-clip-text bg-gradient-to-r  from-yellow-300 to-orange-500 text-transparent font-bold">
                              {allOwnedAlbums.length} {allOwnedAlbums.length > 1 ? `albums` : `album`}
                            </span>
                          </div>
                          {mostLikelyHaveMultipleCopiesOfTheSameAlbum && addressSol && (
                            <p className="text-sm text-gray-300 mb-5">
                              Note: You could have multiple copies of each collectible if you had bought more and we are only showing one of each here. To view
                              all your collectibles, check your{" "}
                              <a
                                href={`https://solana.fm/address/${addressSol}/nfts?cluster=mainnet-alpha`}
                                target="_blank"
                                className="text-yellow-300 hover:underline transition-colors">
                                blockchain wallet here
                              </a>
                            </p>
                          )}
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
                                  setHomeMode={setHomeMode}
                                  checkOwnershipOfMusicAsset={checkOwnershipOfMusicAsset}
                                  openActionFireLogic={openActionFireLogic}
                                  setFeaturedArtistDeepLinkSlug={setFeaturedArtistDeepLinkSlug}
                                  viewSolData={viewSolData}
                                  onCloseMusicPlayer={onCloseMusicPlayer}
                                  navigateToDeepAppView={navigateToDeepAppView}
                                />
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-lg">
                          <span className="text-white/70 text-md">⚠️ You have not collected any albums.</span>{" "}
                          <span
                            className="text-primary cursor-pointer text-yellow-300 hover:text-[#f97316]"
                            onClick={() => {
                              // setHomeMode(`artists-${new Date().getTime()}`);

                              navigateToDeepAppView({
                                toSection: "artists",
                              });
                            }}>
                            Explore artists and albums and buy some rare music collectibles!
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center w-[100%]">
            <div className="w-full flex flex-col items-center h-[300px] md:h-[100%] md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px]">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        )}
      </div>

      {allOwnedFanMemberships.length > 0 && (
        <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
          <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full">
            <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
              Inner Circle Fan Collectibles
            </span>
          </div>

          {dataLoaded && (
            <div className="flex flex-col md:flex-row w-[100%] items-start">
              <div className="flex flex-col gap-4 items-start bg-background min-h-[200px] w-[100%]">
                <div className="flex flex-col justify-center w-[100%]">
                  {isSolCoreLoading ? (
                    <div className="m-auto w-full">
                      <div className="w-full flex flex-col items-center h-[300px] md:h-[100%] md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px]">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="my-2 font-bold text-xl mb-5 ">
                        You have{" "}
                        <span className="text-xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                          {allOwnedFanMemberships.length} {allOwnedFanMemberships.length > 1 ? `fan memberships` : `fan membership`}
                        </span>
                      </div>
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allOwnedFanMemberships.map((membership: any, index: number) => {
                          const handleClick = () => {
                            if (membership.slug) {
                              if (membership.campaignCode) {
                                navigateToDeepAppView({
                                  artistCampaignCode: membership.campaignCode,
                                  artistSlug: membership.slug,
                                });
                              } else {
                                navigateToDeepAppView({
                                  artistSlug: membership.slug,
                                  artistProfileTab: "fan",
                                });
                              }
                            } else {
                              alert("Unable to find the artists page associated with this fan membership, please navigate via the artists page from the menu");
                            }
                          };
                          return (
                            <>
                              {membership && membership.img && membership.img !== "" ? (
                                <div
                                  key={index}
                                  className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors border"
                                  onClick={handleClick}>
                                  <img src={membership.img} alt={membership.desc} className="h-48 w-48 object-cover rounded-lg mb-4" />
                                  <div className="text-center max-w-[300px]">{membership.desc}</div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
                                  <div className="text-center max-w-[300px]">⚠️ Error loading collectible data</div>
                                </div>
                              )}
                            </>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col mb-16 justify-center w-[100%] items-center xl:items-start">
        <div className="flex rounded-lg text-2xl xl:text-3xl cursor-pointer mb-5 w-full items-center justify-between">
          <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
            Commercial Licenses
          </span>
          <div
            className={`cursor-pointer flex items-center gap-2 text-sm ${isLoadingStoryLicenses ? "opacity-50" : ""}`}
            onClick={() => {
              if (!isLoadingStoryLicenses) {
                handleRefreshMyStoryProtocolLicenses();
              }
            }}>
            {isLoadingStoryLicenses ? (
              <Loader className="animate-spin text-yellow-300" size={20} />
            ) : (
              <>
                <RefreshCcw className="w-5 h-5" />
                Refresh
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row w-[100%] items-start">
          <div className="flex flex-col gap-4 items-start bg-background min-h-[200px] w-[100%]">
            <div className="flex flex-col justify-center w-[100%]">
              {isLoadingStoryLicenses ? (
                <div className="m-auto w-full">
                  <div className="w-full flex flex-col items-center h-[300px] md:h-[100%] md:grid md:grid-rows-[300px] md:auto-rows-[300px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[10px]">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="m-2 md:m-0 w-full h-full min-w-[250px] rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="my-2 font-bold text-xl mb-5">
                    {myStoryProtocolLicenses.length > 0 ? (
                      <>
                        You have purchased{" "}
                        <span className="text-xl bg-clip-text bg-gradient-to-r  from-yellow-300 to-orange-500 text-transparent font-bold">
                          {myStoryProtocolLicenses.length} {myStoryProtocolLicenses.length > 1 ? `licenses` : `license`}
                        </span>
                      </>
                    ) : (
                      <div className="text-lg">
                        <span className="text-white/70 text-md">⚠️ You have not purchased any commercial licenses yet.</span>
                        <span
                          className="ml-2 text-primary cursor-pointer text-yellow-300 hover:text-[#f97316]"
                          onClick={() => {
                            navigateToDeepAppView({
                              toSection: "albums",
                              toView: "with_ai_remix_licenses",
                            });
                          }}>
                          Click to find and buy commercial licenses from real-world artists!
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myStoryProtocolLicenses.map((license: any, index: number) => {
                      const img = license.albumImage;
                      const albumName = license.albumName;
                      return (
                        <div key={index} className="flex flex-col items-center p-4 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors border">
                          <div
                            className="w-full h-full flex items-center justify-center"
                            onClick={() => {
                              // get the artist slug from the albumId
                              const artistId = license.albumId.split("_")[0];
                              const slug = artistLookupEverything[artistId]?.slug;
                              navigateToDeepAppView({
                                artistSlug: slug,
                                albumId: license.albumId,
                              });
                            }}>
                            {img ? (
                              <img src={img} alt={albumName} className="h-48 w-48 object-cover rounded-lg mb-4" />
                            ) : (
                              <div className="h-48 w-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">No Image</div>
                            )}
                          </div>
                          <div className="text-center max-w-[300px]">{albumName}</div>

                          <StoryIPLicenseDisplay license={license} navigateToDeepAppView={navigateToDeepAppView} />
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
    </div>
  );
};
