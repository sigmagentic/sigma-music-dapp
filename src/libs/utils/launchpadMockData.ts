import { LaunchpadData } from "libs/types/common";

/**
 * Mutable mock data store for launchpad data
 * This will be replaced with actual API calls later
 */
let mockLaunchpadStore: { [key: string]: LaunchpadData } = {};

/**
 * Initialize default mock data for specific artist/album
 */
const initializeDefaultMockData = (artistId: string, albumId: string): LaunchpadData => {
  return {
    artistId,
    albumId,
    isEnabled: false,
    launchPlatforms: [
      {
        platform: "Sigma Music",
        premiere: true,
        directLink: "https://sigmamusic.fm/?artist=mark-paul~ar140_a4",
        freeStreaming: "Full Album",
        purchaseOptions: ["Digital Album", "Limited Edition Digital Collectible", "AI Remix License", "AI Training License"],
        purchaseType: "Buy Full Album",
        usdPriceAlbum: 5,
        usdPriceTrack: "n/a",
        payMoreSupported: false,
        releaseDate: "2025-12-01",
      },
      {
        platform: "BandCamp",
        premiere: false,
        directLink: "https://markpaulmusic.bandcamp.com/album/frequency-demo-ep",
        freeStreaming: "First X tracks",
        freeStreamingTrackCount: 4,
        purchaseOptions: ["Digital Album", "Merch"],
        purchaseType: "Buy Album or Tracks",
        usdPriceAlbum: 6,
        usdPriceTrack: 1.5,
        payMoreSupported: true,
        releaseDate: "2025-12-09",
      },
      {
        platform: "SoundCloud",
        premiere: false,
        directLink: "https://soundcloud.com/markpaulmusic/sets/frequency-demo-ep",
        freeStreaming: "Full Album",
        purchaseOptions: [],
        purchaseType: "Platform Membership",
        usdPriceAlbum: "n/a",
        usdPriceTrack: "n/a",
        payMoreSupported: false,
        releaseDate: "2025-12-15",
      },
      {
        platform: "Spotify",
        premiere: false,
        directLink: "https://open.spotify.com/album/4EYiaCimOb1Li1bnb7ppi6?si=5muKP4IPRWml5cdSJSgY-g",
        freeStreaming: "Full Album",
        purchaseOptions: [],
        purchaseType: "Platform Membership",
        usdPriceAlbum: "n/a",
        usdPriceTrack: "n/a",
        payMoreSupported: false,
        releaseDate: "2025-12-30",
      },
    ],
    merch: [
      {
        type: "Vinyl",
        directLink: "https://ionazajac.bandcamp.com/merch",
        releaseDate: "2025-12-01",
      },
    ],
    teaserVideoLink: "https://www.youtube.com/watch?v=BRA14k7qQEA",
  };
};

/**
 * Get mock launchpad data for an artist/album
 */
export const getMockLaunchpadData = (artistId: string, albumId: string): LaunchpadData | null => {
  const key = `${artistId}-${albumId}`;

  // If data exists in store, return it
  if (mockLaunchpadStore[key]) {
    return mockLaunchpadStore[key];
  }

  // For ar141-ar141_a2, initialize with default data
  if (artistId === "ar141" && albumId === "ar141_a2") {
    const defaultData = initializeDefaultMockData(artistId, albumId);
    defaultData.isEnabled = true;
    mockLaunchpadStore[key] = defaultData;
    return defaultData;
  }

  return null;
};

/**
 * Update mock launchpad data
 */
export const updateMockLaunchpadData = (data: LaunchpadData): void => {
  const key = `${data.artistId}-${data.albumId}`;
  mockLaunchpadStore[key] = { ...data };
};

/**
 * Get all launchpad data for an artist (to check for live albums)
 */
export const getAllMockLaunchpadDataForArtist = (artistId: string): LaunchpadData[] => {
  return Object.values(mockLaunchpadStore).filter((data) => data.artistId === artistId);
};
