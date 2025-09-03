import React, { useEffect, useState } from "react";
import { ArrowLeft, Play, Loader, Download } from "lucide-react";
import ratingE from "assets/img/icons/rating-E.png";
import { Button } from "libComponents/Button";
import { Album, MusicTrack } from "libs/types";
import { getAlbumTracksFromDBViaAPI, downloadMp3TrackViaAPI } from "libs/utils/api";
import { scrollToTopOnMainContentArea } from "libs/utils/ui";
import { useAudioPlayerStore } from "store/audioPlayer";

interface TrackListProps {
  album: Album;
  artistId: string;
  artistName: string;
  virtualTrackList?: MusicTrack[];
  onBack: () => void;
  onPlayTrack: (album: any, jumpToPlaylistTrackIndex?: number) => void;
  checkOwnershipOfMusicAsset: (album: any) => number;
  trackPlayIsQueued?: boolean;
  assetPlayIsQueued?: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({
  album,
  artistId,
  artistName,
  virtualTrackList,
  onBack,
  onPlayTrack,
  checkOwnershipOfMusicAsset,
  trackPlayIsQueued,
  assetPlayIsQueued,
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
  const { playlistTrackIndexBeingPlayed, albumIdBeingPlayed, updateJumpToTrackIndexInAlbumBeingPlayed } = useAudioPlayerStore();
  const [trackDownloadIsInProgress, setTrackDownloadIsInProgress] = useState<boolean>(false);

  useEffect(() => {
    scrollToTopOnMainContentArea();
  }, [album]);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const userOwnsAlbum = checkOwnershipOfMusicAsset(album) > -1;
        const tracksData = await getAlbumTracksFromDBViaAPI(artistId, album.albumId, userOwnsAlbum);
        setTracks(tracksData || []);
      } catch (error) {
        console.error("Error fetching tracks:", error);
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    if (!virtualTrackList || virtualTrackList.length === 0) {
      fetchTracks(); // get live tracks from the DB
    } else {
      setTracks(virtualTrackList); // we are loading a manual virtual track list (e.g. for the user's remixes)
      setLoading(false);
    }
  }, [artistId, album.albumId, virtualTrackList]);

  const handleTrackClick = (track: MusicTrack, trackIndex: number) => {
    // Don't allow clicking if audio player is being loaded
    if (assetPlayIsQueued || trackPlayIsQueued) {
      return;
    }

    // Don't allow clicking if this track is currently playing
    if (albumIdBeingPlayed === album.albumId && playlistTrackIndexBeingPlayed === trackIndex) {
      return;
    }

    // Check if user owns the album or if it's not a bonus track
    const userOwnsAlbum = checkOwnershipOfMusicAsset(album) > -1;
    const isBonusTrack = track.bonus === 1;

    if (!userOwnsAlbum && isBonusTrack) {
      // Don't allow playing bonus tracks if user doesn't own album
      return;
    }

    // if this album is already playing, we shortcut the MusicPlayer by getting the current player to jump to track the user wants to play
    if (albumIdBeingPlayed === album.albumId) {
      updateJumpToTrackIndexInAlbumBeingPlayed(track.idx);
      return;
    }

    // Use the same play logic as the album play button
    onPlayTrack(album, track.idx);
  };

  const downloadTrackViaClientSide = async (track: MusicTrack) => {
    setTrackDownloadIsInProgress(true);
    let apiDownloadFailed = false;
    try {
      apiDownloadFailed = !(await downloadMp3TrackViaAPI(artistId, album.albumId, track.alId || "", track.title || ""));
    } catch (error) {
      console.error("Error downloading track:", error);
      // Fallback to the original method if fetch fails
      apiDownloadFailed = true;
    }

    if (apiDownloadFailed && track.file) {
      const link = document.createElement("a");
      link.href = track.file;
      link.download = `${album.albumId}-${track.alId}-${track.title}.mp3`;
      link.target = "_blank"; // Open in new tab as fallback
      link.click();
    }

    setTrackDownloadIsInProgress(false);
  };

