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
  nftCollection: string;
  solNftName: string;
  artist: string;
  category: string;
  album: string;
  cover_art_url: string;
  title: string;
  stream?: string; // this is the stream url for the track (Radio load only)
  file?: string; // this is the file url for the track (DB load only)
  bonus?: number; // 0 or 1 indicated if the track is a bonus track (DB load only)
  ctaBuy: string;
  dripSet: string;
  creatorWallet: string;
  bountyId: string;
  isExplicit: string;
  alId?: string; // the album and track index in the format (ar22_a1-1) -- it comes for DB in this format, but in the app we normalize it to albumTrackId
  albumTrackId?: string; // (same as above alid, the radio streams json has it in this format) the album and track index in the format (ar22_a1-1)
}

export interface Album {
  albumId: string;
  solNftName: string;
  title: string;
  desc: string;
  ctaPreviewStream: string;
  ctaBuy: string;
  dripSet: string;
  ctaAirdrop: string;
  bountyId: string;
  img: string;
  isExplicit: string;
  isPodcast: string;
  isSpotlight: string;
  isFeatured: string;
  isSigmaRemixAlbum: string;
  _buyNowMeta?: {
    canBeMinted: boolean;
    priceInUSD: string;
  };
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
  isArtistFeatured: string;
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
