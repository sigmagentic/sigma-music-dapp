import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { create } from "zustand";

type State = {
  mvxNfts: DataNft[];
  isLoadingMvx: boolean;
  solNfts: DasApiAsset[];
  solBitzNfts: DasApiAsset[];
  isSolCoreLoading: boolean;
  solNFMeIdNfts: DasApiAsset[];
  solMusicAssetNfts: DasApiAsset[];
  solFanMembershipNfts: DasApiAsset[];
};

type Action = {
  updateMvxNfts: (bitzBalance: State["mvxNfts"]) => void;
  updateIsLoadingMvx: (isLoading: boolean) => void;
  updateSolNfts: (solNfts: State["solNfts"]) => void;
  updateSolBitzNfts: (solBitzNfts: State["solBitzNfts"]) => void;
  updateIsSolCoreLoading: (isLoading: boolean) => void;
  updateSolNFMeIdNfts: (nfts: DasApiAsset[]) => void;
  updateSolMusicAssetNfts: (nfts: DasApiAsset[]) => void;
  updateSolFanMembershipNfts: (nfts: DasApiAsset[]) => void;
};

export const useNftsStore = create<State & Action>((set) => ({
  mvxNfts: [],
  isLoadingMvx: false,
  solNfts: [],
  solBitzNfts: [],
  isSolCoreLoading: true, // always starts with true (as it's loading valid and usable solana sesion -- i.e only used in app for logged in best case session detection)
  solNFMeIdNfts: [],
  solMusicAssetNfts: [],
  solFanMembershipNfts: [],
  updateMvxNfts: (value: DataNft[]) => set(() => ({ mvxNfts: value })),
  updateIsLoadingMvx: (value: boolean) => set(() => ({ isLoadingMvx: value })),
  updateSolNfts: (value: DasApiAsset[]) => set(() => ({ solNfts: value })),
  updateSolBitzNfts: (value: DasApiAsset[]) => set(() => ({ solBitzNfts: value })),
  updateIsSolCoreLoading: (value: boolean) => set(() => ({ isSolCoreLoading: value })),
  updateSolNFMeIdNfts: (nfts: DasApiAsset[]) => set(() => ({ solNFMeIdNfts: nfts })),
  updateSolMusicAssetNfts: (nfts: DasApiAsset[]) => set(() => ({ solMusicAssetNfts: nfts })),
  updateSolFanMembershipNfts: (nfts: DasApiAsset[]) => set(() => ({ solFanMembershipNfts: nfts })),
}));