  const userOwnsAlbum = checkOwnershipOfMusicAsset(album) > -1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin w-8 h-8 text-yellow-300" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div>
        {!virtualTrackList && (
          <Button variant="outline" className="text-sm px-3 py-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Albums
          </Button>
        )}
        <div className="flex items-center justify-between mb-6 mt-3">
          <div className="flex items-center gap-6">
            {/* Large Circular Play Button */}
            <button
              disabled={assetPlayIsQueued || trackPlayIsQueued || albumIdBeingPlayed === album.albumId}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                assetPlayIsQueued || trackPlayIsQueued || albumIdBeingPlayed === album.albumId
                  ? "bg-gray-600 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-green-400 to-orange-500 hover:from-orange-500 hover:to-green-400 hover:scale-105 cursor-pointer"
              }`}
              onClick={() => onPlayTrack(album)}>
              {assetPlayIsQueued || trackPlayIsQueued ? <Loader className="w-6 h-6 text-white animate-spin" /> : <Play className="w-6 h-6 text-white ml-1" />}
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                {album.title}
                <span className="ml-1">
                  {album.isExplicit && album.isExplicit === "1" && (
                    <img
                      className="max-h-[20px] relative top-[2px] ml-[5px] rounded-md"
                      src={ratingE}
                      alt="Warning: Explicit Content"
                      title="Warning: Explicit Content"
                    />
                  )}
                </span>
              </h2>
              <p className="text-gray-400">{artistName}</p>
              <div className="text-gray-400 text-xs mt-1">
                {tracks.length} {tracks.length === 1 ? "song" : "songs"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {album.img && (
              <div className="hidden md:block md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={album.img}
                  alt={`${album.title} cover`}
                  className="w-full h-full object-cover"
                  onError={({ currentTarget }) => {
                    currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track List Header */}
      <div className="border-b border-gray-700 pb-2 mb-4">
        <div className="grid grid-cols-[50px_1fr_50px] gap-4 text-gray-400 text-sm font-medium">
          <div>#</div>
          <div>Title</div>
          <div>Download</div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isBonusTrack = track.bonus === 1;
          const isDisabled = !userOwnsAlbum && isBonusTrack;
          const isQueued = assetPlayIsQueued || trackPlayIsQueued;
          const isCurrentlyPlaying = albumIdBeingPlayed === album.albumId && playlistTrackIndexBeingPlayed === index;
          const isHovered = hoveredTrackIndex === index;

          return (
            <div
              key={`${track.albumTrackId || track.idx}-${index}`}
              className={`group grid grid-cols-[50px_1fr_50px] gap-4 py-3 px-2 rounded-md transition-colors ${
                isDisabled || isQueued || isCurrentlyPlaying ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800 cursor-pointer"
              }`}
              onMouseEnter={() => setHoveredTrackIndex(index)}
              onMouseLeave={() => setHoveredTrackIndex(null)}
              onClick={() => handleTrackClick(track, index)}>
              {/* Track Number / Play Button */}
              <div className="flex items-center justify-center">
                {isCurrentlyPlaying ? (
                  <span className="text-yellow-300 text-sm font-medium">▶</span>
                ) : isQueued && isHovered ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : isHovered && !isDisabled && !isQueued && !isCurrentlyPlaying ? (
                  <Play className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-gray-400 text-sm">{index + 1}</span>
                )}
              </div>

              {/* Track Title and Artist */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDisabled || isCurrentlyPlaying ? "text-gray-500" : "text-white"}`}>
                    {track.title}
                    {isCurrentlyPlaying && <span className="text-yellow-300 ml-2 text-xs">Playing...</span>}
                  </span>
                  {isBonusTrack && <span className="text-xs bg-orange-500 text-black px-2 py-1 rounded-full">Bonus</span>}
                </div>
                <span className="text-gray-400 text-xs">{artistName}</span>
              </div>

              {/* Download Button */}
              <div className="flex items-center justify-center">
                {userOwnsAlbum ? (
                  <button
                    className={`text-gray-400 hover:text-white transition-colors ${isHovered ? "opacity-100" : "opacity-0"}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent track click handler from firing
                      downloadTrackViaClientSide(track);
                      // downloadMp3TrackViaAPI(artistId, album.albumId, track.alId || "", track.title || "");
                    }}
                    disabled={trackDownloadIsInProgress}
                    title="Download track">
                    {trackDownloadIsInProgress ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-5 h-5" />}
                  </button>
                ) : (
                  <div
                    className={`text-gray-400 transition-opacity cursor-not-allowed ${isHovered ? "opacity-50" : "opacity-0"}`}
                    title="Buy the digital version of this album to download this track">
                    <Download className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Track Notice */}
      {!userOwnsAlbum && tracks.some((track) => track.bonus === 1) && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-300 text-sm">
            <span className="text-orange-400 font-medium">Bonus tracks</span> are available when you purchase this album.
          </p>
        </div>
      )}
    </div>
  );
};
