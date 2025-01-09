import React, { PropsWithChildren, useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { IS_DEVNET } from "appsConfig";
import { DISABLE_BITZ_FEATURES } from "config";
import { viewDataWrapperSol, fetchSolNfts, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { computeRemainingCooldown } from "libs/utils/functions";
import useSolBitzStore from "store/solBitz";
import { useAccountStore } from "./account";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { publicKey: publicKeySol, signMessage } = useWallet();
  const addressSol = publicKeySol?.toBase58();

  // ACCOUNT Store
  const {
    updateBitzBalance: updateBitzBalanceSol,
    updateCooldown: updateCooldownSol,
    updateGivenBitzSum: updateGivenBitzSumSol,
    updateCollectedBitzSum: updateCollectedBitzSumSol,
    updateBonusBitzSum: updateBonusBitzSumSol,
    updateBonusTries: updateBonusTriesSol,
  } = useSolBitzStore();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // NFT Store
  const { solBitzNfts, solNfts, updateSolNfts, updateIsLoadingSol, updateSolBitzNfts } = useNftsStore();

  // SOL Logged in - bootstrap nft store
  useEffect(() => {
    async function getAllUsersSolNftsAndRefreshSignatureSession() {
      updateIsLoadingSol(true);

      // the user might have just logged in or swapped wallets via phantom, so we force refresh the signature session so it's accurate
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
    if (!publicKeySol || solNfts.length === 0) {
      return;
    }

    (async () => {
      updateIsLoadingSol(true);

      // get users bitz data nfts
      const _bitzDataNfts: DasApiAsset[] = IS_DEVNET
        ? solNfts.filter((nft) => nft.content.metadata.name.includes("XP"))
        : solNfts.filter((nft) => nft.content.metadata.name.includes("IXPG")); // @TODO, what is the user has multiple BiTz? IXPG2 was from drip and IXPG3 will be from us direct via the airdrop

      updateSolBitzNfts(_bitzDataNfts);

      updateIsLoadingSol(false);
    })();
  }, [publicKeySol, solNfts]);

  // SOL - Bitz Bootstrap
  useEffect(() => {
    (async () => {
      if (DISABLE_BITZ_FEATURES) {
        return;
      }

      resetBitzValsToLoadingSOL();

      if (solBitzNfts.length > 0 && solPreaccessNonce !== "" && solPreaccessSignature !== "" && publicKeySol) {
        const viewDataArgs = {
          headers: {
            "dmf-custom-only-state": "1",
            "dmf-custom-sol-collection-id": solBitzNfts[0].grouping[0].group_value,
          },
          fwdHeaderKeys: ["dmf-custom-only-state", "dmf-custom-sol-collection-id"],
        };

        const getBitzGameResult = await viewDataWrapperSol(publicKeySol!, solPreaccessNonce, solPreaccessSignature, viewDataArgs, solBitzNfts[0].id);

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

          updateBitzBalanceSol(bitzBeforePlay + sumBonusBitz - sumGivenBits); // collected bits - given bits
          updateGivenBitzSumSol(sumGivenBits); // given bits -- for power-ups
          updateBonusBitzSumSol(sumBonusBitz);

          updateCooldownSol(
            computeRemainingCooldown(
              getBitzGameResult.data.gamePlayResult.lastPlayedBeforeThisPlay,
              getBitzGameResult.data.gamePlayResult.configCanPlayEveryMSecs
            )
          );

          updateCollectedBitzSumSol(getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay); // collected bits by playing
          updateBonusTriesSol(getBitzGameResult.data.gamePlayResult.bonusTriesBeforeThisPlay || 0); // bonus tries awarded to user (currently only via referral code rewards)
        }
      } else {
        resetBitzValsToZeroSOL();
      }
    })();
  }, [publicKeySol, solBitzNfts, solPreaccessNonce, solPreaccessSignature]);

  function resetBitzValsToZeroSOL() {
    updateBitzBalanceSol(-1);
    updateGivenBitzSumSol(-1);
    updateCooldownSol(-1);
    updateCollectedBitzSumSol(-1);
    updateBonusBitzSumSol(-1);
  }

  function resetBitzValsToLoadingSOL() {
    updateBitzBalanceSol(-2);
    updateGivenBitzSumSol(-2);
    updateCooldownSol(-2);
    updateCollectedBitzSumSol(-2);
    updateBonusBitzSumSol(-2);
  }

  async function cacheSolSignatureSession() {
    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage,
      publicKey: publicKeySol,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
      forceNewSession: true,
    });
  }

  return <>{children}</>;
};
