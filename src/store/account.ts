import { create } from "zustand";
import { AiRemixRawTrack, MusicAssetOwned, MyAlbumMintLog, PaymentLog } from "libs/types";

type State = {
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  userWeb2AccountDetails: Record<string, any>;
  myRawPaymentLogs: PaymentLog[]; // anywhere in the app we can refresh the raw payment logs via an API call and the StoreProvider effect will take this and update the myPaymentLogs and myMusicAssetPurchases
  myPaymentLogs: PaymentLog[];
  myMusicAssetPurchases: MusicAssetOwned[];
  myAlbumMintLogs: MyAlbumMintLog[];
  myAiRemixRawTracks: AiRemixRawTrack[];
};

type Action = {
  updateSolPreaccessNonce: (solPreaccessNonce: State["solPreaccessNonce"]) => void;
  updateSolSignedPreaccess: (solSignedPreaccess: State["solPreaccessSignature"]) => void;
  updateSolPreaccessTimestamp: (solPreaccessTimestamp: State["solPreaccessTimestamp"]) => void;
  updateUserWeb2AccountDetails: (userWeb2AccountDetails: State["userWeb2AccountDetails"]) => void;
  updateMyPaymentLogs: (myPaymentLogs: State["myPaymentLogs"]) => void;
  updateMyRawPaymentLogs: (myRawPaymentLogs: State["myRawPaymentLogs"]) => void;
  updateMyMusicAssetPurchases: (myMusicAssetPurchases: State["myMusicAssetPurchases"]) => void;
  updateMyAlbumMintLogs: (myAlbumMintLogs: State["myAlbumMintLogs"]) => void;
  updateMyAiRemixRawTracks: (myAiRemixRawTracks: State["myAiRemixRawTracks"]) => void;
};

export const useAccountStore = create<State & Action>((set) => ({
  solPreaccessNonce: "",
  solPreaccessSignature: "",
  solPreaccessTimestamp: -2,
  userWeb2AccountDetails: {},
  myRawPaymentLogs: [],
  myPaymentLogs: [],
  myMusicAssetPurchases: [],
  myAlbumMintLogs: [],
  myAiRemixRawTracks: [],
  updateSolPreaccessNonce: (value: string) => set(() => ({ solPreaccessNonce: value })),
  updateSolSignedPreaccess: (value: string) => set(() => ({ solPreaccessSignature: value })),
  updateSolPreaccessTimestamp: (value: number) => set(() => ({ solPreaccessTimestamp: value })),
  updateUserWeb2AccountDetails: (value: Record<string, any>) => set(() => ({ userWeb2AccountDetails: value })),
  updateMyPaymentLogs: (value: PaymentLog[]) => set(() => ({ myPaymentLogs: value })),
  updateMyRawPaymentLogs: (value: PaymentLog[]) => set(() => ({ myRawPaymentLogs: value })),
  updateMyMusicAssetPurchases: (value: MusicAssetOwned[]) => set(() => ({ myMusicAssetPurchases: value })),
  updateMyAlbumMintLogs: (value: MyAlbumMintLog[]) => set(() => ({ myAlbumMintLogs: value })),
  updateMyAiRemixRawTracks: (value: AiRemixRawTrack[]) => set(() => ({ myAiRemixRawTracks: value })),
}));
