import { LOG_STREAM_EVENT_METRIC_EVERY_SECONDS } from "config";
import { MusicTrack } from "libs/types";

interface CacheEntry_DataWithTimestamp {
  data: boolean | [] | Record<string, any> | number;
  timestamp: number;
}

const CACHE_DURATION_2_MIN = 2 * 60 * 1000; // 2 minutes in milliseconds
const CACHE_DURATION_60_MIN = 1 * 60 * 1000; // 60 minutes in milliseconds

export const getApiDataMarshal = () => {
  // we can call this without chainID (e.g. solana mode or no login mode), and we get the API endpoint based on ENV
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    return "https://api.itheumcloud.com/datamarshalapi/router/v1";
  } else {
    return "https://api.itheumcloud-stg.com/datamarshalapi/router/v1";
  }
};

export const sleep = (sec: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });
};

export const getApiWeb2Apps = (alwaysUseProd = false) => {
  // we can call this without chainID (e.g. solana mode or no login mode), and we get the API endpoint based on ENV
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet" || alwaysUseProd) {
    return "https://api.itheumcloud.com";
  } else {
    return "https://api.itheumcloud-stg.com";
  }
};

export const isMostLikelyMobile = () => {
  return window?.screen?.width <= 450;
};

export const gtagGo = (category: string, action: any, label?: any, value?: any) => {
  /*
  e.g.
  Category: 'Videos', Action: 'Play', Label: 'Gone With the Wind'
  Category: 'Videos'; Action: 'Play - Mac Chrome'
  Category: 'Videos', Action: 'Video Load Time', Label: 'Gone With the Wind', Value: downloadTime

  // AUTH
  Category: 'Auth', Action: 'Login', Label: 'Metamask'
  Category: 'Auth', Action: 'Login - Success', Label: 'Metamask'
  Category: 'Auth', Action: 'Login', Label: 'DeFi'
  Category: 'Auth', Action: 'Login', Label: 'Ledger'
  Category: 'Auth', Action: 'Login', Label: 'xPortalApp'
  Category: 'Auth', Action: 'Login', Label: 'WebWallet'

  Category: 'Auth', Action: 'Logout', Label: 'WebWallet'
  */

  if (!action || !category) {
    console.error("gtag tracking needs both action and category");
    return;
  }

  const eventObj: Record<string, string> = {
    event_category: category,
  };

  if (label) {
    eventObj["event_label"] = label;
  }

  if (value) {
    eventObj["event_value"] = value;
  }

  // only track mainnet so we have good data on GA
  if (window.location.hostname !== "localhost" && import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    (window as any).gtag("event", action, eventObj);
  }
};

const solPriceCache: CacheEntry_DataWithTimestamp = {
  data: -1,
  timestamp: 0,
};

export const fetchSolPrice = async () => {
  const now = Date.now();

  // Check if we have a valid cache entry
  if (solPriceCache.timestamp && now - solPriceCache.timestamp < CACHE_DURATION_2_MIN) {
    console.log(`fetchSolPrice: Using cached SOL price`);
    return { currentSolPrice: solPriceCache.data };
  }

  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const data = await response.json();
    const currentSolPrice = data.solana.usd;

    // Update cache
    solPriceCache.data = currentSolPrice;
    solPriceCache.timestamp = now;

    return { currentSolPrice };
  } catch (error) {
    console.error("fetchSolPrice: Failed to fetch SOL price:", error);
    solPriceCache.data = -2; // means error
    solPriceCache.timestamp = now;
    throw new Error("Failed to fetch SOL price");
  }
};

export const logPaymentToAPI = async (paymentData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/createPaymentLog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;
      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }
      throw new Error(someHttpErrorContext);
    }

    return data;
  } catch (error) {
    console.error("Error saving payment data:", error);
    throw error;
  }
};

