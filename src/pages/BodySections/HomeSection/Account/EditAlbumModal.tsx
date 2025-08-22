import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Album } from "libs/types";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { Switch } from "libComponents/Switch";
import { InfoTooltip } from "libComponents/Tooltip";

export interface AlbumFormData {
  albumId: string;
  title: string;
  desc: string;
  img: string;
  isExplicit: string;
  isPodcast: string;
  isPublished: string;
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
  const [formData, setFormData] = useState<AlbumFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AlbumFormData>>({});

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
      setFormData(initialData);
      setErrors({});
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

    if (!formData.img.trim()) {
      newErrors.img = "Image URL is required";
    } else if (!formData.img.startsWith("https://")) {
      newErrors.img = "Image URL must start with https://";
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
      const success = await onSave(formData);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{isNewAlbum ? "Create New Album" : `Edit Album: ${albumTitle || "Untitled"}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isSubmitting ? "opacity-20 cursor-not-allowed pointer-events-none" : ""}`}>
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
            <p className="text-gray-400 text-sm mt-1">{formData.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <p className="text-gray-400 text-sm mt-1">{formData.desc.length}/800 characters</p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Album Cover Image URL <span className="text-red-400">*</span>
            </label>
            <Input
              type="url"
              value={formData.img}
              onChange={(e) => handleInputChange("img", e.target.value)}
              placeholder={isNewAlbum ? "https://example.com/your-album-cover.jpg" : "https://example.com/image.jpg"}
              className={`w-full ${errors.img ? "border-red-500" : ""}`}
            />
            {errors.img && <p className="text-red-400 text-sm mt-1">{errors.img}</p>}
            <p className="text-gray-400 text-sm mt-1">Must be a valid HTTPS URL</p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Explicit Content</label>
                <p className="text-gray-400 text-sm">Mark if this album contains explicit content</p>
              </div>
              <Switch checked={formData.isExplicit === "1"} onCheckedChange={(checked) => handleToggleChange("isExplicit", checked)} />
            </div>

            {/* <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Podcast</label>
                <p className="text-gray-400 text-sm">Mark if this is a podcast episode</p>
              </div>
              <Switch checked={formData.isPodcast === "1"} onCheckedChange={(checked) => handleToggleChange("isPodcast", checked)} />
            </div> */}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">Publish This Album</label>
                <InfoTooltip
                  content="A Published album will appear publicly once tracks have been added to it and the artist's profile is verified."
                  position="right"
                />
              </div>
              <Switch checked={formData.isPublished === "1"} onCheckedChange={(checked) => handleToggleChange("isPublished", checked)} />
            </div>
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
            disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isNewAlbum ? "Create Album" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
