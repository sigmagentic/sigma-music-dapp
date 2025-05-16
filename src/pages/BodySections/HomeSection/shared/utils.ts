import axios from "axios";
import { IS_LIVE_DEMO_MODE } from "appsConfig";
import { DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { DISABLE_BITZ_FEATURES } from "config";
import { AlbumTrackCatalog, GiftBitzToArtistMeta, MusicTrack } from "libs/types";
import { getApiWeb2Apps } from "libs/utils/misc";
import { fetchBitSumAndGiverCountsSol } from "pages/AppMarketplace/GetBitz/GetBitzSol/GiveBitzBase";

// get and cache the artists and albums data locally
let _artistsAlbumsDataCachedOnWindow: any[] = [];
let _artistsAlbumsDataEverythingCachedOnWindow: any[] = [];
let _artistsAlbumsDataOrganizedBySectionsCachedOnWindow: Record<string, { sectionCode: string; filteredItems: any[] }> = {};
let _artistsAlbumsDataCachedOn: number = 0;

export async function getArtistsAlbumsData() {
  try {
    // cache for 120 seconds
    if (_artistsAlbumsDataCachedOnWindow.length > 0 && Date.now() - _artistsAlbumsDataCachedOn < 120 * 1000) {
      console.log(`getArtistsAlbumsData: [cache]`);
      return {
        albumArtistLookupData: _artistsAlbumsDataCachedOnWindow,
        albumArtistLookupDataEverything: _artistsAlbumsDataEverythingCachedOnWindow,
        albumArtistLookupDataOrganizedBySections: _artistsAlbumsDataOrganizedBySectionsCachedOnWindow,
      };
    } else {
      console.log(`getArtistsAlbumsData: [no-cache]`);
      const getArtistsAlbumsAPI = `${getApiWeb2Apps(true)}/app_nftunes/assets/json/albumsAndArtistsData.json`;
      const dataRes = await axios.get(getArtistsAlbumsAPI);
      let dataset = dataRes.data;
      let cloneDataset = [...dataset];
      let cloneDatasetEverything = [...dataset];

      const organizedBySectionsDataset = organizeArtistsByCampaignCodes(cloneDataset);

      if (!IS_LIVE_DEMO_MODE) {
        // if we are in live demo mode, we need to filter the dataset to only include the live demo artists
        // .. and only keep items in dataset that have no campaign code
        dataset = dataset.filter(
          (artist: any) => !artist.name.includes("(DEMO)") && (artist.artistCampaignCode === "" || typeof artist.artistCampaignCode === "undefined")
        );
      } else {
        // only keep items in dataset that have no campaign code
        dataset = dataset.filter((artist: any) => artist.artistCampaignCode === "" || typeof artist.artistCampaignCode === "undefined");

        // First process the demo items and mark them
        dataset = dataset.map((artist: any) => {
          if (artist.name.includes("(DEMO)")) {
            return {
              ...artist,
              name: artist.name.replace("(DEMO)", "").trim(),
              isDemo: 1,
            };
          } else {
            return artist;
          }
        });

        // Then sort to move demo items to the top
        dataset.sort((a: any, b: any) => {
          if (a.isDemo && !b.isDemo) return -1;
          if (!a.isDemo && b.isDemo) return 1;
          return 0;
        });
      }

      _artistsAlbumsDataCachedOnWindow = dataset; // this filters our demo artists and artists in campaigns etc
      _artistsAlbumsDataEverythingCachedOnWindow = cloneDatasetEverything; // this has EVERY artists we had in the master list
      _artistsAlbumsDataOrganizedBySectionsCachedOnWindow = organizedBySectionsDataset; // this creates a map of artists based on campaign segments
      _artistsAlbumsDataCachedOn = Date.now();

      return {
        albumArtistLookupData: _artistsAlbumsDataCachedOnWindow,
        albumArtistLookupDataEverything: _artistsAlbumsDataEverythingCachedOnWindow,
        albumArtistLookupDataOrganizedBySections: _artistsAlbumsDataOrganizedBySectionsCachedOnWindow,
      };
    }
  } catch (e) {
    console.error(e);
    return {
      albumArtistLookupData: [],
      albumArtistLookupDataEverything: [],
      albumArtistLookupDataOrganizedBySections: {},
    };
  }
}

// get and cache the artists and albums data locally
let _albumTrackCatalogDataCachedOnWindow: AlbumTrackCatalog = {};
let _albumTrackCatalogDataCachedOn: number = 0;

export async function getAlbumTrackCatalogData() {
  try {
    // cache for 120 seconds
    if (Object.keys(_albumTrackCatalogDataCachedOnWindow).length > 0 && Date.now() - _albumTrackCatalogDataCachedOn < 120 * 1000) {
      console.log(`getAlbumTrackCatalogData: [cache]`);
      return _albumTrackCatalogDataCachedOnWindow;
    } else {
      console.log(`getAlbumTrackCatalogData: [no-cache]`);
      const getAlbumTrackCatalogAPI = `${getApiWeb2Apps(true)}/app_nftunes/assets/json/albumTrackCatalog.json`;
      const dataRes = await axios.get(getAlbumTrackCatalogAPI);
      let dataset: AlbumTrackCatalog = dataRes.data;

      _albumTrackCatalogDataCachedOnWindow = dataset;
      _albumTrackCatalogDataCachedOn = Date.now();

      return _albumTrackCatalogDataCachedOnWindow;
    }
  } catch (e) {
    console.error(e);
    return {};
  }
}

// S: GIVING BITZ FOR ARTIST POWER-UPS AND ALBUM LIKES
// as the user swaps tabs, we fetch the likes and power-up counts and cache them locally

// we use a global window state variable here as musicBountyBitzSumGlobalMapping can be updated by multiple child components at the same time (e.g. RadioPlayer and FeaturedArtistsAndAlbums)
// .. and reach state is not sync updated. But we still use setMusicBountyBitzSumGlobalMapping to update the state so we can feed the "update" effect to all the children that need it
let _bountyBitzSumGlobalMappingWindow: Record<any, any> = {};

export function updateBountyBitzSumGlobalMappingWindow(bountyBitzSumGlobalMapping: Record<any, any>) {
  _bountyBitzSumGlobalMappingWindow = bountyBitzSumGlobalMapping;
}

export async function fetchBitzPowerUpsAndLikesForSelectedArtist({
  giftBitzToArtistMeta,
  userHasNoBitzDataNftYet,
  solBitzNfts,
  setMusicBountyBitzSumGlobalMapping,
  isSingleAlbumBounty,
}: {
  giftBitzToArtistMeta: GiftBitzToArtistMeta;
  userHasNoBitzDataNftYet: any;
  solBitzNfts: any;
  setMusicBountyBitzSumGlobalMapping: any;
  isSingleAlbumBounty: boolean;
}) {
  if (DISABLE_BITZ_FEATURES) {
    return;
  }

  const _bountyToBitzLocalMapping: Record<any, any> = { ..._bountyBitzSumGlobalMappingWindow };
  const checkInCacheSeconds = 120; // cache for 120 seconds

  if (
    !_bountyBitzSumGlobalMappingWindow[giftBitzToArtistMeta.bountyId] ||
    Date.now() - _bountyBitzSumGlobalMappingWindow[giftBitzToArtistMeta.bountyId].syncedOn > checkInCacheSeconds * 1000
  ) {
    console.log(`fetchBitzPowerUpsAndLikesForSelectedArtist: ${giftBitzToArtistMeta.bountyId} - is album ${isSingleAlbumBounty} [no-cache]`);

    let response;
    let collectionIdToUseOnSol = "";

    collectionIdToUseOnSol = userHasNoBitzDataNftYet ? DEFAULT_BITZ_COLLECTION_SOL : solBitzNfts[0].grouping[0].group_value;

    response = await fetchBitSumAndGiverCountsSol({
      getterAddr: giftBitzToArtistMeta?.creatorWallet || "",
      campaignId: giftBitzToArtistMeta?.bountyId || "",
      collectionId: collectionIdToUseOnSol,
    });

    _bountyToBitzLocalMapping[giftBitzToArtistMeta?.bountyId] = {
      syncedOn: Date.now(),
      bitsSum: response?.bitsSum,
    };

    if (isSingleAlbumBounty) {
      _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
      setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
      return;
    }

    // lets make a list of album bounties as well and queue it to be fetched
    if (giftBitzToArtistMeta.albums) {
      const albumBountyIds = giftBitzToArtistMeta.albums.map((i: any) => i.bountyId);

      if (albumBountyIds.length > 0) {
        let albumBitzPowerUpPromises: any[] = [];

        albumBitzPowerUpPromises = albumBountyIds.map((albumBounty: any) => {
          if (
            !_bountyBitzSumGlobalMappingWindow[albumBounty] ||
            Date.now() - _bountyBitzSumGlobalMappingWindow[albumBounty].syncedOn > checkInCacheSeconds * 1000
          ) {
            console.log(`fetchBitzPowerUpsAndLikesForSelectedArtist: ${albumBounty} - is album ${isSingleAlbumBounty} [no-cache]`);

            return fetchBitSumAndGiverCountsSol({
              getterAddr: giftBitzToArtistMeta?.creatorWallet || "",
              campaignId: albumBounty || "",
              collectionId: collectionIdToUseOnSol,
            });
          } else {
            console.log(`fetchBitzPowerUpsAndLikesForSelectedArtist: ${albumBounty} - is album ${isSingleAlbumBounty} [cache]`);
            return null;
          }
        });

        if (albumBitzPowerUpPromises.filter((i: any) => i !== null).length > 0) {
          Promise.all(albumBitzPowerUpPromises).then((values) => {
            albumBountyIds.forEach((albumBountyId: any, idx: number) => {
              _bountyToBitzLocalMapping[albumBountyId] = {
                syncedOn: Date.now(),
                bitsSum: values[idx]?.bitsSum,
              };
            });

            _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
            setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
            // { receivedBitzSum: response.bitsSum, giverCounts: response.giverCounts }
          });
        } else {
          // if no album changes were needed, we just set the global mapping to the current state
          _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
          setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
        }
      } else {
        _bountyBitzSumGlobalMappingWindow = _bountyToBitzLocalMapping;
        setMusicBountyBitzSumGlobalMapping(_bountyToBitzLocalMapping);
      }
    }
  } else {
    console.log(`fetchBitzPowerUpsAndLikesForSelectedArtist: ${giftBitzToArtistMeta.bountyId} - is album ${isSingleAlbumBounty} [cache]`);
    setMusicBountyBitzSumGlobalMapping(_bountyBitzSumGlobalMappingWindow);
  }
}
// E: GIVING BITZ FOR ARTIST POWER-UPS AND ALBUM LIKES

export async function getRadioStreamsData() {
  try {
    const getRadioStreamAPI = `${getApiWeb2Apps(true)}/app_nftunes/assets/json/radioStreamData.json`;

    const tracksRes = await axios.get(getRadioStreamAPI);
    const tracksData = tracksRes.data.map((track: any) => ({
      ...track,
      idx: parseInt(track.idx, 10),
    }));

    return tracksData;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getNFTuneFirstTrackBlobData(trackOne: MusicTrack) {
  try {
    const blob = await fetch(trackOne.stream!).then((r) => r.blob());
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (e) {
    console.error(e);
    return "";
  }
}

// Fisher-Yates shuffle algorithm
// function shuffleArray<T>(array: T[]): T[] {
//   const shuffled = [...array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// }

export function organizeArtistsByCampaignCodes(dataset: any[]) {
  const sectionsMap: Record<string, { sectionCode: string; filteredItems: any[] }> = {};
  // const shuffledDataset = shuffleArray(dataset);
  const shuffledDataset = dataset; // let's not shuffle the dataset for now as on the UI it does not have a predictable order

  // Process each artist
  shuffledDataset.forEach((artist) => {
    const { artistCampaignCode, artistSubGroup1Code, artistSubGroup2Code } = artist;

    // Skip if no campaign code
    if (!artistCampaignCode) return;

    // Add to campaign level section
    const campaignKey = artistCampaignCode;
    if (!sectionsMap[campaignKey]) {
      sectionsMap[campaignKey] = {
        sectionCode: campaignKey,
        filteredItems: [],
      };
    }
    sectionsMap[campaignKey].filteredItems.push(artist);

    // Add to campaign-subgroup1 level section if subgroup1 exists
    if (artistSubGroup1Code) {
      const campaignSubgroup1Key = `${artistCampaignCode}-${artistSubGroup1Code}`;
      if (!sectionsMap[campaignSubgroup1Key]) {
        sectionsMap[campaignSubgroup1Key] = {
          sectionCode: campaignSubgroup1Key,
          filteredItems: [],
        };
      }
      sectionsMap[campaignSubgroup1Key].filteredItems.push(artist);

      // Add to campaign-subgroup1-subgroup2 level section if subgroup2 exists
      if (artistSubGroup2Code) {
        const campaignSubgroup12Key = `${artistCampaignCode}-${artistSubGroup1Code}-${artistSubGroup2Code}`;
        if (!sectionsMap[campaignSubgroup12Key]) {
          sectionsMap[campaignSubgroup12Key] = {
            sectionCode: campaignSubgroup12Key,
            filteredItems: [],
          };
        }
        sectionsMap[campaignSubgroup12Key].filteredItems.push(artist);
      }
    }
  });

  // USE THIS TO HIDE SCTIONS IF NEEDED : let remove wsb-phl and wsb-phl-mrw until we GO LIVE with the new campaign codes
  // delete sectionsMap["wsb-phl"];
  // delete sectionsMap["wsb-phl-mrw"];
  // sectionsMap["wsb"].filteredItems = sectionsMap["wsb"].filteredItems.filter((i: any) => i.artistSubGroup1Code !== "phl");

  // console.log(sectionsMap);

  return sectionsMap;
}
