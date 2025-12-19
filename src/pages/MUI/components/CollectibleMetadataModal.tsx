import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Save, Plus } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { Artist } from "libs/types/common";
import { toastSuccess } from "libs/utils";
import { toastClosableError } from "libs/utils/uiShared";
import { useAccountStore } from "store/account";
import { Modal } from "./Modal";
import { adminApi, MusicCollectibleMetadata, FanCollectibleMetadata } from "../services";

interface CollectibleMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectibleTitle: string;
  collectibleId: string;
  collectibleTier: string;
  selectedArtist: Artist | null;
  isFanCollectible: boolean;
  onMetadataUpdated: () => void;
}

export interface MusicCollectibleMetadataFormData {
  collectibleId: string;
  maxMints: string;
  priceInUSD: string;
  creatorWallet: string;
  ipTokenId: string;
  metadataOnIpfsUrl: string;
  rarityGrade: string;
  tokenName: string;
  tokenImg: string;
}

export interface FanCollectibleMetadataFormData {
  collectibleId: string;
  artistId: string;
  maxMints: string;
  membershipId: string;
  metadataOnIpfsUrl: string;
  perkIdsOffered: string[];
  priceInUSD: string;
  tokenName: string;
  tokenImg: string;
}

export const CollectibleMetadataModal: React.FC<CollectibleMetadataModalProps> = ({
  isOpen,
  onClose,
  collectibleTitle,
  collectibleId,
  collectibleTier,
  selectedArtist,
  isFanCollectible,
  onMetadataUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadataMusic, setMetadataMusic] = useState<MusicCollectibleMetadata | null>(null);
  const [metadataFan, setMetadataFan] = useState<FanCollectibleMetadata | null>(null);
  const [formDataMusic, setFormDataMusic] = useState<MusicCollectibleMetadataFormData>({
    maxMints: "",
    priceInUSD: "",
    collectibleId: "",
    creatorWallet: selectedArtist?.creatorPaymentsWallet || "",
    ipTokenId: "",
    metadataOnIpfsUrl: "",
    rarityGrade: "",
    tokenName: "",
    tokenImg: "",
  });
  const [formDataFan, setFormDataFan] = useState<FanCollectibleMetadataFormData>({
    collectibleId: "",
    artistId: "",
    maxMints: "",
    membershipId: "",
    metadataOnIpfsUrl: "",
    perkIdsOffered: [],
    priceInUSD: "",
    tokenName: "",
    tokenImg: "",
  });
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();

  useEffect(() => {
    if (isOpen && collectibleId) {
      loadCollectibleMetadata();
    }
  }, [isOpen, collectibleId]);

  const loadCollectibleMetadata = async () => {
    setIsLoading(true);

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

      const response = await adminApi.collectibleMetadata.getCollectibleMetadata({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        adminWallet: publicKey?.toBase58() || "",
        collectibleId,
      });

      const dataItem = response.data[0];

      if (response.success && response.data.length > 0) {
        if (!isFanCollectible) {
          setMetadataMusic(dataItem as MusicCollectibleMetadata);
          setFormDataMusic({
            collectibleId: dataItem.collectibleId || "",
            maxMints: dataItem.maxMints || "",
            priceInUSD: dataItem.priceInUSD || "",
            creatorWallet: (dataItem as MusicCollectibleMetadata).creatorWallet || "",
            ipTokenId: (dataItem as MusicCollectibleMetadata).ipTokenId || "",
            metadataOnIpfsUrl: dataItem.metadataOnIpfsUrl || "",
            rarityGrade: (dataItem as MusicCollectibleMetadata).rarityGrade || "",
            tokenName: dataItem.tokenName || "",
            tokenImg: dataItem.tokenImg || "",
          });
        } else {
          setMetadataFan(dataItem as FanCollectibleMetadata);
          setFormDataFan({
            collectibleId: dataItem.collectibleId || "",
            artistId: (dataItem as FanCollectibleMetadata).artistId || "",
            maxMints: (dataItem as FanCollectibleMetadata).maxMints || "",
            membershipId: (dataItem as FanCollectibleMetadata).membershipId || "",
            metadataOnIpfsUrl: dataItem.metadataOnIpfsUrl || "",
            perkIdsOffered: (dataItem as FanCollectibleMetadata).perkIdsOffered || [],
            priceInUSD: dataItem.priceInUSD || "",
            tokenName: response.data[0].tokenName || "",
            tokenImg: dataItem.tokenImg || "",
          });
        }
      } else {
        if (!isFanCollectible) {
          setMetadataMusic(null);
          setFormDataMusic({
            collectibleId: collectibleId,
            maxMints: "",
            priceInUSD: "",
            creatorWallet: selectedArtist?.creatorPaymentsWallet || "",
            ipTokenId: "",
            metadataOnIpfsUrl: "",
            rarityGrade: "",
            tokenName: `${collectibleId}-MUSIC-TOKEN`, // Generate token name
            tokenImg: "",
          });
        } else {
          setMetadataFan(null);
          setFormDataFan({
            collectibleId: collectibleId,
            artistId: selectedArtist?.artistId || "",
            maxMints: "",
            membershipId: "",
            metadataOnIpfsUrl: "",
            perkIdsOffered: [],
            priceInUSD: "",
            tokenName: `${collectibleId}-FAN-TOKEN`, // Generate token name
            tokenImg: "",
          });
        }

        if (response.error) {
          toastClosableError(response.error);
        }
      }
    } catch (error) {
      console.error("Error loading collectible metadata:", error);
      toastClosableError("Failed to load collectible metadata");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChangeMusic = (field: keyof MusicCollectibleMetadataFormData, value: string) => {
    setFormDataMusic((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormChangeFan = (field: keyof FanCollectibleMetadataFormData, value: string) => {
    setFormDataFan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePerkIdsChange = (value: string) => {
    const perkIds = value.split(", ").filter((id) => id.trim());
    setFormDataFan((prev) => ({
      ...prev,
      perkIdsOffered: perkIds,
    }));
  };

  const validateForm = (): string | null => {
    if (!isFanCollectible) {
      // Music collectible validation
      if (!formDataMusic.priceInUSD.trim()) return "Price in USD is required";
      if (!formDataMusic.collectibleId.trim()) return "Collectible ID is required";
      if (!formDataMusic.creatorWallet.trim()) return "Creator wallet is required";
      if (!formDataMusic.metadataOnIpfsUrl.trim()) return "Metadata IPFS URL is required";
      if (!formDataMusic.tokenName.trim()) return "Token name is required";
      if (!formDataMusic.tokenImg.trim()) return "Token image URL is required";

      const maxMintsNum = formDataMusic.maxMints ? parseInt(formDataMusic.maxMints) : 0;
      const priceNum = parseFloat(formDataMusic.priceInUSD);

      if (formDataMusic.maxMints && (isNaN(maxMintsNum) || maxMintsNum <= 0)) return "Max mints must be a positive number";
      if (isNaN(priceNum) || priceNum < 0) return "Price must be a non-negative number";
    } else {
      // Fan collectible validation
      if (!formDataFan.priceInUSD.trim()) return "Price in USD is required";
      if (!formDataFan.collectibleId.trim()) return "Collectible ID is required";
      if (!formDataFan.artistId.trim()) return "Artist ID is required";
      if (!formDataFan.membershipId.trim()) return "Membership ID is required";
      if (!formDataFan.metadataOnIpfsUrl.trim()) return "Metadata IPFS URL is required";
      if (!formDataFan.tokenName.trim()) return "Token name is required";
      if (!formDataFan.tokenImg.trim()) return "Token image URL is required";

      const maxMintsNum = formDataFan.maxMints ? parseInt(formDataFan.maxMints) : 0;
      const priceNum = parseFloat(formDataFan.priceInUSD);

      if (formDataFan.maxMints && (isNaN(maxMintsNum) || maxMintsNum <= 0)) return "Max mints must be a positive number";
      if (isNaN(priceNum) || priceNum < 0) return "Price must be a non-negative number";
    }

    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toastClosableError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isFanCollectible) {
        // Music collectible save logic
        const metadataToUpdate = {
          maxMints: formDataMusic.maxMints,
          priceInUSD: formDataMusic.priceInUSD,
        };

        const response = await adminApi.collectibleMetadata.editCollectibleMetadata(collectibleId, metadataToUpdate);

        if (response.success && response.data?.updated) {
          toastSuccess("Collectible metadata updated successfully");
          onMetadataUpdated();
          onClose();
        } else {
          toastClosableError("Failed to update collectible metadata: " + (response.error || "Unknown error"));
        }
      } else {
        // Fan collectible save logic - use the same API method for now
        const metadataToUpdate = {
          maxMints: formDataFan.maxMints,
          priceInUSD: formDataFan.priceInUSD,
        };

        const response = await adminApi.collectibleMetadata.editCollectibleMetadata(collectibleId, metadataToUpdate);

        if (response.success && response.data?.updated) {
          toastSuccess("Fan collectible metadata updated successfully");
          onMetadataUpdated();
          onClose();
        } else {
          toastClosableError("Failed to update fan collectible metadata: " + (response.error || "Unknown error"));
        }
      }
    } catch (err) {
      console.error("Error updating collectible metadata:", err);
      toastClosableError("Failed to update collectible metadata");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNew = async () => {
    const error = validateForm();
    if (error) {
      toastClosableError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isFanCollectible) {
        // Music collectible add logic
        const dataPayload: Record<string, any> = {
          collectibleId: formDataMusic.collectibleId,
          creatorWallet: formDataMusic.creatorWallet,
          metadataOnIpfsUrl: formDataMusic.metadataOnIpfsUrl,
          priceInUSD: formDataMusic.priceInUSD,
          tokenName: formDataMusic.tokenName,
          tokenImg: formDataMusic.tokenImg,
        };

        if (formDataMusic.ipTokenId) {
          dataPayload.ipTokenId = formDataMusic.ipTokenId;
        }

        if (formDataMusic.maxMints && formDataMusic.maxMints !== "0") {
          dataPayload.maxMints = formDataMusic.maxMints;
        }

        if (formDataMusic.rarityGrade) {
          dataPayload.rarityGrade = formDataMusic.rarityGrade;
        }

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

        const fullSavePayload = {
          solSignature: usedPreAccessSignature,
          signatureNonce: usedPreAccessNonce,
          adminWallet: publicKey?.toBase58(),
          type: "album",
          dataPayload,
        };

        const response = await adminApi.collectibleMetadata.addCollectibleMetadata(fullSavePayload);

        if (response.success && response.data?.created) {
          toastSuccess("Collectible metadata created successfully");
          onMetadataUpdated();
          onClose();
        } else {
          toastClosableError("Failed to create collectible metadata: " + (response.error || "Unknown error"));
        }
      } else {
        // Fan collectible add logic - use the same API method for now
        const dataPayload: Record<string, any> = {
          collectibleId: formDataFan.collectibleId,
          artistId: formDataFan.artistId,
          membershipId: formDataFan.membershipId,
          metadataOnIpfsUrl: formDataFan.metadataOnIpfsUrl,
          priceInUSD: formDataFan.priceInUSD,
          tokenName: formDataFan.tokenName,
          perkIdsOffered: formDataFan.perkIdsOffered,
          tokenImg: formDataFan.tokenImg,
        };

        if (formDataFan.maxMints && formDataFan.maxMints !== "0") {
          dataPayload.maxMints = formDataFan.maxMints;
        }

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

        const fullSavePayload = {
          solSignature: usedPreAccessSignature,
          signatureNonce: usedPreAccessNonce,
          adminWallet: publicKey?.toBase58(),
          type: "fan",
          dataPayload,
        };

        const response = await adminApi.collectibleMetadata.addCollectibleMetadata(fullSavePayload);

        if (response.success && response.data?.created) {
          toastSuccess("Fan collectible metadata created successfully");
          onMetadataUpdated();
          onClose();
        } else {
          toastClosableError("Failed to create fan collectible metadata: " + (response.error || "Unknown error"));
        }
      }
    } catch (err) {
      console.error("Error creating collectible metadata:", err);
      toastClosableError("Failed to create collectible metadata");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMetadataView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Edit Collectible Metadata</h3>
          <p className="text-gray-600">Update the collectible metadata for this album</p>
        </div>
      </div>

      {/* Static Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collectible ID</label>
          <Input value={metadataMusic?.collectibleId || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Creator Wallet</label>
          <Input value={metadataMusic?.creatorWallet || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IP Token ID</label>
          <Input value={metadataMusic?.ipTokenId || "Not set"} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NFT Type</label>
          <Input value={metadataMusic?.nftType || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
          <Input value={metadataMusic?.tokenName || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rarity Grade</label>
          <Input value={metadataMusic?.rarityGrade || "Not set"} disabled className="bg-gray-800" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL</label>
          <Input value={metadataMusic?.metadataOnIpfsUrl || ""} disabled className="bg-gray-800" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Image URL</label>
          <Input value={metadataMusic?.tokenImg || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Added</label>
          <Input value={metadataMusic?.timestampAdded ? new Date(metadataMusic.timestampAdded).toLocaleString() : ""} disabled className="bg-gray-800" />
        </div>
      </div>

      {/* Editable Fields */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Editable Fields</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Mints</label>
            <Input
              type="number"
              min="1"
              value={formDataMusic.maxMints}
              onChange={(e) => handleFormChangeMusic("maxMints", e.target.value)}
              placeholder="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formDataMusic.priceInUSD}
              onChange={(e) => handleFormChangeMusic("priceInUSD", e.target.value)}
              placeholder="49.00"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : "Edit Collectible Metadata"}
        </Button>
      </div>
    </div>
  );

  const renderMetadataViewFan = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Edit Fan Collectible Metadata</h3>
          <p className="text-gray-600">Update the collectible metadata for this fan membership</p>
        </div>
      </div>

      {/* Static Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collectible ID</label>
          <Input value={metadataFan?.collectibleId || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Artist ID</label>
          <Input value={metadataFan?.artistId || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membership ID</label>
          <Input value={metadataFan?.membershipId || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NFT Type</label>
          <Input value={metadataFan?.nftType || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
          <Input value={metadataFan?.tokenName || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Perk IDs Offered</label>
          <Input value={metadataFan?.perkIdsOffered?.join(", ") || "None"} disabled className="bg-gray-800" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL</label>
          <Input value={metadataFan?.metadataOnIpfsUrl || ""} disabled className="bg-gray-800" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Image URL</label>
          <Input value={metadataFan?.tokenImg || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Added</label>
          <Input value={metadataFan?.timestampAdded ? new Date(metadataFan.timestampAdded).toLocaleString() : ""} disabled className="bg-gray-800" />
        </div>
      </div>

      {/* Editable Fields */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Editable Fields</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Mints</label>
            <Input
              type="number"
              min="1"
              value={formDataFan.maxMints}
              onChange={(e) => handleFormChangeFan("maxMints", e.target.value)}
              placeholder="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formDataFan.priceInUSD}
              onChange={(e) => handleFormChangeFan("priceInUSD", e.target.value)}
              placeholder="5.00"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : "Edit Fan Collectible Metadata"}
        </Button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Add New {isFanCollectible ? "Fan" : collectibleTier && collectibleTier === "t2" ? `AI-License` : ""} Collectible Metadata
          </h3>
          <p className="text-gray-600">No collectible metadata found. Create new metadata for this {isFanCollectible ? "fan membership" : "album"}.</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {!isFanCollectible ? (
          // Music collectible form
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collectible ID *</label>
              <Input value={formDataMusic.collectibleId} disabled className="bg-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Creator Wallet *</label>
              <Input
                value={formDataMusic.creatorWallet}
                onChange={(e) => handleFormChangeMusic("creatorWallet", e.target.value)}
                placeholder="14RtZHeYBdYdsj8LH8ectM1Nmtns1H1FZD8L9WRJv6f3"
                required
              />
            </div>

            {collectibleTier && collectibleTier === "t2" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Token ID</label>
                <Input
                  value={formDataMusic.ipTokenId}
                  onChange={(e) => handleFormChangeMusic("ipTokenId", e.target.value)}
                  placeholder="0x45F46853f921bF1D8819a20e3C088c97fF326372"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Name *</label>
              <Input
                value={formDataMusic.tokenName}
                onChange={(e) => handleFormChangeMusic("tokenName", e.target.value)}
                placeholder="MUSSM6T2-TKO-Ash"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rarity Grade</label>
              <select
                value={formDataMusic.rarityGrade}
                onChange={(e) => handleFormChangeMusic("rarityGrade", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent bg-gray-800">
                <option value="">Select rarity grade</option>
                <option value="Common">Common</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Rare">Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
                <option value="Mythic">Mythic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Mints</label>
              <Input
                type="number"
                min="1"
                value={formDataMusic.maxMints}
                onChange={(e) => handleFormChangeMusic("maxMints", e.target.value)}
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formDataMusic.priceInUSD}
                onChange={(e) => handleFormChangeMusic("priceInUSD", e.target.value)}
                placeholder="49.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL *</label>
              <Input
                value={formDataMusic.metadataOnIpfsUrl}
                onChange={(e) => handleFormChangeMusic("metadataOnIpfsUrl", e.target.value)}
                placeholder="https://gateway.lighthouse.storage/ipfs/foo.json"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Image URL *</label>
              <Input
                value={formDataMusic.tokenImg}
                onChange={(e) => handleFormChangeMusic("tokenImg", e.target.value)}
                placeholder="https://gateway.lighthouse.storage/ipfs/foo.gif"
                required
              />
            </div>

            {/* Static Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NFT Type</label>
              <Input value="album" disabled className="bg-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Added</label>
              <Input value="Auto-generated" disabled className="bg-gray-800" />
            </div>
          </div>
        ) : (
          // Fan collectible form
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collectible ID *</label>
              <Input value={formDataFan.collectibleId} disabled className="bg-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artist ID *</label>
              <Input value={formDataFan.artistId} disabled className="bg-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membership ID *</label>
              <Input value={formDataFan.membershipId} onChange={(e) => handleFormChangeFan("membershipId", e.target.value)} placeholder="t1" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Name *</label>
              <Input
                value={formDataFan.tokenName}
                onChange={(e) => handleFormChangeFan("tokenName", e.target.value)}
                placeholder="FANG49-WsbPhlLoonyo-T1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Mints</label>
              <Input type="number" min="1" value={formDataFan.maxMints} onChange={(e) => handleFormChangeFan("maxMints", e.target.value)} placeholder="200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formDataFan.priceInUSD}
                onChange={(e) => handleFormChangeFan("priceInUSD", e.target.value)}
                placeholder="5.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL *</label>
              <Input
                value={formDataFan.metadataOnIpfsUrl}
                onChange={(e) => handleFormChangeFan("metadataOnIpfsUrl", e.target.value)}
                placeholder="https://gateway.lighthouse.storage/ipfs/foo.json"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Image URL *</label>
              <Input
                value={formDataFan.tokenImg}
                onChange={(e) => handleFormChangeFan("tokenImg", e.target.value)}
                placeholder="https://gateway.lighthouse.storage/ipfs/foo.gif"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Perk IDs Offered</label>
              <Input value={formDataFan.perkIdsOffered.join(", ")} onChange={(e) => handlePerkIdsChange(e.target.value)} placeholder="p10, p11, p12" />
            </div>

            {/* Static Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NFT Type</label>
              <Input value="fan" disabled className="bg-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Added</label>
              <Input value="Auto-generated" disabled className="bg-gray-800" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleAddNew} disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Creating..." : `Add New ${isFanCollectible ? "Fan" : ""} Collectible Metadata`}
        </Button>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-200 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading collectible metadata...</p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${collectibleTitle} - Collectible Metadata`} size="lg">
      {isLoading
        ? renderLoadingState()
        : isFanCollectible
          ? metadataFan
            ? renderMetadataViewFan()
            : renderEmptyState()
          : metadataMusic
            ? renderMetadataView()
            : renderEmptyState()}
    </Modal>
  );
};
