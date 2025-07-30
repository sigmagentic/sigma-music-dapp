import { MembershipType, Perk } from "libs/types/common";

export const perksData: Perk[] = [
  {
    pid: "p1",
    name: "Upto 10 free EPs or singles per year",
    type: "virtual" as const,
    description: "If I drop a new EP or Single as a NFT, you get to own a copy (as a NFT) for free and stream all bonus tracks",
    terms: "Upto 10 EPs or Singles per year. Please note that I reserve the right to decide which EPs or Singles are eligible for this perk at any time",
    howToClaim: "Hold the Inner Circle fan club NFT",
    comingSoon: true,
  },
  {
    pid: "p2",
    name: "Monthly video call with all fans",
    type: "physical" as const,
    description: "I'll hold a monthly video call with all fans who hold this tier and tell you all about what I'm working on and you can ask me anything",
    terms:
      "Please note that my fans should join my group of the Sigma Discord server so we can coordinate the call. There may be months when this call may not happen if I'm busy or if there are not many fans who want to join",
    howToClaim: "Hold the Inner Circle fan club NFT",
    comingSoon: true,
  },
  {
    pid: "p3",
    name: "10% revenue share on all my album and fan membership sales",
    type: "physical" as const,
    description: "Help promote my music and grow my fanbase and you can share in the revenue. Share in my success and I'll share in yours",
    terms:
      "10% of total sales per month will be shared with all fans who hold this tier. You need to hold the Inner Circle fan collectible for a whole month to be eligible for a monthly split. All earnings will be split equally among all fans who hold this tier and you will be paid out monthly in USDC (a USD stable coin on Solana that is equal to $1 USD). All renevue splits are based on my discretion and are non negotiable.",
    comingSoon: true,
  },
  {
    pid: "p4",
    name: "Meet me at my performances",
    type: "physical" as const,
    description: "If I perform at an event, you can use your Fan NFT to meet me",
    terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
    howToClaim: "Hold and present the Inner Circle fan club NFT to the artist's crew at the event",
  },
  {
    pid: "p5",
    name: "Access to VIP lounge at my performances",
    type: "physical" as const,
    description: "If I perform at an event, you can use your NFT to chill at my VIP lounge",
    terms: "Note that this only applies to performances that have a VIP lounge planned",
    howToClaim: "Hold and present the Inner Circle fan club NFT to the artist's crew at the event",
  },
  {
    pid: "p6",
    name: "Take a photo with me at my performances",
    type: "physical" as const,
    description: "If I perform at an event, you can use your NFT to take a photo with me",
    terms: "Note that this only applies to performances that allow photo ops",
    howToClaim: "Hold and present the Inner Circle fan club NFT to the artist's crew at the event",
  },
  {
    pid: "p7",
    name: "Personalized video message",
    type: "physical" as const,
    description: "I'll record a personalized video message for you",
    terms: "Can be redeemed once a year. Please note that my fans should join my group of the Sigma Discord server so we can coordinate",
    comingSoon: true,
  },
  {
    pid: "p8",
    name: "Early access to ticket sales",
    type: "physical" as const,
    description: "I'll give you early access to ticket sales for my performances",
    howToClaim: "Hold a fan membership for access to a private link to purchase tickets before they go on sale to the public",
    comingSoon: true,
  },
  {
    pid: "p9",
    name: "Private 1:1 call with me",
    type: "physical" as const,
    description: "I'll give you a private 1:1 call with me to chat about anything you want related to my music, my career, my life, etc",
    howToClaim: "Hold a fan membership to access a private link to schedule a call with me",
    comingSoon: true,
  },
  {
    pid: "p10",
    name: "Win a share of 10% of total sales revenue",
    type: "virtual" as const,
    description: "Help promote my work and grow my fanbase and you can share in the revenue. Share in my success and I'll share in yours",
    linkedRewardPool: "rp1",
    terms:
      "Only applicable to the linked reward pool. Each Inner Circle fan token = 1 raffle ticket to win a shre of 10% of total sales of this collectible. You need to hold the Inner Circle fan club collectible for a whole week to be eligible for this competition. All winners are selected at random and are non negotiable.",
  },
];

