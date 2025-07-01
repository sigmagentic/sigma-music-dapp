import React, { useState } from "react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useAppStore } from "store/app";
import { MainMenu, Breadcrumb, ArtistList, AlbumList } from "./components";

export type MUIView = "main" | "artists" | "albums";

export interface MUIState {
  currentView: MUIView;
  selectedArtistId?: string;
  selectedArtistName?: string;
  selectedCreatorPaymentsWallet?: string;
  selectedAlbumId?: string;
  selectedAlbumName?: string;
}

export const MUI = () => {
  const { publicKey: publicKeySol } = useSolanaWallet();
  const { artistLookup } = useAppStore();
  const [muiState, setMuiState] = useState<MUIState>({
    currentView: "main",
  });

  const handleNavigateToArtists = () => {
    setMuiState({
      currentView: "artists",
    });
  };

  const handleNavigateToAlbums = (artistId: string, artistName: string) => {
    setMuiState({
      currentView: "albums",
      selectedArtistId: artistId,
      selectedArtistName: artistName,
    });
  };

  const handleNavigateBack = () => {
    if (muiState.currentView === "albums") {
      setMuiState({
        currentView: "artists",
      });
    } else if (muiState.currentView === "artists") {
      setMuiState({
        currentView: "main",
      });
    }
  };

  const handleNavigateToMain = () => {
    setMuiState({
      currentView: "main",
    });
  };

  const renderCurrentView = () => {
    switch (muiState.currentView) {
      case "artists":
        return <ArtistList artists={Object.values(artistLookup)} onArtistSelect={handleNavigateToAlbums} />;
      case "albums":
        const selectedArtist = artistLookup[muiState.selectedArtistId!];
        return (
          <AlbumList
            albums={selectedArtist?.albums || []}
            artistName={muiState.selectedArtistName!}
            artistId={muiState.selectedArtistId!}
            selectedArtist={selectedArtist!}
          />
        );
      default:
        return <MainMenu onMusicCatalogClick={handleNavigateToArtists} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Management UI</h1>
        <p className="text-gray-600">Admin panel for managing platform content</p>
      </div>

      {!publicKeySol ? (
        <div className="text-red-500">You need to be logged in to access this page.</div>
      ) : (
        <>
          <Breadcrumb
            currentView={muiState.currentView}
            selectedArtistName={muiState.selectedArtistName}
            selectedAlbumName={muiState.selectedAlbumName}
            onNavigateBack={handleNavigateBack}
            onNavigateToMain={handleNavigateToMain}
          />

          <div className="mt-6">{renderCurrentView()}</div>
        </>
      )}
    </div>
  );
};
