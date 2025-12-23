import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { Switch } from "libComponents/Switch";
import { MediaUpdate } from "libComponents/MediaUpdate";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { saveLargerMediaToServerViaAPI, saveMediaToServerViaAPI } from "libs/utils/api";
import { looseIsMuiModeCheck, toastError } from "libs/utils/ui";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccountStore } from "store/account";
import { InfoTooltip } from "libComponents/Tooltip";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { usePreventScroll } from "hooks";
import { useAppStore } from "store/app";
import { AlbumCollaborator } from "libs/types";

export interface AlbumFormData {
  albumId: string;
  title: string;
  desc: string;
  img: string;
  isExplicit: string;
  isPodcast: string;
  isPublished: string;
  albumPriceOption1: string; // Digital Album + Bonus Tracks Only
  albumPriceOption2: string; // Album + Fan Collectible (NFT)
  albumPriceOption3: string; // Album + Fan Collectible + Commercial-Use License
  albumPriceOption4: string; // Album + Commercial-Use License
  albumAllowPayMore: string; // "1" or "0" - let fans pay more if they want
  collaborators: AlbumCollaborator[];
  solNftName: string;
  solNftAltCodes: string;
}

interface EditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (albumData: AlbumFormData) => Promise<boolean>;
  initialData: AlbumFormData;
  albumTitle: string;
  isNewAlbum?: boolean;
}

