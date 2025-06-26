import { getApiWeb2Apps } from "libs/utils/misc";

// Types for admin API responses
export interface FastStreamTrack {
  file: string;
  bonus: number;
  arId: string;
  category: string;
  cover_art_url: string;
  alId: string;
  idx: number;
  title: string;
}

export interface CollectibleMetadata {
  collectibleId: string;
  creatorWallet: string;
  ipTokenId?: string;
  maxMints: string;
  metadataOnIpfsUrl: string;
  nftType: string;
  priceInUSD: string;
  rarityGrade?: string;
  timestampAdded: number;
  tokenName: string;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Fast Stream Track Management APIs
export const fastStreamApi = {
  // Get fast stream tracks for an album
  getFastStreamTracksForAlbum: async (artistId: string, albumId: string): Promise<AdminApiResponse<FastStreamTrack[]>> => {
    try {
      const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/musicTracks/${artistId}?albumId=${albumId}`);

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          data: [],
          error: data?.errorMessage || "Unknown error",
        };
      } else {
        return {
          success: true,
          data: data,
        };
      }
    } catch (error) {
      console.error("Error fetching fast stream tracks:", error);
      throw error;
    }
  },

  // Add new fast stream tracks for an album
  addNewFastStreamTracksForAlbum: async (trackData: Partial<FastStreamTrack>): Promise<AdminApiResponse<null>> => {
    try {
      const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/management/addOrUpdateMusicCatalogTrack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...trackData }),
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          data: null,
          error: data?.errorMessage || "Unknown error",
        };
      } else if (data?.created) {
        return {
          success: true,
          data: null,
        };
      } else {
        return {
          success: false,
          data: null,
          error: "Unknown error",
        };
      }
    } catch (error) {
      console.error("Error adding fast stream track:", error);
      throw error;
    }
  },

  // Edit fast stream tracks for an album
  editFastStreamTracksForAlbum: async (albumId: string, trackId: string, trackData: Partial<FastStreamTrack>): Promise<AdminApiResponse<FastStreamTrack>> => {
    try {
      const response = await fetch(`${getApiWeb2Apps()}/albums/${albumId}/fast-stream-tracks/${trackId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackData),
      });
      return await response.json();
    } catch (error) {
      console.error("Error editing fast stream track:", error);
      throw error;
    }
  },
};

// Collectible Metadata Management APIs
export const collectibleMetadataApi = {
  // Get collectible metadata for an album
  getCollectibleMetadataForAlbum: async ({
    collectibleId,
    solSignature,
    signatureNonce,
    adminWallet,
  }: {
    collectibleId: string;
    solSignature: string;
    signatureNonce: string;
    adminWallet: string;
  }): Promise<AdminApiResponse<CollectibleMetadata[]>> => {
    try {
      const response = await fetch(
        `${getApiWeb2Apps()}/datadexapi/sigma/management/viewCollectibleMetadata?collectibleId=${collectibleId}&solSignature=${solSignature}&signatureNonce=${signatureNonce}&adminWallet=${adminWallet}`
      );
      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          data: [],
          error: data?.errorMessage || "Unknown error",
        };
      } else {
        return {
          success: true,
          data: data,
        };
      }
    } catch (error) {
      console.error("Error fetching collectible metadata:", error);
      return {
        success: false,
        data: [],
        error: "Unknown error",
      };
    }
  },

  // Add collectible metadata for an album
  addCollectibleMetadataForAlbum: async (collectibleId: string, metadata: any): Promise<AdminApiResponse<{ created: boolean }>> => {
    try {
      const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/management/addToCollectibleCatalog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...metadata }),
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          data: { created: false },
          error: data?.errorMessage || "Unknown error",
        };
      } else if (data?.created) {
        return {
          success: true,
          data: { created: true },
        };
      } else {
        return {
          success: false,
          data: { created: false },
          error: "Unknown error",
        };
      }
    } catch (error) {
      console.error("Error adding collectible metadata:", error);
      throw error;
    }
  },

  // Edit collectible metadata for an album
  editCollectibleMetadataForAlbum: async (collectibleId: string, metadata: Partial<CollectibleMetadata>): Promise<AdminApiResponse<{ updated: boolean }>> => {
    try {
      const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/management/editCollectibleMetadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectibleId, ...metadata }),
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          data: { updated: false },
          error: data?.errorMessage || "Unknown error",
        };
      } else if (data?.updated) {
        return {
          success: true,
          data: { updated: true },
        };
      } else {
        return {
          success: false,
          data: { updated: false },
          error: "Unknown error",
        };
      }
    } catch (error) {
      console.error("Error editing collectible metadata:", error);
      throw error;
    }
  },
};

// Utility function to handle API errors
export const handleAdminApiError = (error: any, context: string): string => {
  console.error(`Admin API Error in ${context}:`, error);

  if (error.response) {
    // Server responded with error status
    return `Server error: ${error.response.status} - ${error.response.statusText}`;
  } else if (error.request) {
    // Network error
    return "Network error: Unable to connect to server";
  } else {
    // Other error
    return `Error: ${error.message || "Unknown error occurred"}`;
  }
};

// Export all APIs as a single object for convenience
export const adminApi = {
  fastStream: fastStreamApi,
  collectibleMetadata: collectibleMetadataApi,
  handleError: handleAdminApiError,
};