export const udpateUserProfileOnBackEndAPI = async (userProfileData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/userAccounts/userUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userProfileData),
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;
      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }
      throw new Error(someHttpErrorContext);
    }

    return data;
  } catch (error) {
    console.error("Error saving user profile data:", error);
    throw error;
  }
};

export const mintAlbumOrFanNFTAfterPaymentViaAPI = async (mintData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/mintAlbumOrFanNFTAfterPayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mintData),
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;
      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }
      throw new Error(someHttpErrorContext);
    }

    return data;
  } catch (error) {
    console.error("Error minting NFT after payment:", error);
    throw error;
  }
};

export const logStatusChangeToAPI = async ({
  launchId,
  createdOn,
  newStatus,
  pumpTokenId,
  bountyId,
  nftId,
}: {
  launchId: string;
  createdOn: number;
  newStatus: string;
  pumpTokenId?: string;
  bountyId?: string;
  nftId?: string;
}) => {
  try {
    const payload: Record<string, string | number> = {
      launchId,
      createdOn,
      newStatus,
    };

    if (pumpTokenId) {
      payload.pumpTokenId = pumpTokenId;
    }

    if (bountyId) {
      payload.bountyId = bountyId;
    }

    if (nftId) {
      payload.nftId = nftId;
    }

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/updateLaunchStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;
      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }
      throw new Error(someHttpErrorContext);
    }

    return data;
  } catch (error) {
    console.error("Error saving new launch:", error);
    throw error;
  }
};

export const filterRadioTracksByUserPreferences = (allRadioTracks: MusicTrack[]) => {
  const _allRadioTracksSorted: MusicTrack[] = [...allRadioTracks]; // we clone it so we dont mutate the original list
  // let now check if the user has some preferences for genres (initially we get this from session storage, later we get this from the NFMe ID)
  const savedGenres = sessionStorage.getItem("sig-pref-genres");

  // Reorder tracks based on user preferences if they exist
  if (savedGenres) {
    const userPreferences = JSON.parse(savedGenres) as string[];
    const normalizedPreferences = userPreferences.map((genre: string) => genre.toLowerCase());

    // Sort tracks based on preference matches
    _allRadioTracksSorted.sort((a: any, b: any) => {
      const aCategories = a.category?.split(",").map((cat: string) => cat.trim().toLowerCase()) || [];
      const bCategories = b.category?.split(",").map((cat: string) => cat.trim().toLowerCase()) || [];

      // Check if any category matches user preferences
      const aMatches = aCategories.some((cat: string) => normalizedPreferences.some((pref: string) => cat.includes(pref)));
      const bMatches = bCategories.some((cat: string) => normalizedPreferences.some((pref: string) => cat.includes(pref)));

      // If both match or both don't match, maintain original order
      if (aMatches === bMatches) return 0;
      // If only one matches, put it first
      return aMatches ? -1 : 1;
    });
  }

  return _allRadioTracksSorted;
};

