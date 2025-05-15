import { RewardPool } from "../pages/BodySections/HomeSection/RewardPools";

export const rewardPools: RewardPool[] = [
  {
    id: "rp1",
    name: "Win a share of 10% of total sales of the collectibles",
    description:
      "Only 200 Loonyo Fan memebrship collectibles will be sold, a collectibly is your raffle ticket to win a share of 10% of total sales of the collectibles. owning more than one collectible will increase your chances of winning.",
    startDate: "2025-05-16",
    endDate: "2025-05-22",
    featured: true,
    totalWinners: 7,
    walletAddress: "6WihiRvs5LW3zGmHze9cKbjmyAyorq2Bn18e8zfnJcNY",
    priceSplit: [
      {
        "1st": "30% (e.g. if 200 USDC is total pool, 60 USDC is your share)",
        "2nd": "20% (e.g. if 200 USDC is total pool, 40 USDC is your share)",
        "3rd": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
        "4th": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
        "5th": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
        "6th": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
        "7th": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
      },
    ],
    terms: [
      "After the end date, winners will be randomly selected from all the collectibles sold",
      "We can only disribute rewards as USDC to Solana wallets",
      "all winners are final and no appeals will be entertained",
      "Winners are responsible for reaching out to us to claim their rewards",
      "We reserve the right to not distribute rewards if the winner does not reach out to us within 10 days of the end date",
      'to check if you are winner, click on the "check if you are a winner" button and follow the instructions',
    ],
    eligibility: [
      "You must buy and own a Loonyo Fan membership collectible. If someone else sent it to your wallet, you will not be eligible. You MUST have purchased it yourself.",
    ],
  },
  {
    id: "rp2",
    name: "Win 200 USDC For being a $FAN Holders who have given over 100 XP to creators",
    description:
      "We will randomly select $FAN holders who have > $9.99 USD worth of tokens and who have also joined the music app and given over 100 XP to creators. We only check if your have over $9.99 worht of $FAN tokens, having a lot more doe snot increase your chances of winning.",
    startDate: "2025-05-23",
    endDate: "2025-05-29",
    featured: false,
    totalWinners: 5,
    walletAddress: "6WihiRvs5LW3zGmHze9cKbjmyAyorq2Bn18e8zfnJcNY",
    priceSplit: [
      {
        "1st": "40% (e.g. if 200 USDC is total pool, 80 USDC is your share)",
        "2nd": "30% (e.g. if 200 USDC is total pool, 60 USDC is your share)",
        "3rd": "15% (e.g. if 200 USDC is total pool, 30 USDC is your share)",
        "4th": "10% (e.g. if 200 USDC is total pool, 20 USDC is your share)",
        "5th": "5% (e.g. if 200 USDC is total pool, 10 USDC is your share)",
      },
    ],
    terms: [
      "After the pool goes live, we wil lrandomly snapshot $FAN holder who have over $9.99 USD worth on tokens in their wallet at the time of the snapshot",
      "At the end date of the pool, we will confirm if these wallets have given over 100 XP to creators in this app",
      "We can only disribute rewards as USDC to Solana wallets",
      "all winners are final and no appeals will be entertained",
      "Winners are responsible for reaching out to us to claim their rewards",
      "We reserve the right to not distribute rewards if the winner does not reach out to us within 10 days of the end date",
      'to check if you are winner, click on the "check if you are a winner" button and follow the instructions',
    ],
    eligibility: [
      "Holders of $FAN tokens who have over $9.99 USD worth of tokens in their wallet at the time of the snapshot",
      "Holders of $FAN tokens who have joined the music app and given over 100 XP to creators",
    ],
  },
];
