import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { InfoTooltip } from "libComponents/Tooltip";
import { isValidUrl } from "libs/utils/ui";

interface EditProfileModalProps {
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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, initialData, walletType }) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialData);
    setErrors({});
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
      newErrors.billingEmail = "Billing email is required";
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
    try {
      const success = await onSave(formData);
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
    setFormData(initialData);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Profile Information</h2>
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
                <InfoTooltip content="This is your account name, it's separate from your artist name." position="right" />
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
                <span>Billing Email *</span>
                <InfoTooltip content="Any billing, invoices and payouts related emails are sent here." position="right" />
              </label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => handleFormChange("billingEmail", e.target.value)}
                placeholder="Enter your billing email"
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.billingEmail ? "border-red-500" : ""}`}
              />
              {errors.billingEmail && <p className="text-red-400 text-sm mt-1">{errors.billingEmail}</p>}
            </div>

            {/* Profile Image URL Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <span>Profile Image URL (Optional)</span>
                <InfoTooltip content="Enter a direct link to your profile image. Must be an HTTPS URL." position="right" />
              </label>
              <Input
                type="url"
                value={formData.profileImage}
                onChange={(e) => handleFormChange("profileImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={errors.profileImage ? "border-red-500" : ""}
              />
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
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-yellow-300 text-black hover:bg-yellow-400">
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
