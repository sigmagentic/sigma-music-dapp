import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Play, Loader, Download, MoreVertical, Plus, Copy, AudioLines } from "lucide-react";
import ratingE from "assets/img/icons/rating-E.png";
import { Button } from "libComponents/Button";
import { Album, MusicTrack, TrackWithKeyAlbumInfo } from "libs/types";
import { getAlbumTracksFromDBViaAPI, injectXUserNameIntoTweet } from "libs/utils";
import { scrollToTopOnMainContentArea, downloadTrackViaClientSide, toastSuccess } from "libs/utils/ui";
import { useAudioPlayerStore } from "store/audioPlayer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "libComponents/DropdownMenu";
import { InfoTooltip } from "libComponents/Tooltip";
import { LICENSE_BLURBS } from "config";
import { TrackRatingButtons } from "components/TrackRatingButtons";
import { useTrackVoting } from "hooks/useTrackVoting";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "store/app";
import { Artist } from "libs/types";
import { AlbumCollaborators } from "components/AlbumCollaborators";

interface TrackListProps {
  album: Album;
  artistId: string;
  artistName: string;
  artistSlug?: string;
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
  artistSlug,
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
  const { playlistTrackIndexBeingPlayed, albumIdBeingPlayed, updateJumpToTrackIndexInAlbumBeingPlayed } = useAudioPlayerStore();
  const [trackDownloadIsInProgress, setTrackDownloadIsInProgress] = useState<boolean>(false);
  const [selectedTrackIdForDeepLinkModal, setSelectedTrackIdForDeepLinkModal] = useState<TrackWithKeyAlbumInfo | null>(null);

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

