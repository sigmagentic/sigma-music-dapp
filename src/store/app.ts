import { create } from "zustand";
import { AlbumWithArtist, AlbumTrackCatalog } from "libs/types";

type State = {
  radioGenres: string[];
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: boolean;
  albumMasterLookup: Record<string, AlbumWithArtist>;
  paymentInProgress: boolean;
  musicTrackLookup: AlbumTrackCatalog;
  artistLookup: Record<string, any>;
  albumLookup: Record<string, any>;
  artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>;
};

type Action = {
  updateRadioGenres: (genres: string[]) => void;
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) => void;
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => void;
  updatePaymentInProgress: (paymentInProgress: boolean) => void;
  updateMusicTrackLookup: (musicTrackLookup: AlbumTrackCatalog) => void;
  updateArtistLookup: (artistLookup: Record<string, any>) => void;
  updateAlbumLookup: (albumLookup: Record<string, any>) => void;
  updateArtistLookupOrganizedBySections: (artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>) => void;
};

export const useAppStore = create<State & Action>((set) => ({
  radioGenres: [],
  radioGenresUpdatedByUserSinceLastRadioTracksRefresh: false,
  albumMasterLookup: {},
  paymentInProgress: false,
  musicTrackLookup: {},
  artistLookup: {},
  albumLookup: {},
  artistLookupOrganizedBySections: {},
  updateRadioGenres: (genres: string[]) => set(() => ({ radioGenres: genres })),
  updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh: (updated: boolean) =>
    set(() => ({ radioGenresUpdatedByUserSinceLastRadioTracksRefresh: updated })),
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => set(() => ({ albumMasterLookup })),
  updatePaymentInProgress: (paymentInProgress: boolean) => set(() => ({ paymentInProgress })),
  updateMusicTrackLookup: (musicTrackLookup: AlbumTrackCatalog) => set(() => ({ musicTrackLookup })),
  updateArtistLookup: (artistLookup: Record<string, any>) => set(() => ({ artistLookup })),
  updateAlbumLookup: (albumLookup: Record<string, any>) => set(() => ({ albumLookup })),
  updateArtistLookupOrganizedBySections: (artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>) =>
    set(() => ({ artistLookupOrganizedBySections })),
}));
