import { create } from "zustand";
import { AlbumWithArtist, AlbumTrackCatalog, MintLeaderboard } from "libs/types";

type State = {
  albumMasterLookup: Record<string, AlbumWithArtist>;
  paymentInProgress: boolean;
  musicTrackLookup: AlbumTrackCatalog;
  artistLookup: Record<string, any>;
  artistLookupEverything: Record<string, any>;
  albumLookup: Record<string, any>;
  artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>;
  tileDataCollectionLoadingInProgress: boolean;
  mintsLeaderboard: MintLeaderboard[];
};

type Action = {
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => void;
  updatePaymentInProgress: (paymentInProgress: boolean) => void;
  updateMusicTrackLookup: (musicTrackLookup: AlbumTrackCatalog) => void;
  updateArtistLookup: (artistLookup: Record<string, any>) => void;
  updateArtistLookupEverything: (artistLookupEverything: Record<string, any>) => void;
  updateAlbumLookup: (albumLookup: Record<string, any>) => void;
  updateArtistLookupOrganizedBySections: (artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>) => void;
  updateTileDataCollectionLoadingInProgress: (tileDataCollectionLoadingInProgress: boolean) => void;
  updateMintsLeaderboard: (mintsLeaderboard: MintLeaderboard[]) => void;
};

export const useAppStore = create<State & Action>((set) => ({
  albumMasterLookup: {},
  paymentInProgress: false,
  musicTrackLookup: {},
  artistLookup: {},
  artistLookupEverything: {},
  albumLookup: {},
  artistLookupOrganizedBySections: {},
  tileDataCollectionLoadingInProgress: false,
  mintsLeaderboard: [],
  updateAlbumMasterLookup: (albumMasterLookup: Record<string, AlbumWithArtist>) => set(() => ({ albumMasterLookup })),
  updatePaymentInProgress: (paymentInProgress: boolean) => set(() => ({ paymentInProgress })),
  updateMusicTrackLookup: (musicTrackLookup: AlbumTrackCatalog) => set(() => ({ musicTrackLookup })),
  updateArtistLookup: (artistLookup: Record<string, any>) => set(() => ({ artistLookup })),
  updateArtistLookupEverything: (artistLookupEverything: Record<string, any>) => set(() => ({ artistLookupEverything })),
  updateAlbumLookup: (albumLookup: Record<string, any>) => set(() => ({ albumLookup })),
  updateArtistLookupOrganizedBySections: (artistLookupOrganizedBySections: Record<string, { sectionCode: string; filteredItems: any[] }>) =>
    set(() => ({ artistLookupOrganizedBySections })),
  updateTileDataCollectionLoadingInProgress: (tileDataCollectionLoadingInProgress: boolean) => set(() => ({ tileDataCollectionLoadingInProgress })),
  updateMintsLeaderboard: (mintsLeaderboard: MintLeaderboard[]) => set(() => ({ mintsLeaderboard })),
}));
