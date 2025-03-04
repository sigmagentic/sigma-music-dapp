import { create } from "zustand";

type State = {
  radioGenres: string[];
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: boolean;
};

type Action = {
  updateRadioGenres: (genres: string[]) => void;
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) => void;
};

export const useAppStore = create<State & Action>((set) => ({
  radioGenres: [],
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: false,
  updateRadioGenres: (genres: string[]) => set(() => ({ radioGenres: genres })),
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) =>
    set(() => ({ radioGenresUpdatedByUserSinceLastRadioTracksRefresh: updated })),
}));
