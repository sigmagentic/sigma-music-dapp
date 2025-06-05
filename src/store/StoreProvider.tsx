import React, { PropsWithChildren, useEffect } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { IS_DEVNET } from "appsConfig";
import { DEFAULT_BITZ_COLLECTION_SOL, DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { viewDataWrapperSol, fetchSolNfts, getOrCacheAccessNonceAndSignature, sigmaWeb2XpSystem } from "libs/sol/SolViewData";
import { AlbumTrackCatalog, MusicAssetOwned } from "libs/types";
import { computeRemainingCooldown } from "libs/utils/functions";
import { fetchMintsLeaderboardByMonth, getLoggedInUserProfileAPI, getPaymentLogsViaAPI } from "libs/utils/misc";
import { getAlbumTrackCatalogData, getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import useSolBitzStore from "store/solBitz";
import { useAccountStore } from "./account";
import { useAppStore } from "./app";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();

  // Stores
  const {
    updateBitzBalance,
    updateCooldown,
    updateGivenBitzSum,
    updateCollectedBitzSum,
    updateBonusBitzSum,
    updateBonusTries,
    updateIsSigmaWeb2XpSystem,
    isSigmaWeb2XpSystem,
  } = useSolBitzStore();
  const {
    solPreaccessNonce,
    solPreaccessSignature,
    solPreaccessTimestamp,
    myRawPaymentLogs,
    userWeb2AccountDetails,
    updateSolPreaccessNonce,
    updateSolPreaccessTimestamp,
    updateSolSignedPreaccess,
    updateMyPaymentLogs,
    updateMyMusicAssetPurchases,
    updateMyRawPaymentLogs,
    updateUserWeb2AccountDetails,
  } = useAccountStore();
  const {
    solBitzNfts,
    solNfts,
    updateSolNfts,
    updateIsLoadingSol,
    updateSolBitzNfts,
    updateSolNFMeIdNfts,
    updateSolMusicAssetNfts,
    updateSolFanMembershipNfts,
  } = useNftsStore();

  // Store lookup etc the app needed regardless on if it the use is logged in or not
  const {
    updateMusicTrackLookup,
    musicTrackLookup,
    updateArtistLookup,
    artistLookup,
    updateAlbumLookup,
    updateArtistLookupOrganizedBySections,
    updateArtistLookupEverything,
    updateMintsLeaderboard,
    mintsLeaderboard,
    artistLookupEverything,
  } = useAppStore();

  useEffect(() => {
    (async () => {
      // we only need to get this once per app session
      if (Object.keys(musicTrackLookup).length === 0) {
        const albumTrackCatalogData = await getAlbumTrackCatalogData();
        updateMusicTrackLookup(albumTrackCatalogData as unknown as AlbumTrackCatalog);
      }

      if (Object.keys(artistLookup).length === 0) {
        const { albumArtistLookupData, albumArtistLookupDataEverything, albumArtistLookupDataOrganizedBySections } = await getArtistsAlbumsData();

        // Create artist lookup
        const artistLookupMap = albumArtistLookupData.reduce(
          (acc, artist) => {
            acc[artist.artistId] = artist;
            return acc;
          },
          {} as Record<string, any>
        );

        // Create album lookup
        const albumLookupMap = albumArtistLookupData.reduce(
          (acc, artist) => {
            artist.albums.forEach((album: any) => {
              acc[album.albumId] = album;
            });
            return acc;
          },
          {} as Record<string, any>
        );

        const artistLookupEverythingMap = albumArtistLookupDataEverything.reduce(
          (acc, artist) => {
            acc[artist.artistId] = artist;
            return acc;
          },
          {} as Record<string, any>
        );

        updateArtistLookup(artistLookupMap);
        updateAlbumLookup(albumLookupMap);
        updateArtistLookupOrganizedBySections(albumArtistLookupDataOrganizedBySections);
        updateArtistLookupEverything(artistLookupEverythingMap);
      }

      // lets so this here as it's used in many places in our app
      if (mintsLeaderboard.length === 0) {
        const _mintsLeaderboard = await fetchMintsLeaderboardByMonth("0_0");
        updateMintsLeaderboard(_mintsLeaderboard);
      }
    })();
  }, []);

  // Logged in - bootstrap nft store and other account data
  useEffect(() => {
    async function getAllUsersSolNftsAndRefreshSignatureSession() {
      updateIsLoadingSol(true);

      // the user might have just logged in or swapped wallets via phantom, so we force refresh the signature session so it's accurate
      // Note that this is the where the 1st time the signature session is cached (i.e. sign message after login)
      await cacheSolSignatureSession();

      if (!addressSol) {
        updateSolNfts([]);
      } else {
        const _allDataNfts = await fetchSolNfts(addressSol);

        updateSolNfts(_allDataNfts);
      }

      updateIsLoadingSol(false);
    }

    async function getAllPaymentLogs() {
      const _paymentLogs = await getPaymentLogsViaAPI({ addressSol: addressSol! });
      updateMyRawPaymentLogs(_paymentLogs);
    }

    if (publicKeySol) {
      getAllUsersSolNftsAndRefreshSignatureSession();
      getAllPaymentLogs();
    }
  }, [publicKeySol]);

  useEffect(() => {
    if (publicKeySol && publicKeySol !== null && solPreaccessNonce !== "" && solPreaccessSignature !== "" && Object.keys(userWeb2AccountDetails).length === 0) {
      (async () => {
        console.log("XXXXXXXXXXX -- user refreshed the page, we need to rehydrate any web2 details");

        const _userProfileData = await getLoggedInUserProfileAPI({
          solSignature: solPreaccessSignature,
          signatureNonce: solPreaccessNonce,
          addr: publicKeySol.toBase58(),
        });

        if (!_userProfileData.error) {
          updateUserWeb2AccountDetails(_userProfileData);
        } else {
          console.error("StoreProvider: error getting user profile data");
          console.error(_userProfileData);
        }
      })();
    }
  }, [publicKeySol, solPreaccessNonce, solPreaccessSignature, userWeb2AccountDetails]);

  // if someone updates data nfts (i.e. at the start when app loads and we get nfts OR they get a free mint during app session), we go over them and find bitz nfts etc
  useEffect(() => {
    if (!publicKeySol) {
      return;
    }

    (async () => {
      updateIsLoadingSol(true);

      // get users bitz data nfts
      const _bitzDataNfts: DasApiAsset[] = IS_DEVNET
        ? solNfts.filter((nft) => nft.content.metadata.name.includes("XP"))
        : solNfts.filter((nft) => nft.content.metadata.name.includes("IXPG")); // @TODO, what is the user has multiple BiTz? IXPG2 was from drip and IXPG3 will be from us direct via the airdrop

      const _nfMeIdNfts: DasApiAsset[] = solNfts.filter((nft) => nft.content.metadata.name.includes("NFMeID"));

      const _musicAssetNfts: DasApiAsset[] = solNfts.filter((nft: DasApiAsset) => {
        if (nft.content.metadata.name.includes("MUS") || nft.content.metadata.name.includes("POD")) {
          return true;
        } else {
          return false;
        }
      });

      const _fanMembershipNfts: DasApiAsset[] = solNfts.filter((nft) => nft.content.metadata.name.includes("FAN"));

      if (_bitzDataNfts.length === 0) {
        // user has no, so we create the place holder one for them
        const _placeHolderBitzDataNft: any = {
          id: "tbm-t1-ignored",
          grouping: [
            {
              group_key: "collection",
              group_value: DEFAULT_BITZ_COLLECTION_SOL,
            },
          ],
        };

        _bitzDataNfts.push(_placeHolderBitzDataNft);
        updateIsSigmaWeb2XpSystem(1);
      } else {
        updateIsSigmaWeb2XpSystem(0);
      }

      // our collection of nfts for this app, this will keep updating as user buys more nfts and we refresh the solNfts master list
      updateSolBitzNfts(_bitzDataNfts);
      updateSolNFMeIdNfts(_nfMeIdNfts);
      updateSolMusicAssetNfts(_musicAssetNfts);
      updateSolFanMembershipNfts(_fanMembershipNfts);

      updateIsLoadingSol(false);
    })();
  }, [publicKeySol, solNfts]);

  // used raw payment logs to get music asset purchases
  useEffect(() => {
    // if we have got the myRawPaymentLogs or updated it after a purchase in the app session, then lets filter it by paymentStatus === success
    // and then find items with type buyAlbum and put that in a new list in useAccountStore called myMusicAssetPurchases
    if (myRawPaymentLogs.length > 0 && Object.keys(artistLookupEverything).length > 0) {
      // add data like artistSlug, artistName, albumName to the myRawPaymentLogs
      const _augmentedMyRawPaymentLogs = myRawPaymentLogs.map((log) => {
        if (log.artistId) {
          const artist = artistLookupEverything[log.artistId];
          if (artist) {
            log._artistSlug = artist.slug;
            log._artistName = artist.name;
          }
        } else if (log.albumId) {
          const artist = artistLookupEverything[log.albumId.split("_")[0]];
          if (artist) {
            log._artistSlug = artist.slug;
            log._artistName = artist.name;

            artist.albums.forEach((album: any) => {
              if (album.albumId === log.albumId) {
                log._albumName = album.title;
              }
            });
          }
        }
        return log;
      });

      const _myMusicAssetPurchases: MusicAssetOwned[] = _augmentedMyRawPaymentLogs
        .filter((log) => log.paymentStatus === "success" && log.task === "buyAlbum")
        .map((log) => ({
          purchasedOn: log.createdOn,
          tx: log.tx,
          albumSaleTypeOption: log.albumSaleTypeOption,
          albumId: log.albumId,
          type: "sol",
          artistId: log.artistId,
          membershipId: log.membershipId,
          _artistSlug: log._artistSlug,
          _artistName: log._artistName,
          _albumName: log._albumName,
        }));

      updateMyPaymentLogs(_augmentedMyRawPaymentLogs);
      updateMyMusicAssetPurchases(_myMusicAssetPurchases);
    }
  }, [myRawPaymentLogs, artistLookupEverything, publicKeySol]);

  // NFT based XP Bootstrap
  useEffect(() => {
    (async () => {
      if (DISABLE_BITZ_FEATURES || isSigmaWeb2XpSystem === -2 || !publicKeySol) {
        return;
      }

      resetBitzValsToLoadingSOL();

      if (solPreaccessNonce !== "" && solPreaccessSignature !== "" && publicKeySol && (solBitzNfts.length > 0 || isSigmaWeb2XpSystem === 1)) {
        const viewDataArgs = {
          headers: {
            "dmf-custom-only-state": "1",
            "dmf-custom-sol-collection-id": solBitzNfts[0].grouping[0].group_value,
          },
          fwdHeaderKeys: ["dmf-custom-only-state", "dmf-custom-sol-collection-id"],
        };

        let getBitzGameResult = null;

        if (isSigmaWeb2XpSystem === 1) {
          getBitzGameResult = await sigmaWeb2XpSystem(publicKeySol!, solPreaccessNonce, solPreaccessSignature, viewDataArgs, solBitzNfts[0].id);
        } else {
          getBitzGameResult = await viewDataWrapperSol(publicKeySol!, solPreaccessNonce, solPreaccessSignature, viewDataArgs, solBitzNfts[0].id);
        }

        if (getBitzGameResult) {
          let bitzBeforePlay = getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay || 0;
          let sumGivenBits = getBitzGameResult.data?.bitsMain?.bitsGivenSum || 0;
          let sumBonusBitz = getBitzGameResult.data?.bitsMain?.bitsBonusSum || 0;

          // some values can be -1 during first play or other situations, so we make it 0 or else we get weird numbers like 1 for the some coming up
          if (bitzBeforePlay < 0) {
            bitzBeforePlay = 0;
          }

          if (sumGivenBits < 0) {
            sumGivenBits = 0;
          }

          if (sumBonusBitz < 0) {
            sumBonusBitz = 0;
          }

          updateBitzBalance(bitzBeforePlay + sumBonusBitz - sumGivenBits); // collected bits - given bits
          updateGivenBitzSum(sumGivenBits); // given bits -- for power-ups
          updateBonusBitzSum(sumBonusBitz);

          updateCooldown(
            computeRemainingCooldown(
              getBitzGameResult.data.gamePlayResult.lastPlayedBeforeThisPlay,
              getBitzGameResult.data.gamePlayResult.configCanPlayEveryMSecs
            )
          );

          updateCollectedBitzSum(getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay); // collected bits by playing
          updateBonusTries(getBitzGameResult.data.gamePlayResult.bonusTriesBeforeThisPlay || 0); // bonus tries awarded to user (currently only via referral code rewards)
        }
      } else {
        resetBitzValsToZeroSOL();
      }
    })();
  }, [publicKeySol, solBitzNfts, solPreaccessNonce, solPreaccessSignature, isSigmaWeb2XpSystem]);

  function resetBitzValsToZeroSOL() {
    updateBitzBalance(-1);
    updateGivenBitzSum(-1);
    updateCooldown(-1);
    updateCollectedBitzSum(-1);
    updateBonusBitzSum(-1);
  }

  function resetBitzValsToLoadingSOL() {
    updateBitzBalance(-2);
    updateGivenBitzSum(-2);
    updateCooldown(-2);
    updateCollectedBitzSum(-2);
    updateBonusBitzSum(-2);
  }

  async function cacheSolSignatureSession() {
    await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
      publicKey: publicKeySol,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
      forceNewSession: true,
    });
  }

  return <>{children}</>;
};
