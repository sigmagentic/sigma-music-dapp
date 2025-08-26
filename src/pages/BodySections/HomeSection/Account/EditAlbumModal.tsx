import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { Switch } from "libComponents/Switch";
import { MediaUpdate } from "libComponents/MediaUpdate";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { saveMediaToServerViaAPI } from "libs/utils/api";
import { toastError } from "libs/utils/ui";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccountStore } from "store/account";
import { InfoTooltip } from "libComponents/Tooltip";

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
  albumPriceOption3: string; // Album + Fan Collectible + Commercial License
  albumPriceOption4: string; // Album + Commercial AI Remix License
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
  const [formData, setFormData] = useState<AlbumFormData>({ ...initialData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AlbumFormData>>({});
  const [newSelectedAlbumImageFile, setNewSelectedAlbumImageFile] = useState<File | null>(null);
  const [showPricingDisclaimerModal, setShowPricingDisclaimerModal] = useState(false);
  const [showPricingInfoModal, setShowPricingInfoModal] = useState(false);
  const [currentPricingInfo, setCurrentPricingInfo] = useState<{ title: string; content: string }>({ title: "", content: "" });
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { signMessage } = useWallet();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Set default values for pricing options if they don't exist
      const defaultPricingData = {
        ...initialData,
        albumPriceOption1: initialData.albumPriceOption1 || "",
        albumPriceOption2: initialData.albumPriceOption2 || "",
        albumPriceOption3: initialData.albumPriceOption3 || "",
        albumPriceOption4: initialData.albumPriceOption4 || "",
      };
      setFormData(defaultPricingData);
      setErrors({});
      setNewSelectedAlbumImageFile(null);
    }
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AlbumFormData> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          signMessage,
          publicKey: publicKeySol,
          updateSolPreaccessNonce,
          updateSolSignedPreaccess,
          updateSolPreaccessTimestamp,
        });

        if (!usedPreAccessNonce || !usedPreAccessSignature) {
          throw new Error("Failed to valid signature to prove account ownership");
        }

        const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedAlbumImageFile, solPreaccessSignature, solPreaccessNonce, addressSol);

        if (fileUploadResponse) {
          formData.img = fileUploadResponse;
        } else {
          toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
          return;
        }
      }
      // E: if a new file has been selected, we need to save it to the server to get back a https url for profileImage

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
      };

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

  const showPricingInfo = (title: string, content: string) => {
    setCurrentPricingInfo({ title, content });
    setShowPricingInfoModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col">
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
                Album Cover Image URL <span className="text-red-400">*</span>
              </label>

              <div className="mb-3">
                <MediaUpdate
                  imageUrl={formData.img}
                  size="md"
                  onFileSelect={(file) => {
                    console.log("Selected file:", file);
                    setNewSelectedAlbumImageFile(file);
                  }}
                  onFileRevert={() => {
                    console.log("File reverted");
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
                <label className="text-sm font-medium text-gray-300">Explicit Content</label>
                <p className="text-gray-400 text-xs">Does this album contain explicit content?</p>
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
              <Switch checked={formData.isPublished === "1"} onCheckedChange={(checked) => handleToggleChange("isPublished", checked)} />
            </div>
          </div>

          {/* Album Sale Options */}
          <div className="space-y-6">
            {/* Disclaimer */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Album Pricing Options</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Before enabling pricing options,{" "}
                    <button
                      type="button"
                      onClick={() => setShowPricingDisclaimerModal(true)}
                      className="text-yellow-400 hover:text-yellow-300 underline font-medium">
                      (Read and agree) to this first
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Digital Album + Bonus Tracks Only */}
              <div className="bg-black border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white">Digital Album + Bonus Tracks Only</h4>
                  <button
                    type="button"
                    onClick={() =>
                      showPricingInfo(
                        "Digital Album + Bonus Tracks Only",
                        "Buyer gets Stream + MP3 downloads incl. bonus tracks. Enabled immediately.\n\nLicense: CC BY-NC-ND 4.0: Attribution, Non Commercial, No Derivatives"
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
                <select
                  value={formData.albumPriceOption1}
                  onChange={(e) => handleInputChange("albumPriceOption1", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Not offered</option>
                  <option value="4">$4 (less than 6 tracks album)</option>
                  <option value="9">$9 (more than 6 tracks in album)</option>
                </select>
              </div>

              {/* Option 4: Album + Commercial AI Remix License */}
              <div className="bg-black border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white">Album + Commercial AI Remix License</h4>
                  <button
                    type="button"
                    onClick={() =>
                      showPricingInfo(
                        "Album + Commercial AI Remix License",
                        "Buyer gets full digital Album + commercial use license. Takes a few days to setup and be enabled.\n\nLicense: CC BY 4.0: Attribution Only. Commercial Use + Derivatives + Redistribution. Also includes on-chain Story Protocol license"
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
                <select
                  value={formData.albumPriceOption4}
                  onChange={(e) => handleInputChange("albumPriceOption4", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Not offered</option>
                  <option value="34">$34 (less than 6 tracks album)</option>
                  <option value="39">$39 (more than 6 tracks in album)</option>
                </select>
              </div>

              {/* Option 2: Album + Fan Collectible (NFT) */}
              <div className="bg-black border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white">Album + Fan Collectible (NFT)</h4>
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
                <select
                  value={formData.albumPriceOption2}
                  onChange={(e) => handleInputChange("albumPriceOption2", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Not offered</option>
                  <option value="14">$14 (less than 6 tracks album)</option>
                  <option value="19">$19 (more than 6 tracks in album)</option>
                </select>
              </div>

              {/* Option 3: Album + Fan Collectible + Commercial License */}
              <div className="bg-black border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white">Album + Fan Collectible + Commercial License</h4>
                  <button
                    type="button"
                    onClick={() =>
                      showPricingInfo(
                        "Album + Fan Collectible + Commercial License",
                        "Buyer gets full digital Album + fan collectible + commercial license. Ultimate web3 + AI Remix ready package! Takes a few days to setup and be enabled.\n\nLicense: CC BY 4.0: Attribution Only. Commercial Use + Derivatives + Redistribution. Also includes on-chain Story Protocol license"
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
                <select
                  value={formData.albumPriceOption3}
                  onChange={(e) => handleInputChange("albumPriceOption3", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Not offered</option>
                  <option value="44">$44 (less than 6 tracks album)</option>
                  <option value="49">$49 (more than 6 tracks in album)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Disclaimer Modal */}
          {showPricingDisclaimerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
              <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                      Also remember to be very clear on how payment splits and licensing work, learn more{" "}
                      <a
                        href="/faq#payment-splits-and-licensing"
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
                        href="/legal#terms-of-sale-by-artist"
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
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-600"
            disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNewAlbum ? "Create Album" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
