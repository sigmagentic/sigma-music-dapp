import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { InfoTooltip } from "libComponents/Tooltip";
import { MediaUpdateImg } from "libComponents/MediaUpdateImg";
import { saveMediaToServerViaAPI } from "libs/utils/api";
import { isValidUrl, toastError } from "libs/utils/ui";
import { useAccountStore } from "store/account";
// import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { useWallet } from "@solana/wallet-adapter-react";

interface EditUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileFormData) => Promise<boolean>;
  initialData: ProfileFormData;
  walletType: string;
}

export interface ProfileFormData {
  profileTypes: string[];
  name: string;
  primaryAccountEmail: string;
  billingEmail: string;
  profileImage: string;
}

interface ValidationErrors {
  profileTypes?: string;
  name?: string;
  primaryAccountEmail?: string;
  billingEmail?: string;
  profileImage?: string;
}

export const EditUserProfileModal: React.FC<EditUserProfileModalProps> = ({ isOpen, onClose, onSave, initialData, walletType }) => {
  const [formData, setFormData] = useState<ProfileFormData>({ ...initialData });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // keeps track if a new file is selected for edit so we can save it to the server to get back a https url for profileImage
  const [newSelectedProfileImageFile, setNewSelectedProfileImageFile] = useState<File | null>(null);

  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const { signMessage } = useWallet();

  // Cached Signature Store Items
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
    setFormData({ ...initialData });
    setErrors({});
    setNewSelectedProfileImageFile(null);
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate profile types - at least one must be selected
    if (!formData.profileTypes || formData.profileTypes.length === 0) {
      newErrors.profileTypes = "At least one profile type must be selected";
    }

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 300) {
      newErrors.name = "Name must be 300 characters or less";
    }

    // Validate account email (only if walletType is NOT web3auth)
    if (walletType !== "web3auth" && !formData.primaryAccountEmail.trim()) {
      newErrors.primaryAccountEmail = "Account email is required";
    } else if (!isValidEmail(formData.primaryAccountEmail)) {
      newErrors.primaryAccountEmail = "Please enter a valid email address";
    }

    // Validate billing email
    if (!formData.billingEmail.trim()) {
      newErrors.billingEmail = "Billing / Payouts email is required";
    } else if (!isValidEmail(formData.billingEmail)) {
      newErrors.billingEmail = "Please enter a valid email address";
    }

    // Validate profile image URL
    if (formData.profileImage.trim() && !isValidUrl(formData.profileImage)) {
      newErrors.profileImage = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFormChange = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Check if form data has changed from initial data
  const hasFormChanged = (): boolean => {
    return (
      JSON.stringify(formData.profileTypes?.sort()) !== JSON.stringify(initialData.profileTypes?.sort()) ||
      formData.name.trim() !== initialData.name ||
      formData.primaryAccountEmail.trim() !== initialData.primaryAccountEmail ||
      formData.billingEmail.trim() !== initialData.billingEmail ||
      !!newSelectedProfileImageFile
    );
  };

  const handleProfileTypeChange = (profileType: string, isChecked: boolean) => {
    setFormData((prev) => {
      const currentTypes = prev.profileTypes || [];
      if (isChecked) {
        // Add the profile type if it's not already included
        if (!currentTypes.includes(profileType)) {
          return { ...prev, profileTypes: [...currentTypes, profileType] };
        }
      } else {
        // Remove the profile type if it's included
        return { ...prev, profileTypes: currentTypes.filter((type) => type !== profileType) };
      }
      return prev;
    });

    // Clear error when user makes a selection
    if (errors.profileTypes) {
      setErrors((prev) => ({ ...prev, profileTypes: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // S: if a new file has been selected, we need to save it to the server to get back a https url for profileImage
    if (newSelectedProfileImageFile && addressSol) {
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

      const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedProfileImageFile, solPreaccessSignature, solPreaccessNonce, addressSol);

      if (fileUploadResponse) {
        formData.profileImage = fileUploadResponse;
      } else {
        toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
        return;
      }
    }
    // E: if a new file has been selected, we need to save it to the server to get back a https url for profileImage

    try {
      // we only send the changed form data to the server to save
      const changedFormData: Partial<ProfileFormData> = {};

      if (initialData.name !== formData.name) {
        changedFormData.name = formData.name.trim();
      }

      if (initialData.primaryAccountEmail !== formData.primaryAccountEmail) {
        changedFormData.primaryAccountEmail = formData.primaryAccountEmail.trim();
      }

      if (initialData.billingEmail !== formData.billingEmail) {
        changedFormData.billingEmail = formData.billingEmail.trim();
      }

      if (initialData.profileImage !== formData.profileImage) {
        changedFormData.profileImage = formData.profileImage.trim();
      }

      if (JSON.stringify(formData.profileTypes?.sort()) !== JSON.stringify(initialData.profileTypes?.sort())) {
        changedFormData.profileTypes = formData.profileTypes;
      }

      const success = await onSave(changedFormData as ProfileFormData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
    setErrors({});
    setNewSelectedProfileImageFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="!text-2xl font-semibold !text-yellow-500">Edit Profile Information</h2>
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
          <div className="space-y-6">
            {/* Profile Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Profile Type *
                <InfoTooltip
                  content="Select one or more profile types that best describe your role on Sigma Music. You can change this later."
                  position="right"
                />
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="profileTypes"
                    value="fan"
                    checked={formData.profileTypes?.includes("fan") || false}
                    onChange={(e) => handleProfileTypeChange("fan", e.target.checked)}
                    className="w-4 h-4 text-yellow-300 bg-gray-800 border-gray-600 focus:ring-yellow-300 focus:ring-2 rounded mt-0.5"
                  />
                  <span className="text-white flex items-start">
                    <span>Fan Only</span>
                    <InfoTooltip content="You only want to stream music or follow and support your favorite artists." position="right" />
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="profileTypes"
                    value="remixer"
                    checked={formData.profileTypes?.includes("remixer") || false}
                    onChange={(e) => handleProfileTypeChange("remixer", e.target.checked)}
                    className="w-4 h-4 text-yellow-300 bg-gray-800 border-gray-600 focus:ring-yellow-300 focus:ring-2 rounded mt-0.5"
                  />
                  <span className="text-white flex items-start">
                    <span>Remix Artist</span>
                    <InfoTooltip
                      content="You will use Sigma AI tools to remix original music from real-world artists and publish them yourself on your own 'remix artist' profile."
                      position="right"
                    />
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="profileTypes"
                    value="composer"
                    checked={formData.profileTypes?.includes("composer") || false}
                    onChange={(e) => handleProfileTypeChange("composer", e.target.checked)}
                    className="w-4 h-4 text-yellow-300 bg-gray-800 border-gray-600 focus:ring-yellow-300 focus:ring-2 rounded mt-0.5"
                  />
                  <span className="text-white flex items-start">
                    <span>Composing Artist</span>
                    <InfoTooltip
                      content="You compose original music, you are the OG of the music industry. You can publish your original tracks to Sigma Music and sell digital albums, collectibles, AI remix licenses, fan memberships etc."
                      position="right"
                    />
                  </span>
                </label>
              </div>
              {errors.profileTypes && <p className="text-red-400 text-sm mt-1">{errors.profileTypes}</p>}
              <p className="text-sm text-gray-400 mt-2">Select one or more profile types. You can change this later.</p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <span>Full Name *</span>
                <InfoTooltip content="This is your account name, it's separate from your artist name (if you are joining as an artist)." position="right" />
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="Enter your name"
                maxLength={300}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              <p className="text-sm text-gray-400 mt-1">{formData.name.length}/300 characters</p>
            </div>

            {/* Account Email Field */}
            {walletType !== "web3auth" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <span>Account Email *</span>
                  <InfoTooltip content="This is your account email. Any emails relating to your account are sent here." position="right" />
                </label>
                <Input
                  type="email"
                  value={formData.primaryAccountEmail}
                  onChange={(e) => handleFormChange("primaryAccountEmail", e.target.value)}
                  placeholder="Enter your account email"
                  className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.primaryAccountEmail ? "border-red-500" : ""}`}
                />
                {errors.primaryAccountEmail && <p className="text-red-400 text-sm mt-1">{errors.primaryAccountEmail}</p>}
              </div>
            )}

            {/* Billing Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <span>Billing / Payouts Email *</span>
                <InfoTooltip content="Any billing, invoices and payouts related emails are sent here." position="right" />
              </label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => handleFormChange("billingEmail", e.target.value)}
                placeholder="Enter your billing / payouts email"
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.billingEmail ? "border-red-500" : ""}`}
              />
              {errors.billingEmail && <p className="text-red-400 text-sm mt-1">{errors.billingEmail}</p>}
            </div>

            {/* Profile Image URL Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <span>Profile Image (Optional)</span>
                <InfoTooltip content="Click on the image to upload a new one, or enter a URL below." position="right" />
              </label>
              <div className="mb-3">
                <MediaUpdateImg
                  imageUrl={formData.profileImage}
                  size="md"
                  onFileSelect={(file) => {
                    console.log("Selected file:", file);
                    setNewSelectedProfileImageFile(file);
                  }}
                  onFileRevert={() => {
                    console.log("File reverted");
                    setNewSelectedProfileImageFile(null);
                  }}
                  alt="Profile"
                />
              </div>
              {/* <Input
                type="url"
                disabled={true}
                value={formData.profileImage}
                onChange={(e) => handleFormChange("profileImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={errors.profileImage ? "border-red-500" : ""}
              /> */}
              {errors.profileImage && <p className="text-red-400 text-sm mt-1">{errors.profileImage}</p>}
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
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !hasFormChanged()}
            className={`${
              isSubmitting || !hasFormChanged() ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-yellow-300 text-black hover:bg-yellow-400"
            }`}>
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
