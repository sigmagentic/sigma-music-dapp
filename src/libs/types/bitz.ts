export type BountyBitzSumMapping = {
  [campaignId: string]: {
    bitsSum: number;
  };
};

export interface GiftBitzToArtistMeta {
  bountyId: string;
  creatorWallet: string;
  albums?: Array<{
    bountyId: string;
    // Add other album properties if needed
  }>;
}
