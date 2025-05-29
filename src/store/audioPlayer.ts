import { create } from "zustand";

type State = {
  trackPlayIsQueued: boolean; // a track is inside an album or a playlist (I dont think this works correctly @TODO)
  assetPlayIsQueued: boolean; // an asset can be a album or a playlist
  albumIdBeingPlayed: string | undefined;
};

type Action = {
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => void;
  updateAssetPlayIsQueued: (assetPlayIsQueued: State["assetPlayIsQueued"]) => void;
  updateAlbumIdBeingPlayed: (albumIdBeingPlayed: State["albumIdBeingPlayed"]) => void;
};

export const useAudioPlayerStore = create<State & Action>((set) => ({
  trackPlayIsQueued: false,
  assetPlayIsQueued: false,
  albumIdBeingPlayed: undefined,
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => set(() => ({ trackPlayIsQueued: trackPlayIsQueued })),
  updateAssetPlayIsQueued: (assetPlayIsQueued: State["assetPlayIsQueued"]) => set(() => ({ assetPlayIsQueued: assetPlayIsQueued })),
  updateAlbumIdBeingPlayed: (albumIdBeingPlayed: State["albumIdBeingPlayed"]) => set(() => ({ albumIdBeingPlayed: albumIdBeingPlayed })),
}));
