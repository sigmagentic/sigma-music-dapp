import React, { useState } from "react";
import { Plus, Music, Users, Tag } from "lucide-react";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { Artist } from "libs/types/common";
import { CollectibleMetadataModal } from "./CollectibleMetadataModal";

interface ArtistListProps {
  artists: Artist[];
  onArtistSelect: (artistId: string, artistName: string) => void;
}

export const ArtistList: React.FC<ArtistListProps> = ({ artists, onArtistSelect }) => {
  // Collectible metadata modal state
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string>("");
  const [selectedCollectibleTier, setSelectedCollectibleTier] = useState<string>("");
  const [selectedArtistTitle, setSelectedArtistTitle] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const handleAddAlbum = (artistId: string, artistName: string) => {
    // TODO: Implement add album functionality
    console.log(`Add album for artist: ${artistName} (${artistId})`);
  };

  const handleViewCollectibleMetadata = async (artistName: string, artistId: string, creatorPaymentsWallet: string, tier: string) => {
    const collectibleId = `${creatorPaymentsWallet}-${artistId}-${tier}`;
    setSelectedCollectibleId(collectibleId);
    setSelectedArtistTitle(artistName);
    setSelectedCollectibleTier(tier || "");
    setIsCollectibleModalOpen(true);
    setSelectedArtist(artists.find((artist) => artist.artistId === artistId) || null);
  };

  const handleCloseCollectibleModal = () => {
    setIsCollectibleModalOpen(false);
    setSelectedCollectibleId("");
    setSelectedCollectibleTier("");
    setSelectedArtist(null);
  };

  const handleCollectibleMetadataUpdated = () => {
    // Optionally refresh any data if needed
    console.log("Collectible metadata updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Music Catalog</h2>
          <p className="text-gray-600 mt-1">Manage artists and their albums</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {artists.length} Artists
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <Card key={artist.artistId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{artist.name}</h3>
                <a href={`/?artist=${artist.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 mb-2 hover:underline">
                  <p className="text-sm text-gray-500 mb-2">@{artist.slug}</p>
                </a>
                <p className="text-sm text-gray-500 mb-2">{artist.artistId}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {artist.creatorPaymentsWallet && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span className="font-mono text-xs">
                        {artist.creatorPaymentsWallet.slice(0, 6)}...{artist.creatorPaymentsWallet.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {artist.artistCampaignCode && (
              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  Campaign: {artist.artistCampaignCode}
                </Badge>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => handleViewCollectibleMetadata(artist.name, artist.artistId, artist.creatorPaymentsWallet, "t1")}
                variant="outline"
                className="w-full">
                <Tag className="w-4 h-4 mr-2" />
                View Basic Fan Collectible Metadata
              </Button>
              <div className="flex space-x-2">
                <Button onClick={() => onArtistSelect(artist.artistId, artist.name)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  View Albums
                </Button>
                <Button
                  onClick={() => handleAddAlbum(artist.artistId, artist.name)}
                  variant="outline"
                  size="sm"
                  className="opacity-10 pointer-events-none px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {artists.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Artists Found</h3>
          <p className="text-gray-600">No artists are currently available in the catalog.</p>
        </div>
      )}

      <CollectibleMetadataModal
        isOpen={isCollectibleModalOpen}
        onClose={handleCloseCollectibleModal}
        collectibleTitle={selectedArtistTitle}
        collectibleId={selectedCollectibleId}
        collectibleTier={selectedCollectibleTier}
        selectedArtist={selectedArtist}
        isFanCollectible={true}
        onMetadataUpdated={handleCollectibleMetadataUpdated}
      />
    </div>
  );
};
