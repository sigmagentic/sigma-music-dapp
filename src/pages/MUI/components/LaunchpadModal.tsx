import React, { useState, useEffect } from "react";
import { X, Plus, Trash, AlertCircle } from "lucide-react";
import { LaunchpadData, LaunchPlatform, MerchItem, FreeStreamingType, PurchaseType, PurchaseOption, MerchType } from "libs/types/common";
import { Modal } from "./Modal";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { Switch } from "libComponents/Switch";
import { Card } from "libComponents/Card";
import { updateMockLaunchpadData, getAllMockLaunchpadDataForArtist } from "libs/utils/launchpadMockData";
import { toastError, toastSuccess, clearLaunchpadDataCache } from "libs/utils";

interface LaunchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  albumId: string;
  albumTitle: string;
  initialData: LaunchpadData | null;
  liveAlbumId: string | null | undefined; // artistLaunchpadLiveAlbumId from userArtistProfile
}

interface ValidationErrors {
  general?: string;
  launchPlatforms?: string;
  [key: string]: string | undefined;
}

const PURCHASE_OPTIONS: PurchaseOption[] = [
  "Digital Album",
  "Merch",
  "Limited Edition Digital Collectible",
  "AI Remix License",
  "AI Training License",
];

const PURCHASE_TYPES: PurchaseType[] = ["Platform Membership", "Buy Album or Tracks", "Buy Full Album", "Buy Seperate Tracks"];

const FREE_STREAMING_TYPES: FreeStreamingType[] = ["Full Album", "First X tracks"];

const MERCH_TYPES: MerchType[] = ["Vinyl", "Clothing", "Other"];

