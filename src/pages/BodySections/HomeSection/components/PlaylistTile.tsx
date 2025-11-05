import React from "react";
import { Loader } from "lucide-react";

interface PlaylistTileProps {
  genre: {
    code: string;
    label: string;
    tier: any;
    tileImgBg: string;
  };
  color: string;
  hoverBgColor?: string;
  selectedCodeForPlaylist: string;
  lastClickedGenreForPlaylist: string;
  assetPlayIsQueued: boolean;
  isMusicPlayerOpen: boolean;
  extendTileToFullWidth?: boolean;
  showClickToPlay?: boolean;
  onCloseMusicPlayer: () => void;
  setLastClickedGenreForPlaylist: (genre: string) => void;
  updateAssetPlayIsQueued: (value: boolean) => void;
  onPlaylistUpdate: (genre: string) => void;
  setLaunchPlaylistPlayerWithDefaultTracks: (value: boolean) => void;
  setLaunchPlaylistPlayer: (value: boolean) => void;
}

export const PlaylistTile = ({
  genre,
  color,
  hoverBgColor,
  selectedCodeForPlaylist,
  lastClickedGenreForPlaylist,
  assetPlayIsQueued,
  isMusicPlayerOpen,
  extendTileToFullWidth,
  showClickToPlay,
  onCloseMusicPlayer,
  setLastClickedGenreForPlaylist,
  updateAssetPlayIsQueued,
  onPlaylistUpdate,
  setLaunchPlaylistPlayerWithDefaultTracks,
  setLaunchPlaylistPlayer,
}: PlaylistTileProps) => {
  const handleClick = () => {
    onCloseMusicPlayer();
    setLastClickedGenreForPlaylist(genre.code);

    if (isMusicPlayerOpen) {
      updateAssetPlayIsQueued(true);
      setTimeout(() => {
        onPlaylistUpdate(genre.code);
        setLaunchPlaylistPlayerWithDefaultTracks(false);
        setLaunchPlaylistPlayer(true);
        updateAssetPlayIsQueued(false);
      }, 5000);
    } else {
      onPlaylistUpdate(genre.code);
      setLaunchPlaylistPlayerWithDefaultTracks(false);
      setLaunchPlaylistPlayer(true);
      updateAssetPlayIsQueued(false);
    }
  };

  const image = genre.tileImgBg;

  return (
    <div
      key={genre.code}
      onClick={handleClick}
      className={`flex-shrink-0 ${extendTileToFullWidth ? "w-full h-40" : "w-64 h-40"} bg-black rounded-sm p-0 flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg
        ${assetPlayIsQueued ? "pointer-events-none cursor-not-allowed" : ""}
        ${selectedCodeForPlaylist === genre.code ? "ring-2 ring-yellow-300" : ""}  ${hoverBgColor ? `hover:border-2 hover:border-${hoverBgColor}` : ""}`}
      style={{ background: color }}>
      {/* Genre Title */}
      <div className="absolute top-4 left-5 z-5">
        <span className="text-white text-xl font-bold drop-shadow-lg">{genre.label}</span>
      </div>
      {/* Loader/Playing indicator */}
      {selectedCodeForPlaylist === "" && lastClickedGenreForPlaylist === genre.code && (
        <div className="absolute top-4 right-5 z-5">
          <Loader className="animate-spin text-yellow-300" size={20} />
        </div>
      )}
      {selectedCodeForPlaylist === genre.code ? (
        <div className="absolute top-4 right-5 z-10">
          <span className="text-white text-sm font-semibold bg-black/40 px-2 py-1 rounded-full">Playing</span>
        </div>
      ) : (
        <>
          {selectedCodeForPlaylist === "" && lastClickedGenreForPlaylist !== genre.code && showClickToPlay ? (
            <div className="absolute top-4 right-5 z-10">
              <span className="text-white text-sm font-semibold bg-black/40 px-2 py-1 rounded-full">Click to Play</span>
            </div>
          ) : null}
        </>
      )}
      {/* Angled image in bottom right */}
      <div className="absolute bottom-0 right-0 z-5" style={{ transform: "rotate(12deg) translate(20px, 20px)" }}>
        <img
          src={image}
          alt={genre.label}
          className="w-24 h-24 object-cover rounded-lg shadow-xl border-4 border-white"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
        />
      </div>
    </div>
  );
};
