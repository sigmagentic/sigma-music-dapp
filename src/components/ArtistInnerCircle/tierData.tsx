import { MembershipType } from "libs/types/common";

export const tierData: Record<string, MembershipType> = {
  t1: {
    id: "t1",
    label: "Base",
    priceUSD: 0.5,
    term: "lifetime" as const,
    perks: [
      {
        name: "Upto 10 Free Albums per year",
        type: "virtual" as const,
        description: "If I drop a new album as a NFT, you get it for free (upto 10 albums per year)",
        terms: "Please note that I reserve the right to decide which albums are eligible for this perk at any time",
        howToClaim: "Hold the inner circle fan membership NFT",
      },
      {
        name: "Monthly Video Group Call with all Fans",
        type: "physical" as const,
        description: "I'll hold a monthly video call with all fans who hold this tier and tell you all about what I'm working on and you can ask me anything",
        terms:
          "Please note that my fans should join my group of the Sigma Discord server so we can coordinate the call. There may be months when this call may not happen if I'm busy or if there are not many fans who want to join",
        howToClaim: "Hold the inner circle fan membership NFT",
      },
    ],
  },
  t2: {
    id: "t2",
    label: "Premium",
    priceUSD: 1.0,
    term: "annual" as const,
    perks: [
      {
        name: "Everything in the Base Tier",
        type: "physical" as const,
        description: "Access to everything in the base tier",
        terms: "Hold the inner circle fan membership NFT",
      },
      {
        name: "10% Revenue Share on All My Album and Fan Membership Sales",
        type: "physical" as const,
        description: "Help promote my music and grow my fanbase and you can share in the revenue. Share in my success and I'll share in yours",
        terms:
          "10% of total sales per month will be shared with all fans who hold this tier. You need to hold the inner circle fan membership NFT for a whole month to be eligible for a monthly split. All earnings will be split equally among all fans who hold this tier and you will be paid out monthly in USDC (a USD stable coin on Solana that is equal to $1 USD). All renevue splits are based on my discretion and are non negotiable.",
      },
      {
        name: "10 Min Meet and Greet at My Performances",
        type: "physical" as const,
        description: "If I perform at an event, you can use your NFT to meet me",
        terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
        howToClaim: "Hold the inner circle fan membership NFT",
      },
      {
        name: "Personalized Video Message",
        type: "physical" as const,
        description: "I'll record a personalized video message for you",
        terms: "Can be redeemed once a year. Please note that my fans should join my group of the Sigma Discord server so we can coordinate",
      },
    ],
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
                        "Hold the inner circle fan membership NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
                    },
                    {
                      name: "20 Min Voice Call",
                      type: "virtual" as const,
                      description: "I'll give you a 20-minute voice call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
                    },
                    {
                      name: "10 Min Video Call",
                      type: "virtual" as const,
                      description: "I'll give you a 10-minute video call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
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
                        "Hold the inner circle fan membership NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
                    },
                    {
                      name: "10 Min Meet and Greet at My Performances",
                      type: "physical" as const,
                      description: "If I perform at an event, you can use your NFT to meet me",
                      terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
                      howToClaim: "Hold the inner circle fan membership NFT and show it to the artist's crew at the event",
                    },
                    {
                      name: "20 Min Voice Call",
                      type: "virtual" as const,
                      description: "I'll give you a 20-minute voice call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
                    },
                    {
                      name: "10 Min Video Call",
                      type: "virtual" as const,
                      description: "I'll give you a 10-minute video call to chat",
                      terms: "Can be redeemed once a month per user who holds this tier",
                      howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
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
