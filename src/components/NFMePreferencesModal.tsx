import React, { useEffect, useState } from "react";
import { ALL_MUSIC_GENRES } from "config";
import { Button } from "libComponents/Button";
import { GenreSelector } from "./GenreSelector";

interface NFMePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfMeIdBrandingHide: boolean;
}

export function NFMePreferencesModal({ isOpen, onClose, nfMeIdBrandingHide }: NFMePreferencesModalProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Load preferences from session storage when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedGenres = sessionStorage.getItem("sig-pref-genres");
      if (savedGenres) {
        setSelectedGenres(JSON.parse(savedGenres));
      }
    }
  }, [isOpen]);

  // Handle genre selection/deselection
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const newGenres = prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre];
      return newGenres;
    });
  };

  // Handle save
  const handleSave = () => {
    sessionStorage.setItem("sig-pref-genres", JSON.stringify(selectedGenres));
    onClose();
  };

  if (!isOpen) return null;

  const allConfigGenres = ALL_MUSIC_GENRES.map((genre: any) => genre.code);
  const allGenres = new Set([...allConfigGenres, ...selectedGenres]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-center">Save your app preferences</h3>

          {!nfMeIdBrandingHide && (
            <p className="text-gray-300 text-center">
              Your NFMe is a special NFT that you can use to store your personal data like your music preferences which is then used to personalize your Sigma
              Music experience!
            </p>
          )}

          <GenreSelector genres={Array.from(allGenres)} selectedGenres={selectedGenres} onGenreToggle={toggleGenre} />

          <div className="flex gap-4 justify-center mt-6">
            <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">
              Close
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
