import { DISABLE_AI_REMIX_FEATURES, LOG_STREAM_EVENT_METRIC_EVERY_SECONDS } from "config";
import { CACHE_DURATION_2_MIN, CACHE_DURATION_60_MIN, CACHE_DURATION_FIVE_SECONDS, CACHE_DURATION_HALF_MIN } from "./constant";
import { AiRemixLaunch, PaymentLog, LaunchpadData } from "../types/common";
import { getMockLaunchpadData } from "./launchpadMockData";

interface CacheEntry_DataWithTimestamp {
  data: boolean | [] | Record<string, any> | number | null;
  timestamp: number;
}

export const getApiDataMarshal = () => {
  // we can call this without chainID (e.g. solana mode or no login mode), and we get the API endpoint based on ENV
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    return "https://api.itheumcloud.com/datamarshalapi/router/v1";
  } else {
    return "https://api.itheumcloud-stg.com/datamarshalapi/router/v1";
  }
};

export const getApiWeb2Apps = (alwaysUseProd = false) => {
  // we can call this without chainID (e.g. solana mode or no login mode), and we get the API endpoint based on ENV
  if (import.meta.env.VITE_ENV_NETWORK === "mainnet" || alwaysUseProd) {
    return "https://api.itheumcloud.com";
  } else {
    return "https://api.itheumcloud-stg.com";
  }
};

const solPriceCache: CacheEntry_DataWithTimestamp = {
  data: -1,
  timestamp: 0,
};

export const fetchSolPriceViaAPI = async () => {
  const now = Date.now();

  // Check if we have a valid cache entry
  if (solPriceCache.timestamp && now - solPriceCache.timestamp < CACHE_DURATION_2_MIN) {
    console.log(`fetchSolPriceViaAPI: Using cached SOL price`);
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
    console.error("fetchSolPriceViaAPI: Failed to fetch SOL price:", error);
    solPriceCache.data = -2; // means error
    solPriceCache.timestamp = now;
    throw new Error("Failed to fetch SOL price");
  }
};