export const LaunchpadModal: React.FC<LaunchpadModalProps> = ({
  isOpen,
  onClose,
  artistId,
  albumId,
  albumTitle,
  initialData,
  liveAlbumId,
}) => {
  const [formData, setFormData] = useState<LaunchpadData>(() => {
    if (initialData) {
      return { ...initialData };
    }
    return {
      artistId,
      albumId,
      isEnabled: false,
      launchPlatforms: [],
      merch: [],
      teaserVideoLink: "N/A",
    };
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlatformForm, setNewPlatformForm] = useState<Partial<LaunchPlatform>>({
    platform: "",
    premiere: false,
    directLink: "",
    freeStreaming: "Full Album",
    freeStreamingTrackCount: undefined,
    purchaseOptions: [],
    purchaseType: "Platform Membership",
    usdPriceAlbum: "n/a",
    usdPriceTrack: "n/a",
    payMoreSupported: false,
    releaseDate: "",
  });
  const [newMerchForm, setNewMerchForm] = useState<Partial<MerchItem>>({
    type: "Vinyl",
    directLink: "",
    releaseDate: "",
  });
  const [showMerchForm, setShowMerchForm] = useState<boolean>(false);

  // Check if another album is live
  const isAnotherAlbumLive = liveAlbumId && liveAlbumId !== albumId && liveAlbumId !== "";
  const isFormDisabled = isAnotherAlbumLive && !formData.isEnabled;

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        artistId,
        albumId,
        isEnabled: false,
        launchPlatforms: [],
        merch: [],
        teaserVideoLink: "N/A",
      });
    }
    setErrors({});
  }, [initialData, artistId, albumId]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // At least one launch platform required
    if (formData.launchPlatforms.length === 0) {
      newErrors.launchPlatforms = "At least one launch platform is required";
    }

    // Validate each launch platform
    formData.launchPlatforms.forEach((platform, index) => {
      if (!platform.platform.trim()) {
        newErrors[`platform_${index}_name`] = "Platform name is required";
      }
      if (!platform.directLink.trim() || !platform.directLink.startsWith("https://")) {
        newErrors[`platform_${index}_link`] = "Direct link must start with https://";
      }
      if (!platform.releaseDate) {
        newErrors[`platform_${index}_date`] = "Release date is required";
      }
      if (platform.freeStreaming === "First X tracks" && (!platform.freeStreamingTrackCount || platform.freeStreamingTrackCount <= 0)) {
        newErrors[`platform_${index}_trackCount`] = "Track count is required when 'First X tracks' is selected";
      }
    });

    // Validate merch items
    formData.merch.forEach((merch, index) => {
      if (!merch.directLink.trim() || !merch.directLink.startsWith("https://")) {
        newErrors[`merch_${index}_link`] = "Direct link must start with https://";
      }
      if (!merch.releaseDate) {
        newErrors[`merch_${index}_date`] = "Release date is required";
      }
    });

    // Validate teaser video link (optional but must be https:// if provided)
    if (formData.teaserVideoLink !== "N/A" && formData.teaserVideoLink.trim() && !formData.teaserVideoLink.startsWith("https://")) {
      newErrors.teaserVideoLink = "Teaser video link must start with https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // If enabling, check if another album is live
    if (formData.isEnabled && isAnotherAlbumLive) {
      setErrors({ general: "Another album is currently live on the launchpad. Please disable that album launchpad first." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Console log the mock object for review
      console.log("Launchpad data to save:", JSON.stringify(formData, null, 2));

      // Update mock data store
      updateMockLaunchpadData(formData);

      // Clear cache to force refresh
      clearLaunchpadDataCache(artistId, albumId);

      // TODO: Replace with actual API call when backend is ready
      // await updateLaunchpadDataViaAPI(formData);
      // After API call, update userArtistProfile.artistLaunchpadLiveAlbumId if isEnabled changed

      toastSuccess("Launchpad data saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving launchpad data:", error);
      toastError("Error saving launchpad data - " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPlatform = () => {
    if (!newPlatformForm.platform || !newPlatformForm.directLink || !newPlatformForm.releaseDate) {
      setErrors({ general: "Please fill in all required platform fields" });
      return;
    }

    if (!newPlatformForm.directLink.startsWith("https://")) {
      setErrors({ general: "Direct link must start with https://" });
      return;
    }

    if (newPlatformForm.freeStreaming === "First X tracks" && (!newPlatformForm.freeStreamingTrackCount || newPlatformForm.freeStreamingTrackCount <= 0)) {
      setErrors({ general: "Track count is required when 'First X tracks' is selected" });
      return;
    }

    const platform: LaunchPlatform = {
      platform: newPlatformForm.platform!,
      premiere: newPlatformForm.premiere || false,
      directLink: newPlatformForm.directLink!,
      freeStreaming: newPlatformForm.freeStreaming || "Full Album",
      freeStreamingTrackCount: newPlatformForm.freeStreamingTrackCount,
      purchaseOptions: newPlatformForm.purchaseOptions || [],
      purchaseType: newPlatformForm.purchaseType || "Platform Membership",
      usdPriceAlbum: newPlatformForm.usdPriceAlbum || "n/a",
      usdPriceTrack: newPlatformForm.usdPriceTrack || "n/a",
      payMoreSupported: newPlatformForm.payMoreSupported || false,
      releaseDate: newPlatformForm.releaseDate!,
    };

    // If this is set as premiere, unset all others
    if (platform.premiere) {
      setFormData((prev) => ({
        ...prev,
        launchPlatforms: prev.launchPlatforms.map((p) => ({ ...p, premiere: false })),
      }));
    }

    setFormData((prev) => ({
      ...prev,
      launchPlatforms: [...prev.launchPlatforms, platform],
    }));

    // Reset form
    setNewPlatformForm({
      platform: "",
      premiere: false,
      directLink: "",
      freeStreaming: "Full Album",
      freeStreamingTrackCount: undefined,
      purchaseOptions: [],
      purchaseType: "Platform Membership",
      usdPriceAlbum: "n/a",
      usdPriceTrack: "n/a",
      payMoreSupported: false,
      releaseDate: "",
    });
    setErrors({});
  };

  const handleRemovePlatform = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      launchPlatforms: prev.launchPlatforms.filter((_, i) => i !== index),
    }));
  };

  const handleUpdatePlatform = (index: number, field: keyof LaunchPlatform, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.launchPlatforms];
      updated[index] = { ...updated[index], [field]: value };

      // If premiere is set to true, unset all others
      if (field === "premiere" && value === true) {
        updated.forEach((p, i) => {
          if (i !== index) {
            p.premiere = false;
          }
        });
      }

      return { ...prev, launchPlatforms: updated };
    });
  };

  const handleAddMerch = () => {
    if (!newMerchForm.type || !newMerchForm.directLink || !newMerchForm.releaseDate) {
      setErrors({ general: "Please fill in all required merch fields" });
      return;
    }

    if (!newMerchForm.directLink.startsWith("https://")) {
      setErrors({ general: "Direct link must start with https://" });
      return;
    }

    const merch: MerchItem = {
      type: newMerchForm.type!,
      directLink: newMerchForm.directLink!,
      releaseDate: newMerchForm.releaseDate!,
    };

    setFormData((prev) => ({
      ...prev,
      merch: [...prev.merch, merch],
    }));

    // Reset form
    setNewMerchForm({
      type: "Vinyl",
      directLink: "",
      releaseDate: "",
    });
    setShowMerchForm(false);
    setErrors({});
  };

  const handleRemoveMerch = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      merch: prev.merch.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateMerch = (index: number, field: keyof MerchItem, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.merch];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, merch: updated };
    });
  };

  const togglePurchaseOption = (platformIndex: number, option: PurchaseOption) => {
    setFormData((prev) => {
      const updated = [...prev.launchPlatforms];
      const currentOptions = updated[platformIndex].purchaseOptions || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter((o) => o !== option)
        : [...currentOptions, option];
      updated[platformIndex] = { ...updated[platformIndex], purchaseOptions: newOptions };
      return { ...prev, launchPlatforms: updated };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Launchpad: ${albumTitle}`} size="xl" isWorking={isSubmitting}>
      <div className="space-y-6">
        {/* Subtitle */}
        <p className="!text-sm text-gray-400 mb-4">Launching a new album on multiple platforms? Use the launchpad to showcase the launch timeline to your fans</p>

        {/* Enabled/Disabled Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div>
            <label className="!text-sm font-medium text-white">Enable Launchpad</label>
            <p className="!text-xs text-gray-400 mt-1">Toggle to show/hide the launchpad tab on your artist profile</p>
          </div>
          <Switch
            checked={formData.isEnabled}
            onCheckedChange={(checked) => {
              if (checked && isAnotherAlbumLive) {
                setErrors({ general: "Another album is currently live on the launchpad. Please disable that album launchpad first." });
                return;
              }
              setFormData((prev) => ({ ...prev, isEnabled: checked }));
              setErrors({});
            }}
            disabled={isAnotherAlbumLive && !formData.isEnabled}
          />
        </div>

        {/* Warning if another album is live */}
        {isFormDisabled && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="!text-sm font-medium text-red-400">Another album is currently live on the launchpad</p>
              <p className="!text-xs text-red-300 mt-1">Please disable that album launchpad first before enabling this one.</p>
            </div>
          </div>
        )}

        {/* Launch Platforms Section */}
        <div className="space-y-4">
          <h3 className="!text-base font-semibold text-white">Launch Platforms</h3>

          {/* Existing Platforms */}
          {formData.launchPlatforms.map((platform, index) => (
            <Card key={index} className="p-4 border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <h4 className="!text-sm font-semibold text-white">Platform {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePlatform(index)}
                  className="h-8 w-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Trash className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 !text-sm">
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Platform Name *</label>
                  <Input
                    value={platform.platform}
                    onChange={(e) => handleUpdatePlatform(index, "platform", e.target.value)}
                    disabled={isFormDisabled}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`platform_${index}_name`] && <p className="!text-xs text-red-400 mt-1">{errors[`platform_${index}_name`]}</p>}
                </div>

                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Direct Link *</label>
                  <Input
                    value={platform.directLink}
                    onChange={(e) => handleUpdatePlatform(index, "directLink", e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`platform_${index}_link`] && <p className="!text-xs text-red-400 mt-1">{errors[`platform_${index}_link`]}</p>}
                </div>

                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Release Date *</label>
                  <Input
                    type="date"
                    value={platform.releaseDate}
                    onChange={(e) => handleUpdatePlatform(index, "releaseDate", e.target.value)}
                    disabled={isFormDisabled}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`platform_${index}_date`] && <p className="!text-xs text-red-400 mt-1">{errors[`platform_${index}_date`]}</p>}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platform.premiere}
                    onChange={(e) => handleUpdatePlatform(index, "premiere", e.target.checked)}
                    disabled={isFormDisabled}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="!text-xs text-gray-300">Premiere Platform</span>
                </label>

                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Free Streaming</label>
                  <select
                    value={platform.freeStreaming}
                    onChange={(e) => handleUpdatePlatform(index, "freeStreaming", e.target.value as FreeStreamingType)}
                    disabled={isFormDisabled}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white !text-sm">
                    {FREE_STREAMING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {platform.freeStreaming === "First X tracks" && (
                  <div>
                    <label className="block !text-xs text-gray-300 mb-1">Track Count *</label>
                    <Input
                      type="number"
                      value={platform.freeStreamingTrackCount || ""}
                      onChange={(e) => handleUpdatePlatform(index, "freeStreamingTrackCount", parseInt(e.target.value) || 0)}
                      disabled={isFormDisabled}
                      min="1"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {errors[`platform_${index}_trackCount`] && <p className="!text-xs text-red-400 mt-1">{errors[`platform_${index}_trackCount`]}</p>}
                  </div>
                )}

                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Purchase Options</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PURCHASE_OPTIONS.map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={platform.purchaseOptions?.includes(option) || false}
                          onChange={() => togglePurchaseOption(index, option)}
                          disabled={isFormDisabled}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="!text-xs text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Purchase Type</label>
                  <select
                    value={platform.purchaseType}
                    onChange={(e) => handleUpdatePlatform(index, "purchaseType", e.target.value as PurchaseType)}
                    disabled={isFormDisabled}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white !text-sm">
                    {PURCHASE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block !text-xs text-gray-300 mb-1">USD Price / Album</label>
                    <Input
                      type="number"
                      value={platform.usdPriceAlbum === "n/a" ? "" : platform.usdPriceAlbum}
                      onChange={(e) => handleUpdatePlatform(index, "usdPriceAlbum", e.target.value === "" ? "n/a" : parseFloat(e.target.value))}
                      disabled={isFormDisabled}
                      placeholder="n/a"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block !text-xs text-gray-300 mb-1">USD Price / Track</label>
                    <Input
                      type="number"
                      value={platform.usdPriceTrack === "n/a" ? "" : platform.usdPriceTrack}
                      onChange={(e) => handleUpdatePlatform(index, "usdPriceTrack", e.target.value === "" ? "n/a" : parseFloat(e.target.value))}
                      disabled={isFormDisabled}
                      placeholder="n/a"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platform.payMoreSupported}
                    onChange={(e) => handleUpdatePlatform(index, "payMoreSupported", e.target.checked)}
                    disabled={isFormDisabled}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="!text-xs text-gray-300">Pay More Supported</span>
                </label>
              </div>
            </Card>
          ))}

          {/* Add New Platform Form */}
          <Card className="p-4 border-dashed border-gray-600">
            <h4 className="!text-sm font-semibold text-white mb-3">Add New Platform</h4>
            <div className="space-y-3 !text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Platform Name *</label>
                  <Input
                    value={newPlatformForm.platform || ""}
                    onChange={(e) => setNewPlatformForm({ ...newPlatformForm, platform: e.target.value })}
                    disabled={isFormDisabled}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Direct Link *</label>
                  <Input
                    value={newPlatformForm.directLink || ""}
                    onChange={(e) => setNewPlatformForm({ ...newPlatformForm, directLink: e.target.value })}
                    disabled={isFormDisabled}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block !text-xs text-gray-300 mb-1">Release Date *</label>
                <Input
                  type="date"
                  value={newPlatformForm.releaseDate || ""}
                  onChange={(e) => setNewPlatformForm({ ...newPlatformForm, releaseDate: e.target.value })}
                  disabled={isFormDisabled}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={handleAddPlatform}
                disabled={isFormDisabled}
                className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-4 py-2 !text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Platform
              </Button>
            </div>
          </Card>
        </div>

        {/* Merch Section */}
        <div className="space-y-4">
          <h3 className="!text-base font-semibold text-white">Merch (Optional)</h3>

          {/* Existing Merch Items */}
          {formData.merch.map((merch, index) => (
            <Card key={index} className="p-4 border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <h4 className="!text-sm font-semibold text-white">Merch Item {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMerch(index)}
                  className="h-8 w-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Trash className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 !text-sm">
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Type</label>
                  <select
                    value={merch.type}
                    onChange={(e) => handleUpdateMerch(index, "type", e.target.value as MerchType)}
                    disabled={isFormDisabled}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white !text-sm">
                    {MERCH_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Direct Link *</label>
                  <Input
                    value={merch.directLink}
                    onChange={(e) => handleUpdateMerch(index, "directLink", e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="https://..."
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`merch_${index}_link`] && <p className="!text-xs text-red-400 mt-1">{errors[`merch_${index}_link`]}</p>}
                </div>
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Release Date *</label>
                  <Input
                    type="date"
                    value={merch.releaseDate}
                    onChange={(e) => handleUpdateMerch(index, "releaseDate", e.target.value)}
                    disabled={isFormDisabled}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {errors[`merch_${index}_date`] && <p className="!text-xs text-red-400 mt-1">{errors[`merch_${index}_date`]}</p>}
                </div>
              </div>
            </Card>
          ))}

          {/* Add New Merch Item - Show only button when form is not shown */}
          {!showMerchForm ? (
            <div className="flex justify-start">
              <Button
                onClick={() => setShowMerchForm(true)}
                disabled={isFormDisabled}
                className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-4 py-2 !text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Merch Item
              </Button>
            </div>
          ) : (
            <Card className="p-4 border-dashed border-gray-600">
              <h4 className="!text-sm font-semibold text-white mb-3">Add New Merch Item</h4>
              <div className="space-y-3 !text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block !text-xs text-gray-300 mb-1">Type</label>
                    <select
                      value={newMerchForm.type || "Vinyl"}
                      onChange={(e) => setNewMerchForm({ ...newMerchForm, type: e.target.value as MerchType })}
                      disabled={isFormDisabled}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white !text-sm">
                      {MERCH_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block !text-xs text-gray-300 mb-1">Direct Link *</label>
                    <Input
                      value={newMerchForm.directLink || ""}
                      onChange={(e) => setNewMerchForm({ ...newMerchForm, directLink: e.target.value })}
                      disabled={isFormDisabled}
                      placeholder="https://..."
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block !text-xs text-gray-300 mb-1">Release Date *</label>
                  <Input
                    type="date"
                    value={newMerchForm.releaseDate || ""}
                    onChange={(e) => setNewMerchForm({ ...newMerchForm, releaseDate: e.target.value })}
                    disabled={isFormDisabled}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddMerch}
                    disabled={isFormDisabled}
                    className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-4 py-2 !text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Merch Item
                  </Button>
                  <Button
                    onClick={() => {
                      setNewMerchForm({ type: "Vinyl", directLink: "", releaseDate: "" });
                      setShowMerchForm(false);
                    }}
                    variant="outline"
                    disabled={isFormDisabled}
                    className="border-gray-600 text-white hover:bg-gray-800 px-4 py-2 !text-sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Teaser Video Link */}
        <div className="space-y-2">
          <h3 className="!text-base font-semibold text-white">Teaser Video Link (Optional)</h3>
          <Input
            value={formData.teaserVideoLink === "N/A" ? "" : formData.teaserVideoLink}
            onChange={(e) => setFormData({ ...formData, teaserVideoLink: e.target.value || "N/A" })}
            disabled={isFormDisabled}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-gray-800 border-gray-600 text-white"
          />
          {errors.teaserVideoLink && <p className="!text-xs text-red-400 mt-1">{errors.teaserVideoLink}</p>}
        </div>

        {/* Validation Errors Summary - Moved to bottom */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="!text-sm font-medium text-red-400 mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1 !text-xs text-red-300">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
            className="border-gray-600 text-white hover:bg-gray-800">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || isFormDisabled}
            className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-2 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600">
            {isSubmitting ? "Saving..." : "Save Launchpad"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

