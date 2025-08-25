import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { InfoTooltip } from "libComponents/Tooltip";
import { isValidUrl, toastError } from "libs/utils/ui";
import { MediaUpdateImg } from "libComponents/MediaUpdateImg";
import { saveMediaToServerViaAPI, checkIfArtistSlugIsAvailableViaAPI } from "libs/utils/api";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccountStore } from "store/account";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface EditArtistProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ArtistProfileFormData) => Promise<boolean>;
  initialData: ArtistProfileFormData;
}

export interface ArtistProfileFormData {
  name: string;
  bio: string;
  img: string;
  slug: string;
  altMainPortfolioLink: string;
  xLink: string;
  ytLink: string;
  tikTokLink: string;
  instaLink: string;
  webLink: string;
}

interface ValidationErrors {
  name?: string;
  bio?: string;
  img?: string;
  slug?: string;
  altMainPortfolioLink?: string;
  xLink?: string;
  ytLink?: string;
  tikTokLink?: string;
  instaLink?: string;
  webLink?: string;
}

export const EditArtistProfileModal: React.FC<EditArtistProfileModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<ArtistProfileFormData>({ ...initialData });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSelectedArtistProfileImageFile, setNewSelectedArtistProfileImageFile] = useState<File | null>(null);
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { signMessage } = useWallet();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const [slugAvailability, setSlugAvailability] = useState<"available" | "unavailable" | "unchecked" | "checking">("unchecked");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

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
    setFormData({ ...initialData });
    setErrors({});
    setNewSelectedArtistProfileImageFile(null);
    setSlugAvailability("unchecked");
    setIsCheckingSlug(false);
  }, [initialData]);

  // Check if form data has changed from initial data
  const hasFormChanged = (): boolean => {
    debugger;
    return (
      formData.name.trim() !== initialData.name.trim() ||
      formData.bio.trim() !== initialData.bio.trim() ||
      formData.img !== initialData.img ||
      (formData.slug !== initialData.slug && slugAvailability === "available") ||
      formData.altMainPortfolioLink.trim() !== initialData.altMainPortfolioLink ||
      formData.xLink.trim() !== initialData.xLink ||
      formData.ytLink.trim() !== initialData.ytLink ||
      formData.tikTokLink.trim() !== initialData.tikTokLink ||
      formData.instaLink.trim() !== initialData.instaLink ||
      formData.webLink.trim() !== initialData.webLink ||
      !!newSelectedArtistProfileImageFile
    );
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Artist name validation - required, max 50 characters
    if (!formData.name.trim()) {
      newErrors.name = "Artist name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Artist name must be 50 characters or less";
    } else if (!/^[a-zA-Z0-9- ]+$/.test(formData.name)) {
      newErrors.name = "Artist name can only contain letters, numbers, spaces, and hyphens";
    }

    // Bio validation - required, max 1000 characters
    if (!formData.bio.trim()) {
      newErrors.bio = "Artist bio is required";
    } else if (formData.bio.length > 1000) {
      newErrors.bio = "Artist bio must be 1000 characters or less";
    }

    // Image validation - required
    if (!formData.img && !newSelectedArtistProfileImageFile) {
      newErrors.img = "Profile image is required";
    }

    // Slug validation - required, max 80 characters, no spaces or special chars, and must be available
    if (!formData.slug.trim()) {
      newErrors.slug = "Profile URL slug is required";
    } else if (formData.slug.length > 80) {
      newErrors.slug = "Profile URL slug must be 80 characters or less";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Profile URL slug can only contain lowercase letters, numbers, and hyphens";
    } else if (formData.slug !== initialData.slug && slugAvailability !== "available") {
      newErrors.slug = "Please check slug availability before proceeding";
    }

    // Optional link validations - if provided, must be valid HTTPS URLs
    if (formData.altMainPortfolioLink.trim() && !isValidUrl(formData.altMainPortfolioLink)) {
      newErrors.altMainPortfolioLink = "Please enter a valid HTTPS URL";
    }
    if (formData.xLink.trim() && !isValidUrl(formData.xLink)) {
      newErrors.xLink = "Please enter a valid HTTPS URL";
    }
    if (formData.ytLink.trim() && !isValidUrl(formData.ytLink)) {
      newErrors.ytLink = "Please enter a valid HTTPS URL";
    }
    if (formData.tikTokLink.trim() && !isValidUrl(formData.tikTokLink)) {
      newErrors.tikTokLink = "Please enter a valid HTTPS URL";
    }
    if (formData.instaLink.trim() && !isValidUrl(formData.instaLink)) {
      newErrors.instaLink = "Please enter a valid HTTPS URL";
    }
    if (formData.webLink.trim() && !isValidUrl(formData.webLink)) {
      newErrors.webLink = "Please enter a valid HTTPS URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (field: keyof ArtistProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // S: if a new file has been selected, we need to save it to the server to get back a https url for profileImage
    if (newSelectedArtistProfileImageFile && addressSol) {
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

      const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedArtistProfileImageFile, solPreaccessSignature, solPreaccessNonce, addressSol);

      if (fileUploadResponse) {
        formData.img = fileUploadResponse;
      } else {
        toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
        return;
      }
    }
    // E: if a new file has been selected, we need to save it to the server to get back a https url for profileImage

    try {
      // we only send the changed form data to the server to save
      const changedFormData: Partial<ArtistProfileFormData> = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        img: formData.img,
        slug: formData.slug.trim(),
      };

      if (initialData.altMainPortfolioLink !== formData.altMainPortfolioLink) {
        changedFormData.altMainPortfolioLink = formData.altMainPortfolioLink.trim();
      }

      if (initialData.xLink !== formData.xLink) {
        changedFormData.xLink = formData.xLink.trim();
      }

      if (initialData.ytLink !== formData.ytLink) {
        changedFormData.ytLink = formData.ytLink.trim();
      }

      if (initialData.tikTokLink !== formData.tikTokLink) {
        changedFormData.tikTokLink = formData.tikTokLink.trim();
      }

      if (initialData.instaLink !== formData.instaLink) {
        changedFormData.instaLink = formData.instaLink.trim();
      }

      if (initialData.webLink !== formData.webLink) {
        changedFormData.webLink = formData.webLink.trim();
      }

      const success = await onSave(changedFormData as ArtistProfileFormData);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving artist profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
    setErrors({});
    setNewSelectedArtistProfileImageFile(null);
    setSlugAvailability("unchecked");
    setIsCheckingSlug(false);
    onClose();
  };

  const handleSlugChange = (slug: string) => {
    handleFormChange("slug", slug);
    // Reset availability status when slug changes
    setSlugAvailability("unchecked");
    // Clear any existing slug errors
    if (errors.slug) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slug;
        return newErrors;
      });
    }
  };

  const checkSlugAvailability = async () => {
    if (!formData.slug.trim()) {
      setErrors((prev) => ({ ...prev, slug: "Please enter a slug first" }));
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setErrors((prev) => ({ ...prev, slug: "Profile URL slug can only contain lowercase letters, numbers, and hyphens" }));
      return;
    }

    setIsCheckingSlug(true);
    setSlugAvailability("checking");

    try {
      const result = await checkIfArtistSlugIsAvailableViaAPI(formData.slug);
      if (result.isAvailable) {
        setSlugAvailability("available");
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      } else {
        setSlugAvailability("unavailable");
        setErrors((prev) => ({ ...prev, slug: "This slug is already taken. Please try another one." }));
      }
    } catch (error) {
      setSlugAvailability("unchecked");
      setErrors((prev) => ({ ...prev, slug: "Error checking slug availability. Please try again." }));
    } finally {
      setIsCheckingSlug(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="!text-2xl font-semibold !text-yellow-500">Edit Artist Profile Information</h2>
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className={`h-8 w-8 p-0 hover:bg-gray-800 text-white ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
          <div className="space-y-6 mb-8 flex md:flex-row flex-col gap-4 bgx-red-500">
            <div className="flex flex-col gap-4 md:w-2/3">
              {/* Artist Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name *
                  <InfoTooltip content="This is your Artist Name" position="right" />
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Enter your artist name"
                  maxLength={50}
                  className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                <p className="text-gray-400 text-xs mt-2">{formData.name.length}/50 characters</p>
              </div>

              {/* Artist Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Bio *
                  <InfoTooltip content="This is your Artist Bio" position="right" />
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleFormChange("bio", e.target.value)}
                  placeholder="Tell us about your music, style, and what makes you unique..."
                  maxLength={1000}
                  rows={4}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    errors.bio ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio}</p>}
                <p className="text-gray-400 text-xs">{formData.bio.length}/1000 characters</p>
              </div>
            </div>

            <div className="md:w-1/3 flex flex-col items-center justify-top">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Image *
                  <InfoTooltip content="Enter a direct link to your profile image. Must be an HTTPS URL." position="right" />
                </label>

                <div className="mb-3">
                  <MediaUpdateImg
                    imageUrl={formData.img}
                    size="md"
                    onFileSelect={(file) => {
                      console.log("Selected file:", file);
                      setNewSelectedArtistProfileImageFile(file);
                    }}
                    onFileRevert={() => {
                      console.log("File reverted");
                      setNewSelectedArtistProfileImageFile(null);
                    }}
                    alt="Profile"
                  />
                </div>

                {/* <Input
                  type="url"
                  value={formData.img}
                  onChange={(e) => handleFormChange("img", e.target.value)}
                  placeholder="https://example.com/artist-image.jpg"
                  className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.img ? "border-red-500" : ""}`}
                /> */}
                {errors.img && <p className="text-red-400 text-sm mt-1">{errors.img}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-6 mb-8 bgx-green-500">
            {/* Profile URL Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile URL Slug *
                <InfoTooltip
                  content="This friendly URL slug is used for your profile page and helps with profile discovery and sharing. It's best if it matches your artist name and it must be unique."
                  position="right"
                />
              </label>
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="young-buck"
                    maxLength={80}
                    className={`flex-1 ${errors.slug ? "border-red-500" : ""}`}
                  />
                  <Button
                    onClick={checkSlugAvailability}
                    disabled={!formData.slug.trim() || isCheckingSlug}
                    variant="outline"
                    className="px-4 py-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    {isCheckingSlug ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Availability"
                    )}
                  </Button>
                </div>

                {/* Availability Status */}
                {slugAvailability === "available" && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />✓ Slug is available!
                  </div>
                )}
                {slugAvailability === "unavailable" && (
                  <div className="flex items-center text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 mr-2" />✗ Slug is already taken
                  </div>
                )}
                {slugAvailability === "checking" && (
                  <div className="flex items-center text-yellow-400 text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking availability...
                  </div>
                )}
              </div>
              {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
              <p className="text-gray-400 text-xs mt-1">Your profile will be available at: sigma-music.com/artist/{formData.slug}</p>
              {slugAvailability !== "available" && (
                <p className="text-xs mt-1">Click the "Check Availability" button to verify if the slug is available to proceed.</p>
              )}
            </div>

            {/* Social Media Links Section */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Social Media & Links</h3>
              <p className="text-gray-400 text-xs mb-6">
                All social media links are optional. <br />
                We'll verify by sending you a DM or validating your content, and once confirmed, you'll get a "Verified Artist" badge!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Music Portfolio Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Music Portfolio
                    <InfoTooltip
                      content="Enter Full URL of your preferred Music Portfolio profile (Soundcloud, Bandcamp, Spotify, Apple Music, etc)"
                      position="right"
                    />
                  </label>
                  <Input
                    type="url"
                    value={formData.altMainPortfolioLink}
                    onChange={(e) => handleFormChange("altMainPortfolioLink", e.target.value)}
                    placeholder="https://soundcloud.com/yourusername"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.altMainPortfolioLink ? "border-red-500" : ""}`}
                  />
                  {errors.altMainPortfolioLink && <p className="text-red-400 text-sm mt-1">{errors.altMainPortfolioLink}</p>}
                </div>

                {/* X Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    X Account
                    <InfoTooltip content="Enter Full URL of your X Account" position="right" />
                  </label>
                  <Input
                    type="url"
                    value={formData.xLink}
                    onChange={(e) => handleFormChange("xLink", e.target.value)}
                    placeholder="https://x.com/yourusername"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.xLink ? "border-red-500" : ""}`}
                  />
                  {errors.xLink && <p className="text-red-400 text-sm mt-1">{errors.xLink}</p>}
                </div>

                {/* YouTube Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    YouTube Account
                    <InfoTooltip content="Enter Full URL of your YouTube Account" position="right" />
                  </label>
                  <Input
                    type="url"
                    value={formData.ytLink}
                    onChange={(e) => handleFormChange("ytLink", e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.ytLink ? "border-red-500" : ""}`}
                  />
                  {errors.ytLink && <p className="text-red-400 text-sm mt-1">{errors.ytLink}</p>}
                </div>

                {/* TikTok Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    TikTok Account
                    <InfoTooltip content="Enter Full URL of your TikTok Account" position="right" />
                  </label>
                  <Input
                    type="url"
                    value={formData.tikTokLink}
                    onChange={(e) => handleFormChange("tikTokLink", e.target.value)}
                    placeholder="https://tiktok.com/@yourusername"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.tikTokLink ? "border-red-500" : ""}`}
                  />
                  {errors.tikTokLink && <p className="text-red-400 text-sm mt-1">{errors.tikTokLink}</p>}
                </div>

                {/* Instagram Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram Account
                    <InfoTooltip content="Enter Full URL of your Instagram Account" position="right" />
                  </label>
                  <Input
                    type="url"
                    value={formData.instaLink}
                    onChange={(e) => handleFormChange("instaLink", e.target.value)}
                    placeholder="https://instagram.com/yourusername"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.instaLink ? "border-red-500" : ""}`}
                  />
                  {errors.instaLink && <p className="text-red-400 text-sm mt-1">{errors.instaLink}</p>}
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website or any other link
                    <InfoTooltip content="Enter Full URL of your Website" position="right" />
                  </label>
                  <Input
                    type="url"
                    value={formData.webLink}
                    onChange={(e) => handleFormChange("webLink", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.webLink ? "border-red-500" : ""}`}
                  />
                  {errors.webLink && <p className="text-red-400 text-sm mt-1">{errors.webLink}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <Button
            onClick={handleCancel}
            variant="outline"
            className={`border-gray-600 text-white hover:bg-gray-800 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !hasFormChanged()} className="bg-yellow-300 text-black hover:bg-yellow-400">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <p>Save Changes</p>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
