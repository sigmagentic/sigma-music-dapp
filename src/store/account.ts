import { create } from "zustand";
import { MusicAssetOwned, PaymentLog } from "libs/types";

type State = {
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  userWeb2AccountDetails: Record<string, any>;
  myRawPaymentLogs: PaymentLog[]; // anywhere in the app we can refresh the raw payment logs via an API call and the StoreProvider effect will take this and update the myPaymentLogs and myMusicAssetPurchases
  myPaymentLogs: PaymentLog[];
  myMusicAssetPurchases: MusicAssetOwned[];
};

type Action = {
  updateSolPreaccessNonce: (solPreaccessNonce: State["solPreaccessNonce"]) => void;
  updateSolSignedPreaccess: (solSignedPreaccess: State["solPreaccessSignature"]) => void;
  updateSolPreaccessTimestamp: (solPreaccessTimestamp: State["solPreaccessTimestamp"]) => void;
  updateUserWeb2AccountDetails: (userWeb2AccountDetails: State["userWeb2AccountDetails"]) => void;
  updateMyPaymentLogs: (myPaymentLogs: State["myPaymentLogs"]) => void;
  updateMyRawPaymentLogs: (myRawPaymentLogs: State["myRawPaymentLogs"]) => void;
  updateMyMusicAssetPurchases: (myMusicAssetPurchases: State["myMusicAssetPurchases"]) => void;
};

export const useAccountStore = create<State & Action>((set) => ({
  solPreaccessNonce: "",
  solPreaccessSignature: "",
  solPreaccessTimestamp: -2,
  userWeb2AccountDetails: {},
  myRawPaymentLogs: [],
  myPaymentLogs: [],
  myMusicAssetPurchases: [],
  updateSolPreaccessNonce: (value: string) => set(() => ({ solPreaccessNonce: value })),
  updateSolSignedPreaccess: (value: string) => set(() => ({ solPreaccessSignature: value })),
  updateSolPreaccessTimestamp: (value: number) => set(() => ({ solPreaccessTimestamp: value })),
  updateUserWeb2AccountDetails: (value: Record<string, any>) => set(() => ({ userWeb2AccountDetails: value })),
  updateMyPaymentLogs: (value: PaymentLog[]) => set(() => ({ myPaymentLogs: value })),
  updateMyRawPaymentLogs: (value: PaymentLog[]) => set(() => ({ myRawPaymentLogs: value })),
  updateMyMusicAssetPurchases: (value: MusicAssetOwned[]) => set(() => ({ myMusicAssetPurchases: value })),
}));
