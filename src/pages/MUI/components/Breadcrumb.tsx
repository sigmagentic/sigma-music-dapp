import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { MUIView } from "../index";

interface BreadcrumbProps {
  currentView: MUIView;
  selectedArtistName?: string;
  selectedAlbumName?: string;
  onNavigateBack: () => void;
  onNavigateToMain: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentView, selectedArtistName, selectedAlbumName, onNavigateBack, onNavigateToMain }) => {
  if (currentView === "main") {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <button onClick={onNavigateToMain} className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
        <Home className="w-4 h-4" />
        <span>Home</span>
      </button>

      <ChevronRight className="w-4 h-4" />

      {currentView === "artists" && <span className="text-gray-900 font-medium">Music Catalog</span>}

      {currentView === "albums" && (
        <>
          <button onClick={onNavigateBack} className="hover:text-blue-600 transition-colors">
            Music Catalog
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{selectedArtistName}</span>
        </>
      )}
    </nav>
  );
};
