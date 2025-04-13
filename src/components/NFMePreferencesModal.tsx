import React, { useEffect, useState } from "react";
import { Button } from "libComponents/Button";
import { useAppStore } from "store/app";

interface NFMePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NFMePreferencesModal({ isOpen, onClose }: NFMePreferencesModalProps) {
  const { radioGenres, updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh } = useAppStore();
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

    updateRadioGenresUpdatedByUserSinceLastRadioTracksRefresh(true);
    onClose();
  };

  if (!isOpen) return null;

  // Combine current radioGenres with any saved genres that aren't in radioGenres
  const allGenres = new Set([...radioGenres, ...selectedGenres]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-center">Save your app preferences</h3>
          <p className="text-gray-300 text-center">
            Your NFMe is a special NFT that you can use to store your personal data like your music preferences which is then used to personalize your Sigma
            Music experience!
          </p>

          {/* Music Genres Section */}
          <div className="mt-4">
            <h4 className="text-white font-medium mb-3">Music Genres I Like</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Array.from(allGenres).map((genre) => (
                <label key={genre} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                    className="form-checkbox h-4 w-4 text-orange-500 rounded border-gray-600 bg-gray-700"
                  />
                  <span className="text-gray-300">{genre.toLocaleUpperCase().trim()}</span>
                </label>
              ))}
            </div>
          </div>

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
