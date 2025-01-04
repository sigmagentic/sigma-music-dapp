export type Track = {
  idx: number;
  title: string;
  artist: string;
  album: string;
  cover_art_url: string;
  isRadioTrack?: boolean;
  albums?: Array<{
    bountyId: string;
    // Add other album properties if needed
  }>;
  category?: string;
  stream?: string;
  isExplicit?: "1" | "0";
  ctaBuy?: string;
  dripSet?: string;
  airdrop?: string;
  solNftName?: string;
  bountyId?: string;
  creatorWallet?: string;
};
