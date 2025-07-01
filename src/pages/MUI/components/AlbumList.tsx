import React, { useState, useEffect } from "react";
import { Plus, Music, Tag, Eye } from "lucide-react";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { Artist } from "libs/types/common";
import { Album } from "libs/types/common";
import { CollectibleMetadataModal } from "./CollectibleMetadataModal";
import { TrackListModal } from "./TrackListModal";
import { adminApi, FastStreamTrack } from "../services";

interface AlbumListProps {
  albums: Album[];
  artistName: string;
  artistId: string;
  selectedArtist: Artist;
}

export const AlbumList: React.FC<AlbumListProps> = ({ albums, artistName, artistId, selectedArtist }) => {
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<FastStreamTrack[]>([]);
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState<string>("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [selectedAlbumArtist, setSelectedAlbumArtist] = useState<Artist | null>(null);

  // Collectible metadata modal state
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string>("");
  const [selectedCollectibleTier, setSelectedCollectibleTier] = useState<string>("");

  useEffect(() => {
    setSelectedAlbumArtist(selectedArtist);
  }, [selectedArtist]);

  const handleViewCollectibleMetadata = async (albumId: string, albumTitle: string, tier?: string) => {
    const collectibleId = tier ? `${albumId}_${tier}` : albumId;
    setSelectedCollectibleId(collectibleId);
    setSelectedAlbumTitle(albumTitle);
    setSelectedCollectibleTier(tier || "");
    setIsCollectibleModalOpen(true);
  };

  const handleViewCurrentTracks = async (albumId: string, albumTitle: string) => {
    setIsLoadingTracks(true);
    try {
      const response = await adminApi.fastStream.getFastStreamTracksForAlbum(artistId, albumId);
      if (response.success) {
        setSelectedAlbumTracks(response.data || []);
        setSelectedAlbumTitle(albumTitle);
        setSelectedAlbumId(albumId);
        setIsModalOpen(true);
      } else {
        console.error("Failed to fetch tracks:", response.error);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlbumTracks([]);
    setSelectedAlbumTitle("");
    setSelectedAlbumId("");
  };

  const handleCloseCollectibleModal = () => {
    setIsCollectibleModalOpen(false);
    setSelectedCollectibleId("");
    setSelectedCollectibleTier("");
  };

  const handleCollectibleMetadataUpdated = () => {
    // Optionally refresh any data if needed
    console.log("Collectible metadata updated");
  };

  const handleTracksUpdated = async () => {
    if (selectedAlbumId) {
      try {
        const response = await adminApi.fastStream.getFastStreamTracksForAlbum(artistId, selectedAlbumId);
        if (response.success) {
          setSelectedAlbumTracks(response.data || []);
        }
      } catch (error) {
        console.error("Error refreshing tracks:", error);
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{artistName}</h2>
            <p className="text-gray-600 mt-1">Manage albums and tracks</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {albums.length} Albums
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.albumId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{album.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">ID: {album.albumId}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {album?.isExplicit === "1" && (
                      <Badge variant="destructive" className="text-xs">
                        Explicit
                      </Badge>
                    )}
                  </div>
                </div>
                {album.img && (
                  <div className="ml-4">
                    <img src={album.img} alt={album.title} className="w-16 h-16 rounded-lg object-cover" />
                  </div>
                )}
              </div>

              {album.bountyId && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs">
                    Bounty: {album.bountyId}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => handleViewCurrentTracks(album.albumId, album.title)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoadingTracks}>
                  <Eye className="w-4 h-4 mr-2" />
                  {isLoadingTracks ? "Loading..." : "View Current Tracks"}
                </Button>

                <Button onClick={() => handleViewCollectibleMetadata(album.albumId, album.title)} variant="outline" className="w-full">
                  <Tag className="w-4 h-4 mr-2" />
                  View Non-Commercial Collectible Metadata
                </Button>

                <Button onClick={() => handleViewCollectibleMetadata(album.albumId, album.title, "t2")} variant="outline" className="w-full">
                  <Tag className="w-4 h-4 mr-2" />
                  View Commercial Collectible Metadata
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Albums Found</h3>
            <p className="text-gray-600">No albums are currently available for this artist.</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Album
            </Button>
          </div>
        )}
      </div>

      <TrackListModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tracks={selectedAlbumTracks}
        albumTitle={selectedAlbumTitle}
        artistId={artistId}
        albumId={selectedAlbumId}
        onTracksUpdated={handleTracksUpdated}
      />

      <CollectibleMetadataModal
        isOpen={isCollectibleModalOpen}
        onClose={handleCloseCollectibleModal}
        collectibleTitle={selectedAlbumTitle}
        collectibleId={selectedCollectibleId}
        collectibleTier={selectedCollectibleTier}
        selectedArtist={selectedAlbumArtist}
        isFanCollectible={false}
        onMetadataUpdated={handleCollectibleMetadataUpdated}
      />
    </>
  );
};