/*
  {
    pid: "p3",
    name: "Everything in the Base Tier",
    type: "physical" as const,
    description: "Access to everything in the base tier",
    terms: "Hold the Inner Circle fan club NFT",
  },

*/

export const tierData: Record<string, MembershipType> = {
  t1: {
    id: "t1",
    label: "Base",
    defaultPriceUSD: 5,
    term: "lifetime" as const,
    perks: [],
  },
  t2: {
    id: "t2",
    label: "Premium",
    defaultPriceUSD: 50,
    term: "annual" as const,
    perks: [],
  },
};

/*
              const data = {
                base: {
                  id: "base",
                  priceUSD: 10,
                  term: "lifetime" as const,
                  perks: [
                    {
                      name: "Free Highest Rarity Tier Album Airdrop",
                      type: "virtual" as const,
                      description: "Each time I drop a new Music Album NFT, you get the highest rarity tier for free",
                      terms: "",
                    },
                    {
                      name: "10 Min Meet and Greet at My Performances",
                      type: "physical" as const,
                      description: "If I perform at an event, you can use your NFT to meet me",
                      terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
                      howToClaim:
                        "Hold the Inner Circle fan club NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
                    },
                    {
                      name: "20 Min Voice Call",
                      type: "virtual" as const,
                      description: "I'll give you a 20-minute voice call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the Inner Circle fan club NFT, DM me on X and we can arrange a time to chat",
                    },
                    {
                      name: "10 Min Video Call",
                      type: "virtual" as const,
                      description: "I'll give you a 10-minute video call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the Inner Circle fan club NFT, DM me on X and we can arrange a time to chat",
                    },
                  ],
                },
                premium: {
                  id: "premium",
                  priceUSD: 100,
                  term: "annual" as const,
                  perks: [
                    {
                      name: "Everything in the Base Tier",
                      type: "virtual" as const,
                      description: "Access to everything in the base tier",
                      terms: "",
                    },
                    {
                      name: "Access to VIP Lounge at My Performances",
                      type: "physical" as const,
                      description: "If I perform at an event, you can use your NFT to chill at my VIP lounge",
                      terms: "Note that this only applies to performances that have a VIP lounge planned",
                    },
                  ],
                },
              };
              */

/*
              const data = {
                base: {
                  id: "base",
                  priceUSD: 10,
                  term: "lifetime" as const,
                  perks: [
                    {
                      name: "Free Highest Rarity Tier Album Airdrop",
                      type: "virtual" as const,
                      description: "Each time I drop a new Music Album NFT, you get the highest rarity tier for free",
                      terms: "",
                      howToClaim:
                        "Hold the Inner Circle fan club NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
                    },
                    {
                      name: "10 Min Meet and Greet at My Performances",
                      type: "physical" as const,
                      description: "If I perform at an event, you can use your NFT to meet me",
                      terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
                      howToClaim: "Hold the Inner Circle fan club NFT and show it to the artist's crew at the event",
                    },
                    {
                      name: "20 Min Voice Call",
                      type: "virtual" as const,
                      description: "I'll give you a 20-minute voice call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the Inner Circle fan club NFT, DM me on X and we can arrange a time to chat",
                    },
                    {
                      name: "10 Min Video Call",
                      type: "virtual" as const,
                      description: "I'll give you a 10-minute video call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the Inner Circle fan club NFT, DM me on X and we can arrange a time to chat",
                    },
                  ],
                },
              };
              */

// const tierData = {};

/*
        {
                name: "20% Discount on All Music NFTs",
                type: "physical" as const,
                description: "Each time I drop a new Music NFT, you get a 20% discount on it",
                terms: "",
              },
{
                name: "20% Discount on All Merchandise",
                type: "physical" as const,
                description: "Get 20% off all merchandise on my store",
                terms: "",
              },

              {
                name: "Access to VIP Lounge at My Performances",
                type: "physical" as const,
                description: "If I perform at an event, you can use your NFT to chill at my VIP lounge",
                terms: "Note that this only applies to performances that have a VIP lounge planned",
              },

               {
                name: "20 Min Voice Call",
                type: "physical" as const,
                description: "I'll give you a 20-minute voice call to chat",
                terms: "Can be redeemed once a month per user who holds this tier",
              },

              early access to ticket sales

        */
