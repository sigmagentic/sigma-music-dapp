import { create } from "zustand";

type State = {
  trackPlayIsQueued: boolean; // a track is inside an album or a playlist (I dont think this works correctly @TODO)
  assetPlayIsQueued: boolean; // an asset can be a album or a playlist
  albumIdBeingPlayed: string | undefined;
  playlistTrackIndexBeingPlayed: number | undefined;
  jumpToTrackIndexInAlbumBeingPlayed: number | undefined; // if the user is already playing an album, and clicks a track in the album from the track list or elsewhere, we use this to shortcut the muisc player to jump into the track the user wants to play
};

type Action = {
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => void;
  updateAssetPlayIsQueued: (assetPlayIsQueued: State["assetPlayIsQueued"]) => void;
  updateAlbumIdBeingPlayed: (albumIdBeingPlayed: State["albumIdBeingPlayed"]) => void;
  updatePlaylistTrackIndexBeingPlayed: (playlistTrackIndexBeingPlayed: State["playlistTrackIndexBeingPlayed"]) => void;
  updateJumpToTrackIndexInAlbumBeingPlayed: (jumpToTrackIndexInAlbumBeingPlayed: State["jumpToTrackIndexInAlbumBeingPlayed"]) => void;
};

export const useAudioPlayerStore = create<State & Action>((set) => ({
  trackPlayIsQueued: false,
  assetPlayIsQueued: false,
  albumIdBeingPlayed: undefined,
  playlistTrackIndexBeingPlayed: undefined,
  jumpToTrackIndexInAlbumBeingPlayed: undefined,
  updateTrackPlayIsQueued: (trackPlayIsQueued: State["trackPlayIsQueued"]) => set(() => ({ trackPlayIsQueued: trackPlayIsQueued })),
  updateAssetPlayIsQueued: (assetPlayIsQueued: State["assetPlayIsQueued"]) => set(() => ({ assetPlayIsQueued: assetPlayIsQueued })),
  updateAlbumIdBeingPlayed: (albumIdBeingPlayed: State["albumIdBeingPlayed"]) => set(() => ({ albumIdBeingPlayed: albumIdBeingPlayed })),
  updatePlaylistTrackIndexBeingPlayed: (playlistTrackIndexBeingPlayed: State["playlistTrackIndexBeingPlayed"]) =>
    set(() => ({ playlistTrackIndexBeingPlayed: playlistTrackIndexBeingPlayed })),
  updateJumpToTrackIndexInAlbumBeingPlayed: (jumpToTrackIndexInAlbumBeingPlayed: State["jumpToTrackIndexInAlbumBeingPlayed"]) =>
    set(() => ({ jumpToTrackIndexInAlbumBeingPlayed: jumpToTrackIndexInAlbumBeingPlayed })),
}));