export async function mergeImages(
  baseImageUrl: string,
  overlayImageUrl: string
): Promise<{
  base64ForApi: string; // base64 without data:image/png;base64, prefix
  base64ForPreview: string; // complete base64 with data:image/png;base64, prefix for <img> tags
}> {
  // Create new Image objects
  const loadImage = async (
    url: string
  ): Promise<{
    element: HTMLImageElement;
    base64: string;
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS

      // Create a canvas to get base64
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      img.onload = () => {
        if (tempCtx) {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          tempCtx.drawImage(img, 0, 0);
          const base64String = tempCanvas.toDataURL("image/png");
          resolve({
            element: img,
            base64: base64String,
          });
        } else {
          reject(new Error("Failed to get temporary canvas context"));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    // Load both images
    const [baseImage, overlayImage] = await Promise.all([loadImage(baseImageUrl), loadImage(overlayImageUrl)]);

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas size to base image dimensions
    canvas.width = baseImage.element.width;
    canvas.height = baseImage.element.height;

    // Draw base image
    ctx.drawImage(baseImage.element, 0, 0);

    // Calculate position to center the overlay image
    const x = (canvas.width - overlayImage.element.width) / 2;
    const y = (canvas.height - overlayImage.element.height) / 2;

    // Draw overlay image in the center
    ctx.drawImage(overlayImage.element, x, y);

    // Get base64 of the merged result
    const fullBase64 = canvas.toDataURL("image/png", 1.0); // Using max quality

    // For API: Remove the data:image/png;base64, prefix
    const base64ForApi = fullBase64.replace(/^data:image\/png;base64,/, "");

    return {
      base64ForApi: base64ForApi, // Use this when sending to API
      base64ForPreview: fullBase64, // Use this for <img> tags
    };
  } catch (error) {
    console.error("Error merging images:", error);
    throw error;
  }
}

const cache_checkIfAlbumCanBeMinted: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const checkIfAlbumCanBeMintedViaAPI = async (albumId: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_checkIfAlbumCanBeMinted[albumId];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(`checkIfAlbumCanBeMintedViaAPI: Using cached minting status for albumId: ${albumId}`);
      return cacheEntry.data;
    }

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/mintAlbumNFTCanBeMinted?albumId=${albumId}`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_checkIfAlbumCanBeMinted[albumId] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with false as data)
      cache_checkIfAlbumCanBeMinted[albumId] = {
        data: { _canBeMinted: false },
        timestamp: now,
      };

      return { _canBeMinted: false };
    }
  } catch (error) {
    console.error("Error checking if album can be minted:", error);

    // Update cache (with false as data)
    cache_checkIfAlbumCanBeMinted[albumId] = {
      data: { _canBeMinted: false },
      timestamp: now,
    };

    return { _canBeMinted: false };
  }
};

const cache_albumTracks: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const getAlbumTracksFromDBViaAPI = async (artistId: string, albumId: string, userOwnsAlbum?: boolean) => {
  const now = Date.now();

  const bonus = userOwnsAlbum ? 1 : 0;

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_albumTracks[`${artistId}-${albumId}-bonus_${bonus}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(`getAlbumTracks: Getting tracks for artistId: ${artistId} and albumId: ${albumId} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/musicTracks/${artistId}?albumId=${albumId}&bonus=${userOwnsAlbum ? 1 : 0}`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_albumTracks[`${artistId}-${albumId}-bonus_${bonus}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_albumTracks[`${artistId}-${albumId}-bonus_${bonus}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("Error checking if album can be minted:", error);

    // Update cache (with [] as data)
    cache_albumTracks[`${artistId}-${albumId}-bonus_${bonus}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_creatorFanMembershipAvailability: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchCreatorFanMembershipAvailabilityViaAPI = async (creatorPaymentsWallet: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_creatorFanMembershipAvailability[creatorPaymentsWallet];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(
        `fetchCreatorFanMembershipAvailabilityViaAPI: Getting fan membership availability for creatorPaymentsWallet: ${creatorPaymentsWallet} from cache`
      );
      return cacheEntry.data as Record<string, any>;
    }

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/mintInnerCircleNFTCanBeMinted?creatorWallet=${creatorPaymentsWallet}`);

    if (!response.ok) {
      throw new Error("Failed to fetch if creator has fan memberships");
    }

    const data = await response.json();

    if (data.canBeMinted) {
      // Transform the data into the desired format
      const transformedData = Object.entries(data.mintableItems).reduce(
        (acc, [, value]: [string, any]) => {
          acc[value.membershipId] = {
            tokenImg: value.tokenImg,
            perkIdsOffered: value.perkIdsOffered,
          };
          return acc;
        },
        {} as Record<string, { tokenImg: string; perkIdsOffered: string[] }>
      );

      // Update cache
      cache_creatorFanMembershipAvailability[creatorPaymentsWallet] = {
        data: transformedData,
        timestamp: now,
      };

      return transformedData as Record<string, any>;
    }

    return {} as Record<string, any>;
  } catch (error) {
    console.error("Error fetching membership data:", error);

    cache_creatorFanMembershipAvailability[creatorPaymentsWallet] = {
      data: {},
      timestamp: now,
    };

    return {} as Record<string, any>;
  }
};

const cache_myFanMembershipsForThisArtist: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMyFanMembershipsForArtistViaAPI = async (addressSol: string, creatorPaymentsWallet: string, bypassCacheAsNewDataAdded = false) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN && !bypassCacheAsNewDataAdded) {
      console.log(
        `fetchMyFanMembershipsForArtistViaAPI: Getting fan memberships for addressSol: ${addressSol} and creatorPaymentsWallet: ${creatorPaymentsWallet} from cache`
      );
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/getUserMintLogs?forSolAddr=${addressSol}&mintTemplateSearchString=fan-${creatorPaymentsWallet.trim().toLowerCase()}`
    );

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMyFanMembershipsForArtistViaAPI: Error fetching fan memberships:", error);

    // Update cache (with [] as data)
    cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_artistSales: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchArtistSalesViaAPI = async (creatorPaymentsWallet: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_artistSales[`${creatorPaymentsWallet}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchArtistSalesViaAPI: Getting artist sales for creatorPaymentsWallet: ${creatorPaymentsWallet} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/paymentsByCreatorSales?creatorWallet=${creatorPaymentsWallet}&byCreatorSalesStatusFilter=success`
    );

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_artistSales[`${creatorPaymentsWallet}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_artistSales[`${creatorPaymentsWallet}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchArtistSalesViaAPI: Error fetching artist sales:", error);

    // Update cache (with [] as data)
    cache_artistSales[`${creatorPaymentsWallet}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_streamsLeaderboardByArtist: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchStreamsLeaderboardByArtistViaAPI = async (artistId: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_streamsLeaderboardByArtist[`${artistId}`];
    if (cacheEntry && now - cacheEntry.timestamp < 10) {
      console.log(`fetchStreamsLeaderboardByArtistViaAPI: Getting streams leaderboard for artistId: ${artistId} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/streamsLeaderboardByArtist?arId=${artistId}`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_streamsLeaderboardByArtist[`${artistId}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_streamsLeaderboardByArtist[`${artistId}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchStreamsLeaderboardByArtistViaAPI: Error fetching streams leaderboard:", error);

    // Update cache (with [] as data)
    cache_streamsLeaderboardByArtist[`${artistId}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_streamsLeaderboardAllTracksByMonth: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchStreamsLeaderboardAllTracksByMonthViaAPI = async (MMYYString: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchStreamsLeaderboardAllTracksViaAPI: Getting streams leaderboard for MMYYString: ${MMYYString} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/streamsLeaderboardByMonthAllTracks?MMYYString=${MMYYString}`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchStreamsLeaderboardByArtistViaAPI: Error fetching streams leaderboard:", error);

    // Update cache (with [] as data)
    cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

let logStreamViaAPILastCalled = 0; // worse case the protected in the Music Player component does not work, we also make sure we don't call the API too often here too

export const logStreamViaAPI = async (streamLogData: { streamerAddr: string; albumTrackId: string }) => {
  try {
    const nowTimeStamp = Date.now();

    if (nowTimeStamp - logStreamViaAPILastCalled < LOG_STREAM_EVENT_METRIC_EVERY_SECONDS * 1000) {
      console.log("logStreamViaAPI: Skipping log stream via API because it was called too recently");
      return;
    }

    logStreamViaAPILastCalled = nowTimeStamp; // put this here rather that after the asunc call next to prevent multiple calls (due to async delay)

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/streamsLogTrackEntry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(streamLogData),
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;
      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }
      throw new Error(someHttpErrorContext);
    }

    return data;
  } catch (error) {
    console.error("Error logging stream:", error);
    throw error;
  }
};