export const logPaymentToAPI = async (paymentData: any, isXPPurchase: boolean = false, xpCollectionIdToUse: string = "") => {
  try {
    let APIEndpoint = `${getApiWeb2Apps()}/datadexapi/sigma/createPaymentLog`;

    if (isXPPurchase) {
      APIEndpoint = `${getApiWeb2Apps()}/datadexapi/sigma/createPaymentLogXP`;
    }

    const headerConfig: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (xpCollectionIdToUse && xpCollectionIdToUse != "") {
      headerConfig["fwd-tokenid"] = xpCollectionIdToUse;
    }

    const response = await fetch(APIEndpoint, {
      method: "POST",
      headers: headerConfig,
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

export const updateUserProfileOnBackEndAPI = async (userProfileData: any) => {
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

export const updateArtistProfileOnBackEndAPI = async (artistProfileData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/account/addOrUpdateArtist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(artistProfileData),
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

export const updateAlbumOnBackEndAPI = async (albumData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/management/addOrUpdateAlbum`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(albumData),
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

export const checkIfArtistSlugIsAvailableViaAPI = async (artistSlug: string) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/artistBySlug?artistSlug=${encodeURIComponent(artistSlug)}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;

      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }

      throw new Error(someHttpErrorContext);
    }

    return {
      isAvailable: data.artistNotFound,
    };
  } catch (error) {
    console.error("Error checking if artist slug is available:", error);
    throw error;
  }
};

export const getArtistByCreatorWallet = async (creatorWallet: string) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/artistByCreatorWallet?creatorWallet=${encodeURIComponent(creatorWallet)}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      let someHttpErrorContext = `HTTP error! status: ${response.status}`;

      if (data.error && data.errorMessage) {
        someHttpErrorContext += ` - ${data.errorMessage}`;
      }

      throw new Error(someHttpErrorContext);
    }

    // we should get exactly one artist or its an error and we assume there is no match
    if (!data.matchingArtists || data.matchingArtists.length === 0 || data.matchingArtists.length > 1) {
      return null;
    }

    return data.matchingArtists[0];
  } catch (error) {
    console.error("Error getting artist by creator wallet:", error);
    return null;
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
    console.error("Error minting collectible after payment:", error);
    throw error;
  }
};

export const sendRemixJobAfterPaymentViaAPI = async (remixData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/sendRemixJobAfterPayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(remixData),
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
    console.error("Error minting collectible after payment:", error);
    throw error;
  }
};

export const claimPayoutViaAPI = async (claimData: any) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/account/claimPayout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(claimData),
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
    console.error("Error claiming payout:", error);
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

const cache_checkIfAlbumCanBeMinted: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const checkIfAlbumCanBeMintedViaAPI = async (albumId: string) => {
  const now = Date.now();
  const baseNothingAvailable = {
    rarityGrade: "Common", // default to Common if not set
    maxMints: 0, // 0 means unlimited and is the default for Common
    priceOption1: {
      priceInUSD: null,
    },
    priceOption2: {
      canBeMinted: false,
      priceInUSD: null,
      tokenImg: null,
    },
    priceOption3: {
      canBeMinted: false,
      IpTokenId: null,
      priceInUSD: null,
      tokenImg: null,
    },
    priceOption4: {
      IpTokenId: null,
      priceInUSD: null,
    },
  };

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

      // the above API trumps of if option 2 and 3 is actually available (as it needs to be minted)
      const _buyNowMeta = {
        rarityGrade: data.rarityGrade || "Common", // default to Common if not set
        maxMints: typeof data.maxMints !== "undefined" && !isNaN(parseInt(data.maxMints)) ? parseInt(data.maxMints) : 0, // 0 means unlimited and is the default for Common
        priceOption1: {
          priceInUSD: null,
        },
        priceOption2: {
          canBeMinted: data.canBeMinted,
          priceInUSD: null,
          tokenImg: data.tokenImg || null,
        },
        priceOption3: {
          canBeMinted: data.t2CollectibleAvailable,
          IpTokenId: data.t2IpTokenId,
          priceInUSD: null,
          tokenImg: data.tokenImg || null,
        },
        priceOption4: {
          IpTokenId: data.t2IpTokenId, // the IP token will be the same as priceOption3
          priceInUSD: null,
        },
      };

      // Update cache
      cache_checkIfAlbumCanBeMinted[albumId] = {
        data: _buyNowMeta,
        timestamp: now,
      };

      return _buyNowMeta;
    } else {
      // Update cache (with false as data)
      cache_checkIfAlbumCanBeMinted[albumId] = {
        data: baseNothingAvailable,
        timestamp: now,
      };

      return baseNothingAvailable;
    }
  } catch (error) {
    console.error("Error checking if album can be minted:", error);

    // Update cache (with false as data)
    cache_checkIfAlbumCanBeMinted[albumId] = {
      data: baseNothingAvailable,
      timestamp: now,
    };

    return baseNothingAvailable;
  }
};

const cache_albumTracks: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const getAlbumTracksFromDBViaAPI = async (artistId: string, albumId: string, userOwnsAlbum?: boolean, bypassCache = false) => {
  const now = Date.now();

  const bonus = userOwnsAlbum ? 1 : 0;

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_albumTracks[`${artistId}-${albumId}-bonus_${bonus}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN && !bypassCache) {
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

const cache_artistPlaylistTracks: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const getArtistPlaylistTracksFromDBViaAPI = async (artistId: string, bypassCache = false) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_artistPlaylistTracks[`${artistId}-playlist`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN && !bypassCache) {
      console.log(`getArtistPlaylistTracksFromDBViaAPI: Getting playlist tracks for artistId: ${artistId} from cache`);
      return cacheEntry.data;
    }

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/musicTracks/${artistId}`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_artistPlaylistTracks[`${artistId}-playlist`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      cache_artistPlaylistTracks[`${artistId}-playlist`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("Error getting artist playlist tracks from DB:", error);

    // Update cache (with [] as data)
    cache_artistPlaylistTracks[`${artistId}-playlist`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

export const getAlbumFromDBViaAPI = async (artistId: string) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/albums/${artistId}`);

    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting album from DB:", error);
    return [];
  }
};

const cache_creatorFanMembershipAvailability: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchCreatorFanMembershipAvailabilityViaAPI = async (creatorPaymentsWallet: string, artistId: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_creatorFanMembershipAvailability[`${creatorPaymentsWallet}-${artistId}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(
        `fetchCreatorFanMembershipAvailabilityViaAPI: Getting fan membership availability for creatorPaymentsWallet: ${creatorPaymentsWallet} and artistId: ${artistId} from cache`
      );
      return cacheEntry.data as Record<string, any>;
    }

    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/mintInnerCircleNFTCanBeMinted?creatorWallet=${creatorPaymentsWallet}&artistId=${artistId}`
    );

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
            maxMints: value.maxMints,
          };
          return acc;
        },
        {} as Record<string, { tokenImg: string; perkIdsOffered: string[]; maxMints?: string }>
      );

      // Update cache
      cache_creatorFanMembershipAvailability[`${creatorPaymentsWallet}-${artistId}`] = {
        data: transformedData,
        timestamp: now,
      };

      return transformedData as Record<string, any>;
    }

    return {} as Record<string, any>;
  } catch (error) {
    console.error("Error fetching membership data:", error);

    cache_creatorFanMembershipAvailability[`${creatorPaymentsWallet}-${artistId}`] = {
      data: {},
      timestamp: now,
    };

    return {} as Record<string, any>;
  }
};

