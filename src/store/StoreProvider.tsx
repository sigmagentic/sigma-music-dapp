import React, { PropsWithChildren, useEffect } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { IS_DEVNET } from "appsConfig";
import { DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { viewDataWrapperSol, fetchSolNfts, getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { computeRemainingCooldown } from "libs/utils/functions";
import useSolBitzStore from "store/solBitz";
import { useAccountStore } from "./account";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();

  // ACCOUNT Store
  const { updateBitzBalance, updateCooldown, updateGivenBitzSum, updateCollectedBitzSum, updateBonusBitzSum, updateBonusTries } = useSolBitzStore();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // NFT Store
  const { solBitzNfts, solNfts, updateSolNfts, updateIsLoadingSol, updateSolBitzNfts, updateSolNFMeIdNfts } = useNftsStore();

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
    if (!publicKeySol || solNfts.length === 0) {
      return;
    }

    (async () => {
      updateIsLoadingSol(true);

      // get users bitz data nfts
      const _bitzDataNfts: DasApiAsset[] = IS_DEVNET
        ? solNfts.filter((nft) => nft.content.metadata.name.includes("XP"))
        : solNfts.filter((nft) => nft.content.metadata.name.includes("IXPG")); // @TODO, what is the user has multiple BiTz? IXPG2 was from drip and IXPG3 will be from us direct via the airdrop

      const _nfMeIdNfts: DasApiAsset[] = solNfts.filter((nft) => nft.content.metadata.name.includes("NFMeID"));

      // console.log("_bitzDataNfts", _bitzDataNfts);
      // console.log("_bitzDataNfts[0]", JSON.stringify(_bitzDataNfts[0]));

      // if (walletType === "web3auth" && _bitzDataNfts.length === 0) {
      //   // user has no, so we create the place holder one for them
      //   const _placeHolderBitzDataNft: any = {
      //     id: addressSol,
      //     grouping: [
      //       {
      //         group_key: "collection",
      //         group_value: "tbm-c1",
      //       },
      //     ],
      //   };

      //   _bitzDataNfts.push(_placeHolderBitzDataNft);
      // }

      updateSolBitzNfts(_bitzDataNfts);
      updateSolNFMeIdNfts(_nfMeIdNfts);

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
  }, [publicKeySol, solBitzNfts, solPreaccessNonce, solPreaccessSignature]);

  // In your component or hook where you need to sign messages
  // const signMessageViaWeb3Auth = async (message: Uint8Array) => {
  //   // Convert Uint8Array to base58 string for Web3Auth
  //   const messageString = bs58.encode(message);

  //   let signedMessage = await web3auth?.provider?.request({
  //     method: "solanaSignMessage",
  //     params: ["test message"],
  //   });

  //   return signedMessage;
  // };

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
