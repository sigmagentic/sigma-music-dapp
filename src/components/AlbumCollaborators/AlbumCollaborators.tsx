import React from "react";
import { AlbumCollaborator } from "libs/types";
import { useAppStore } from "store/app";

interface AlbumCollaboratorsProps {
  collaborators: any;
  onCollaboratorClick?: (artistId: string) => void;
}

export const AlbumCollaborators: React.FC<AlbumCollaboratorsProps> = ({ collaborators, onCollaboratorClick }) => {
  const { artistLookup } = useAppStore();

  // Helper function to parse collaborators and get artist names
  const parseCollaborators = (collaborators: any): AlbumCollaborator[] => {
    if (!collaborators || !Array.isArray(collaborators) || collaborators.length === 0) {
      return [];
    }

    // Handle format: [{"ar1": "0"}, {"ar6": "10"}]
    if (typeof collaborators[0] === "object" && !collaborators[0].hasOwnProperty("artistId")) {
      return collaborators.map((collab: Record<string, string>) => {
        const [artistId, revenueSplit] = Object.entries(collab)[0];
        return { artistId, revenueSplit };
      });
    }

    // Handle format: [{artistId: "ar1", revenueSplit: "0"}, ...]
    return collaborators as AlbumCollaborator[];
  };

  // Helper function to get artist name from artistId
  const getArtistName = (artistId: string): string => {
    return (artistLookup[artistId] as any)?.name || artistId;
  };

  const parsedCollaborators = parseCollaborators(collaborators);

  if (parsedCollaborators.length === 0) {
    return null;
  }

  const handleClick = (artistId: string) => {
    if (onCollaboratorClick) {
      onCollaboratorClick(artistId);
    } else {
      // alert(artistId);
    }
  };

  return (
    <div className="mt-3">
      <h4 className="!text-xs font-medium text-gray-400 mb-1">Collaborators:</h4>
      <div className="flex flex-wrap gap-2">
        {parsedCollaborators.map((collab) => {
          const artistName = getArtistName(collab.artistId);
          return (
            <button
              key={collab.artistId}
              type="button"
              onClick={() => handleClick(collab.artistId)}
              className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors border border-gray-600 hover:border-gray-500 pointer-events-none">
              {artistName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
