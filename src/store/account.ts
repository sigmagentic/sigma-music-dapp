import { create } from "zustand";

type State = {
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  userWeb2AccountDetails: Record<string, any>;
};

type Action = {
  updateSolPreaccessNonce: (solPreaccessNonce: State["solPreaccessNonce"]) => void;
  updateSolSignedPreaccess: (solSignedPreaccess: State["solPreaccessSignature"]) => void;
  updateSolPreaccessTimestamp: (solPreaccessTimestamp: State["solPreaccessTimestamp"]) => void;
  updateUserWeb2AccountDetails: (userWeb2AccountDetails: State["userWeb2AccountDetails"]) => void;
};

export const useAccountStore = create<State & Action>((set) => ({
  solPreaccessNonce: "",
  solPreaccessSignature: "",
  solPreaccessTimestamp: -2,
  userWeb2AccountDetails: {},
  updateSolPreaccessNonce: (value: string) => set(() => ({ solPreaccessNonce: value })),
  updateSolSignedPreaccess: (value: string) => set(() => ({ solPreaccessSignature: value })),
  updateSolPreaccessTimestamp: (value: number) => set(() => ({ solPreaccessTimestamp: value })),
  updateUserWeb2AccountDetails: (value: Record<string, any>) => set(() => ({ userWeb2AccountDetails: value })),
}));
