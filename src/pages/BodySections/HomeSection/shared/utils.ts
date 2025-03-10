import axios from "axios";
import { DEFAULT_BITZ_COLLECTION_SOL } from "config";
import { DISABLE_BITZ_FEATURES } from "config";
import { GiftBitzToArtistMeta, Track } from "libs/types";
import { fetchBitSumAndGiverCountsSol } from "pages/AppMarketplace/GetBitz/GetBitzSol/GiveBitzBase";

// get and cache the artists and albums data locally
let _artistsAlbumsDataCachedOnWindow: any[] = [];
let _artistsAlbumsDataCachedOn: number = 0;

export async function getArtistsAlbumsData() {
  try {
    // cache for 120 seconds
    if (_artistsAlbumsDataCachedOnWindow.length > 0 && Date.now() - _artistsAlbumsDataCachedOn < 120 * 1000) {
      console.log(`getArtistsAlbumsData: [cache]`);
      return _artistsAlbumsDataCachedOnWindow;
    } else {
      console.log(`getArtistsAlbumsData: [no-cache]`);
      const getArtistsAlbumsAPI = `https://api.itheumcloud.com/app_nftunes/assets/json/albumsAndArtistsData.json`;
      const dataRes = await axios.get(getArtistsAlbumsAPI);
      const dataset = dataRes.data;
      _artistsAlbumsDataCachedOnWindow = dataset;
      _artistsAlbumsDataCachedOn = Date.now();

      return _artistsAlbumsDataCachedOnWindow;
    }
  } catch (e) {
    console.error(e);
    return [];
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
    // return [
    //   {
    //     idx: 1,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/MelancholyChristmas.jpg",
    //     title: "Melancholy Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/9691.audio_MelancholyChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "https://drip.haus/itheum/set/7d3117c1-4956-428b-9e2d-d254f19a94a8",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 2,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheSilenceofChristmasTears.jpg",
    //     title: "The Silence of Christmas Tears",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96142.audio_TheSilenceofChristmasTears.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    // ];

    // return [
    //   {
    //     idx: 1,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/MelancholyChristmas.jpg",
    //     title: "Melancholy Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/9691.audio_MelancholyChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "https://drip.haus/itheum/set/7d3117c1-4956-428b-9e2d-d254f19a94a8",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 2,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheSilenceofChristmasTears.jpg",
    //     title: "The Silence of Christmas Tears",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96142.audio_TheSilenceofChristmasTears.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 3,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ChristmasRockBalladSymphony.jpg",
    //     title: "Christmas Rock Ballad Symphony",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96623.audio_ChristmasRockBalladSymphony.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 4,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/AChristmasSymphonyofLove.jpg",
    //     title: "A Christmas Symphony of Love",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96124.audio_AChristmasSymphonyofLove.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 5,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/BaskInTheGlowOfChristmas.jpg",
    //     title: "Bask In The Glow Of Christmas",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96305.audio_BaskInTheGlowOfChristmas.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 6,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/QuietDreamOfChristmasNight.jpg",
    //     title: "Quiet Dream Of Christmas Night",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96146.audio_QuietDreamOfChristmasNight.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 7,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/RomanianNewYearsEveParty2025.jpg",
    //     title: "Romanian New Years Eve Party 2025",
    //     stream:
    //       "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96677.audio_RomanianNewYearsEveParty2025.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 8,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG17-Olly'G-Christmas Ballad",
    //     artist: "Olly'G",
    //     category: "EDM, Rock Ballad",
    //     album: "Christmas Ballad",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ANewYearsLove.jpg",
    //     title: "A New Years Love",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeic4bdq7r6lfnqssjktmj6r4im65vln3nguoz2frbwmzfjpnwxh7aq/96478.audio_ANewYearsLove.mp3",
    //     ctaBuy: "",
    //     dripSet: "",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a2",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 9,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/TheDreamer.jpg",
    //     title: "The Dreamer",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeigcoxwp4eco5ply73n3cop2jkjxzjbucpk5qgqj6hf76rhrwz3sg4/4501.audio_TheDreamer.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 10,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/CanYouHearMe.jpg",
    //     title: "Can You Hear Me",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeiftwf3ueqthuaukd2tpw3jynlyoqkjtsadl2ihmrazml2jctor7t4/98712.audio_CanYouHearMe.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 11,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG14 - Olly'G - EDM Collection",
    //     artist: "Olly'G",
    //     category: "Electronic Dance Music",
    //     album: "",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/LifeIsAGift.jpg",
    //     title: "Life Is A Gift",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeiftwf3ueqthuaukd2tpw3jynlyoqkjtsadl2ihmrazml2jctor7t4/98373.audio_LifeIsAGift.mp3",
    //     ctaBuy: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     dripSet: "https://drip.haus/itheum/set/fd8d6137-3c32-4d35-9751-d836ceabe0a3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar14_a1",
    //     isExplicit: "0",
    //   },
    //   {
    //     idx: 12,
    //     nftCollection: "me2Sj97xewgEodSCRs31jFEyA1m3FQFzziqVXK9SVHX",
    //     solNftName: "MUSG13 - GritBeat - Subnautical2",
    //     artist: "GritBeat",
    //     category: "DnB, Trance, Breakbeat",
    //     album: "Subnautical II",
    //     cover_art_url: "https://api.itheumcloud.com/app_nftunes/assets/img/ToxicWaters.jpg",
    //     title: "Toxic Waters",
    //     stream: "https://gateway.lighthouse.storage/ipfs/bafybeienck7ahtjsof3ozjfyczovhrjmmkkkjd6yrnmvrefmv5e62v5cqq/74401.audio_ToxicWaters.Toxic Waters",
    //     ctaBuy: "https://drip.haus/itheum/set/58edad5c-eb49-4812-988c-d4baf04811b3",
    //     dripSet: "https://drip.haus/itheum/set/58edad5c-eb49-4812-988c-d4baf04811b3",
    //     creatorWallet: "3ibP6nxaKocQPA8S5ntXSo1Xd4aYSa93QKjPzDaPqAmB",
    //     bountyId: "mus_ar13_a1",
    //     isExplicit: "0",
    //   },
    // ];

    const getRadioStreamAPI = `https://api.itheumcloud.com/app_nftunes/assets/json/radioStreamData.json`;

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

export async function getNFTuneFirstTrackBlobData(trackOne: Track) {
  try {
    const blob = await fetch(trackOne.stream!).then((r) => r.blob());
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (e) {
    console.error(e);
    return "";
  }
}
