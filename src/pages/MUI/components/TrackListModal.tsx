import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Music, Plus, X, Edit, Loader2, Trash, Recycle, ArrowUp, ArrowDown } from "lucide-react";
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
import { FastStreamTrack, MusicTrack } from "libs/types";
import { MediaUpdate } from "libComponents/MediaUpdate";
import { saveMediaToServerViaAPI, saveSongMediaViaAPI } from "libs/utils/api";
import { toastError, toastSuccess } from "libs/utils/ui";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { usePreventScroll } from "hooks";
import ratingE from "assets/img/icons/rating-E.png";

interface TrackListModalProps {
  isOpen: boolean;
  isNonMUIMode?: boolean;
  tracks: FastStreamTrack[];
  albumTitle: string;
  artistId: string;
  albumId: string;
  albumImg: string;
  albumIsPublished?: string;
  preloadExistingTrackToAlbum?: MusicTrack | null;
  onClose: () => void;
  onTracksUpdated: () => void;
}

interface TrackFormData {
  idx: number;
  displayidx: number;
  arId: string;
  alId: string;
  bonus: number;
  category: string;
  cover_art_url: string;
  file: string;
  title: string;
  isExplicit: string;
}

export const TrackListModal: React.FC<TrackListModalProps> = ({
  isOpen,
  isNonMUIMode,
  tracks,
  albumTitle,
  artistId,
  albumId,
  albumImg,
  albumIsPublished,
  preloadExistingTrackToAlbum,
  onClose,
  onTracksUpdated,
}) => {
  const { publicKey, walletType } = useSolanaWallet();
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { signMessage } = useWallet();
  const addressSol = publicKey?.toBase58();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  const [isFormView, setIsFormView] = useState(false);
  const [isReorderView, setIsReorderView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>({
    idx: -1,
    displayidx: -1,
    arId: artistId,
    alId: `${albumId}-X`,
    bonus: 0,
    category: "",
    cover_art_url: albumImg || "",
    file: "",
    title: "",
    isExplicit: "",
  });
  const [errors, setErrors] = useState<Partial<TrackFormData>>({});
  const [trackIdxListSoFar, setTrackIdxListSoFar] = useState<string>("");
  const [trackIdxNextGuess, setTrackIdxNextGuess] = useState<number>(1);
  const [trackDisplayIdxListSoFar, setTrackDisplayIdxListSoFar] = useState<string>("");
  const [trackDisplayIdxNextGuess, setTrackDisplayIdxNextGuess] = useState<number>(1);
  const [newSelectedTrackCoverArtFile, setNewSelectedTrackCoverArtFile] = useState<File | null>(null);
  const [newSelectedAudioFile, setNewSelectedAudioFile] = useState<File | null>(null);
  const [isDeletingTrackId, setIsDeletingTrackId] = useState<string>("");
  const [agreeToTermsOfLaunchMusic, setAgreeToTermsOfLaunchMusic] = useState(false);
  const [reorderedTracks, setReorderedTracks] = useState<(FastStreamTrack & { _displayIdxNew: number })[]>([]);
  const [supportTrackReordering, setSupportTrackReordering] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  usePreventScroll(); // Prevent scrolling on non-mobile screens on view

  useEffect(() => {
    let titleToUse = "";
    let fileToUse = "";
    let coverArtUrlToUse = albumImg || "";
    let categoryToUse = "";
    let isExplicitToUse = "";

    if (preloadExistingTrackToAlbum) {
      titleToUse = preloadExistingTrackToAlbum.title || "";
      fileToUse = preloadExistingTrackToAlbum.stream || "";
      coverArtUrlToUse = preloadExistingTrackToAlbum.cover_art_url || "";
      categoryToUse = preloadExistingTrackToAlbum.category || "";
      isExplicitToUse = preloadExistingTrackToAlbum.isExplicit || "";
    }

    setFormData({
      idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
      displayidx: trackDisplayIdxNextGuess > 0 ? trackDisplayIdxNextGuess : 1,
      arId: artistId,
      alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
      bonus: 0,
      category: categoryToUse,
      cover_art_url: coverArtUrlToUse,
      file: fileToUse,
      title: titleToUse,
      isExplicit: isExplicitToUse,
    });

    setErrors({});
    setIsEditing(false);
    setNewSelectedTrackCoverArtFile(null);
    setNewSelectedAudioFile(null);
    setAgreeToTermsOfLaunchMusic(false);
    setIsReorderView(false);

    if (preloadExistingTrackToAlbum) {
      setIsFormView(true);
    } else {
      setIsFormView(false);
    }
  }, [artistId, albumId, trackIdxNextGuess, preloadExistingTrackToAlbum]);

  useEffect(() => {
    if (tracks.length > 0) {
      // work out next idx
      const trackListIdxList = tracks.map((track) => track.idx);
      setTrackIdxListSoFar(trackListIdxList.join(","));

      const nextHighestIdx = Math.max(...trackListIdxList);
      setTrackIdxNextGuess(nextHighestIdx + 1);

      // work out next display idx
      const trackListDisplayIdxList = tracks.map((track) => track.displayidx);
      setTrackDisplayIdxListSoFar(trackListDisplayIdxList.join(","));

      const nextHighestDisplayIdx = Math.max(...trackListDisplayIdxList);
      setTrackDisplayIdxNextGuess(nextHighestDisplayIdx + 1);

      // if all the tracks have a displayIdx prop then we support track reordering
      if (tracks.every((track) => typeof track.displayidx === "number")) {
        setSupportTrackReordering(true);
      } else {
        setSupportTrackReordering(false);
      }
    } else {
      setTrackIdxListSoFar("");
      setTrackIdxNextGuess(1);
      setTrackDisplayIdxListSoFar("");
      setTrackDisplayIdxNextGuess(1);
      setSupportTrackReordering(true); // it's a new album, so we support track reordering
    }
  }, [tracks]);

  // Initialize reordered tracks with _displayIdxNew
  useEffect(() => {
    const clonedTracks = tracks.map((track) => ({
      ...track,
      _displayIdxNew: track.displayidx || track.idx,
    }));

    setReorderedTracks(clonedTracks);
  }, [tracks]);

  const handleAddTrackToFastStream = () => {
    setIsEditing(false);
    setIsFormView(true);
  };

  const handleEditTrack = (track: FastStreamTrack) => {
    setIsEditing(true);
    setFormData({
      idx: track.idx,
      displayidx: track.displayidx,
      arId: track.arId || artistId,
      alId: track.alId || `${albumId}-${track.idx}`,
      bonus: track.bonus || 0,
      category: track.category || "",
      cover_art_url: track.cover_art_url || "",
      file: track.file || "",
      title: track.title || "",
      isExplicit: track.isExplicit || "",
    });
    setErrors({});
    setIsFormView(true);
  };

  const handleDeleteTrack = async (arId: string, alId: string, recoverTrack: boolean = false) => {
    setIsDeletingTrackId(alId);

    try {
      // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      // S: if new img and  or mp3 files are selected we need to save that to the media server and get back a https url
      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to valid signature to prove account ownership");
      }

      // "1" for hide, "2" for delete (you an only for 2 if the album has never been published before)
      const payloadToSave: any = {
        arId,
        alId,
        hideOrDelete: albumIsPublished === "1" ? "1" : "2",
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
      };

      // a user can recover a track that was previously deleted or hidden, we just set the older value of hideOrDelete to 0
      if (recoverTrack) {
        payloadToSave.hideOrDelete = "0";
      }

      if (!isNonMUIMode) {
        payloadToSave.adminWallet = publicKey?.toBase58() || "";
      }

      // "1" for hide, "2" for delete (you an only for 2 if the album has never been published before)
      const response = await adminApi.fastStream.deleteOrHideTrack(payloadToSave);

      if (response.success) {
        onTracksUpdated();

        if (recoverTrack) {
          toastSuccess("Track recovered successfully");
        } else {
          toastSuccess(`Track ${albumIsPublished === "1" ? "hidden" : "deleted"} successfully`);
        }
      } else {
        toastError("Error deleting track: " + response.error);
      }
    } catch (error) {
      toastError("Error deleting track: " + (error as Error)?.message);
    } finally {
      setIsDeletingTrackId("");
    }
  };

  const handleCancelForm = () => {
    setIsFormView(false);
    setIsReorderView(false);
    setIsEditing(false);
    setIsSubmitting(false);
    setFormData({
      idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
      displayidx: trackDisplayIdxNextGuess > 0 ? trackDisplayIdxNextGuess : 1,
      arId: artistId,
      alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
      bonus: 0,
      category: "",
      cover_art_url: albumImg || "",
      file: "",
      title: "",
      isExplicit: "",
    });

    setErrors({});
    setNewSelectedTrackCoverArtFile(null);
    setNewSelectedAudioFile(null);
    setAgreeToTermsOfLaunchMusic(false);
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

    if (!formData.cover_art_url.trim() && !newSelectedTrackCoverArtFile) {
      newErrors.cover_art_url = "Cover art URL is required";
    }

    // check if the cover art image is less than 3MB
    if (newSelectedTrackCoverArtFile) {
      if (newSelectedTrackCoverArtFile.size > 3 * 1024 * 1024) {
        newErrors.cover_art_url = "Cover art image must be less than 3MB";
      }

      // Validate file type
      const fileName = newSelectedTrackCoverArtFile.name.toLowerCase();
      const validExtensions = [".gif", ".png", ".jpg", ".jpeg"];
      const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasValidExtension) {
        newErrors.cover_art_url = "Cover art must be a GIF, PNG, or JPG file";
      }
    }

    if (!formData.file.trim() && !newSelectedAudioFile) {
      newErrors.file = "Audio file is required";
    }

    // check if the audio file is less than 10MB
    if (newSelectedAudioFile) {
      if (newSelectedAudioFile.size > 10 * 1024 * 1024) {
        newErrors.file = "Audio file must be less than 10MB";
      }

      // Validate file type for audio
      const fileName = newSelectedAudioFile.name.toLowerCase();
      if (!fileName.endsWith(".mp3")) {
        newErrors.file = "Audio file must be an MP3 file";
      }
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
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      // S: if new img and  or mp3 files are selected we need to save that to the media server and get back a https url
      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to valid signature to prove account ownership");
      }

      if (addressSol) {
        if (newSelectedTrackCoverArtFile) {
          try {
            const fileUploadResponse = await saveMediaToServerViaAPI({
              file: newSelectedTrackCoverArtFile,
              solSignature: solPreaccessSignature,
              signatureNonce: solPreaccessNonce,
              creatorWallet: addressSol,
            });

            if (fileUploadResponse) {
              formData.cover_art_url = fileUploadResponse;
            } else {
              toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
              return;
            }
          } catch (error) {
            toastError("Error uploading cover art image: " + (error as Error)?.message);
            return;
          }
        }

        if (newSelectedAudioFile) {
          try {
            const fileUploadResponse = await saveSongMediaViaAPI({
              file: newSelectedAudioFile,
              solSignature: solPreaccessSignature,
              signatureNonce: solPreaccessNonce,
              creatorWallet: addressSol,
              fileType: newSelectedAudioFile.type,
              fileName: newSelectedAudioFile.name,
              fileSize: newSelectedAudioFile.size,
            });

            if (fileUploadResponse) {
              formData.file = fileUploadResponse;
            } else {
              toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
              return;
            }
          } catch (error) {
            toastError("Error uploading audio file: " + (error as Error)?.message);
            return;
          }
        }
      }

      const formDataToSave: Partial<TrackFormData> = { ...formData };

      // if isExplicit is "" (i.e its not an explicit track) then we remove it before saving as we dont need to save in db
      if (formData.isExplicit === "") {
        delete formDataToSave.isExplicit;
      }

      const payloadToSave: any = { ...formDataToSave, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce };

      if (!isNonMUIMode) {
        payloadToSave.adminWallet = publicKey?.toBase58() || "";
      }

      const response = await adminApi.fastStream.addOrUpdateFastStreamTracksForAlbum(payloadToSave);

      if (response.success) {
        setIsFormView(false);
        setIsEditing(false);
        onTracksUpdated(); // Refresh the track list
        setFormData({
          idx: trackIdxNextGuess > 0 ? trackIdxNextGuess : 1,
          displayidx: trackDisplayIdxNextGuess > 0 ? trackDisplayIdxNextGuess : 1,
          arId: artistId,
          alId: `${albumId}-${trackIdxNextGuess > 0 ? trackIdxNextGuess : 1}`,
          bonus: 0,
          category: "",
          cover_art_url: albumImg || "",
          file: "",
          title: "",
          isExplicit: "",
        });
        setErrors({});

        toastSuccess("Tracks updated successfully");
      } else {
        toastError(`Error: ${response.error || `Failed to ${isEditing ? "update" : "add"} track`}`);
      }
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} track:`, err);
      toastError(`Failed to ${isEditing ? "update" : "add"} track. Please try again.`);
    } finally {
      setIsSubmitting(false);
      setNewSelectedTrackCoverArtFile(null);
      setNewSelectedAudioFile(null);
      setAgreeToTermsOfLaunchMusic(false);
      setIsReorderView(false);
    }
  };

  const handleMoveTrackUp = (index: number) => {
    if (index === 0) return; // Can't move first track up

    const newTracks = [...reorderedTracks];
    const currentTrack = newTracks[index];
    const previousTrack = newTracks[index - 1];

    // Swap _displayIdxNew values
    const tempDisplayIdx = currentTrack._displayIdxNew;
    currentTrack._displayIdxNew = previousTrack._displayIdxNew;
    previousTrack._displayIdxNew = tempDisplayIdx;

    // Swap positions in array
    newTracks[index] = previousTrack;
    newTracks[index - 1] = currentTrack;

    setReorderedTracks(newTracks);
  };

  const handleMoveTrackDown = (index: number) => {
    if (index === reorderedTracks.length - 1) return; // Can't move last track down

    const newTracks = [...reorderedTracks];
    const currentTrack = newTracks[index];
    const nextTrack = newTracks[index + 1];

    // Swap _displayIdxNew values
    const tempDisplayIdx = currentTrack._displayIdxNew;
    currentTrack._displayIdxNew = nextTrack._displayIdxNew;
    nextTrack._displayIdxNew = tempDisplayIdx;

    // Swap positions in array
    newTracks[index] = nextTrack;
    newTracks[index + 1] = currentTrack;

    setReorderedTracks(newTracks);
  };

  const handleUpdateOrder = async () => {
    // we only need to save the items that changed (by comparing the originalDisplayIdx and the updatedDisplayIdx) that we need to save
    const itemsToSave = reorderedTracks
      .filter((track) => track.displayidx !== track._displayIdxNew)
      .map((track) => ({
        arId: track.arId,
        alId: track.alId,
        updatedDisplayIdx: track._displayIdxNew,
      }));

    console.log("Update display order items to save:", itemsToSave);

    if (itemsToSave.length > 0) {
      setIsUpdatingOrder(true);

      try {
        // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
        const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
          solPreaccessNonce,
          solPreaccessSignature,
          solPreaccessTimestamp,
          signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
          publicKey,
          updateSolPreaccessNonce,
          updateSolSignedPreaccess,
          updateSolPreaccessTimestamp,
        });

        // S: if new img and  or mp3 files are selected we need to save that to the media server and get back a https url
        if (!usedPreAccessNonce || !usedPreAccessSignature) {
          throw new Error("Failed to valid signature to prove account ownership");
        }

        const payloadToSave: any = { updatedDisplayOrderList: itemsToSave, solSignature: usedPreAccessSignature, signatureNonce: usedPreAccessNonce };

        if (!isNonMUIMode) {
          payloadToSave.adminWallet = publicKey?.toBase58() || "";
        } else {
          payloadToSave.arId = artistId;
        }

        const response = await adminApi.fastStream.updateDisplayOrderForTracks(payloadToSave);

        if (response.success) {
          onTracksUpdated(); // Refresh the track list
          setIsReorderView(false);
          setIsUpdatingOrder(false);
          setReorderedTracks([]);
          toastSuccess("Display order updated successfully");
        } else {
          toastError(`Error: ${response.error || `Failed to update display order`}`);
        }
      } catch (error) {
        console.error("Error updating display order:", error);
        toastError(`Failed to update display order. Please try again.`);
      } finally {
        setIsUpdatingOrder(false);
      }
    } else {
      toastError("No changes to display order");
    }
  };

  const RenderNewTrackFormView = () => (
    <div className="">
      {isSubmitting && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-6" />
        </div>
      )}

      <div className={`${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="!text-lg font-semibold text-gray-900">{isEditing ? "Edit Track" : "Add New Track"}</h3>
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
              disabled={true}
              className={errors.idx ? "border-red-500" : ""}
            />
            {errors.idx && <p className="text-red-400 text-sm mt-1">{errors.idx}</p>}
          </div>
          {/* Display Track Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Track Order <span className="text-red-400">*</span>
            </label>
            <Input
              type="number"
              min="1"
              value={formData.displayidx}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                handleFormChange("displayidx", isNaN(value) ? 1 : value);
              }}
              placeholder="1"
              required
              disabled={true}
              className={errors.displayidx ? "border-red-500" : ""}
            />
            {errors.displayidx && <p className="text-red-400 text-sm mt-1">{errors.displayidx}</p>}
          </div>

          <div className="col-span-2">
            {!isEditing && (
              <>
                <span className="text-xs text-gray-600">
                  track numbers used so far (make sure it's in sequence with no duplicates): {trackIdxListSoFar}
                  <br />
                  display track numbers used so far (make sure it's in sequence with no duplicates): {trackDisplayIdxListSoFar}
                </span>
              </>
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
            {preloadExistingTrackToAlbum && (
              <p className="text-xs text-gray-400 mb-2">
                As this is a Sigma AI Remix, you cannot remove "AIM" or "Sigma AI Remix" as genres but you can add other genres.
              </p>
            )}
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
                        isSelected ? "text-yellow-300" : "hover:bg-gray-700"
                      } ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          // if preloadExistingTrackToAlbum is NOT null, then we should NOT allow them to remove either ai music or simremix
                          if (preloadExistingTrackToAlbum) {
                            if (genre.code === "ai music" || genre.code === "simremix") {
                              return;
                            }
                          }

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
                        className="rounded border-gray-300 text-yellow-300 focus:ring-yellow-500"
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

          {/* Is this Track Explicit? */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Is this Track Explicit?</label>
            </div>
            <Switch checked={formData.isExplicit === "1"} onCheckedChange={(checked) => handleFormChange("isExplicit", checked ? "1" : "")} />
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

          {/* Asset Uploads */}
          <div className="flex flex-row gap-4 w-full md:col-span-2 mb-4">
            {/* Cover Art URL */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Art URL <span className="text-red-400">*</span>
              </label>

              <div className="mb-3">
                <MediaUpdate
                  imageUrl={formData.cover_art_url}
                  size="md"
                  onFileSelect={(file) => {
                    setNewSelectedTrackCoverArtFile(file);
                  }}
                  onFileRevert={() => {
                    setNewSelectedTrackCoverArtFile(null);
                  }}
                  alt="Track Cover"
                  imgPlaceholder="image"
                />
              </div>

              {errors.cover_art_url && <p className="text-red-400 text-sm mt-1">{errors.cover_art_url}</p>}
              <p className="text-gray-400 text-xs mt-1">Must be a GIF, JPG, or PNG (Max size: 3MB)</p>
            </div>

            {/* File URL */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio File (MP3) <span className="text-red-400">*</span>
              </label>

              <div className="mb-3">
                <MediaUpdate
                  mediaUrl={formData.file}
                  size="md"
                  customWidthClass="w-[90%]"
                  onFileSelect={(file) => {
                    setNewSelectedAudioFile(file);
                  }}
                  onFileRevert={() => {
                    setNewSelectedAudioFile(null);
                  }}
                  alt="Audio File"
                  imgPlaceholder="audio"
                  isAudio={true}
                />
              </div>

              {errors.file && <p className="text-red-400 text-sm mt-1">{errors.file}</p>}
              <p className="text-gray-400 text-xs mt-1">Must be a valid MP3 file (Max size: 10MB)</p>
            </div>
          </div>
        </div>

        {/* agree to terms of launch music  */}
        <div className="flex items-center justify-between my-4 border border-gray-700 p-2 rounded-md">
          <div className="flex items-center space-x-2">
            <label htmlFor="agree-to-terms-of-launch-music" className="text-sm font-medium text-gray-300">
              I agree to the{" "}
              <a href="/legal#terms-of-launching-music" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 underline">
                terms of launching music on Sigma Music
              </a>
            </label>
          </div>
          <Switch checked={agreeToTermsOfLaunchMusic} onCheckedChange={(checked) => setAgreeToTermsOfLaunchMusic(checked)} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSubmitting || !agreeToTermsOfLaunchMusic} className="bg-yellow-300 text-black hover:bg-yellow-400">
          {isSubmitting ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update Track" : "Save Track"}
        </Button>
      </div>
    </div>
  );

  const RenderTrackListView = () => (
    <div className="space-y-4">
      {tracks.length > 0 && (
        <div className="flex items-end justify-end mb-6">
          <Badge variant="secondary">
            {tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}
          </Badge>
        </div>
      )}

      {tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track, index) => (
            <>
              <Card
                key={`${track.alId}-${index}`}
                className={`p-4 hover:shadow-md transition-shadow ${track.hideOrDelete === "2" || track.hideOrDelete === "1" ? "opacity-50 cursor-not-allowed" : ""}`}>
                <div className="flex items-start space-x-3">
                  {track.cover_art_url && (
                    <div className="flex-shrink-0">
                      <img src={track.cover_art_url} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 max-w-[200px]">
                        <h3 className="!text-sm font-semibold text-gray-900 truncate">{track.title}</h3>
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
                          {track.isExplicit === "1" && <img src={ratingE} alt="Explicit" title="Explicit" className="w-3 h-3 text-gray-400" />}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2 flex space-x-1">
                        <Button
                          disabled={isDeletingTrackId !== ""}
                          title={track.hideOrDelete === "2" || track.hideOrDelete === "1" ? "Recover Track" : "Delete Track"}
                          onClick={() => {
                            if (track.hideOrDelete === "2" || track.hideOrDelete === "1") {
                              const alertMsg = "Are are sure you want to recover this track? Once it is recovered, it will be visible to the public again.";
                              const confirmed = confirm(alertMsg);
                              if (!confirmed) {
                                return;
                              }

                              handleDeleteTrack(track.arId, track.alId, true);
                              return;
                            } else {
                              const alertMsg =
                                albumIsPublished === "1"
                                  ? "Are are sure you want to delete this track? Note that as your album is published and some people may have already bought it, the track just gets hidden from the public in future."
                                  : "Are are sure you want to delete this track?";
                              const confirmed = confirm(alertMsg);
                              if (!confirmed) {
                                return;
                              }

                              handleDeleteTrack(track.arId, track.alId);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0">
                          {isDeletingTrackId === track.alId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>{track.hideOrDelete === "2" || track.hideOrDelete === "1" ? <Recycle className="w-3 h-3" /> : <Trash className="w-3 h-3" />}</>
                          )}
                        </Button>
                        <Button
                          disabled={isDeletingTrackId !== "" || track.hideOrDelete === "2" || track.hideOrDelete === "1"}
                          onClick={() => handleEditTrack(track)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {(track.hideOrDelete === "2" || track.hideOrDelete === "1") && (
                  <div className="text-red-500 text-xs">{track.hideOrDelete === "2" ? "Deleted" : "Hidden"}</div>
                )}
              </Card>
            </>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracks Found</h3>
          <p className="text-gray-600">No tracks are currently available for this album.</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 items-center border-t border-gray-700 pt-4">
        <Button
          onClick={() => {
            handleCancelForm();
            onClose();
          }}
          variant="outline"
          className={`border-gray-600 text-white hover:bg-gray-800 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
          Cancel
        </Button>

        {supportTrackReordering && (
          <Button
            onClick={() => setIsReorderView(true)}
            disabled={tracks.length === 0 || !supportTrackReordering}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800">
            Reorder Tracks
          </Button>
        )}

        <Button
          onClick={handleAddTrackToFastStream}
          className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Track
        </Button>
      </div>
    </div>
  );

  const RenderReorderTrackListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reorder Tracks</h3>
          <p className="text-sm text-gray-600">Use the arrow buttons to reorder your tracks</p>
        </div>
        <div className="flex items-center space-x-3">
          {reorderedTracks.length > 0 && (
            <Badge variant="secondary">
              {reorderedTracks.length} {reorderedTracks.length === 1 ? "Track" : "Tracks"}
            </Badge>
          )}
          <Button
            onClick={() => {
              setIsReorderView(false);
            }}
            disabled={isUpdatingOrder}
            variant="outline"
            size="sm"
            className={`border-gray-600 text-white hover:bg-gray-800 ${isUpdatingOrder ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
            <X className="w-4 h-4 mr-2" />
            {isUpdatingOrder ? "Updating..." : "Cancel"}
          </Button>
        </div>
      </div>

      {reorderedTracks.length > 0 ? (
        <div className="space-y-2">
          {reorderedTracks.map((track, index) => (
            <Card key={`${track.alId}-${index}`} className="p-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    <span className="text-lg font-bold text-gray-700">#{track._displayIdxNew}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="!text-base font-semibold text-gray-900">{track.title}</h3>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleMoveTrackUp(index)} disabled={index === 0} variant="outline" size="sm" className="h-9 w-9 p-0" title="Move Up">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleMoveTrackDown(index)}
                    disabled={index === reorderedTracks.length - 1}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    title="Move Down">
                    <ArrowDown className="w-4 h-4" />
                  </Button>
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

      <div className="flex justify-end space-x-3 items-center border-t border-gray-700 pt-4 mt-6">
        <Button
          onClick={() => {
            handleCancelForm();
            onClose();
          }}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-800">
          Cancel
        </Button>

        <Button
          onClick={handleUpdateOrder}
          disabled={isUpdatingOrder}
          className={`bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 ${isUpdatingOrder ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
          {isUpdatingOrder ? "Updating..." : "Update Order"}
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
      title={`Tracks: ${albumTitle}`}
      size="lg"
      isWorking={isSubmitting || isUpdatingOrder}>
      {isFormView ? RenderNewTrackFormView() : isReorderView ? RenderReorderTrackListView() : RenderTrackListView()}
    </Modal>
  );
};
