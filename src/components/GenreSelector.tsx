import React from "react";

interface GenreSelectorProps {
  genres: string[];
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  maxHeight?: string;
}

export function GenreSelector({ genres, selectedGenres, onGenreToggle, maxHeight = "300px" }: GenreSelectorProps) {
  return (
    <div className="mt-4">
      <h4 className="text-white font-medium mb-3">Music Genres I Like</h4>
      <div className={`max-h-[${maxHeight}] overflow-y-auto`}>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => onGenreToggle(genre)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                selectedGenres.includes(genre) ? "bg-orange-500 text-black font-medium" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}>
              {genre.toLocaleUpperCase().trim()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
