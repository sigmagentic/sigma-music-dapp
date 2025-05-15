import React, { PropsWithChildren, useEffect } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { IS_DEVNET } from "appsConfig";
import { DEFAULT_BITZ_COLLECTION_SOL, DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { viewDataWrapperSol, fetchSolNfts, getOrCacheAccessNonceAndSignature, sigmaWeb2XpSystem } from "libs/sol/SolViewData";
import { AlbumTrackCatalog } from "libs/types";
import { computeRemainingCooldown } from "libs/utils/functions";
import { getAlbumTrackCatalogData, getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import useSolBitzStore from "store/solBitz";
import { useAccountStore } from "./account";
import { useAppStore } from "./app";
import { useNftsStore } from "./nfts";
import { fetchMintsLeaderboardByMonth } from "libs/utils/misc";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();

  // ACCOUNT Store
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
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // NFT Store
  const { solBitzNfts, solNfts, updateSolNfts, updateIsLoadingSol, updateSolBitzNfts, updateSolNFMeIdNfts } = useNftsStore();

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

  // SOL Logged in - bootstrap nft store
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

    if (publicKeySol) {
      getAllUsersSolNftsAndRefreshSignatureSession();
    }
  }, [publicKeySol]);

  // SOL: if someone updates data nfts (i.e. at the start when app loads and we get nfts OR they get a free mint during app session), we go over them and find bitz nfts etc
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

      updateSolBitzNfts(_bitzDataNfts);
      updateSolNFMeIdNfts(_nfMeIdNfts);

      updateIsLoadingSol(false);
    })();
  }, [publicKeySol, solNfts]);

  // SOL - Bitz Bootstrap
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
