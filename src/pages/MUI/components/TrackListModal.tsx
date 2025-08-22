import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Music, Play, Plus, X, Edit } from "lucide-react";
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
import { adminApi } from "../services";
import { FastStreamTrack } from "libs/types";

interface TrackListModalProps {
  isOpen: boolean;
  isNonMUIMode?: boolean;
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

export const TrackListModal: React.FC<TrackListModalProps> = ({ isOpen, isNonMUIMode, onClose, tracks, albumTitle, artistId, albumId, onTracksUpdated }) => {
  const [isFormView, setIsFormView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
  const [errors, setErrors] = useState<Partial<TrackFormData>>({});
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();
  const [trackIdxListSoFar, setTrackIdxListSoFar] = useState<string>("");
  const [trackIdxNextGuess, setTrackIdxNextGuess] = useState<number>(1);

  useEffect(() => {
    setFormData({
      idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
      arId: artistId,
      alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
      bonus: 0,
      category: "",
      cover_art_url: "",
      file: "",
      title: "",
    });
    setErrors({});
    setIsEditing(false);
    setIsFormView(false);
  }, [artistId, albumId, trackIdxNextGuess]);

  useEffect(() => {
    if (tracks.length > 0) {
      setTrackIdxListSoFar(tracks.map((track) => track.idx).join(","));
      setTrackIdxNextGuess(tracks.length + 1);
    }
  }, [tracks]);

  const handleAddTrackToFastStream = () => {
    setIsEditing(false);
    setIsFormView(true);
  };

  const handleEditTrack = (track: FastStreamTrack) => {
    setIsEditing(true);
    setFormData({
      idx: track.idx,
      arId: track.arId || artistId,
      alId: track.alId || `${albumId}-${track.idx}`,
      bonus: track.bonus || 0,
      category: track.category || "",
      cover_art_url: track.cover_art_url || "",
      file: track.file || "",
      title: track.title || "",
    });
    setErrors({});
    setIsFormView(true);
  };

  const handleCancelForm = () => {
    setIsFormView(false);
    setIsEditing(false);
    setIsSubmitting(false);
    setFormData({
      idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
      arId: artistId,
      alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
      bonus: 0,
      category: "",
      cover_art_url: "",
      file: "",
      title: "",
    });
    setErrors({});
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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TrackFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "At least one genre is required";
    } else {
      // Validate that we have at least one genre and no more than 5
      const selectedGenres = formData.category
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g.length > 0);
      if (selectedGenres.length === 0) {
        newErrors.category = "At least one genre is required";
      } else if (selectedGenres.length > 5) {
        newErrors.category = "Maximum 5 genres allowed";
      }
    }

    if (!formData.cover_art_url.trim()) {
      newErrors.cover_art_url = "Cover art URL is required";
    } else if (!formData.cover_art_url.startsWith("https://")) {
      newErrors.cover_art_url = "Cover art URL must start with https://";
    }

    if (!formData.file.trim()) {
      newErrors.file = "Audio file URL is required";
    } else if (!formData.file.startsWith("https://")) {
      newErrors.file = "Audio file URL must start with https://";
    } else if (!formData.file.toLowerCase().endsWith(".mp3")) {
      newErrors.file = "Audio file must have .mp3 extension";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
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

      const payloadToSave: any = { ...formData, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce };

      if (!isNonMUIMode) {
        payloadToSave.adminWallet = publicKey?.toBase58() || "";
      }

      let response;
      if (isEditing) {
        // Update existing track
        response = await adminApi.fastStream.addOrUpdateFastStreamTracksForAlbum(payloadToSave);
      } else {
        // Add new track
        response = await adminApi.fastStream.addOrUpdateFastStreamTracksForAlbum(payloadToSave);
      }

      if (response.success) {
        setIsFormView(false);
        setIsEditing(false);
        onTracksUpdated(); // Refresh the track list
        setFormData({
          idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
          arId: artistId,
          alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
          bonus: 0,
          category: "",
          cover_art_url: "",
          file: "",
          title: "",
        });
        setErrors({});
      } else {
        alert(`Error: ${response.error || `Failed to ${isEditing ? "update" : "add"} track`}`);
      }
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} track:`, err);
      alert(`Failed to ${isEditing ? "update" : "add"} track. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNewTrackFormView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{isEditing ? "Edit Track" : "Add New Track"}</h3>
          <p className="text-gray-600">{isEditing ? "Update the track details below" : "Fill in the track details below"}</p>
        </div>
        <Button onClick={handleCancelForm} variant="outline" size="sm">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track Number <span className="text-red-400">*</span>
          </label>
          <Input
            type="number"
            min="1"
            value={formData.idx}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              handleFormChange("idx", isNaN(value) ? 1 : value);
            }}
            placeholder="1"
            required
            disabled={isEditing}
            className={errors.idx ? "border-red-500" : ""}
          />
          {errors.idx && <p className="text-red-400 text-sm mt-1">{errors.idx}</p>}
          {!isEditing && (
            <span className="text-xs text-gray-600">track numbers used so far (make sure it's in sequence with no duplicates): {trackIdxListSoFar}</span>
          )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genres <span className="text-red-400">*</span> (Select up to 5)
          </label>
          <div className={`border rounded-md p-3 bg-gray-800 max-h-48 overflow-y-auto ${errors.category ? "border-red-500" : "border-gray-300"}`}>
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
          {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
          {formData.category && <div className="mt-2 text-sm text-gray-600">Selected: {formData.category}</div>}
        </div>

        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track Title <span className="text-red-400">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
            placeholder="Enter track title"
            required
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Cover Art URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Art URL <span className="text-red-400">*</span>
          </label>
          <Input
            value={formData.cover_art_url}
            onChange={(e) => handleFormChange("cover_art_url", e.target.value)}
            placeholder="https://example.com/cover-art.jpg"
            required
            className={errors.cover_art_url ? "border-red-500" : ""}
          />
          {errors.cover_art_url && <p className="text-red-400 text-sm mt-1">{errors.cover_art_url}</p>}
          <p className="text-gray-400 text-sm mt-1">Must be a valid HTTPS URL</p>
        </div>

        {/* File URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Audio File URL <span className="text-red-400">*</span>
          </label>
          <Input
            value={formData.file}
            onChange={(e) => handleFormChange("file", e.target.value)}
            placeholder="https://example.com/audio-file.mp3"
            required
            className={errors.file ? "border-red-500" : ""}
          />
          {errors.file && <p className="text-red-400 text-sm mt-1">{errors.file}</p>}
          <p className="text-gray-400 text-sm mt-1">Must be a valid HTTPS URL with .mp3 extension</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSubmitting} className="bg-yellow-300 text-black hover:bg-yellow-400">
          {isSubmitting ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update Track" : "Save Track"}
        </Button>
      </div>
    </div>
  );

  const renderTrackListView = () => (
    <div className="space-y-4">
      {tracks.length > 0 && (
        <div className="flex items-end justify-end mb-6">
          <Badge variant="secondary">{tracks.length} Tracks</Badge>
        </div>
      )}

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
                    <div className="flex-shrink-0 ml-2 flex space-x-1">
                      <Button onClick={() => handleEditTrack(track)} variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
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
          <p className="text-gray-600">No tracks are currently available for this album.</p>
        </div>
      )}

      <div className="flex justify-end space-x-3  p-6items-center border-t border-gray-700 pt-4">
        <Button
          onClick={onClose}
          variant="outline"
          className={`border-gray-600 text-white hover:bg-gray-800 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
          Cancel
        </Button>

        <Button
          onClick={handleAddTrackToFastStream}
          className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Track
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleCancelForm();
        onClose();
      }}
      title={`${albumTitle} - Tracks`}
      size="lg">
      {isFormView ? renderNewTrackFormView() : renderTrackListView()}
    </Modal>
  );
};
