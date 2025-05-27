import { LOG_STREAM_EVENT_METRIC_EVERY_SECONDS } from "config";

interface CacheEntry_DataWithTimestamp {
  data: boolean | [] | Record<string, any> | number;
  timestamp: number;
}

const CACHE_DURATION_HALF_MIN = 30 * 1000; // 30 seconds in milliseconds
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

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_checkIfAlbumCanBeMinted[albumId];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_60_MIN) {
      console.log(`checkIfAlbumCanBeMintedViaAPI: Using cached minting status for albumId: ${albumId}`);
      return cacheEntry.data;
    }

    const response = await fetch(`${getApiWeb2Apps(true)}/datadexapi/sigma/mintAlbumNFTCanBeMinted?albumId=${albumId}`);

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
      `${getApiWeb2Apps(true)}/datadexapi/sigma/mintInnerCircleNFTCanBeMinted?creatorWallet=${creatorPaymentsWallet}&artistId=${artistId}`
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

const cache_artistSales: { [key: string]: CacheEntry_DataWithTimestamp } = {};

export const fetchArtistSalesViaAPI = async (creatorPaymentsWallet: string, artistId: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_artistSales[`${creatorPaymentsWallet}-${artistId}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchArtistSalesViaAPI: Getting artist sales for creatorPaymentsWallet: ${creatorPaymentsWallet} and artistId: ${artistId} from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(
      `${getApiWeb2Apps()}/datadexapi/sigma/paymentsByCreatorSales?creatorWallet=${creatorPaymentsWallet}&artistId=${artistId}&byCreatorSalesStatusFilter=success`
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

export const fetchLatestCollectiblesAvailableViaAPI = async (nftType: string = "fan", limit: number = 20) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_latestInnerCircleNFTOptions[`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchLatestCollectiblesAvailableViaAPI-${nftType}-${limit}: Getting data from cache`);
      return cacheEntry.data;
    }

    // if the userOwnsAlbum, then we instruct the DB to also send back the bonus tracks
    const response = await fetch(`${getApiWeb2Apps(true)}/datadexapi/sigma/latestCollectiblesAvailable?nftType=${nftType}`);

    if (response.ok) {
      let data = await response.json();

      if (data.length > 0 && nftType === "album") {
        // remove items from data have that have a .isDemo property
        data = data.filter((item: any) => !item.isDemo);
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

export const fetchMintsLeaderboardByMonth = async (MMYYString: string) => {
  const now = Date.now();

  try {
    // Check if we have a valid cache entry
    const cacheEntry = cache_mintsLeaderboardByMonth[`${MMYYString}`];
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_2_MIN) {
      console.log(`fetchMintsLeaderboardByMonth: Getting mints leaderboard for MMYYString: ${MMYYString} from cache`);
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
    console.error("fetchMintsLeaderboardByMonth: Error fetching mints leaderboard:", error);

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
