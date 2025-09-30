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
  idx: number;
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
  isSigmaAiRemix?: string; // 0 or 1 indicated if the track was published via Sigma AI Remix
  isSigmaAiRemixUsingFreeLicense?: string; // 0 or 1 indicated if the track was published via Sigma AI Remix using a free license track
  isNewlyCreatedAiRemixDuringCurrentSession?: boolean; // was the track just created during the current browser sessio (so we can mark it as newly created)
  hideOrDelete?: string; // // "1" for hide, "2" for delete (optional) 0 means the track is not deleted or hidden anymore (recovering a track)
}

export interface Album {
  albumId: string;
  solNftName: string;
  solNftAltCodes?: string; // can be a , separated list of alt codes prefixes for the album (e.g. MUSSM1)
  title: string;
  desc: string;
  ctaPreviewStream: string;
  ctaBuy: string;
  dripSet?: string;
  bountyId: string;
  img: string;
  isExplicit: string;
  isPodcast: string;
  isFeatured: string;
  isSigmaRemixAlbum: string;
  albumPriceOption1?: string; // digital album  + download only
  albumPriceOption2?: string; // digital album + download + NFT
  albumPriceOption3?: string; // digital album + commercial license + download + NFT
  albumPriceOption4?: string; // digital album + commercial license
  isSigmaExclusive?: string; // 0 or 1 indicated if the album is a sigma exclusive album
  timestampAlbumAdded?: string; // the timestamp of the album added to the database
  createdOn?: number; // the timestamp of the album created on the database
  updatedOn?: number; // the timestamp of the album updated on the database
  isPublished?: string; // 0 or 1 indicated if the album is published (0 means draft, 1 means published)
  _buyNowMeta?: {
    rarityGrade?: string; // the rarity of the album (e.g. "common", "uncommon", "rare", "epic", "legendary")
    maxMints?: number; // the max number of mints for the album (0 means unlimited)
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
    priceOption4?: {
      IpTokenId: string | null; // the story protocol IP token to issue licenses on
      priceInUSD: string | null;
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
  altMainPortfolioLink?: string;
  fanTokenNftMarketplaceLink?: string;
  isArtistFeatured: string;
  isDeprioritized: string;
  creatorPaymentsWallet: string;
  artistCampaignCode?: string;
  artistSubGroup1Code?: string;
  artistSubGroup2Code?: string;
  fanToken3DGifTeaser?: string;
  createdOn?: number;
  updatedOn?: number;
  isVerifiedArtist?: boolean;
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
  priceOption4 = "4", // Digital Album + Commercial License
}

export interface PaymentLog {
  task: "buyAlbum" | "joinFanClub" | "remix" | "buyXP"; // buyAlbum or joinFanClub or remix or buyXP
  paymentStatus: "new" | "success" | "failed" | "uncertain"; // new, success, failed (not sure if we use this)
  createdOn: number;
  tx: string;
  amount: string;
  payer: string;
  type: "sol" | "cc" | "xp"; // sol or cc or xp
  creatorWallet?: string;
  paymentStatusAddedOn?: number;
  albumSaleTypeOption?: string; // 1 (digital album + download only), 2 (digital album + download + NFT), 3 (digital album + commercial license + download + NFT)
  priceInUSD?: string; // only when type is sol
  albumId?: string;
  artistId?: string;
  membershipId?: string;
  _artistSlug?: string; // we add this inside the app
  _artistName?: string; // we add this inside the app
  _albumName?: string; // we add this inside the app
  _artistCampaignCode?: string; // we add this inside the app
  _artistSubGroup1Code?: string; // we add this inside the app
  _artistSubGroup2Code?: string; // we add this inside the app
  asyncTaskJobTraceId?: string; // the SQS message ID of the job that processed the payment
  promptParams?: {
    songTitle: string;
    genre: string;
    mood: string;
    refTrack_alId: string;
    refTrack_file: string;
    refTrack_arId: string;
    textPrompt?: string;
  };
  XPBeingBought?: string;
  XPPurchasedFromUrl?: string;
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
  mp3TracksCanBeDownloaded: boolean;
  licenseTerms: {
    shortDescription: string | null;
    urlToLicense: string | null;
    ipTokenId: string | null;
  };
  nftAssetIdOnBlockchain: string | null;
}

export interface MyAlbumMintLog {
  mintTemplate: string;
  assetId: string;
  paymentHash: string;
  creatorWallet: string;
  createdOnTS: number;
  updatedOnTS?: number;
  normalizedAddr: string;
  ipTokenId: string;
  storyProtocolLicenseMintingSQSMessageId?: string;
  storyProtocolLicenseTokenId?: string;
  storyProtocolLicenseMintingTxHash?: string;
}

// AI Remix based
export interface AiRemixTrackVersion {
  bountyId: string;
  streamUrl: string;
  deepLinkSlugToTrackInAlbum?: string;
}

export interface AiRemixLaunch {
  image: string;
  createdOn: number; // Unix timestamp
  lastStatusUpdateOn?: number; // Unix timestamp
  remixedBy: string;
  launchId: string;
  paymentTxHash: string;
  status?: string;
  versions: AiRemixTrackVersion[];
  promptParams: {
    songTitle: string;
    genre: string;
    mood: string;
    refTrack_alId: string;
    refTrack_file: string;
    refTrack_arId: string;
    textPrompt?: string;
  };
  graduated?: number;
  graduatedStreamUrl?: string;
  votes?: number; // Optional as it might not be present in all responses
  votesNeeded?: number; // Optional as it might not be present in all responses
  // isNewlyCreated?: boolean; // was the track just created during the current browser sessio (so we can mark it as newly created)
}

export interface AiRemixRawTrack {
  createdOn: number;
  songTitle: string;
  genre: string;
  mood: string;
  image: string;
  streamUrl: string;
  status: "new" | "graduated" | "published";
  bountyId: string;
  refTrack_alId?: string;
  textPrompt?: string;
  refTrackWasFreeLicense?: string; // 0 or 1 indicated if the reference track was a free license track (i.e. sigma platform owns the rights to the remix)
  // isNewlyCreated?: boolean; // was the track just created during the current browser sessio (so we can mark it as newly created)
}

export interface FastStreamTrack {
  file: string;
  bonus: number;
  arId: string;
  category: string;
  cover_art_url: string;
  alId: string;
  idx: number;
  title: string;
  isExplicit?: string;
  hideOrDelete?: string; // // "1" for hide, "2" for delete (optional) 0 means the track is not deleted or hidden anymore (recovering a track)
}