export const EditAlbumModal: React.FC<EditAlbumModalProps> = ({ isOpen, onClose, onSave, initialData, albumTitle, isNewAlbum = false }) => {
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { signMessage } = useWallet();
  const {
    solPreaccessNonce,
    solPreaccessSignature,
    solPreaccessTimestamp,
    updateSolPreaccessNonce,
    updateSolPreaccessTimestamp,
    updateSolSignedPreaccess,
    userArtistProfile,
  } = useAccountStore();
  const { artistLookup } = useAppStore();

  const [formData, setFormData] = useState<AlbumFormData>({ ...initialData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AlbumFormData>>({});
  const [newSelectedAlbumImageFile, setNewSelectedAlbumImageFile] = useState<File | null>(null);
  const [showPricingDisclaimerModal, setShowPricingDisclaimerModal] = useState(false);
  const [showPricingInfoModal, setShowPricingInfoModal] = useState(false);
  const [currentPricingInfo, setCurrentPricingInfo] = useState<{ title: string; content: string }>({ title: "", content: "" });
  const [agreeToTermsOfLaunchMusic, setAgreeToTermsOfLaunchMusic] = useState(isNewAlbum ? false : true); // if it's edit, then we can default to agree to terms of launch music

  const [collaborators, setCollaborators] = useState<AlbumCollaborator[]>([]);
  const [showAddCollaboratorForm, setShowAddCollaboratorForm] = useState(false);
  const [newCollaboratorArtistName, setNewCollaboratorArtistName] = useState("");
  const [newCollaboratorRevenueSplit, setNewCollaboratorRevenueSplit] = useState("0");
  const [artistNameSuggestions, setArtistNameSuggestions] = useState<Array<{ artistId: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [collaboratorError, setCollaboratorError] = useState<string>("");

  // Collectible Metadata state
  const [collectibleImg, setCollectibleImg] = useState<string>("");
  const [collectibleRarity, setCollectibleRarity] = useState<string>("common-5000");
  const [collectibleDeployedT1, setCollectibleDeployedT1] = useState<number>(0);
  const [collectibleDeployedT2, setCollectibleDeployedT2] = useState<number>(0);
  const [newSelectedCollectibleImageFile, setNewSelectedCollectibleImageFile] = useState<File | null>(null);
  const [isUsingAlbumImageForCollectible, setIsUsingAlbumImageForCollectible] = useState<boolean>(false);
  const [collectibleErrors, setCollectibleErrors] = useState<{ collectibleImg?: string; collectibleRarity?: string }>({});

  usePreventScroll(); // Prevent scrolling on non-mobile screens on view

  useEffect(() => {
    if (isOpen) {
      // Set default values for pricing options if they don't exist
      const defaultPricingData = {
        ...initialData,
        albumPriceOption1: initialData.albumPriceOption1 || "",
        albumPriceOption2: initialData.albumPriceOption2 || "",
        albumPriceOption3: initialData.albumPriceOption3 || "",
        albumPriceOption4: initialData.albumPriceOption4 || "",
        albumAllowPayMore: (initialData as any).albumAllowPayMore || "0",
      };

      setFormData(defaultPricingData);
      setErrors({});
      setNewSelectedAlbumImageFile(null);
      setAgreeToTermsOfLaunchMusic(isNewAlbum ? false : true);

      // Initialize collaborators from initialData if it exists
      if ((initialData as any).collaborators && Array.isArray((initialData as any).collaborators)) {
        const parsedCollaborators: AlbumCollaborator[] = (initialData as any).collaborators.map((collab: Record<string, string>) => {
          const [artistId, revenueSplit] = Object.entries(collab)[0];
          return { artistId, revenueSplit };
        });
        setCollaborators(parsedCollaborators);
      } else {
        setCollaborators([]);
      }

      // Reset collaborator form
      setShowAddCollaboratorForm(false);
      setNewCollaboratorArtistName("");
      setNewCollaboratorRevenueSplit("0");
      setArtistNameSuggestions([]);
      setShowSuggestions(false);
      setCollaboratorError("");

      // Initialize collectible metadata from initialData if it exists
      if ((initialData as any)._collectibleMetadataDraft) {
        const metadata = (initialData as any)._collectibleMetadataDraft;
        const existingCollectibleImg = metadata.collectibleImg || "";
        const albumImg = defaultPricingData.img || "";

        // Check if collectible image is the same as album image
        const isSameAsAlbumImage = existingCollectibleImg === albumImg && existingCollectibleImg !== "";

        setCollectibleImg(existingCollectibleImg);
        setCollectibleRarity(metadata.collectibleRarity || "common-5000");
        setCollectibleDeployedT1(metadata.collectibleDeployedT1 || 0);
        setCollectibleDeployedT2(metadata.collectibleDeployedT2 || 0);
        setIsUsingAlbumImageForCollectible(isSameAsAlbumImage);
        setNewSelectedCollectibleImageFile(null);
      } else {
        setCollectibleImg("");
        setCollectibleRarity("common-5000");
        setCollectibleDeployedT1(0);
        setCollectibleDeployedT2(0);
        setIsUsingAlbumImageForCollectible(false);
        setNewSelectedCollectibleImageFile(null);
      }
      setCollectibleErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AlbumFormData> = {};
    const newCollectibleErrors: { collectibleImg?: string; collectibleRarity?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!formData.desc.trim()) {
      newErrors.desc = "Description is required";
    } else if (formData.desc.length > 800) {
      newErrors.desc = "Description must be 800 characters or less";
    }

    if (!formData.img && !newSelectedAlbumImageFile) {
      newErrors.img = "Album cover image is required";
    }

    // check if the profile image is less than 3MB
    if (newSelectedAlbumImageFile) {
      if (newSelectedAlbumImageFile.size > 3 * 1024 * 1024) {
        newErrors.img = "Profile image must be less than 3MB";
      }

      // Validate file type
      const fileName = newSelectedAlbumImageFile.name.toLowerCase();
      const validExtensions = [".gif", ".png", ".jpg", ".jpeg"];
      const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasValidExtension) {
        newErrors.img = "Cover art must be a GIF, PNG, or JPG file";
      }
    }

    // Validate collectible metadata if required (either T1 or T2 is not deployed yet)
    if (shouldShowCollectibleMetadata() && (collectibleDeployedT1 === 0 || collectibleDeployedT2 === 0)) {
      if (!collectibleImg && !isUsingAlbumImageForCollectible && !newSelectedCollectibleImageFile) {
        newCollectibleErrors.collectibleImg = "Collectible image is required";
      }

      if (!collectibleRarity) {
        newCollectibleErrors.collectibleRarity = "Collectible rarity is required";
      }

      // Validate collectible image file if a new one is selected
      if (newSelectedCollectibleImageFile) {
        if (newSelectedCollectibleImageFile.size > 10 * 1024 * 1024) {
          newCollectibleErrors.collectibleImg = "Collectible image must be less than 10MB";
        }

        // Validate file type
        const fileName = newSelectedCollectibleImageFile.name.toLowerCase();
        const validExtensions = [".gif", ".png", ".jpg", ".jpeg"];
        const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

        if (!hasValidExtension) {
          newCollectibleErrors.collectibleImg = "Collectible image must be a GIF, PNG, or JPG file";
        }
      }
    }

    setErrors(newErrors);
    setCollectibleErrors(newCollectibleErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newCollectibleErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // S: if a new file has been selected, we need to save it to the server to get back a https url for profileImage
      if (newSelectedAlbumImageFile && addressSol) {
        // Get the pre-access nonce and signature
        const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
          solPreaccessNonce,
          solPreaccessSignature,
          solPreaccessTimestamp,
          signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
          publicKey: publicKeySol,
          updateSolPreaccessNonce,
          updateSolSignedPreaccess,
          updateSolPreaccessTimestamp,
        });

        if (!usedPreAccessNonce || !usedPreAccessSignature) {
          throw new Error("Failed to valid signature to prove account ownership");
        }

        try {
          const fileUploadResponse = await saveMediaToServerViaAPI({
            file: newSelectedAlbumImageFile,
            solSignature: solPreaccessSignature,
            signatureNonce: solPreaccessNonce,
            creatorWallet: addressSol,
          });

          if (fileUploadResponse) {
            formData.img = fileUploadResponse;
          } else {
            toastError("Error uploading image. Please reupload and try again later.");
            return;
          }
        } catch (error) {
          toastError("Error uploading image: " + (error as Error)?.message);
          return;
        }
      }
      // E: if a new file has been selected, we need to save it to the server to get back a https url for profileImage

      // Handle collectible image upload if needed
      let finalCollectibleImg = collectibleImg;

      if (shouldShowCollectibleMetadata() && collectibleImg !== "" && (collectibleDeployedT1 === 0 || collectibleDeployedT2 === 0)) {
        if (isUsingAlbumImageForCollectible) {
          // Use the album image URL (either existing or newly uploaded)
          finalCollectibleImg = formData.img;
        } else if (newSelectedCollectibleImageFile && addressSol) {
          // Upload new collectible image
          const { usedPreAccessNonce: collectibleNonce, usedPreAccessSignature: collectibleSignature } = await getOrCacheAccessNonceAndSignature({
            solPreaccessNonce,
            solPreaccessSignature,
            solPreaccessTimestamp,
            signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
            publicKey: publicKeySol,
            updateSolPreaccessNonce,
            updateSolSignedPreaccess,
            updateSolPreaccessTimestamp,
          });

          if (!collectibleNonce || !collectibleSignature) {
            throw new Error("Failed to get valid signature to prove account ownership for collectible image");
          }

          try {
            // here we use the saveLargerMediaToServerViaAPI to save the collectible image as it is larger than 3MB
            let collectibleFileUploadResponse = "";

            if (newSelectedCollectibleImageFile.size > 3 * 1024 * 1024) {
              collectibleFileUploadResponse = await saveLargerMediaToServerViaAPI({
                file: newSelectedCollectibleImageFile,
                solSignature: collectibleSignature,
                signatureNonce: collectibleNonce,
                creatorWallet: addressSol,
                fileType: newSelectedCollectibleImageFile.type,
                fileName: newSelectedCollectibleImageFile.name,
                fileSize: newSelectedCollectibleImageFile.size,
              });
            } else {
              collectibleFileUploadResponse = await saveMediaToServerViaAPI({
                file: newSelectedCollectibleImageFile,
                solSignature: collectibleSignature,
                signatureNonce: collectibleNonce,
                creatorWallet: addressSol,
              });
            }

            if (collectibleFileUploadResponse) {
              finalCollectibleImg = collectibleFileUploadResponse;
            } else {
              toastError("Error uploading collectible image. Please reupload and try again later.");
              return;
            }
          } catch (error) {
            toastError("Error uploading collectible image: " + (error as Error)?.message);
            return;
          }
        }
      }

      // we only send the changed form data to the server to save
      const changedFormData: Partial<AlbumFormData> = {
        title: formData.title.trim(),
        desc: formData.desc.trim(),
        img: formData.img,
        isExplicit: formData.isExplicit,
        isPodcast: formData.isPodcast,
        isPublished: formData.isPublished,
        albumPriceOption1: formData.albumPriceOption1,
        albumPriceOption2: formData.albumPriceOption2,
        albumPriceOption3: formData.albumPriceOption3,
        albumPriceOption4: formData.albumPriceOption4,
        albumAllowPayMore: formData.albumAllowPayMore || "0",
      };

      // Add collaborators data in the required format
      if (collaborators.length > 0) {
        (changedFormData as any).collaborators = collaborators.map((collab) => ({
          [collab.artistId]: collab.revenueSplit,
        }));
      } else {
        (changedFormData as any).collaborators = [];
      }

      // Add collectible metadata if required
      if (shouldShowCollectibleMetadata()) {
        (changedFormData as any)._collectibleMetadataDraft = {
          collectibleImg: finalCollectibleImg,
          collectibleRarity: collectibleRarity,
        };

        if (collectibleDeployedT1 === 1) {
          // its already been set up
          (changedFormData as any)._collectibleMetadataDraft.collectibleDeployedT1 = 1;
        } else {
          // user has requested a simple collectible for the first time
          if (formData.albumPriceOption2 !== "") {
            (changedFormData as any)._collectibleMetadataDraft.collectibleDeployedT1 = 0;
          }
        }

        if (collectibleDeployedT2 === 1) {
          // its already been set up
          (changedFormData as any)._collectibleMetadataDraft.collectibleDeployedT2 = 1;
        } else {
          // user has requested a IP license collectible for the first time
          if (formData.albumPriceOption3 !== "" || formData.albumPriceOption4 !== "") {
            (changedFormData as any)._collectibleMetadataDraft.collectibleDeployedT2 = 0;
          }
        }
      }

      // Add solNftName and solNftAltCodes if they are set
      if (formData.solNftName) {
        (changedFormData as any).solNftName = formData.solNftName.trim();
      }

      if (formData.solNftAltCodes) {
        (changedFormData as any).solNftAltCodes = formData.solNftAltCodes.trim();
      }

      const success = await onSave(changedFormData as AlbumFormData);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving album:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AlbumFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleToggleChange = (field: "isExplicit" | "isPodcast" | "isPublished", checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked ? "1" : "0" }));
  };

  const handlePricingOptionToggle = (option: "albumPriceOption1" | "albumPriceOption2" | "albumPriceOption3" | "albumPriceOption4", enabled: boolean) => {
    setFormData((prev) => {
      if (enabled) {
        // Set to lowest recommended price when enabled
        const defaultPrices: Record<string, string> = {
          albumPriceOption1: "4", // Digital Album + Bonus Tracks Only: $4-$9
          albumPriceOption2: "14", // Album + Fan Collectible (NFT): $14-$19
          albumPriceOption3: "44", // Album + Fan Collectible + Commercial-Use License: $44-$49
          albumPriceOption4: "34", // Album + Commercial-Use License: $34-$39
        };
        return {
          ...prev,
          [option]: defaultPrices[option] || "1",
        };
      } else {
        // Clear the value when disabled
        return {
          ...prev,
          [option]: "",
        };
      }
    });
  };

  const handlePricingOptionValueChange = (option: "albumPriceOption1" | "albumPriceOption2" | "albumPriceOption3" | "albumPriceOption4", value: string) => {
    // Only allow whole numbers between 1 and 1000
    const numValue = parseInt(value, 10);
    if (value === "" || (numValue >= 1 && numValue <= 1000 && Number.isInteger(numValue))) {
      // if the user presses back and clears the value, we need to set the value to "1" as default or else the toggle gets called and disabled
      if (value === "") {
        setFormData((prev) => ({ ...prev, [option]: "1" }));
      } else {
        setFormData((prev) => ({ ...prev, [option]: value }));
      }
    }
  };

  const isAnyPricingOptionEnabled = (): boolean => {
    return formData.albumPriceOption1 !== "" || formData.albumPriceOption2 !== "" || formData.albumPriceOption3 !== "" || formData.albumPriceOption4 !== "";
  };

  const showPricingInfo = (title: string, content: string) => {
    setCurrentPricingInfo({ title, content });
    setShowPricingInfoModal(true);
  };

  // Collaborator handlers
  const handleArtistNameInput = (value: string) => {
    setNewCollaboratorArtistName(value);
    // Clear error when user starts typing
    if (collaboratorError) {
      setCollaboratorError("");
    }

    if (value.length >= 2) {
      const searchTerm = value.toLowerCase();
      const matches = Object.entries(artistLookup)
        .filter(([artistId, artist]) => {
          const artistName = (artist as any)?.name?.toLowerCase() || "";
          return artistName.includes(searchTerm);
        })
        .map(([artistId, artist]) => ({
          artistId,
          name: (artist as any)?.name || "",
        }))
        .slice(0, 10); // Limit to 10 suggestions

      setArtistNameSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setArtistNameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectArtist = (artistId: string, artistName: string) => {
    setNewCollaboratorArtistName(artistName);
    setShowSuggestions(false);
  };

  const handleAddCollaborator = () => {
    // Clear any previous errors
    setCollaboratorError("");

    if (!newCollaboratorArtistName.trim()) {
      return;
    }

    // Calculate the new revenue split value
    const newRevenueSplit = Math.max(0, Math.min(100, parseInt(newCollaboratorRevenueSplit) || 0));

    // Calculate current total revenue split
    const currentTotal = collaborators.reduce((sum, collab) => sum + parseInt(collab.revenueSplit || "0"), 0);

    // Check if adding this collaborator would exceed 100%
    if (currentTotal + newRevenueSplit > 100) {
      setCollaboratorError("The total Revenue Split value is exceeding 100%, which is not allowed");
      return;
    }

    // Find the artistId from the artist name (exact match)
    const selectedArtist = Object.entries(artistLookup).find(([_, artist]) => (artist as any)?.name?.trim() === newCollaboratorArtistName.trim());

    if (!selectedArtist) {
      // If no exact match, try to find from suggestions
      const suggestionMatch = artistNameSuggestions.find((s) => s.name.trim() === newCollaboratorArtistName.trim());
      if (!suggestionMatch) {
        return;
      }
      const artistId = suggestionMatch.artistId;
      const revenueSplit = newRevenueSplit.toString();

      // Check if already added
      if (collaborators.some((c) => c.artistId === artistId)) {
        return;
      }

      // Check if we've reached the limit
      if (collaborators.length >= 5) {
        return;
      }

      setCollaborators([...collaborators, { artistId, revenueSplit }]);
      setNewCollaboratorArtistName("");
      setNewCollaboratorRevenueSplit("0");
      setShowAddCollaboratorForm(false);
      setShowSuggestions(false);
      setCollaboratorError("");
      return;
    }

    const artistId = selectedArtist[0];
    const revenueSplit = newRevenueSplit.toString();

    // Check if already added
    if (collaborators.some((c) => c.artistId === artistId)) {
      return;
    }

    // Check if we've reached the limit
    if (collaborators.length >= 5) {
      return;
    }

    setCollaborators([...collaborators, { artistId, revenueSplit }]);
    setNewCollaboratorArtistName("");
    setNewCollaboratorRevenueSplit("0");
    setShowAddCollaboratorForm(false);
    setShowSuggestions(false);
    setCollaboratorError("");
  };

  const handleRemoveCollaborator = (artistId: string) => {
    setCollaborators(collaborators.filter((c) => c.artistId !== artistId));
  };

  const getArtistName = (artistId: string): string => {
    return (artistLookup[artistId] as any)?.name || artistId;
  };

  // Check if collectible metadata section should be shown
  const shouldShowCollectibleMetadata = (): boolean => {
    // Only show if:
    // 1. User has uploaded an album image (either existing or newly selected)
    // 2. AND one of the collectible-related options is selected
    const hasAlbumImage = formData.img || newSelectedAlbumImageFile;
    const hasCollectibleOption =
      formData.albumPriceOption2 !== "" || // Album + Fan Collectible (NFT)
      formData.albumPriceOption3 !== "" || // Album + Fan Collectible + Commercial-Use License
      formData.albumPriceOption4 !== ""; // Album + Commercial-Use License

    return !!(hasAlbumImage && hasCollectibleOption);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
      <div className="w-full max-w-4xl max-h-[75vh] bg-black rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="!text-2xl font-bold !text-yellow-300">{isNewAlbum ? "Create New Album" : `Edit Album: ${albumTitle || "Untitled"}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSubmitting && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-6" />
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
          <div className="space-y-6 mb-8 flex md:flex-row flex-col gap-4 justify-between">
            <div className="flex-col gap-4 md:w-2/3 bgx-yellow-500">
              {/* Title */}
              <div>
                <p className="text-gray-500 text-xs mb-4 text-right">Album ID: {formData.albumId}</p>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Album Title <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder={isNewAlbum ? "Enter your new album title" : "Enter album title"}
                  className={`w-full ${errors.title ? "border-red-500" : ""}`}
                  maxLength={200}
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                <p className="text-gray-400 text-xs mt-1">{formData.title.length}/200 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">
                  Album Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => handleInputChange("desc", e.target.value)}
                  placeholder={isNewAlbum ? "Describe your new album..." : "Enter album description"}
                  className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.desc ? "border-red-500" : ""
                  }`}
                  rows={4}
                  maxLength={800}
                />
                {errors.desc && <p className="text-red-400 text-sm mt-1">{errors.desc}</p>}
                <p className="text-gray-400 text-xs mt-1">{formData.desc.length}/800 characters</p>
              </div>
            </div>

            {/* Image URL */}
            <div className="md:w-1/3 flex flex-col items-center justify-top">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Album Cover Art <span className="text-red-400">*</span>
              </label>

              <div className="mb-3">
                <MediaUpdate
                  imageUrl={formData.img}
                  size="md"
                  onFileSelect={(file) => {
                    setNewSelectedAlbumImageFile(file);
                  }}
                  onFileRevert={() => {
                    setNewSelectedAlbumImageFile(null);
                  }}
                  alt="Album Cover"
                  imgPlaceholder="image"
                />
              </div>
              {errors.img && <p className="text-red-400 text-sm mt-1">{errors.img}</p>}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Does this album contain <span className="text-orange-400">Explicit Content</span> or adult themes?
                </label>
              </div>
              <Switch checked={formData.isExplicit === "1"} onCheckedChange={(checked) => handleToggleChange("isExplicit", checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">Publish This Album</label>
                <InfoTooltip
                  content="A Published album will appear publicly once tracks have been added to it. You can use this setting to show and hide and album on your public profile."
                  className="ml-2"
                />
              </div>
              <Switch
                checked={formData.isPublished === "1"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const confirmed = confirm(
                      "You are about to publish this album. Once you publish it, your album goes live and you will have limited ability to delete, hide or reorder tracks. Only publish albums that are ready to be streamed by the public and are in the final published state you want them to be."
                    );
                    if (!confirmed) {
                      return;
                    }
                  }
                  handleToggleChange("isPublished", checked);
                }}
              />
            </div>
          </div>

          {/* Album Sale Options */}
          <div className="space-y-2 bg-gray-800 border border-gray-600 rounded-lg p-4">
            {/* Disclaimer */}
            <div className="">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h3 className="!text-lg font-semibold text-white mb-2">Album Sales Options</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Before enabling pricing options,{" "}
                    <button
                      type="button"
                      onClick={() => setShowPricingDisclaimerModal(true)}
                      className="text-yellow-400 hover:text-yellow-300 underline font-medium">
                      Read and agree to these terms first
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="relative">
              {!userArtistProfile.isVerifiedArtist && !looseIsMuiModeCheck() && (
                <p className="mb-2 absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-yellow-400 rounded-lg p-2 text-center text-black z-10">
                  Only Verified Artists can sell albums with pricing options. Find out how to get verified{" "}
                  <a href="/faq#get-verified-artist-status" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                    here
                  </a>
                </p>
              )}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${userArtistProfile.isVerifiedArtist || looseIsMuiModeCheck() ? "" : "opacity-20 cursor-not-allowed pointer-events-none"}`}>
                {/* Option 1: Digital Album + Bonus Tracks Only */}
                <div className="bg-black border border-gray-600 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="!text-lg font-medium text-white">Digital Album + Bonus Tracks Only</h4>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Digital Album + Bonus Tracks Only",
                          "Buyer gets all track (including bonus tracks) to Stream and as MP3 downloads. Enabled immediately.\n\nLicense: CC BY-NC-ND 4.0: Attribution, Non Commercial, No Derivatives"
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Enable this option</label>
                    <Switch
                      checked={formData.albumPriceOption1 !== ""}
                      onCheckedChange={(checked) => handlePricingOptionToggle("albumPriceOption1", checked)}
                    />
                  </div>
                  {formData.albumPriceOption1 !== "" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={formData.albumPriceOption1}
                        onChange={(e) => handlePricingOptionValueChange("albumPriceOption1", e.target.value)}
                        placeholder="Enter price (1-1000)"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended: $4-$9</p>
                    </div>
                  )}
                </div>

                {/* Option 4: Album + Commercial-Use License */}
                <div className="bg-black border border-gray-600 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="!text-lg font-medium text-white">Album + Commercial-Use License</h4>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Album + Commercial-Use License",
                          "Buyer gets full digital Album + commercial use license. Takes a few days to setup and be enabled.\n\nLicense: CC BY 4.0: Attribution Only. Commercial Use + Derivatives + Redistribution. AI Remix + AI Training Allowed. Also includes on-chain Story Protocol license"
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Enable this option</label>
                    <Switch
                      checked={formData.albumPriceOption4 !== ""}
                      onCheckedChange={(checked) => handlePricingOptionToggle("albumPriceOption4", checked)}
                    />
                  </div>
                  {formData.albumPriceOption4 !== "" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={formData.albumPriceOption4}
                        onChange={(e) => handlePricingOptionValueChange("albumPriceOption4", e.target.value)}
                        placeholder="Enter price (1-1000)"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended: $34-$39</p>
                    </div>
                  )}
                </div>

                {/* Option 2: Album + Fan Collectible (NFT) */}
                <div className="bg-black border border-gray-600 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="!text-lg font-medium text-white">Album + Fan Collectible (NFT)</h4>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Album + Fan Collectible (NFT)",
                          "Buyer gets full digital Album + limited edition digital collectible. Takes a few days to setup and be enabled.\n\nLicense: CC BY-NC-ND 4.0: Attribution, Non Commercial, No Derivatives"
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Enable this option</label>
                    <Switch
                      checked={formData.albumPriceOption2 !== ""}
                      onCheckedChange={(checked) => handlePricingOptionToggle("albumPriceOption2", checked)}
                    />
                  </div>
                  {formData.albumPriceOption2 !== "" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={formData.albumPriceOption2}
                        onChange={(e) => handlePricingOptionValueChange("albumPriceOption2", e.target.value)}
                        placeholder="Enter price (1-1000)"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended: $14-$19</p>
                    </div>
                  )}
                </div>

                {/* Option 3: Album + Fan Collectible + Commercial-Use License */}
                <div className="bg-black border border-gray-600 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="!text-lg font-medium text-white">Album + Fan Collectible + Commercial-Use License</h4>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Album + Fan Collectible + Commercial-Use License",
                          "Buyer gets full digital Album + fan collectible + commercial license. Ultimate web3 + AI Remix ready package! Takes a few days to setup and be enabled.\n\nLicense: CC BY 4.0: Attribution Only. Commercial Use + Derivatives + Redistribution. AI Remix + AI Training Allowed. Also includes on-chain Story Protocol license"
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Enable this option</label>
                    <Switch
                      checked={formData.albumPriceOption3 !== ""}
                      onCheckedChange={(checked) => handlePricingOptionToggle("albumPriceOption3", checked)}
                    />
                  </div>
                  {formData.albumPriceOption3 !== "" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={formData.albumPriceOption3}
                        onChange={(e) => handlePricingOptionValueChange("albumPriceOption3", e.target.value)}
                        placeholder="Enter price (1-1000)"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended: $44-$49</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Let Fans Pay More Option */}
            {isAnyPricingOptionEnabled() && (
              <div className="mt-4 bg-black border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-300">Let fans pay more if they want</label>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Let fans pay more if they want",
                          'This feature is not live yet but is very coming soon: once it\'s live it will use your selected pricing as the "minimum price" and allow fans to pay more if they want to support you!'
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <Switch
                    checked={formData.albumAllowPayMore === "1"}
                    onCheckedChange={(checked) => handleInputChange("albumAllowPayMore", checked ? "1" : "0")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Collectible Metadata */}
          {shouldShowCollectibleMetadata() && (
            <div className="space-y-2 bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h3 className="!text-lg font-semibold text-white mb-2">Fan Collectible Metadata</h3>
                    {(collectibleDeployedT1 === 1 || collectibleDeployedT2 === 1) && (
                      <p className="text-yellow-400 text-sm mb-3">⚠️ Collectible is already generated so you cannot edit this anymore</p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`relative ${collectibleDeployedT1 === 1 || collectibleDeployedT2 === 1 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Collectible Image */}
                  <div className="bg-black border border-gray-600 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                      Collectible Image (Max 10MB. Only PNG & GIF files allowed) <span className="text-red-400">*</span>
                    </label>
                    <div className="mb-3">
                      {isUsingAlbumImageForCollectible ? (
                        <div className="space-y-2 flex-col flex items-center justify-between">
                          <div className="relative inline-block">
                            <img src={formData.img || ""} alt="Album Image Preview" className="w-32 h-32 object-cover rounded-md border-2 border-gray-600" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUsingAlbumImageForCollectible(false);
                              setCollectibleImg("");
                              setNewSelectedCollectibleImageFile(null);
                            }}
                            className="text-xs text-yellow-400 hover:text-yellow-300 underline">
                            Close and upload new collectible image
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-col flex items-center justify-between">
                          <MediaUpdate
                            imageUrl={collectibleImg}
                            size="md"
                            onFileSelect={(file) => {
                              setNewSelectedCollectibleImageFile(file);
                              setIsUsingAlbumImageForCollectible(false);
                            }}
                            onFileRevert={() => {
                              setNewSelectedCollectibleImageFile(null);
                            }}
                            alt="Collectible Image"
                            imgPlaceholder="image"
                          />
                          {formData.img && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUsingAlbumImageForCollectible(true);
                                setNewSelectedCollectibleImageFile(null);
                                setCollectibleImg("");
                              }}
                              className="text-xs text-yellow-400 hover:text-yellow-300 underline">
                              Use My Same Album Image
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {collectibleErrors.collectibleImg && <p className="text-red-400 text-sm mt-1 text-center">{collectibleErrors.collectibleImg}</p>}
                    {looseIsMuiModeCheck() && (isUsingAlbumImageForCollectible ? formData.img : collectibleImg) && (
                      <a
                        href={isUsingAlbumImageForCollectible ? formData.img : collectibleImg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-2 inline-block bg-blue-500 text-white px-2 py-1 rounded-md">
                        Open in New Tab
                      </a>
                    )}
                  </div>

                  {/* Collectible Rarity */}
                  <div className="bg-black border border-gray-600 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      How rare is the collectible? <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={collectibleRarity}
                      onChange={(e) => {
                        setCollectibleRarity(e.target.value);
                        if (collectibleErrors.collectibleRarity) {
                          setCollectibleErrors((prev) => ({ ...prev, collectibleRarity: undefined }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="common-5000">Common - Only 5000 Sold</option>
                      <option value="rare-500">Rare - Only 500 Sold</option>
                      <option value="legendary-50">Legendary - Only 50 Sold</option>
                    </select>
                    {collectibleErrors.collectibleRarity && <p className="text-red-400 text-sm mt-1">{collectibleErrors.collectibleRarity}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-2 bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h3 className="!text-lg font-semibold text-white mb-2">Advanced Options</h3>
                </div>
              </div>
            </div>

            {/* Advanced Options Content */}
            <div className="relative">
              <div className="grid grid-cols-1 gap-6">
                {/* Option: Seal & Protect Album on the Blockchain */}
                <div className="bg-black border border-gray-600 rounded-lg p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="!text-lg font-medium text-white">Seal & Protect Album on the Blockchain</h4>
                      <span className="px-2 py-1 text-xs font-semibold text-black bg-orange-400 rounded">Coming Soon</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        showPricingInfo(
                          "Seal & Protect Album on the Blockchain",
                          "If your album contains tracks that you have not yet legally registered for IP protection, then using this Seal & Protect option may help you. Once your album is ready to be published, if you choose to Seal & Protect Album on the Blockchain, a proof of the album and its tracks will be stored on a decentralized network and a proof of it stored on a blockchain. This immutable step creates a timestamp and proof of when you produced the tracks, so in the future if someone were to steal any of your composition work, even if you do not have formal IP registered, you will have an immutable way to prove that the tracks were composed by you at a specific timestamp in history. These kinds of proofs can help you with any legal proceedings and are a key use-case of blockchain technology."
                        )
                      }
                      className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">
                    This feature will allow you to create an immutable blockchain record of your album and tracks for IP protection purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="space-y-2 bg-gray-800 border border-gray-600 rounded-lg p-4">
            <div className="">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h3 className="!text-lg font-semibold text-white mb-2">Add Collaborators</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    List up to 5 collaborators on this album and also include optional revenue splits with them for all sales related to this album.
                  </p>
                </div>
              </div>
            </div>

            {/* Existing Collaborators */}
            {collaborators.length > 0 && (
              <div className="space-y-2 mb-4">
                {collaborators.map((collab) => (
                  <div key={collab.artistId} className="bg-black border border-gray-600 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{getArtistName(collab.artistId)}</p>
                      <p className="text-gray-400 text-sm">Revenue Split: {collab.revenueSplit}%</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveCollaborator(collab.artistId)} className="hover:text-red-300 transition-colors p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Collaborator Button */}
            {!showAddCollaboratorForm && collaborators.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddCollaboratorForm(true)}
                className="text-xs text-gray-300 border-gray-600 hover:bg-gray-700">
                Add Collaborator
              </Button>
            )}

            {/* Add Collaborator Form */}
            {showAddCollaboratorForm && (
              <div className="bg-black border border-gray-600 rounded-lg p-4 space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name</label>
                  <Input
                    type="text"
                    value={newCollaboratorArtistName}
                    onChange={(e) => handleArtistNameInput(e.target.value)}
                    placeholder="Type to search for an artist..."
                    className="w-full"
                    onFocus={() => {
                      if (newCollaboratorArtistName.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  {showSuggestions && artistNameSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {artistNameSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.artistId}
                          type="button"
                          onClick={() => handleSelectArtist(suggestion.artistId, suggestion.name)}
                          className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors">
                          {suggestion.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Revenue Split %</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newCollaboratorRevenueSplit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || (!isNaN(parseInt(value)) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
                        setNewCollaboratorRevenueSplit(value);
                        // Clear error when user changes the value
                        if (collaboratorError) {
                          setCollaboratorError("");
                        }
                      }
                    }}
                    placeholder="0"
                    className={`w-full ${collaboratorError ? "border-red-500" : ""}`}
                  />
                  <p className="text-gray-400 text-xs mt-1">Enter a value between 0 and 100</p>
                  {collaboratorError && <p className="text-red-400 text-sm mt-1">{collaboratorError}</p>}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddCollaboratorForm(false);
                      setNewCollaboratorArtistName("");
                      setNewCollaboratorRevenueSplit("0");
                      setShowSuggestions(false);
                    }}
                    className="text-xs text-gray-300 border-gray-600 hover:bg-gray-700">
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCollaborator}
                    disabled={!newCollaboratorArtistName.trim()}
                    className="text-xs bg-gradient-to-r from-yellow-300 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-600">
                    Add
                  </Button>
                </div>
              </div>
            )}

            {collaborators.length >= 5 && <p className="text-gray-400 text-sm">Maximum of 5 collaborators reached.</p>}
          </div>

          {/* MUI Only: manage solNftName and solNftAltCodes */}
          {looseIsMuiModeCheck() && (
            <div className="space-y-2 bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <h3 className="!text-lg font-semibold text-white mb-2">Manage SolNftName and SolNftAltCodes</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">SolNftName</label>
                  <Input
                    type="text"
                    value={formData.solNftName}
                    onChange={(e) => handleInputChange("solNftName", e.target.value)}
                    placeholder="MUSG28-TKO-Into My Mind"
                    className="w-full"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">SolNftAltCodes</label>
                  <Input
                    type="text"
                    value={formData.solNftAltCodes}
                    onChange={(e) => handleInputChange("solNftAltCodes", e.target.value)}
                    placeholder="MUSSM1T1:MUSSM1T2"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing Disclaimer Modal */}
          {showPricingDisclaimerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[75vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Album Pricing Options - Important Information</h3>
                  <button onClick={() => setShowPricingDisclaimerModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="text-white space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="mb-3">
                      If you don't select any options below, this means that the album tracks (non-bonus tracks) are only provided free for anyone to stream and
                      not download or use! This is the default behaviour and you agree to have your music freely streamable.
                    </p>
                    <p className="mb-3">
                      If you want a "private album", just make sure you select all tracks as "bonus tracks" when you upload them. This makes your album only
                      available for sale.
                    </p>
                  </div>

                  <div>
                    <p className="mb-3">
                      If you want to sell your album using multiple innovative methods that only Sigma Music provides, feel free to select as many options as
                      you want and they are all available to the user. Some options are enabled immediately whilst others may take some time to be enabled (e.g.
                      Fan Collectible or Commercial Licensing via Story Protocol).
                    </p>
                    <p className="mb-3">
                      Also note that these pricing options are ONLY enabled AFTER you become a verified artist profile. More on how you can get verified is{" "}
                      <a
                        href="/faq#get-verified-artist-status"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 underline">
                        here
                      </a>
                      .
                    </p>
                  </div>

                  <div>
                    <p className="mb-3">
                      Also remember to be very clear on how sales splits and licensing work, learn more{" "}
                      <a
                        href="/faq#sales-splits-and-licensing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 underline">
                        here
                      </a>
                      .
                    </p>
                  </div>

                  <div>
                    <p className="mb-3">
                      By enabling and proceeding with sales, you agree to these{" "}
                      <a
                        href="/legal#terms-of-launching-music"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 underline">
                        terms of use
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="text-sm px-6" onClick={() => setShowPricingDisclaimerModal(false)}>
                    I Understand
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Info Modal */}
          {showPricingInfoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{currentPricingInfo.title}</h3>
                  <button onClick={() => setShowPricingInfoModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="text-white space-y-4 text-sm leading-relaxed">
                  <div className="whitespace-pre-line">{currentPricingInfo.content}</div>
                </div>

                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="text-sm px-6" onClick={() => setShowPricingInfoModal(false)}>
                    Got it
                  </Button>
                </div>
              </div>
            </div>
          )}

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

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-600"
            disabled={isSubmitting || !agreeToTermsOfLaunchMusic}>
            {isSubmitting ? "Saving..." : isNewAlbum ? "Create Album" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
