import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Play, Loader, Download, MoreVertical, Plus } from "lucide-react";
import ratingE from "assets/img/icons/rating-E.png";
import { Button } from "libComponents/Button";
import { Album, MusicTrack } from "libs/types";
import { getAlbumTracksFromDBViaAPI } from "libs/utils/api";
import { scrollToTopOnMainContentArea, downloadTrackViaClientSide } from "libs/utils/ui";
import { useAudioPlayerStore } from "store/audioPlayer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { InfoTooltip } from "libComponents/Tooltip";
import { LICENSE_BLURBS } from "config";
import { TrackRatingButtons } from "components/TrackRatingButtons";
import { useTrackVoting } from "hooks/useTrackVoting";

interface TrackListProps {
  album: Album;
  artistId: string;
  artistName: string;
  virtualTrackList?: MusicTrack[];
  trackPlayIsQueued?: boolean;
  assetPlayIsQueued?: boolean;
  remixWorkspaceView?: boolean;
  disabledDownloadAlways?: boolean;
  checkOwnershipOfMusicAsset: (album: any) => number;
  onBack: () => void;
  onPlayTrack: (album: any, jumpToPlaylistTrackIndex?: number) => void;
  handleTrackSelection?: (track: MusicTrack) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  album,
  artistId,
  artistName,
  virtualTrackList,
  trackPlayIsQueued,
  assetPlayIsQueued,
  remixWorkspaceView,
  disabledDownloadAlways,
  checkOwnershipOfMusicAsset,
  onBack,
  onPlayTrack,
  handleTrackSelection,
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
  const { playlistTrackIndexBeingPlayed, albumIdBeingPlayed, updateJumpToTrackIndexInAlbumBeingPlayed } = useAudioPlayerStore();
  const [trackDownloadIsInProgress, setTrackDownloadIsInProgress] = useState<boolean>(false);
  // Calculate bounty IDs for voting system - memoized to prevent re-render loops
  const bountyIds = useMemo(() => [...(virtualTrackList?.map((track) => track.bountyId).filter(Boolean) || [])] as string[], [virtualTrackList]);

  // Rating system state - tracks which specific votes user has made to prevent spam
  const { userVotedOptions, setUserVotedOptions } = useTrackVoting({ bountyIds });

  useEffect(() => {
    scrollToTopOnMainContentArea();
  }, [album]);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const userOwnsAlbum = checkOwnershipOfMusicAsset(album) > -1;
        const tracksData: MusicTrack[] = await getAlbumTracksFromDBViaAPI(artistId, album.albumId, userOwnsAlbum);

        // filter out any hidden or deleted tracks first...
        const tracksDataWithoutHiddenOrDeleted = tracksData.filter((track: MusicTrack) => track.hideOrDelete !== "2" && track.hideOrDelete !== "1");

        setTracks(tracksDataWithoutHiddenOrDeleted);
      } catch (error) {
        console.error("Error fetching tracks:", error);
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    if (album.title !== "My AI Remixes") {
      fetchTracks(); // get live tracks from the DB
    } else {
      // we are loading a manual list of remixes (most likely for the user's remixes -- i.e. album is "My AI Remixes")
      if (virtualTrackList) {
        setTracks(virtualTrackList); // we are loading a manual virtual track list (e.g. for the user's remixes)
      }

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

  const downloadTrackViaClientSideWrapper = async (track: MusicTrack) => {
    setTrackDownloadIsInProgress(true);
    await downloadTrackViaClientSide({
      trackMediaUrl: track.file || track.stream || "",
      artistId,
      albumId: album.albumId,
      alId: track.alId || "",
      trackTitle: track.title || "",
    });
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
              <h2 className="!text-2xl font-bold text-white flex items-center">
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
          {!disabledDownloadAlways && <div>{remixWorkspaceView ? "Options" : "Download"}</div>}
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {tracks.map((track: MusicTrack, index) => {
          const isBonusTrack = track.bonus === 1;
          const isDisabled = !userOwnsAlbum && isBonusTrack;
          const isQueued = assetPlayIsQueued || trackPlayIsQueued;
          const isCurrentlyPlaying = albumIdBeingPlayed === album.albumId && playlistTrackIndexBeingPlayed === index;
          const isHovered = hoveredTrackIndex === index;
          const isNewlyCreatedAiRemixDuringCurrentSession = track.isNewlyCreatedAiRemixDuringCurrentSession || false;

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
              <div className="flex items-center justify-start">
                <>
                  {isCurrentlyPlaying ? (
                    <span className="text-yellow-300 text-sm font-medium">▶</span>
                  ) : isQueued && isHovered ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : isHovered && !isDisabled && !isQueued && !isCurrentlyPlaying ? (
                    <Play className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-gray-400 text-sm">{index + 1}</span>
                  )}
                  {track.isSigmaAiRemixUsingFreeLicense && (
                    <span className="text-xs text-black px-2 py-1 rounded-full">
                      <InfoTooltip content={`This was remixed with a CC BY-NC 4.0 license - ${LICENSE_BLURBS["CC BY-NC 4.0"].blurb}`} position="right" />
                    </span>
                  )}
                </>
              </div>

              {/* Track Title and Artist */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {isNewlyCreatedAiRemixDuringCurrentSession && <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 rounded-full">New</span>}
                  <span className={`text-sm ${isDisabled || isCurrentlyPlaying ? "text-gray-500" : "text-white"}`}>
                    {track.title}

                    {isCurrentlyPlaying && <span className="text-yellow-300 ml-2 text-xs">Playing...</span>}
                  </span>
                  {isBonusTrack && <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 rounded-full">Bonus</span>}
                </div>
                <span className="text-gray-400 text-xs">{artistName}</span>
              </div>

              {/* Download Button */}
              {!disabledDownloadAlways && !remixWorkspaceView && (
                <div className="flex items-center justify-center">
                  {userOwnsAlbum ? (
                    <button
                      className={`text-gray-400 hover:text-white transition-colors ${isHovered ? "opacity-100" : "opacity-0"}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent track click handler from firing
                        downloadTrackViaClientSideWrapper(track);
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
              )}

              {!disabledDownloadAlways && remixWorkspaceView && (
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`text-gray-400 hover:text-white transition-colors p-1 rounded-sm hover:bg-gray-700 ${
                          isHovered ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        title="Track options">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700 text-white" sideOffset={5}>
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-sm py-2 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTrackViaClientSideWrapper(track);
                        }}
                        disabled={trackDownloadIsInProgress}>
                        <Download className="w-4 h-4 mr-2" />
                        {trackDownloadIsInProgress ? "Downloading..." : "Download Track"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-sm py-2 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handleTrackSelection) {
                            handleTrackSelection(track);
                          }
                        }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Track to Album
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {track.bountyId && (
                    <TrackRatingButtons bountyId={track.bountyId} userVotedOptions={userVotedOptions} setUserVotedOptions={setUserVotedOptions} />
                  )}
                </div>
              )}
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
