import { ViewDataReturnType } from "@itheum/sdk-mx-data-nft";

export enum BlobDataType {
  TEXT,
  IMAGE,
  AUDIO,
  SVG,
  PDF,
  VIDEO,
}

export interface ExtendedViewDataReturnType extends ViewDataReturnType {
  blobDataType: BlobDataType;
}

export interface MusicTrack {
  idx: string;
  nftCollection?: string;
  solNftName?: string;
  solNftAltCodes?: string; // can be a , separated list of alt codes prefixes for the album (e.g. MUSSM1). but intially we only support 1 (if we add more, code repo changes are needed)
  artist: string;
  category: string;
  album: string;
  cover_art_url: string;
  title: string;
  stream?: string; // this is the stream url for the track
  file?: string; // this is the file url for the track (DB load only)
  bonus?: number; // 0 or 1 indicated if the track is a bonus track (DB load only)
  ctaBuy?: string;
  dripSet?: string;
  creatorWallet?: string;
  bountyId?: string;
  isExplicit?: string;
  alId?: string; // the album and track index in the format (ar22_a1-1) -- it comes for DB in this format, but in the app we normalize it to albumTrackId
  albumTrackId?: string; // (same as above alid, the playlist (prev radio) streams json has it in this format) the album and track index in the format (ar22_a1-1)
  artistSlug?: string;
}

export interface Album {
  albumId: string;
  solNftName: string;
  solNftAltCodes?: string; // can be a , separated list of alt codes prefixes for the album (e.g. MUSSM1)
  title: string;
  desc: string;
  ctaPreviewStream: string;
  ctaBuy: string;
  dripSet: string;
  bountyId: string;
  img: string;
  isExplicit: string;
  isPodcast: string;
  isFeatured: string;
  isSigmaRemixAlbum: string;
  albumPriceOption1?: string; // digital album  + download only
  albumPriceOption2?: string; // digital album + download + NFT
  albumPriceOption3?: string; // digital album + commercial license + download + NFT
  isSigmaExclusive?: string; // 0 or 1 indicated if the album is a sigma exclusive album
  _buyNowMeta?: {
    priceOption1?: {
      priceInUSD: string | null;
    };
    priceOption2?: {
      canBeMinted: boolean;
      priceInUSD: string | null;
      tokenImg: string | null;
    };
    priceOption3?: {
      canBeMinted: boolean;
      IpTokenId: string | null; // the story protocol IP token to issue licenses on
      priceInUSD: string | null;
      tokenImg: string | null;
    };
  };
  _albumCanBeFastStreamed?: boolean;
}

export interface Artist {
  artistId: string;
  name: string;
  slug: string;
  bio: string;
  img: string;
  bountyId: string;
  dripLink: string;
  xLink: string;
  creatorWallet: string;
  webLink: string;
  ytLink: string;
  tikTokLink?: string;
  instaLink?: string;
  otherLink1: string;
  fanTokenNftMarketplaceLink?: string;
  isArtistFeatured: string;
  isDeprioritized: string;
  creatorPaymentsWallet: string;
  artistCampaignCode?: string;
  artistSubGroup1Code?: string;
  artistSubGroup2Code?: string;
  fanToken3DGifTeaser?: string;
  albums: Album[];
}

export interface AlbumWithArtist extends Album {
  artistId: string;
  artistName: string;
  artistSlug: string;
}

export interface Perk {
  pid: string;
  name: string;
  type: "physical" | "virtual";
  description: string;
  terms?: string;
  howToClaim?: string;
  comingSoon?: boolean;
  linkedRewardPool?: string;
}

export interface MyFanMembershipType {
  paymentHash: string;
  creatorWallet: string;
  createdOnTS: number;
  normalizedAddr: string;
  mintTemplate: string;
  membershipId?: string;
  membershipLabel?: string;
  tokenImg?: string | null;
  expiresInDays?: number;
  totalQuantityInBatch?: number; // was bought as part of a batch
  totalQtySentFlag?: number; // 0 means we have not yet sent individual collectibles, 1 means we have sent them
}

export interface MembershipType {
  id: string;
  label: string;
  defaultPriceUSD: number;
  term: "lifetime" | "annual" | "monthly";
  maxMints?: number;
  perks: Perk[];
}

export interface MembershipData {
  [key: string]: MembershipType;
}

export interface TrackInfo {
  arId: string;
  title: string;
  cover_art_url: string;
}

export type AlbumTrackCatalog = Record<string, TrackInfo>;

export interface StreamMetricData {
  alid: string;
  streams: number;
  songTitle: string;
  coverArtUrl: string;
}

export interface MintLeaderboard {
  mintTemplatePrefix: string;
  lastBought: number;
  nftType: string;
  arId: string;
  mints: number;
}

export enum AlbumSaleTypeOption {
  priceOption1 = "1", // Digital Album + Download Only
  priceOption2 = "2", // Digital Album + Download + NFT
  priceOption3 = "3", // Digital Album + Commercial License + Download + NFT
}

export interface PaymentLog {
  task: "buyAlbum" | "joinFanClub"; // buyAlbum or joinFanClub
  paymentStatus: "new" | "success" | "failed"; // new, success, failed (not sure if we use this)
  createdOn: number;
  tx: string;
  amount: string;
  creatorWallet: string;
  payer: string;
  paymentStatusAddedOn: number;
  albumSaleTypeOption: string; // 1 (digital album + download only), 2 (digital album + download + NFT), 3 (digital album + commercial license + download + NFT)
  priceInUSD?: string; // only when type is sol
  albumId?: string;
  type: "sol" | "cc"; // sol or cc
  artistId?: string;
  membershipId?: string;
  _artistSlug?: string; // we add this inside the app
  _artistName?: string; // we add this inside the app
  _albumName?: string; // we add this inside the app
  _artistCampaignCode?: string; // we add this inside the app
  _artistSubGroup1Code?: string; // we add this inside the app
  _artistSubGroup2Code?: string; // we add this inside the app
}

export interface MusicAssetOwned {
  purchasedOn: number;
  tx: string;
  albumSaleTypeOption: string; // 1 (digital album + download only), 2 (digital album + download + NFT), 3 (digital album + commercial license + download + NFT)
  albumId?: string;
  type: "sol" | "cc"; // sol or cc
  artistId?: string;
  membershipId?: string;
  _artistSlug?: string; // we add this inside the app
  _artistName?: string; // we add this inside the app
  _albumName?: string; // we add this inside the app
}

export interface EntitlementForMusicAsset {
  mp3TrackUrls: string[];
  licenseTerms: {
    shortDescription: string | null;
    urlToLicense: string | null;
    ipTokenId: string | null;
  };
  nftAssetIdOnBlockchain: string | null;
}
