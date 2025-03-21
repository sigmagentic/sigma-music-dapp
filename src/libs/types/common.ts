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
  stream: string;
  ctaBuy: string;
  dripSet: string;
  creatorWallet: string;
  bountyId: string;
  isExplicit: string;
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
  _canBeMinted: boolean;
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
  otherLink1: string;
  isArtistFeatured: string;
  albums: Album[];
}

export interface AlbumWithArtist extends Album {
  artistId: string;
  artistName: string;
  artistSlug: string;
}
