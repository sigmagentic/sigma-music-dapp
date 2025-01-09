import { create } from "zustand";

type State = {
  trackPlayIsQueued: boolean;
  albumPlayIsQueued: boolean;
};

type Action = {
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => void;
  updateAlbumPlayIsQueued: (albumPlayIsQueued: State["albumPlayIsQueued"]) => void;
};

export const useAudioPlayerStore = create<State & Action>((set) => ({
  trackPlayIsQueued: false,
  albumPlayIsQueued: false,
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => set(() => ({ trackPlayIsQueued: trackPlayIsQueued })),
  updateAlbumPlayIsQueued: (albumPlayIsQueued: State["albumPlayIsQueued"]) => set(() => ({ albumPlayIsQueued: albumPlayIsQueued })),
}));