    if (album.title !== "AI Remixes") {
      fetchTracks(); // get live tracks from the DB
    } else {
      // we are loading a manual list of remixes (most likely for the user's remixes -- i.e. album is "AI Remixes")
      if (virtualTrackList) {
        setTracks(virtualTrackList); // we are loading a manual virtual track list (e.g. for the user's remixes)
      }

      setLoading(false);
    }
  }, [artistId, album.albumId, virtualTrackList]);

  useEffect(() => {
    if (album && artistId && tracks.length > 0 && searchParams) {
      // alId is the track id, if a user sends this in then they are deep linking to a track
      const alIdToDeepLinkTo = searchParams.get("alId");
      if (alIdToDeepLinkTo && alIdToDeepLinkTo !== "") {
        const track = tracks.find((track) => track.alId === alIdToDeepLinkTo);

        if (track) {
          setSelectedTrackIdForDeepLinkModal({
            ...track,
            albumId: album.albumId,
            artistId: artistId,
            albumCoverImg: album.img || "",
          } as TrackWithKeyAlbumInfo);
        }

        console.log("show track deep link modal: album", album);
        console.log("show track deep link modal: tracks", tracks);
      }
    }
  }, [album, artistId, tracks, searchParams]);

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
        <Loader className="animate-spin text-yellow-300" size={20} />
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
              onClick={() => onPlayTrack(album)}
              title={albumIdBeingPlayed === album.albumId ? "Playing..." : "Play"}>
              {assetPlayIsQueued || trackPlayIsQueued ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : albumIdBeingPlayed === album.albumId ? (
                <AudioLines className="w-6 h-6 text-white" style={{ animation: "playPulse 5s ease-in-out infinite" }} />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
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
              <div>
                <AlbumCollaborators collaborators={album?.collaborators} />
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
          {!disabledDownloadAlways && (
            <div>
              <MoreVertical className="w-4 h-4" />
            </div>
          )}
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
                      <InfoTooltip
                        content={`This was remixed with a CC BY-NC 4.0 license - ${LICENSE_BLURBS["CC BY-NC 4.0"].oneLinerBlurb}`}
                        position="right"
                      />
                    </span>
                  )}
                </>
              </div>

              {/* Track Title and Artist */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {isNewlyCreatedAiRemixDuringCurrentSession && <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 rounded-full">New</span>}
                  <span className={`text-sm ${isDisabled || isCurrentlyPlaying ? "text-gray-500" : "text-white"}`}>
                    <div className="flex items-center">
                      {track.title}
                      {track.isExplicit && track.isExplicit === "1" && (
                        <img
                          className="max-h-[15px] relative ml-[5px] rounded-md"
                          src={ratingE}
                          alt="Warning: Explicit Content"
                          title="Warning: Explicit Content"
                        />
                      )}
                    </div>

                    {isCurrentlyPlaying && <span className="text-yellow-300 text-[9px]">Playing...</span>}
                  </span>
                  {isBonusTrack && <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 rounded-full">Bonus</span>}
                </div>
                <span className="text-gray-400 text-xs">{artistName}</span>
              </div>

              {/* Options Dropdown */}
              {!disabledDownloadAlways && (
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
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/?section=artists&action=tracklist&alId=${track.alId}&artist=${artistSlug || artistId}~${album.albumId}`
                            );
                            toastSuccess("Track link copied!");
                          } catch (err) {
                            console.error("Failed to copy track link:", err);
                          }
                        }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Track Link
                      </DropdownMenuItem>

                      {/* Download Track - only if user owns album */}
                      {userOwnsAlbum && (
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
                      )}

                      {/* Add Track to Album - only in remix workspace view */}
                      {remixWorkspaceView && handleTrackSelection && (
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-sm py-2 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackSelection(track);
                          }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Track to Album
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {remixWorkspaceView && track.bountyId && (
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

      {/* Track Deep Link Modal */}
      {selectedTrackIdForDeepLinkModal && (
        <TrackDeepLinkModal
          track={selectedTrackIdForDeepLinkModal}
          artistName={artistName}
          albumTitle={album.title}
          onClose={() => {
            setSelectedTrackIdForDeepLinkModal(null);
            // Remove alId from URL
            const currentParams = Object.fromEntries(searchParams.entries());
            delete currentParams["alId"];
            setSearchParams(currentParams);
          }}
          onPlayTrack={() => {
            handleTrackClick(selectedTrackIdForDeepLinkModal, selectedTrackIdForDeepLinkModal.idx);
            setSelectedTrackIdForDeepLinkModal(null);
            // Remove alId from URL
            const currentParams = Object.fromEntries(searchParams.entries());
            delete currentParams["alId"];
            setSearchParams(currentParams);
          }}
        />
      )}
    </div>
  );
};

// Track Deep Link Modal Component
interface TrackDeepLinkModalProps {
  track: TrackWithKeyAlbumInfo;
  artistName: string;
  albumTitle: string;
  onClose: () => void;
  onPlayTrack: () => void;
}

const TrackDeepLinkModal: React.FC<TrackDeepLinkModalProps> = ({ track, artistName, albumTitle, onClose, onPlayTrack }) => {
  const { artistLookupEverything } = useAppStore();
  const [tweetText, setTweetText] = useState<string>("");

  useEffect(() => {
    if (track.title && track.title !== "") {
      const findArtist = Object.values(artistLookupEverything).find((artist: Artist) => artist.artistId === track.artistId);

      // Include artist slug and album ID in the deep link so it can be opened from anywhere
      const artistSlug = findArtist?.slug || track.artistId;
      const trackDeepSlug = `artist=${artistSlug}~${track.albumId}&action=tracklist&alId=${track.alId}`;

      const tweetMsg = injectXUserNameIntoTweet(`Check out "${track.title}" by ${artistName} _(xUsername)_ on @SigmaXMusic!`, findArtist?.xLink);

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?${trackDeepSlug}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [track, artistName, artistLookupEverything]);

  return (
    <div className="fixed inset-0 bg-yellow-400 bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-[#1A1A1A] rounded-lg p-6 max-w-lg w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        <div className="space-y-2 flex flex-col items-center w-full">
          {/* Track Title */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h2 className="!text-xl text-center font-bold text-white">{track.title}</h2>
            {track.isExplicit && track.isExplicit === "1" && (
              <img className="max-h-[20px] rounded-md" src={ratingE} alt="Warning: Explicit Content" title="Warning: Explicit Content" />
            )}
            {track.bonus === 1 && <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 rounded-full">Bonus</span>}
          </div>

          {/* Track Cover Art */}
          <div className="relative group flex justify-center w-full cursor-pointer" onClick={onPlayTrack}>
            <div
              className="w-64 h-64 bg-no-repeat bg-cover bg-center rounded-md relative overflow-hidden"
              style={{
                backgroundImage: `url(${track.cover_art_url})`,
              }}>
              {/* Play Icon Overlay - always visible, dimmed by default, brighter and bigger on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:w-20 group-hover:h-20 transition-all duration-300 ml-1" />
              </div>
            </div>
          </div>

          {/* Album Details Section */}
          <div className="w-full border-yellow-500 bg-yellow-500/10 border-2 rounded-lg p-4 flex items-center gap-3">
            <div
              className="w-16 h-16 bg-no-repeat bg-cover bg-center rounded-md border border-gray-600"
              style={{
                backgroundImage: `url(${track.albumCoverImg})`,
              }}
            />
            <div className="flex flex-col">
              <p className="text-xs text-gray-400">Track from</p>
              <p className="text-sm font-semibold text-white">{albumTitle}</p>
              <p className="text-xs text-gray-300">by {artistName}</p>
            </div>
          </div>

          {/* Share on X Button */}
          <div className="bg-yellow-300 rounded-full p-[10px] w-full">
            <a
              className="bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
              href={"https://twitter.com/intent/tweet?" + tweetText}
              data-size="large"
              target="_blank"
              rel="noreferrer">
              <span className="[&>svg]:h-4 [&>svg]:w-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                </svg>
              </span>
              <p className="text-sm">Share this track on X</p>
            </a>
          </div>

          <div className="mt-5"></div>

          {/* Play Track Button */}
          {/* <Button
            onClick={onPlayTrack}
            className="w-full bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 text-black font-bold py-4 px-8 rounded-lg transition-all duration-300 text-lg">
            <Play className="w-6 h-6 mr-2" />
            Play Track
          </Button> */}
        </div>
      </div>
    </div>
  );
};