const cache_myFanMembershipsForThisArtist: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMyFanMembershipsForArtistViaAPI = async (
  addressSol: string,
  creatorPaymentsWallet: string,
  artistId: string,
  bypassCacheAsNewDataAdded = false
) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}-${artistId}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN && !bypassCacheAsNewDataAdded) {
      console.log(
        `fetchMyFanMembershipsForArtistViaAPI: Getting fan memberships for addressSol: ${addressSol} and creatorPaymentsWallet: ${creatorPaymentsWallet} from cache`
      );
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/getUserMintLogs?forSolAddr=${addressSol}&mintTemplateSearchString=fan-${creatorPaymentsWallet.trim().toLowerCase()}-${artistId.trim()}`
    );

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}-${artistId}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}-${artistId}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMyFanMembershipsForArtistViaAPI: Error fetching fan memberships:", error);

    // Update cache (with [] as data)
    cache_myFanMembershipsForThisArtist[`${addressSol}-${creatorPaymentsWallet}-${artistId}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_myAlbumsFromMinLogs: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMyAlbumsFromMintLogsViaAPI = async (addressSol: string, bypassCacheAsNewDataAdded = false) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_myAlbumsFromMinLogs[`${addressSol}-myAlbumsFromMinLogs`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN && !bypassCacheAsNewDataAdded) {
      console.log(`fetchMyAlbumsFromMintLogsViaAPI: Getting albums from min logs for addressSol: ${addressSol} from cache`);
      return cacheEntry.data;
    }

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/getUserMintLogs?forSolAddr=${addressSol}&mintTemplateSearchString=album`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_myAlbumsFromMinLogs[`${addressSol}-myAlbumsFromMinLogs`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_myAlbumsFromMinLogs[`${addressSol}-myAlbumsFromMinLogs`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMyAlbumsFromMintLogsViaAPI: Error fetching albums from min logs:", error);

    // Update cache (with [] as data)
    cache_myAlbumsFromMinLogs[`${addressSol}-myAlbumsFromMinLogs`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_artistSales: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchArtistSalesViaAPI = async ({
  creatorPaymentsWallet,
  artistId,
  xTakeReadOnlyPersona,
}: {
  creatorPaymentsWallet: string;
  artistId: string;
  xTakeReadOnlyPersona?: string | null;
}) => {
  if (xTakeReadOnlyPersona) {
    alert("ALERT! fetchArtistSalesViaAPI using xTakeReadOnlyPersona: " + xTakeReadOnlyPersona);
  }

  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_artistSales[`${creatorPaymentsWallet}-${artistId}`];

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchArtistSalesViaAPI: Getting artist sales for creatorPaymentsWallet: ${creatorPaymentsWallet} and artistId: ${artistId} from cache`);
      return cacheEntry.data;
    }

    const walletToUse = xTakeReadOnlyPersona ? xTakeReadOnlyPersona : creatorPaymentsWallet;

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/paymentsByCreatorSales?creatorWallet=${walletToUse}&artistId=${artistId}&byCreatorSalesStatusFilter=success`
    );

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_artistSales[`${creatorPaymentsWallet}-${artistId}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_artistSales[`${creatorPaymentsWallet}-${artistId}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchArtistSalesViaAPI: Error fetching artist sales:", error);

    // Update cache (with [] as data)
    cache_artistSales[`${creatorPaymentsWallet}-${artistId}`] = {
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
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
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

export const fetchStreamsLeaderboardAllTracksByMonthViaAPI = async (MMYYString: string, limit: number = 20) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}-${limit}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchStreamsLeaderboardAllTracksViaAPI: Getting streams leaderboard for MMYYString: ${MMYYString} and limit: ${limit} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/streamsLeaderboardByMonthAllTracks?MMYYString=${MMYYString}`);

    if (response.ok) {
      let data = await response.json();

      data = data.slice(0, limit);

      // Update cache
      cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}-${limit}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}-${limit}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchStreamsLeaderboardByArtistViaAPI: Error fetching streams leaderboard:", error);

    // Update cache (with [] as data)
    cache_streamsLeaderboardAllTracksByMonth[`${MMYYString}-${limit}`] = {
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

const cache_latestInnerCircleNFTOptions: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchLatestCollectiblesAvailableViaAPI = async (nftType: string = "fan", limit: number = 20, alwaysUseProd = true) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_latestInnerCircleNFTOptions[`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}: Getting data from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps(alwaysUseProd)}/datadexapi/sigma/latestCollectiblesAvailable?nftType=${nftType}`);

    if (response.ok) {
      let data = await response.json();

      if (data.length > 0 && nftType === "album") {
        // remove items from data have that have a .isDemo property
        data = data.filter((item: any) => !item.isDemo);
      } else if (data.length > 0 && nftType === "fan") {
        // also, let's filter out the WSB ones for now as that campaign is over and not promoted anymore. These are items that have wsb in the tokenName. i.e "tokenName": "FANG79-WsbYshie-T1"
        data = data.filter((item: any) => !item.tokenName.toLowerCase().includes("wsb"));
      }

      data = data.slice(0, limit);

      // Update cache
      cache_latestInnerCircleNFTOptions[`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_latestInnerCircleNFTOptions[`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchLatestCollectiblesAvailableViaAPI: Error fetching latest Inner Circle collectible options:", error);

    // Update cache (with [] as data)
    cache_latestInnerCircleNFTOptions[`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_mintsByTemplatePrefix: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMintsByTemplatePrefix = async (templatePrefix: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_mintsByTemplatePrefix[`${templatePrefix}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
      console.log(`fetchMintsByTemplatePrefix: Getting mints by template prefix: ${templatePrefix} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/mintsByTemplatePrefix?templatePrefix=${templatePrefix}`);

    if (response.ok) {
      let data = await response.json();

      // we should only get 1 item as the API is returing all time mints for this template.
      if (data.length > 0) {
        data = data[0];
      } else {
        data = [];
      }

      // Update cache
      cache_mintsByTemplatePrefix[`${templatePrefix}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_mintsByTemplatePrefix[`${templatePrefix}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMintsByTemplatePrefix: Error fetching mints by template prefix:", error);

    // Update cache (with [] as data)
    cache_mintsByTemplatePrefix[`${templatePrefix}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_mintsLeaderboardByMonth: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMintsLeaderboardByMonthViaAPI = async (MMYYString: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_mintsLeaderboardByMonth[`${MMYYString}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchMintsLeaderboardByMonthViaAPI: Getting mints leaderboard for MMYYString: ${MMYYString} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/mintsLeaderboardByMonth?MMYYString=${MMYYString}`);

    if (response.ok) {
      let data = await response.json();

      // Update cache
      cache_mintsLeaderboardByMonth[`${MMYYString}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_mintsLeaderboardByMonth[`${MMYYString}`] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMintsLeaderboardByMonthViaAPI: Error fetching mints leaderboard:", error);

    // Update cache (with [] as data)
    cache_mintsLeaderboardByMonth[`${MMYYString}`] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

export async function fetchBitSumAndGiverCountsViaAPI({
  getterAddr,
  campaignId,
  collectionId,
}: {
  getterAddr: string;
  campaignId: string;
  collectionId: string;
}): Promise<any> {
  const callConfig = {
    headers: {
      "fwd-tokenid": collectionId,
    },
  };

  try {
    const res = await fetch(
      `${getApiWeb2Apps()}/datadexapi/xpGamePrivate/getterBitSumAndGiverCounts?getterAddr=${getterAddr}&campaignId=${campaignId}`,
      callConfig
    );

    const data = await res.json();
    return data;
  } catch (err: any) {
    const message = "Getting sum and giver count failed :" + getterAddr + "  " + campaignId + err.message;
    console.error(message);
    return false;
  }
}

export async function getMusicTracksByGenreViaAPI({ genre, pageSize = 50, pageToken }: { genre: string; pageSize?: number; pageToken?: string }): Promise<any> {
  try {
    // replace spaces with _
    const genreWithSpaces = genre.replace(/\s+/g, "-");
    let callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/musicTracks/byGenre/${genreWithSpaces}?pageSize=${pageSize}`;

    if (pageToken) {
      callUrl += `&pageToken=${pageToken}`;
    }

    const res = await fetch(callUrl);

    const data = await res.json();
    return data;
  } catch (err: any) {
    const message = "Getting music tracks by genre failed :" + genre + "  " + err.message;
    console.error(message);
    return false;
  }
}

export async function getPaymentLogsViaAPI({ addressSol, byTaskFilter }: { addressSol: string; byTaskFilter?: string }): Promise<any> {
  try {
    let callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/paymentLogs?payer=${addressSol}`;

    // if byTaskFilter is provided, then we filter the payment logs by the type (e.g. "remix")
    if (byTaskFilter) {
      callUrl += `&byTaskFilter=${byTaskFilter}`;
    }

    const res = await fetch(callUrl);

    const data: PaymentLog[] = await res.json();

    // @TODO, we should reorder the createdOn which is the timestamp of the payment in the server, for now, lets do it here
    return data.sort((a: any, b: any) => b.createdOn - a.createdOn);
  } catch (err: any) {
    const message = "Getting payment logs failed :" + err.message;
    console.error(message);
    return false;
  }
}

const cache_remixLaunches: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export async function getRemixLaunchesViaAPI({ launchStatus, addressSol }: { launchStatus: string; addressSol: string | null }): Promise<any> {
  // we disable it here as a backup as well so we dont even hit the APIs
  if (DISABLE_AI_REMIX_FEATURES === "1") {
    return [];
  }

  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_remixLaunches[`${launchStatus}-${addressSol || "all"}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_FIVE_SECONDS) {
      console.log(`getRemixLaunchesViaAPI: Getting remix launches for launchStatus: ${launchStatus} and addressSol: ${addressSol || "all"} from cache`);
      return cacheEntry.data;
    }

    try {
      let callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/newLaunchesByStatus/${launchStatus}`;

      // if addressSol is provided then only get the remixes for the logged in user
      if (addressSol) {
        callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/newLaunchesByStatusAndRemixedBy/${launchStatus}?remixedBy=${addressSol}`;
      }

      const res = await fetch(callUrl);
      const toJson = await res.json();
      const data: PaymentLog[] = toJson.items || [];

      // if addressSol path, then the items wont be ordered by createdOn, so lets do it here
      if (addressSol) {
        data.sort((a: any, b: any) => b.createdOn - a.createdOn);
      }

      // Update cache
      cache_remixLaunches[`${launchStatus}-${addressSol || "all"}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } catch (err: any) {
      const message = "Getting remix launches failed :" + err.message;
      console.error(message);
      // Update cache (with [] as data)
      cache_remixLaunches[`${launchStatus}-${addressSol || "all"}`] = {
        data: [],
        timestamp: now,
      };
      return [];
    }
  } catch (error) {
    console.error("Error getting remix launches:", error);
    // Update cache (with [] as data)
    cache_remixLaunches[`${launchStatus}-${addressSol || "all"}`] = {
      data: [],
      timestamp: now,
    };
    return [];
  }
}

export const getLoggedInUserProfileAPI = async ({ solSignature, signatureNonce, addr }: { solSignature: string; signatureNonce: string; addr: string }) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/userAccounts/loggedInUserProfile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ solSignature, signatureNonce, addr }),
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
    console.error("Error getting logged in user profile:", error);
    throw error;
  }
};

const cache_fullXPLeaderboard: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchFullXPLeaderboardViaAPI = async (xpCollectionIdToUse: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_fullXPLeaderboard["fullXPLeaderboard"];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
      console.log(`fetchFullXPLeaderboardViaAPI: Getting full XP leaderboard from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks

    const callConfig = {
      headers: {
        "fwd-tokenid": xpCollectionIdToUse,
      },
    };

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/xpGamePrivate/giverLeaderBoard`, callConfig);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_fullXPLeaderboard["fullXPLeaderboard"] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_fullXPLeaderboard["fullXPLeaderboard"] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchFullXPLeaderboardViaAPI: Error fetching full XP leaderboard:", error);

    // Update cache (with [] as data)
    cache_fullXPLeaderboard["fullXPLeaderboard"] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_MyPlaceOnfullXPLeaderboard: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchMyPlaceOnFullXPLeaderboardViaAPI = async (xpCollectionIdToUse: string, playerAddr: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_MyPlaceOnfullXPLeaderboard["myPlaceOnFullXPLeaderboard"];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
      console.log(`fetchMyPlaceOnFullXPLeaderboardViaAPI: Getting my place on full XP leaderboard from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks

    const callConfig = {
      headers: {
        "fwd-tokenid": xpCollectionIdToUse,
      },
    };

    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/xpGamePrivate/playerRankOnLeaderBoard?playerAddr=${playerAddr}&giveMeGiverLeaderBoard=1`,
      callConfig
    );

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_MyPlaceOnfullXPLeaderboard["myPlaceOnFullXPLeaderboard"] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_MyPlaceOnfullXPLeaderboard["myPlaceOnFullXPLeaderboard"] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchMyPlaceOnFullXPLeaderboardViaAPI: Error fetching my place on full XP leaderboard:", error);

    // Update cache (with [] as data)
    cache_MyPlaceOnfullXPLeaderboard["myPlaceOnFullXPLeaderboard"] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_bountySnapshot: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchBountySnapshotViaAPI = async () => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_bountySnapshot["bountySnapshot"];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
      console.log(`fetchBountySnapshotViaAPI: Getting bounty snapshot from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks

    const response = await fetch(`${getApiWeb2Apps()}/app_nftunes/assets/json/bounty_snapshot.json`);

    if (response.ok) {
      const data = await response.json();

      // Update cache
      cache_bountySnapshot["bountySnapshot"] = {
        data: data,
        timestamp: now,
      };

      return data;
    } else {
      // Update cache (with [] as data)
      cache_bountySnapshot["bountySnapshot"] = {
        data: [],
        timestamp: now,
      };

      return [];
    }
  } catch (error) {
    console.error("fetchBountySnapshotViaAPI: Error fetching bounty snapshot:", error);

    // Update cache (with [] as data)
    cache_bountySnapshot["bountySnapshot"] = {
      data: [],
      timestamp: now,
    };

    return [];
  }
};

const cache_doFastStreamOnAlbumCheck: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const doFastStreamOnAlbumCheckViaAPI = async (alId: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_doFastStreamOnAlbumCheck[`${alId}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(`doFastStreamOnAlbumCheckViaAPI: Getting doFastStreamOnAlbumCheck for alId: ${alId} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/fastStreamOnAlbumCheck?alId=${alId}`);

    if (response.ok) {
      const data = await response.json();

      let albumCanBeStreamed = false;

      if (data.albumCanBeStreamed) {
        albumCanBeStreamed = true;
      }
      // Update cache
      cache_doFastStreamOnAlbumCheck[`${alId}`] = {
        data: albumCanBeStreamed,
        timestamp: now,
      };

      return albumCanBeStreamed;
    } else {
      // Update cache (with [] as data)
      cache_doFastStreamOnAlbumCheck[`${alId}`] = {
        data: false,
        timestamp: now,
      };

      return false;
    }
  } catch (error) {
    console.error("doFastStreamOnAlbumCheckViaAPI: Error fetching doFastStreamOnAlbumCheck:", error);

    // Update cache (with [] as data)
    cache_doFastStreamOnAlbumCheck[`${alId}`] = {
      data: false,
      timestamp: now,
    };

    return false;
  }
};

const cache_payoutLogs: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export async function getPayoutLogsViaAPI({ addressSol, xTakeReadOnlyPersona }: { addressSol: string; xTakeReadOnlyPersona?: string | null }): Promise<any> {
  if (xTakeReadOnlyPersona) {
    alert("ALERT! getPayoutLogsViaAPI using xTakeReadOnlyPersona: " + xTakeReadOnlyPersona);
  }

  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_payoutLogs["payoutLogs"];

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_HALF_MIN) {
      console.log(`getPayoutLogsViaAPI: Getting payout logs from cache`);
      return cacheEntry.data;
    }

    const walletToUse = xTakeReadOnlyPersona ? xTakeReadOnlyPersona : addressSol;

    let callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/payoutLogs?receiverAddr=${walletToUse}`;

    const res = await fetch(callUrl);

    const data: PaymentLog[] = await res.json();

    // Update cache
    cache_payoutLogs["payoutLogs"] = {
      data: data,
      timestamp: now,
    };

    return data;
  } catch (err: any) {
    const message = "Getting payout logs failed :" + err.message;
    console.error(message);

    // Update cache (with [] as data)
    cache_payoutLogs["payoutLogs"] = {
      data: [],
      timestamp: now,
    };

    return false;
  }
}

const cache_artistAiRemix: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export async function getArtistAiRemixViaAPI({ artistId }: { artistId: string }): Promise<any> {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_artistAiRemix[`${artistId}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_FIVE_SECONDS) {
      console.log(`getArtistAiRemixViaAPI: Getting artistAiRemix for artistId: ${artistId} from cache`);
      return cacheEntry.data;
    }

    try {
      let callUrl = `${getApiWeb2Apps()}/datadexapi/sigma/aiRemixesByArtist/${artistId}`;

      const res = await fetch(callUrl);
      const toJson = await res.json();

      const data: AiRemixLaunch[] = toJson.items || [];

      // Update cache
      cache_artistAiRemix[`${artistId}`] = {
        data: data,
        timestamp: now,
      };

      return data;
    } catch (err: any) {
      const message = "Getting artistAiRemix failed :" + err.message;
      console.error(message);
      // Update cache (with [] as data)
      cache_artistAiRemix[`${artistId}`] = {
        data: [],
        timestamp: now,
      };
      return [];
    }
  } catch (error) {
    console.error("Error getting artistAiRemix:", error);
    // Update cache (with [] as data)
    cache_artistAiRemix[`${artistId}`] = {
      data: [],
      timestamp: now,
    };
    return [];
  }
}

export const downloadMp3TrackViaAPI = async (albumId: string, alId: string, trackTitle: string) => {
  try {
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/musicTracksDownload?albumId=${albumId}&alId=${alId}&directDownload=1`);

    if (response.ok) {
      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = !trackTitle ? `${albumId}-${alId}.mp3` : `${trackTitle.replaceAll(" ", "_")}.mp3`; // Use the trackTitle parameter

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } else {
      console.error("Error downloading track:", response.statusText);
      return false;
    }
  } catch (error) {
    console.error("Error downloading track:", error);
    return false;
  }
};

export const saveSongMediaViaAPI = async ({
  solSignature,
  signatureNonce,
  creatorWallet,
  file,
  fileType,
  fileName,
  fileSize,
}: {
  solSignature: string;
  signatureNonce: string;
  creatorWallet: string;
  file: File;
  fileType: string;
  fileName: string;
  fileSize: number;
}) => {
  // if file is less than 3 MB we use the saveMediaToServerViaAPI otherwise we use the saveLargerMediaToServerViaAPI
  if (file.size < 3 * 1024 * 1024) {
    return await saveMediaToServerViaAPI({ solSignature, signatureNonce, creatorWallet, file });
  } else {
    return await saveLargerMediaToServerViaAPI({ solSignature, signatureNonce, creatorWallet, file, fileType, fileName, fileSize });
  }
};

export const saveMediaToServerViaAPI = async ({
  solSignature,
  signatureNonce,
  creatorWallet,
  file,
}: {
  solSignature: string;
  signatureNonce: string;
  creatorWallet: string;
  file: File;
}) => {
  try {
    const formData = new FormData();
    formData.append("media", file, file.name);
    formData.append("solSignature", solSignature);
    formData.append("signatureNonce", signatureNonce);
    formData.append("creatorWallet", creatorWallet);

    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/account/uploadMedia`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const mediaUploadResponse = await response.json();

      if (mediaUploadResponse.error) {
        throw new Error("API Error on upload media" + mediaUploadResponse.errorMessage || " - unknown error");
      } else {
        if (mediaUploadResponse?.data?.fileUrl) {
          return mediaUploadResponse.data.fileUrl;
        } else {
          throw new Error("API Error on upload media - did not get a fileUrl back");
        }
      }
    } else {
      throw new Error("API Error on upload media - did not get a success response back");
    }
  } catch (error) {
    console.error("Error saving media to server:", error);
    throw new Error("Failed to upload media to server " + (error as Error).message);
  }
};

