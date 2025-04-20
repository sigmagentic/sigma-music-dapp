import create from "zustand";

interface SolBitzStore {
  bitzBalance: number;
  cooldown: number;
  givenBitzSum: number;
  collectedBitzSum: number;
  bonusBitzSum: number;
  bonusTries: number;
  isSigmaWeb2XpSystem: number; // -2 is loadding, 1 is true, 0 is false
  updateBitzBalance: (bitzBalance: SolBitzStore["bitzBalance"]) => void;
  updateCooldown: (cooldown: SolBitzStore["cooldown"]) => void;
  updateGivenBitzSum: (givenBitzSum: SolBitzStore["givenBitzSum"]) => void;
  updateCollectedBitzSum: (collectedBitzSum: SolBitzStore["collectedBitzSum"]) => void;
  updateBonusBitzSum: (bonusBitzSum: SolBitzStore["bonusBitzSum"]) => void;
  updateBonusTries: (bonusTries: SolBitzStore["bonusTries"]) => void;
  updateIsSigmaWeb2XpSystem: (isSigmaWeb2XpSystem: SolBitzStore["isSigmaWeb2XpSystem"]) => void;
}

const useSolBitzStore = create<SolBitzStore>((set, _get) => ({
  bitzBalance: -2,
  cooldown: -2,
  givenBitzSum: -2,
  collectedBitzSum: -2,
  bonusBitzSum: -2,
  bonusTries: -2,
  isSigmaWeb2XpSystem: -2,
  updateBitzBalance: (value: number) => set(() => ({ bitzBalance: value })),
  updateCooldown: (value: number) => set(() => ({ cooldown: value })),
  updateGivenBitzSum: (value: number) => set(() => ({ givenBitzSum: value })),
  updateCollectedBitzSum: (value: number) => set(() => ({ collectedBitzSum: value })),
  updateBonusBitzSum: (value: number) => set(() => ({ bonusBitzSum: value })),
  updateBonusTries: (value: number) => set(() => ({ bonusTries: value })),
  updateIsSigmaWeb2XpSystem: (value: number) => set(() => ({ isSigmaWeb2XpSystem: value })),
}));

export default useSolBitzStore;
