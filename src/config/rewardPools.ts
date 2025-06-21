import { RewardPool } from "../pages/BodySections/HomeSection/RewardPools";

export const rewardPools: RewardPool[] = [
  // {
  //   id: "rp1",
  //   name: "Artist Fans win a share of 10% of total sales of Inner Circle Fan Collectibles",
  //   description:
  //     "Holding  collectible is your raffle ticket to win a share of 10% of total sales of the collectibles. Owning more than one collectible will increase your chances of winning.",
  //   startDate: "2025-05-16",
  //   endDate: "2025-06-16",
  //   featured: true,
  //   totalWinners: 7,
  //   walletAddress: "6WihiRvs5LW3zGmHze9cKbjmyAyorq2Bn18e8zfnJcNY",
  //   priceSplit: [
  //     {
  //       "1st": "30% (e.g. if 200 USDC is total pool, 60 USDC is your share)",
  //       "2nd": "20% (e.g. if 200 USDC, 40 USDC is your share)",
  //       "3rd": "10% (e.g. if 200 USDC, 20 USDC is your share)",
  //       "4th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
  //       "5th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
  //       "6th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
  //       "7th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
  //     },
  //   ],
  //   terms: [
  //     "After the end date, winners will be randomly selected from all the collectibles sold",
  //     "We can only distribute rewards as USDC to Solana wallets",
  //     "All winners are final and no appeals will be entertained",
  //     "Winners are responsible for reaching out to us to claim their rewards",
  //     "We reserve the right to not distribute rewards if the winner does not reach out to us within 10 days of the end date",
  //     'To check if you are a winner, click on the "check if you are a winner" button and follow the instructions',
  //   ],
  //   eligibility: [
  //     "You must buy and own a Loonyo Fan membership collectible. If someone else sent it to your wallet, you will not be eligible. You MUST have purchased it yourself.",
  //   ],
  //   cta: {
  //     text: "Buy Loonyo Fan Collectible",
  //     isNewWindow: false,
  //     link: "https://sigmamusic.fm/wsb/rockwell/loonyo",
  //   },
  // },
  {
    id: "rp2",
    name: "Win USDC For being a $FAN Holder who has given over 100 XP to creators",
    description:
      "We will randomly select $FAN holders who have > $9.99 USD worth of tokens and who have also joined the music app and given over 100 XP to creators. We only check if you have over $9.99 worth of $FAN tokens, having a lot more does not increase your chances of winning.",
    startDate: "2025-05-16",
    endDate: "2025-06-30",
    featured: false,
    totalWinners: 5,
    walletAddress: "3TBJxt6Xm41iiYKkuq2JGiYTsfvsrWgTEvaE6KTmU36U",
    priceSplit: [
      {
        "1st": "40% (e.g. if 200 USDC is total pool, 80 USDC is your share)",
        "2nd": "30% (e.g. if 200 USDC, 60 USDC is your share)",
        "3rd": "15% (e.g. if 200 USDC, 30 USDC is your share)",
        "4th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
        "5th": "5% (e.g. if 200 USDC, 10 USDC is your share)",
      },
    ],
    terms: [
      "After the pool goes live, we will randomly snapshot $FAN holders who have over $9.99 USD worth of tokens in their wallet at the time of the snapshot",
      "At the end date of the pool, we will confirm if these wallets have given over 100 XP to creators in this app",
      "We can only distribute rewards as USDC to Solana wallets",
      "All winners are final and no appeals will be entertained",
      "Winners are responsible for reaching out to us to claim their rewards",
      "We reserve the right to not distribute rewards if the winner does not reach out to us within 10 days of the end date",
      'To check if you are a winner, click on the "check if you are a winner" button and follow the instructions',
    ],
    eligibility: [
      "Holders of $FAN tokens who have over $9.99 USD worth of tokens in their wallet at the time of the snapshot",
      "Holders of $FAN tokens who have joined the music app and given over 100 XP to creators",
    ],
    cta: {
      text: "Get $FAN Tokens",
      isNewWindow: true,
      link: "https://raydium.io/swap/?inputMint=D7qqKEr7JFpAd82m9nvJL2psdPmU1oW54g1LHvDUYFAN&outputMint=sol",
    },
  },
  {
    id: "rp3",
    name: "Win USDC For being an Engaged Artist on the Sigma Music platform",
    description:
      "Artists who are most engaged with the Sigma Music platform and have the most fan engagement (e.g. most streams, most power-ups, most boosts, most social engagement, most albums lauched on Sigma Music, etc.) will win a share of the pool.",
    startDate: "2025-06-16",
    endDate: "2025-07-16",
    featured: false,
    totalWinners: 5,
    walletAddress: "6WihiRvs5LW3zGmHze9cKbjmyAyorq2Bn18e8zfnJcNY",
    priceSplit: [
      {
        "1st": "40% (e.g. if 200 USDC is total pool, 80 USDC is your share)",
        "2nd": "30% (e.g. if 200 USDC, 60 USDC is your share)",
        "3rd": "15% (e.g. if 200 USDC, 30 USDC is your share)",
        "4th": "10% (e.g. if 200 USDC, 20 USDC is your share)",
        "5th": "5% (e.g. if 200 USDC, 10 USDC is your share)",
      },
    ],
    terms: [
      "We analyse the engagement of artists on the Sigma Music platform and select the top 5 artists with the most engagement",
      "We can only distribute rewards as USDC to Solana wallets",
      "All winners are final and no appeals will be entertained",
      "Winners are responsible for reaching out to us to claim their rewards",
      "We reserve the right to not distribute rewards if the winner does not reach out to us within 10 days of the end date",
    ],
    eligibility: [
      "Drop as many albums, EPs, singles, etc. as you can on the Sigma Music platform",
      "Launch your Inner Circle fan club and get your fans to join",
      "Engage with your fans on your own socials and ask them to get Sigma XP and use it to power-up your artist profile and boost your music albums/EPs",
      "Get your fans to free stream your music albums/EPs on the Sigma Music platform",
      "Engage with Sigma Music content on X and other social media platforms",
    ],
    cta: {
      text: "",
      isNewWindow: false,
      link: "",
    },
  },
];
