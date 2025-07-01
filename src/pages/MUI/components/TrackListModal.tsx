import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Music, Play, Plus, X } from "lucide-react";
import { ALL_MUSIC_GENRES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { Input } from "libComponents/Input";
import { Switch } from "libComponents/Switch";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { useAccountStore } from "store/account";
import { Modal } from "./Modal";
import { adminApi, FastStreamTrack } from "../services";

interface TrackListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: FastStreamTrack[];
  albumTitle: string;
  artistId: string;
  albumId: string;
  onTracksUpdated: () => void;
}

interface TrackFormData {
  idx: number;
  arId: string;
  alId: string;
  bonus: number;
  category: string;
  cover_art_url: string;
  file: string;
  title: string;
}

export const TrackListModal: React.FC<TrackListModalProps> = ({ isOpen, onClose, tracks, albumTitle, artistId, albumId, onTracksUpdated }) => {
  const [isFormView, setIsFormView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>({
    idx: -1,
    arId: artistId,
    alId: `${albumId}-X`,
    bonus: 0,
    category: "",
    cover_art_url: "",
    file: "",
    title: "",
  });
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();

  useEffect(() => {
    setFormData({
      idx: -1,
      arId: artistId,
      alId: `${albumId}-X`,
      bonus: 0,
      category: "",
      cover_art_url: "",
      file: "",
      title: "",
    });

    setIsFormView(false);
  }, [artistId, albumId]);

  const handleAddTrackToFastStream = () => {
    setIsFormView(true);
  };

  const handleCancelForm = () => {
    setIsFormView(false);
    setFormData({
      idx: -1,
      arId: artistId,
      alId: `${albumId}-X`,
      bonus: 0,
      category: "",
      cover_art_url: "",
      file: "",
      title: "",
    });
  };

  const handleFormChange = (field: keyof TrackFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Update alId when idx changes
      if (field === "idx") {
        updated.alId = `${albumId}-${value}`;
      }

      return updated;
    });
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.category.trim()) return "At least one genre is required";
    if (!formData.cover_art_url.trim()) return "Cover art URL is required";
    if (!formData.file.trim()) return "File URL is required";
    if (formData.idx <= 0) return "Track number must be positive";

    // Validate that we have at least one genre and no more than 5
    const selectedGenres = formData.category
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    if (selectedGenres.length === 0) return "At least one genre is required";
    if (selectedGenres.length > 5) return "Maximum 5 genres allowed";

    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    try {
      // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
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

      const payloadToSave = { ...formData, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce, adminWallet: publicKey?.toBase58() };

      // log the track to the web2 API
      const response = await adminApi.fastStream.addNewFastStreamTracksForAlbum(payloadToSave);

      if (response.success) {
        setIsFormView(false);
        onTracksUpdated(); // Refresh the track list
        setFormData({
          idx: -1,
          arId: artistId,
          alId: `${albumId}-1`,
          bonus: 0,
          category: "",
          cover_art_url: "",
          file: "",
          title: "",
        });
      } else {
        alert(`Error: ${response.error || "Failed to add track"}`);
      }
    } catch (err) {
      console.error("Error adding track:", err);
      alert("Failed to add track. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Add New Track</h3>
          <p className="text-gray-600">Fill in the track details below</p>
        </div>
        <Button onClick={handleCancelForm} variant="outline" size="sm">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Track Number *</label>
          <Input type="number" min="1" value={formData.idx} onChange={(e) => handleFormChange("idx", parseInt(e.target.value) || 1)} placeholder="1" required />
        </div>

        {/* Artist ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Artist ID</label>
          <Input value={formData.arId} disabled className="bg-gray-800" />
        </div>

        {/* Album Track ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Album Track ID</label>
          <Input value={formData.alId} disabled className="bg-gray-800" />
        </div>

        {/* Bonus Track Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Track</label>
          <div className="flex items-center space-x-2">
            <Switch checked={formData.bonus === 1} onCheckedChange={(checked) => handleFormChange("bonus", checked ? 1 : 0)} />
            <span className="text-sm text-gray-600">{formData.bonus === 1 ? "Yes" : "No"}</span>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Genres * (Select up to 5)</label>
          <div className="border border-gray-300 rounded-md p-3 bg-gray-800 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALL_MUSIC_GENRES.map((genre) => {
                const selectedGenres = formData.category ? formData.category.split(",").map((g) => g.trim()) : [];
                const isSelected = selectedGenres.includes(genre.code);
                const canSelect = isSelected || selectedGenres.length < 5;

                return (
                  <label
                    key={genre.code}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-gray-700"
                    } ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentGenres = formData.category ? formData.category.split(",").map((g) => g.trim()) : [];
                        let newGenres;

                        if (e.target.checked) {
                          newGenres = [...currentGenres, genre.code];
                        } else {
                          newGenres = currentGenres.filter((g) => g !== genre.code);
                        }

                        handleFormChange("category", newGenres.join(", "));
                      }}
                      disabled={!canSelect && !isSelected}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{genre.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {formData.category && <div className="mt-2 text-sm text-gray-600">Selected: {formData.category}</div>}
        </div>

        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Track Title *</label>
          <Input value={formData.title} onChange={(e) => handleFormChange("title", e.target.value)} placeholder="Enter track title" required />
        </div>

        {/* Cover Art URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Art URL *</label>
          <Input
            value={formData.cover_art_url}
            onChange={(e) => handleFormChange("cover_art_url", e.target.value)}
            placeholder="https://example.com/cover-art.jpg"
            required
          />
        </div>

        {/* File URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Audio File URL *</label>
          <Input value={formData.file} onChange={(e) => handleFormChange("file", e.target.value)} placeholder="https://example.com/audio-file.mp3" required />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
          {isSubmitting ? "Saving..." : "Save Track"}
        </Button>
      </div>
    </div>
  );

  const renderTrackListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">Current fast stream tracks for this album</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {tracks.length} Tracks
          </Badge>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track, index) => (
            <Card key={`${track.alId}-${index}`} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                {track.cover_art_url && (
                  <div className="flex-shrink-0">
                    <img src={track.cover_art_url} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{track.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">Track #{track.idx}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center space-x-1">
                          <Music className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 truncate">{track.category}</span>
                        </div>
                        {track.bonus > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Bonus
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Button onClick={() => window.open(track.file, "_blank")} variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracks Found</h3>
          <p className="text-gray-600">No fast stream tracks are currently available for this album.</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleAddTrackToFastStream} className="w-full bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Track to Fast Stream
        </Button>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${albumTitle} - Fast Stream Tracks`} size="lg">
      {isFormView ? renderFormView() : renderTrackListView()}
    </Modal>
  );
};
