import React, { useRef, useState, useEffect } from "react";
import { UserIcon, ImageIcon, MusicIcon, X } from "lucide-react";

interface MediaUpdateProps {
  imageUrl?: string;
  mediaUrl?: string;
  size?: "sm" | "md" | "lg";
  customWidthClass?: string;
  onFileSelect: (file: File) => void;
  onFileRevert?: () => void;
  alt?: string;
  className?: string;
  imgPlaceholder?: "user" | "image" | "audio";
  isAudio?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-32 h-32",
  lg: "w-48 h-48",
};

export const MediaUpdate: React.FC<MediaUpdateProps> = ({
  imageUrl,
  mediaUrl,
  size = "md",
  customWidthClass = "",
  onFileSelect,
  onFileRevert,
  alt = "Media",
  className = "",
  imgPlaceholder = "user",
  isAudio = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      // Notify parent component that file was reverted
      onFileRevert?.();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      let validTypes = ["image/gif", "image/jpeg", "image/jpg", "image/png"];
      if (isAudio) {
        validTypes = ["audio/mpeg"];
      }
      if (validTypes.includes(file.type)) {
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onFileSelect(file);
      } else {
        alert(`Please select a valid ${isAudio ? "audio" : "image"} file (GIF, JPG, PNG${isAudio ? ", MP3" : ""})`);
      }
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${customWidthClass} ${className} relative`}>
      <div
        className="w-full h-full rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700 cursor-pointer hover:border-yellow-300 transition-colors bg-[#482d1a] p-[5px]"
        onClick={handleImageClick}>
        {previewUrl ? (
          isAudio ? (
            <audio src={previewUrl} controls className="w-full h-full object-cover pb-[30px]" />
          ) : (
            <img src={previewUrl} alt={alt} className="w-full h-full object-cover" />
          )
        ) : imageUrl ? (
          <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        ) : mediaUrl ? (
          <audio src={mediaUrl} controls className="w-full h-full object-cover pb-[30px]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {imgPlaceholder === "image" ? (
              <ImageIcon className={`${size === "sm" ? "w-8 h-8" : size === "md" ? "w-16 h-16" : "w-24 h-24"} text-gray-600`} />
            ) : imgPlaceholder === "audio" ? (
              <MusicIcon className={`${size === "sm" ? "w-8 h-8" : size === "md" ? "w-16 h-16" : "w-24 h-24"} text-gray-600`} />
            ) : (
              <UserIcon className={`${size === "sm" ? "w-8 h-8" : size === "md" ? "w-16 h-16" : "w-24 h-24"} text-gray-600`} />
            )}
          </div>
        )}
      </div>

      {/* Cancel button - positioned at top right corner */}
      {previewUrl && (
        <button
          onClick={handleCancel}
          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg z-10"
          title="Cancel and revert to original image">
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={isAudio ? ".mp3" : ".gif,.jpg,.jpeg,.png,image/gif,image/jpeg,image/jpg,image/png"}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
