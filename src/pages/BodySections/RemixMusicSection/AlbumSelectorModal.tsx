import React from "react";
import { Loader, Plus } from "lucide-react";
import { Button } from "libComponents/Button";
import { Badge } from "libComponents/Badge";
import { useAccountStore } from "store/account";
import { Album, MusicTrack } from "libs/types/common";
import { getAlbumFromDBViaAPI } from "libs/utils/api";
import { useState, useEffect } from "react";

export const AlbumSelectorModal = ({
  isOpen,
  onClose,
  trackToAddToAlbum,
  albumTracksLoading,
  onViewCurrentTracks,
}: {
  isOpen: boolean;
  onClose: () => void;
  trackToAddToAlbum: MusicTrack | null;
  albumTracksLoading: boolean;
  onViewCurrentTracks: (albumId: string, albumTitle: string, albumImg: string) => void;
}) => {
  if (!isOpen) return null;

  const { userArtistProfile } = useAccountStore();

  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);
  const [myAlbums, setMyAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (userArtistProfile && userArtistProfile.artistId) {
      setAlbumsLoading(true);

      getAlbumFromDBViaAPI(userArtistProfile.artistId).then((albums) => {
        setMyAlbums(albums);
        setAlbumsLoading(false);
      });
    } else {
      // most likely a fan or non-artist user is trying to add a track to an album, get them to complete their artist profile first
      if (!userArtistProfile || Object.keys(userArtistProfile).length === 0) {
        setAlbumsLoading(false);
      }
    }
  }, [userArtistProfile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold mr-auto">Pick an Album To Add Track To</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors">
            ✕
          </button>
        </div>

        <p className="mb-4">
          Selected Track: <span className="text-yellow-300">{trackToAddToAlbum?.title}</span>
        </p>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto p-4">
          {albumsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-yellow-500" size={30} />
            </div>
          ) : (
            <>
              {myAlbums.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Albums Found</h3>
                  <p className="text-gray-600">Create an album first, then come back here to add tracks.</p>
                  <Button
                    onClick={() => {
                      window.open(`?section=profile&view=artistProfile&action=createAlbum`, "_blank");
                    }}
                    className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Album
                  </Button>
                </div>
              )}
            </>
          )}

          {!albumsLoading &&
            myAlbums.length > 0 &&
            myAlbums.map((album) => (
              <div key={album.albumId} className="p-6 hover:shadow-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{album.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{album.albumId}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {album?.isExplicit === "1" && (
                        <Badge variant="destructive" className="text-xs">
                          Explicit
                        </Badge>
                      )}
                      <p className="text-sm text-gray-400 mb-2">
                        Status:{" "}
                        {album?.isPublished === "1" ? (
                          <span className="text-yellow-400 font-medium">Published</span>
                        ) : (
                          <span className="text-gray-400 font-medium">Draft</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {album.img && (
                    <div className="ml-4">
                      <img src={album.img} alt={album.title} className="w-16 h-16 rounded-lg object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => onViewCurrentTracks(album.albumId, album.title, album.img)}
                    disabled={albumTracksLoading}
                    className={`bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 ${albumTracksLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                    Add Track to Album {albumTracksLoading ? <Loader className="animate-spin ml-2" size={16} /> : null}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
