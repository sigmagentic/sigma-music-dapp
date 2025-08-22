import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "libComponents/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md", showCloseButton = true }) => {
  // Handle escape key to close modal
  useEffect(() => {
    // const handleEscape = (event: KeyboardEvent) => {
    //   if (event.key === "Escape") {
    //     onClose();
    //   }
    // };
    // if (isOpen) {
    //   document.addEventListener("keydown", handleEscape);
    //   // Prevent body scroll when modal is open
    //   document.body.style.overflow = "hidden";
    // }
    // return () => {
    //   document.removeEventListener("keydown", handleEscape);
    //   document.body.style.overflow = "unset";
    // };
  }, [isOpen, onClose]);

  // Handle click outside modal to close
  const handleBackdropClick = (event: React.MouseEvent) => {
    // if (event.target === event.currentTarget) {
    //   onClose();
    // }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4" onClick={handleBackdropClick}>
      <div className={`w-full max-w-4xl max-h-[90vh] bg-black rounded-lg shadow-xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
