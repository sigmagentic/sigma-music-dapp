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
import { adminApi, CollectibleMetadata } from "../services";

interface CollectibleMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumTitle: string;
  collectibleId: string;
  collectibleTier: string;
  selectedAlbumArtist: Artist | null;
  onMetadataUpdated: () => void;
}

interface CollectibleMetadataFormData {
  maxMints: string;
  priceInUSD: string;
  collectibleId: string;
  creatorWallet: string;
  ipTokenId: string;
  metadataOnIpfsUrl: string;
  rarityGrade: string;
  tokenName: string;
}

export const CollectibleMetadataModal: React.FC<CollectibleMetadataModalProps> = ({
  isOpen,
  onClose,
  albumTitle,
  collectibleId,
  collectibleTier,
  selectedAlbumArtist,
  onMetadataUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<CollectibleMetadata | null>(null);
  const [formData, setFormData] = useState<CollectibleMetadataFormData>({
    maxMints: "",
    priceInUSD: "",
    collectibleId: "",
    creatorWallet: selectedAlbumArtist?.creatorPaymentsWallet || "",
    ipTokenId: "",
    metadataOnIpfsUrl: "",
    rarityGrade: "",
    tokenName: "",
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

      const response = await adminApi.collectibleMetadata.getCollectibleMetadataForAlbum({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        adminWallet: publicKey?.toBase58() || "",
        collectibleId,
      });

      if (response.success && response.data.length > 0) {
        setMetadata(response.data[0]);
        setFormData({
          maxMints: response.data[0].maxMints || "",
          priceInUSD: response.data[0].priceInUSD || "",
          collectibleId: response.data[0].collectibleId || "",
          creatorWallet: response.data[0].creatorWallet || "",
          ipTokenId: response.data[0].ipTokenId || "",
          metadataOnIpfsUrl: response.data[0].metadataOnIpfsUrl || "",
          rarityGrade: response.data[0].rarityGrade || "",
          tokenName: response.data[0].tokenName || "",
        });
      } else {
        setMetadata(null);
        setFormData({
          maxMints: "",
          priceInUSD: "",
          collectibleId: collectibleId,
          creatorWallet: selectedAlbumArtist?.creatorPaymentsWallet || "",
          ipTokenId: "",
          metadataOnIpfsUrl: "",
          rarityGrade: "",
          tokenName: `${collectibleId}-TOKEN`, // Generate token name
        });

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

  const handleFormChange = (field: keyof CollectibleMetadataFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.priceInUSD.trim()) return "Price in USD is required";
    if (!formData.collectibleId.trim()) return "Collectible ID is required";
    if (!formData.creatorWallet.trim()) return "Creator wallet is required";
    if (!formData.metadataOnIpfsUrl.trim()) return "Metadata IPFS URL is required";
    if (!formData.tokenName.trim()) return "Token name is required";

    const maxMintsNum = formData.maxMints ? parseInt(formData.maxMints) : 0;
    const priceNum = parseFloat(formData.priceInUSD);

    if (formData.maxMints && (isNaN(maxMintsNum) || maxMintsNum <= 0)) return "Max mints must be a positive number";
    if (isNaN(priceNum) || priceNum < 0) return "Price must be a non-negative number";

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
      const metadataToUpdate = {
        maxMints: formData.maxMints,
        priceInUSD: formData.priceInUSD,
      };

      const response = await adminApi.collectibleMetadata.editCollectibleMetadataForAlbum(collectibleId, metadataToUpdate);

      if (response.success && response.data?.updated) {
        toastSuccess("Collectible metadata updated successfully");
        onMetadataUpdated();
        onClose();
      } else {
        toastClosableError("Failed to update collectible metadata: " + (response.error || "Unknown error"));
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
      const dataPayload: Record<string, any> = {
        collectibleId: formData.collectibleId,
        creatorWallet: formData.creatorWallet,
        metadataOnIpfsUrl: formData.metadataOnIpfsUrl,
        priceInUSD: formData.priceInUSD,
        tokenName: formData.tokenName,
      };

      if (formData.ipTokenId) {
        dataPayload.ipTokenId = formData.ipTokenId;
      }

      if (formData.maxMints && formData.maxMints !== "0") {
        dataPayload.maxMints = formData.maxMints;
      }

      if (formData.rarityGrade) {
        dataPayload.rarityGrade = formData.rarityGrade;
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

      const response = await adminApi.collectibleMetadata.addCollectibleMetadataForAlbum(collectibleId, fullSavePayload);

      if (response.success && response.data?.created) {
        toastSuccess("Collectible metadata created successfully");
        onMetadataUpdated();
        onClose();
      } else {
        toastClosableError("Failed to create collectible metadata: " + (response.error || "Unknown error"));
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
          <Input value={metadata?.collectibleId || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Creator Wallet</label>
          <Input value={metadata?.creatorWallet || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IP Token ID</label>
          <Input value={metadata?.ipTokenId || "Not set"} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NFT Type</label>
          <Input value={metadata?.nftType || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
          <Input value={metadata?.tokenName || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rarity Grade</label>
          <Input value={metadata?.rarityGrade || "Not set"} disabled className="bg-gray-800" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL</label>
          <Input value={metadata?.metadataOnIpfsUrl || ""} disabled className="bg-gray-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Added</label>
          <Input value={metadata?.timestampAdded ? new Date(metadata.timestampAdded * 1000).toLocaleString() : ""} disabled className="bg-gray-800" />
        </div>
      </div>

      {/* Editable Fields */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Editable Fields</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Mints</label>
            <Input type="number" min="1" value={formData.maxMints} onChange={(e) => handleFormChange("maxMints", e.target.value)} placeholder="100" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.priceInUSD}
              onChange={(e) => handleFormChange("priceInUSD", e.target.value)}
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

  const renderEmptyState = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Add New {collectibleTier && collectibleTier === "t2" ? `Commercial License` : ""} Collectible Metadata
          </h3>
          <p className="text-gray-600">No collectible metadata found. Create new metadata for this album.</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collectible ID *</label>
            <Input value={formData.collectibleId} disabled className="bg-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creator Wallet *</label>
            <Input
              value={formData.creatorWallet}
              onChange={(e) => handleFormChange("creatorWallet", e.target.value)}
              placeholder="14RtZHeYBdYdsj8LH8ectM1Nmtns1H1FZD8L9WRJv6f3"
              required
            />
          </div>

          {collectibleTier && collectibleTier === "t2" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Token ID</label>
              <Input
                value={formData.ipTokenId}
                onChange={(e) => handleFormChange("ipTokenId", e.target.value)}
                placeholder="0x45F46853f921bF1D8819a20e3C088c97fF326372"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token Name *</label>
            <Input value={formData.tokenName} onChange={(e) => handleFormChange("tokenName", e.target.value)} placeholder="MUSSM6T2-TKO-Ash" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rarity Grade</label>
            <select
              value={formData.rarityGrade}
              onChange={(e) => handleFormChange("rarityGrade", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800">
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
            <Input type="number" min="1" value={formData.maxMints} onChange={(e) => handleFormChange("maxMints", e.target.value)} placeholder="100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price in USD *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.priceInUSD}
              onChange={(e) => handleFormChange("priceInUSD", e.target.value)}
              placeholder="49.00"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Metadata IPFS URL *</label>
            <Input
              value={formData.metadataOnIpfsUrl}
              onChange={(e) => handleFormChange("metadataOnIpfsUrl", e.target.value)}
              placeholder="https://gateway.lighthouse.storage/ipfs/..."
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
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleAddNew} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Creating..." : "Add New Collectible Metadata"}
        </Button>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading collectible metadata...</p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${albumTitle} - Collectible Metadata`} size="lg">
      {isLoading ? renderLoadingState() : metadata ? renderMetadataView() : renderEmptyState()}
    </Modal>
  );
};
