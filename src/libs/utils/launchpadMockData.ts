import { LaunchpadData } from "libs/types/common";

/**
 * Mock launchpad data for testing
 * This will be replaced with actual API calls later
 * Currently only returns data for artistId: ar142 and albumId: ar142_a1
 */
export const getMockLaunchpadData = (artistId: string, albumId: string): LaunchpadData | null => {
  // Only return mock data for the specific artist and album
  if (artistId !== "ar142" || albumId !== "ar142_a1") {
    return null;
  }

  return {
    artistId,
    albumId,
    isEnabled: true,
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
        releaseDate: "1 Dec 2025",
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
        releaseDate: "9 Dec 2025",
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
        releaseDate: "15 Dec 2025",
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
        releaseDate: "30 Dec 2025",
      },
    ],
    merch: [
      {
        type: "Vinyl",
        directLink: "https://ionazajac.bandcamp.com/merch",
        releaseDate: "1 Dec 2025",
      },
    ],
    teaserVideoLink: "https://www.youtube.com/watch?v=BRA14k7qQEA",
  };
};