export const saveLargerMediaToServerViaAPI = async ({
  solSignature,
  signatureNonce,
  creatorWallet,
  file,
  fileType,
  fileName,
  fileSize,
}: {
  solSignature: string;
  signatureNonce: string;
  creatorWallet: string;
  file: File;
  fileType: string;
  fileName: string;
  fileSize: number;
}) => {
  try {
    // Get presigned POST data
    const response = await fetch(`${getApiWeb2Apps()}/datadexapi/sigma/account/uploadMediaLarger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solSignature, signatureNonce, creatorWallet, fileType, fileName, fileSize }),
    });

    if (response.ok) {
      const mediaUploadResponse = await response.json();

      const { url, fields, fileUrl } = mediaUploadResponse.data;

      if (!url || !fields || !fileUrl) {
        throw new Error("API Error on upload media - did not get a url or fields back");
      }

      // Upload with POST using FormData
      const formData = new FormData();

      // appear all the fields in the fields object
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      formData.append("file", file);

      // save it to S3 via the signed URL
      try {
        await fetch(url, {
          method: "POST",
          body: formData,
        });

        return fileUrl;
      } catch (error) {
        throw new Error("Failed to upload media to server " + (error as Error).message);
      }
    } else {
      const errorDetails = await response.json();
      /*
      {
        "error": true,
        "errorMessage": "File size too large. Maximum size: 1MB",
        "receivedSize": "1.83MB",
        "maxSize": "1.00MB"
      }
      */

      if (errorDetails?.error) {
        throw new Error("Failed to upload media to server " + errorDetails?.errorMessage || " - unknown error");
      } else {
        throw new Error("Failed to upload media to server");
      }
    }
  } catch (error) {
    console.error("Error saving media to server:", error);
    throw new Error("Failed to upload media to server " + (error as Error).message);
  }
};

export const logAssetRatingToAPI = async ({ assetId, rating, address }: { assetId: string; rating: string; address: string }) => {
  try {
    let APIEndpoint = `${getApiWeb2Apps()}/datadexapi/sigma/assetRating`;

    const headerConfig: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(APIEndpoint, {
      method: "POST",
      headers: headerConfig,
      body: JSON.stringify({ assetId, rating, raterAddr: address }),
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
    console.error("Error saving asset rating data:", error);
    throw error;
  }
};

const cache_launchpadData: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const getLaunchpadDataViaAPI = async (artistId: string, albumId?: string): Promise<LaunchpadData | null> => {
  const now = Date.now();
  const cacheKey = `${artistId}-${albumId || "default"}`;

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_launchpadData[cacheKey];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(`getLaunchpadDataViaAPI: Getting launchpad data for artistId: ${artistId} from cache`);
      return cacheEntry.data as LaunchpadData | null;
    }

    // TODO: Replace with actual API call when backend is ready
    // For now, use mock data
    const mockData = getMockLaunchpadData(artistId, albumId || "");

    // Update cache
    cache_launchpadData[cacheKey] = {
      data: mockData,
      timestamp: now,
    };

    return mockData;
  } catch (error) {
    console.error("getLaunchpadDataViaAPI: Error fetching launchpad data:", error);
    // Update cache (with null as data)
    cache_launchpadData[cacheKey] = {
      data: null,
      timestamp: now,
    };
    return null;
  }
};
