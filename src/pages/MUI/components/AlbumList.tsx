import React, { useState, useEffect } from "react";
import { Plus, Music, Tag, Eye, Edit } from "lucide-react";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { Artist, MusicTrack } from "libs/types/common";
import { Album } from "libs/types/common";

// Extended Album type with source tracking
interface AlbumWithSource extends Album {
  source: "db" | "indexed";
}
import { CollectibleMetadataModal } from "./CollectibleMetadataModal";
import { TrackListModal } from "./TrackListModal";
import { adminApi } from "../services";
import { FastStreamTrack } from "libs/types";
import { generateNextAlbumId } from "pages/BodySections/HomeSection/Account/ArtistProfile";
import { EditAlbumModal } from "pages/BodySections/HomeSection/Account/EditAlbumModal";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { AlbumFormData } from "pages/BodySections/HomeSection/Account/EditAlbumModal";
import { useAccountStore } from "store/account";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { updateAlbumOnBackEndAPI, toastSuccess, toastError, getAlbumFromDBViaAPI, getAlbumTracksFromDBViaAPI } from "libs/utils";

interface AlbumListProps {
  indexedAlbums: Album[];
  artistName: string;
  artistId: string;
  selectedArtist: Artist;
}

export const AlbumList: React.FC<AlbumListProps> = ({ indexedAlbums, artistName, artistId, selectedArtist }) => {
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<FastStreamTrack[]>([]);
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState<string>("");
  const [selectedAlbumImg, setSelectedAlbumImg] = useState<string>("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isTrackListModalOpen, setIsTrackListModalOpen] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // albums management
  const [selectedAlbumArtist, setSelectedAlbumArtist] = useState<Artist | null>(null);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState<boolean>(false);
  const [selectedAlbumForEdit, setSelectedAlbumForEdit] = useState<Album | null>(null);
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);
  const [myAlbums, setMyAlbums] = useState<AlbumWithSource[]>([]);

  // Collectible metadata modal state
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string>("");
  const [selectedCollectibleTier, setSelectedCollectibleTier] = useState<string>("");

  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();

  useEffect(() => {
    setSelectedAlbumArtist(selectedArtist);
  }, [selectedArtist]);

  useEffect(() => {
    // get their albums from the DB as well
    if (artistId) {
      setAlbumsLoading(true);
      getAlbumFromDBViaAPI(artistId).then((dbAlbums) => {
        // Add source tracking to distinguish between DB and indexed albums
        const dbAlbumsWithSource: AlbumWithSource[] = dbAlbums.map((album: Album) => ({ ...album, source: "db" }));
        const indexedAlbumsWithSource: AlbumWithSource[] = indexedAlbums.map((album: Album) => ({ ...album, source: "indexed" }));
        setMyAlbums([...dbAlbumsWithSource, ...indexedAlbumsWithSource]); // merge the DB albums AND the JSON index file albums
        setAlbumsLoading(false);
      });
    }
  }, [indexedAlbums, selectedArtist, artistId]);

  const handleViewCollectibleMetadata = async (albumId: string, albumTitle: string, tier?: string) => {
    const collectibleId = tier ? `${albumId}_${tier}` : albumId;
    setSelectedCollectibleId(collectibleId);
    setSelectedAlbumTitle(albumTitle);
    setSelectedCollectibleTier(tier || "");
    setIsCollectibleModalOpen(true);
  };

  const handleViewCurrentTracks = async (albumId: string, albumTitle: string, albumImg: string) => {
    setIsLoadingTracks(true);
    try {
      const albumTracksFromDb: FastStreamTrack[] = await getAlbumTracksFromDBViaAPI(artistId, albumId, true, true);

      if (albumTracksFromDb.length > 0) {
        setSelectedAlbumTracks(albumTracksFromDb);
      } else {
        setSelectedAlbumTracks([]);
      }

      setSelectedAlbumTitle(albumTitle);
      setSelectedAlbumId(albumId);
      setSelectedAlbumImg(albumImg);
      setIsTrackListModalOpen(true);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleCloseModal = () => {
    setIsTrackListModalOpen(false);
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

  const handleAddNewAlbum = () => {
    // Generate a new album ID
    const newAlbumId = generateNextAlbumId(artistId, myAlbums);

    // Create a placeholder album for the new album
    const newAlbum: Album = {
      albumId: newAlbumId,
      solNftName: "",
      title: "",
      desc: "",
      ctaPreviewStream: "",
      ctaBuy: "",
      bountyId: "",
      img: "",
      isExplicit: "0",
      isPodcast: "0",
      isPublished: "0",
      isFeatured: "0",
      isSigmaRemixAlbum: "0",
    };

    setSelectedAlbumForEdit(newAlbum);
    setShowEditAlbumModal(true);
  };

  const handleAlbumSave = async (albumData: AlbumFormData): Promise<boolean> => {
    if (!selectedAlbumForEdit) {
      return false;
    }

    try {
      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      const albumDataToSave = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        adminWallet: publicKey?.toBase58() || "",
        artistId: artistId,
        albumId: selectedAlbumForEdit.albumId,
        albumFieldsObject: {
          title: albumData.title,
          desc: albumData.desc,
          img: albumData.img,
          isExplicit: albumData.isExplicit,
          isPodcast: albumData.isPodcast,
          isPublished: albumData.isPublished,
          albumPriceOption1: albumData.albumPriceOption1,
          albumPriceOption2: albumData.albumPriceOption2,
          albumPriceOption3: albumData.albumPriceOption3,
          albumPriceOption4: albumData.albumPriceOption4,
        },
      };

      const response = await updateAlbumOnBackEndAPI(albumDataToSave);

      if (response.updated && response.fullAlbumData) {
        // Update existing album locally in myAlbums
        setMyAlbums((prevAlbums) =>
          prevAlbums.map((album) => (album.albumId === selectedAlbumForEdit.albumId ? { ...album, ...response.fullAlbumData } : album))
        );
        toastSuccess("Album updated successfully", true);
      } else if (response.created && response.fullAlbumData) {
        // Add new album to myAlbums
        setMyAlbums((prevAlbums) => [...prevAlbums, response.fullAlbumData]);
        toastSuccess("Album created successfully", true);
      } else {
        throw new Error("Failed to save album");
      }

      return true;
    } catch (error) {
      console.error("Error saving album:", error);
      toastError("Error saving album - " + (error as Error).message, true);
      return false;
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
            <Badge variant="secondary" className="">
              {myAlbums.length} Albums
            </Badge>
          </div>
        </div>

        <div className="flex justify-start">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-all duration-200" onClick={handleAddNewAlbum}>
            Add New Album
          </Button>
        </div>

        {albumsLoading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Albums...</h3>
          </div>
        )}

        {!albumsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAlbums.map((album) => (
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
                      <Badge variant={album?.isPublished === "1" ? "default" : "secondary"} className="text-xs">
                        {album?.isPublished === "1" ? "Published" : "Draft"}
                      </Badge>
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
                    onClick={() => handleViewCurrentTracks(album.albumId, album.title, album.img)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoadingTracks}>
                    <Eye className="w-4 h-4 mr-2" />
                    {isLoadingTracks ? "Loading..." : "Add/Edit Tracks"}
                  </Button>

                  {album.source === "db" && (
                    <Button
                      onClick={() => {
                        setSelectedAlbumForEdit(album);
                        setShowEditAlbumModal(true);
                      }}
                      variant="outline"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Album
                    </Button>
                  )}

                  <Button
                    onClick={() => handleViewCollectibleMetadata(album.albumId, album.title)}
                    variant="outline"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Tag className="w-4 h-4 mr-2" />
                    Non-Commercial Collectible Metadata
                  </Button>

                  <Button
                    onClick={() => handleViewCollectibleMetadata(album.albumId, album.title, "t2")}
                    variant="outline"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Tag className="w-4 h-4 mr-2" />
                    Commercial Collectible Metadata
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!albumsLoading && myAlbums.length === 0 && (
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
        isOpen={isTrackListModalOpen}
        isNonMUIMode={false}
        onClose={handleCloseModal}
        tracks={selectedAlbumTracks}
        albumTitle={selectedAlbumTitle}
        artistId={artistId}
        albumId={selectedAlbumId}
        albumImg={selectedAlbumImg}
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

      {/* Add / Edit Album Modal */}
      {selectedAlbumForEdit && (
        <EditAlbumModal
          isOpen={showEditAlbumModal}
          onClose={() => {
            setShowEditAlbumModal(false);
            setSelectedAlbumForEdit(null);
          }}
          onSave={handleAlbumSave}
          initialData={{
            albumId: selectedAlbumForEdit.albumId || "",
            title: selectedAlbumForEdit.title || "",
            desc: selectedAlbumForEdit.desc || "",
            img: selectedAlbumForEdit.img || "",
            isExplicit: selectedAlbumForEdit.isExplicit || "0",
            isPodcast: selectedAlbumForEdit.isPodcast || "0",
            isPublished: selectedAlbumForEdit.isPublished || "0",
            albumPriceOption1: selectedAlbumForEdit.albumPriceOption1 || "",
            albumPriceOption2: selectedAlbumForEdit.albumPriceOption2 || "",
            albumPriceOption3: selectedAlbumForEdit.albumPriceOption3 || "",
            albumPriceOption4: selectedAlbumForEdit.albumPriceOption4 || "",
          }}
          albumTitle={selectedAlbumForEdit.title || ""}
          isNewAlbum={!selectedAlbumForEdit.title} // If no title, it's a new album
        />
      )}
    </>
  );
};
