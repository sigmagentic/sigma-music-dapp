import { create } from "zustand";
import { AlbumWithArtist } from "libs/types";

type State = {
  radioGenres: string[];
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: boolean;
  albumMasterLookup: Record<string, AlbumWithArtist>;
};

type Action = {
  updateRadioGenres: (genres: string[]) => void;
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) => void;
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => void;
};

export const useAppStore = create<State & Action>((set) => ({
  radioGenres: [],
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: false,
  albumMasterLookup: {},
  updateRadioGenres: (genres: string[]) => set(() => ({ radioGenres: genres })),
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) =>
    set(() => ({ radioGenresUpdatedByUserSinceLastRadioTracksRefresh: updated })),
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => set(() => ({ albumMasterLookup })),
}));
