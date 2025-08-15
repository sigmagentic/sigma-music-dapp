import { useEffect, useState } from "react";
import { routeNames } from "routes";

interface FAQSection {
  title: string;
  questions: {
    id: string;
    question: string;
    answer: JSX.Element;
  }[];
}

const faqSections: FAQSection[] = [
  {
    title: "Project Overview",
    questions: [
      {
        id: "about-sigma-music",
        question: "About Sigma Music",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold mb-4">Sigma Music's vision is ambitious yet simple.</p>

            <div className="space-y-4">
              <p>There are over 9 billion people on Earth. While we may differ in countless ways, one thing unites us all: we're all fans of music.</p>

              <p className="text-lg font-semibold text-yellow-300">
                What if we could turn those 9 billion fans into the world's largest music distribution network?
              </p>

              <p className="mb-3">
                With Sigma Music, artists can tap into this global fan-powered network to launch their music, go viral, and earn from their work—without selling
                their souls to centralized labels. For the first time, fans can also share in the success of the artists they support and get rewarded for
                spreading the music they love.
              </p>

              <p>
                This is made possible by combining AI and crypto. Together, they create a new kind of infrastructure—one that aligns incentives across all
                participants through cryptoeconomics, and scales distribution exponentially through agentic AI.
              </p>

              <p className="text-lg font-semibold mt-6">Sigma is a is a next-gen music platform built on the intersection of music, fan engagement and AI.</p>
            </div>
          </div>
        ),
      },
      {
        id: "vision-statement",
        question: "Vision Statement",
        answer: (
          <div>
            <p>
              To empower artists and fans through AI and crypto, enabling viral music launches, shared earnings, and a decentralized music economy driven by
              collective passion.
            </p>
          </div>
        ),
      },
      {
        id: "mission-statement",
        question: "Mission Statement",
        answer: (
          <div>
            <p>
              To empower artists with direct fan engagement and fair compensation while giving fans unprecedented access and influence in the music they love.
            </p>
          </div>
        ),
      },
      {
        id: "pitch-deck",
        question: "Do you have an investor or partner pitch deck?",
        answer: (
          <div>
            <p>
              Yes, you can find our pitch deck{" "}
              <a
                href="https://sigmamusic.fm/deck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-300 transition-colors">
                here
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        id: "how-to-get-started",
        question: "I am a music artist, how can I get started with Sigma Music?",
        answer: (
          <div>
            <p>
              We provide a red-carpet experience for artists and give you all the support your need to launch your music and fan memberships on Sigma Music. If
              you're interested in joining us, please reach out to us on the dedicated{" "}
              <a
                href="https://t.me/SigmaXMusicOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-300 transition-colors">
                Telegram channel for Musicans
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        id: "traction",
        question: "What is the traction of Sigma Music?",
        answer: (
          <div>
            <p className="mb-4">We are growing fast, here are some highlights (which may already be outdated when you read this):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Over 70K music album NFTs launched</li>
              <li>25 artists onboarded, with at least one new album released weekly</li>
              <li>Deep Forest, a Grammy-winning artist, launched on the platform</li>
              <li>Discussions ongoing to onboard more prominent artists like Justice Crew, and more.</li>
              <li>
                Exclusive music partnership with{" "}
                <a
                  href="https://worldsupremacybattlegrounds.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-300 hover:text-yellow-300 transition-colors">
                  worldsupremacybattlegrounds.com
                </a>{" "}
                for the first IRL music competition in Dubai in April 2025
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    title: "App & Technology",
    questions: [
      {
        id: "features-on-the-app",
        question: "What are the features on this music app and platform?",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold mb-4">
              Sigma Music is where artists, fans, and AI come together to change the music game. Here's what's already live on the app:
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🎵</span> Launch Music, No Strings Attached
                </h4>
                <p>
                  Artists can drop full albums, singles, or samples—for free. Want to sell your work? Set your own prices. Whether it's pay-what-you-want or
                  premium drops, it's all up to the artist. No label middlemen. No gatekeepers.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🎧</span> Listen Free, Unlock Premium with NFTs
                </h4>
                <p>Anyone can stream music freely. But if you want exclusive tracks, hidden content, or premium perks—you'll need to buy Music NFTs.</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>⚡</span> Power-Up System (Yep, Like a Game)
                </h4>
                <p>
                  Fans collect free XP every 6 hours and can use it to "power up" artists and albums. That not only supports artists—it unlocks rewards and
                  drives discovery.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>💎</span> Inner Circle Fan Clubs
                </h4>
                <p>
                  Buy a one-time or monthly membership to support your fav artists. You'll get exclusive access, perks, shoutouts—and a chance to win in
                  platform raffles.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🤖</span> Sigma REMiX: Co-Create Music with AI
                </h4>
                <p>
                  With Sigma REMiX, fans can use AI to remix real music from artists. The remix gets minted into a Music NFT—and both the artist and the fan
                  earn revenue from sales.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🧠</span> Sigma: Your AI Music Agent
                </h4>
                <p>
                  Sigma isn't just an AI. She knows every track, album, and artist on the platform—and helps fans discover music or remix it. You can even chat
                  with her on X to make music.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>💰</span> Revenue Sharing
                </h4>
                <p>
                  Starting with raffles for holders, and soon expanding to include reward systems based on your social reach and referrals. Promote your fav
                  artists, grow the platform, and get rewarded.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg mt-6">
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>👾</span> Try It Out Now
                </h4>
                <p>Want to see how it all works? Launch tour mode now:</p>
                <a
                  href="https://sigmamusic.fm?g=tour"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-300 hover:text-yellow-300 transition-colors inline-block mt-2">
                  👉 https://sigmamusic.fm?g=tour
                </a>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "fan-revenue-share",
        question: "How Does the Fan Revenue Share Work?",
        answer: (
          <div className="space-y-4">
            <p className="mb-4">
              Sigma Music shares platform success directly with its biggest supporters — the fans. We're starting with a raffle-based model, designed to be
              simple, fun, and fair.
            </p>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-2">How it works:</h4>
              <p className="mb-4">
                Every 2 weeks, 10% of all Sigma Music platform revenue (from music sales, fan memberships, etc.) is pooled into a reward bucket.
              </p>

              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Eligibility Requirements:</h5>
                <p>We take random snapshots of users who hold:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>🎵 Music NFTs</li>
                  <li>🌟 Inner Circle Fan Club NFTs</li>
                  <li>💰 $FAN tokens worth at least $9.99 (the price of a fan membership)</li>
                </ul>
              </div>

              <p className="mb-4">
                From these eligible wallets, 10 winners are randomly selected. The top winner receives a larger share — because a little competition makes it
                more exciting 😉
              </p>

              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="font-semibold">🗓️ First Raffle Event:</p>
                <p className="mt-2">
                  We're aiming to run our first revenue share raffle in the last week of May 2025. As Sigma grows, we'll evolve the model based on community
                  feedback — but our core belief stays the same: Fans should win when the platform wins.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "technology-overview",
        question: "Technology Overview",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold mb-4">
              Sigma Music is built as a Web3-native platform with a fully Web2-style user experience. This hybrid approach is central to our strategy for
              widespread adoption.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🔗</span> Solana Blockchain Integration
                </h4>
                <p>
                  Sigma is deeply integrated with the Solana blockchain. Solana's high-speed, low-cost transactions allow us to tokenize music assets and user
                  accounts efficiently, enabling scalable on-chain interactions with minimal latency.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🎵</span> Compressed NFT Technology
                </h4>
                <p>
                  All assets on Sigma are implemented using Solana's compressed NFT (cNFT) standard. This innovation allows us to mint and distribute millions
                  of NFTs affordably, making it feasible to tokenize everything from music tracks to fan engagement events.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>💾</span> Itheum Protocol: Data NFTs
                </h4>
                <p>
                  Sigma utilizes the{" "}
                  <a href="http://x.com/itheum" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                    Itheum protocol
                  </a>{" "}
                  to issue Data NFTs — a powerful extension of compressed NFTs that support mutable "data streams." This allows for flexible and updatable NFTs,
                  such as dynamic music albums, evolving artist metadata, or unlockable fan experiences. Sigma is proudly incubated by Itheum and is a flagship
                  use case of this technology.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🔐</span> Frictionless Onboarding: Email Wallets & Credit Card Payments
                </h4>
                <p>
                  Sigma users can sign up using just an email address. Upon registration, a secure custodial wallet is provisioned automatically, abstracting
                  away blockchain complexity. NFTs can be purchased with credit cards and are minted on-demand to the user's wallet. Users retain full
                  ownership, and Sigma does not hold custody of any user assets. This Web2-friendly experience ensures accessibility without compromising on
                  Web3 principles.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🤖</span> Sigma AI Agent (ElizaOS-Powered)
                </h4>
                <p>
                  Sigma's AI agent, also called "Sigma," is built on the{" "}
                  <a
                    href="https://www.elizaos.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-300 hover:text-yellow-300 transition-colors">
                    ElizaOS
                  </a>{" "}
                  framework and customized for the music domain. It interacts with users via social platforms, accesses and streams NFT-based content, and
                  collaborates with artists and fans to co-create music. It can even tokenize new creations as NFTs directly from conversations or remix
                  sessions.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>🎨</span> REMiX and Multimodal AI
                </h4>
                <p>
                  Our REMiX feature harnesses multiple AI models across language, image, and music generation. Coordinated through our backend orchestration
                  system, these models enable real-time collaboration between humans and AI to produce, remix, and distribute music seamlessly.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "$FAN Token",
    questions: [
      {
        id: "sigma-token-utility",
        question: "$FAN Token Utility",
        answer: (
          <div className="space-y-6">
            <p className="mb-4">
              The utility of $FAN is powerful—yet simple.
              <br />
              Sigma Music is unique in how it shares value. By holding the $FAN token, fans become true participants in the music economy.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-2">1. Revenue Sharing for Fans</h4>
                <p className="mb-2">Sigma shares up to 10% of all platform revenue back with die-hard fans through raffles. To enter, you need:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>A "Inner Circle" fan membership or music NFT (your raffle ticket)</li>
                  <li>At least $9.99 worth of $FAN (each multiple gives you more chances)</li>
                </ul>
                <p className="mt-2">This creates a model where fans are incentivized to support artists—and win alongside them.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-yellow-300">
                  ⚠️ Note: The revenue share model is still being finalized. We intend to launch with the above structure and iterate based on community
                  feedback and platform performance.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">2. Token-Gated Features & Access</h4>
                <p className="mb-2">Holding $FAN unlocks powerful perks and gated features:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Generation of longer tracks in Sigma REMiX, our AI-powered remixing tool</li>
                  <li>Exclusive discounts on platform-wide music subscriptions</li>
                  <li>Buy IP rights to music for remixing, social sharing, and influencer licensing</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">3. Governance & Community-Led Growth</h4>
                <p>
                  Our aim is to evolve $FAN into a governance token as well. Token holders can vote on reward distribution rules, platform direction, and
                  incentive structures—ensuring that artists, fans, and creators grow together in a fair, community-owned ecosystem.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "sigma-tokenomics",
        question: "$FAN Token – Tokenomics",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold mb-4">Total Supply: 1,000,000,000 $FAN</p>

            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="mb-4">
                Based on the amount of tokens we purchased for the project during the fair launch on 8 May 2025, here is the breakdown of the token distribution
                buckets and vesting schedules:
              </p>

              <p className="text-yellow-300 font-semibold mb-6">
                We were able to secure 42% of the total supply for the project, with 34% (Foundation) locked (for details see below for details of the lock)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/50 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">Foundation</h4>
                  <div className="space-y-3">
                    <p>
                      <span className="text-gray-400">TGE:</span> <span className="text-white">34%</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Cliff:</span> <span className="text-white">3 months</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Vesting:</span> <span className="text-white">12 months</span>
                    </p>
                  </div>
                </div>

                <div className="bg-black/50 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">Airdrop</h4>
                  <div className="space-y-3">
                    <p>
                      <span className="text-gray-400">TGE:</span> <span className="text-white">4%</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Cliff:</span> <span className="text-white">0 months</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Vesting:</span> <span className="text-white">6 months</span>
                    </p>
                  </div>
                </div>

                <div className="bg-black/50 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">Liquidity</h4>
                  <div className="space-y-3">
                    <p>
                      <span className="text-gray-400">TGE:</span> <span className="text-white">4%</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Cliff:</span> <span className="text-white">0 months</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Vesting:</span> <span className="text-white">6 months</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p>
                Sigma is built to generate real revenue—just like Web2 platforms—but with one big difference: we don't want to rely on selling tokens to
                survive.
              </p>
              <p>
                Too many Web3 projects dump tokens for revenue. That's a short-term play and a long-term loss—for everyone. Instead, $FAN is designed to grow
                our fanbase and power the world's largest music distribution network.
              </p>
              <p>
                Since we're launching fairly, even the project team has to buy tokens from the market. Our incentives are aligned with the community—we win
                together.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold">Here's how our tokenomics will work:</h4>

              <div className="space-y-6">
                <div>
                  <h5 className="text-md font-semibold flex items-center gap-2">
                    <span>🌱</span> Ecosystem Growth via Airdrops
                  </h5>
                  <p className="mt-2 mb-3">We'll reward fans and artists who actively help grow the platform:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Airdrops based on XP, streams, purchases, and fan memberships</li>
                    <li>Airdrops to artists who launch music and engage fans</li>
                    <li>Airdrops to fans who use Sigma REMiX to create standout remixes</li>
                    <li>Airdrops to collaborators who co-create new music</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-md font-semibold flex items-center gap-2">
                    <span>💧</span> Token Growth via Liquidity
                  </h5>
                  <p className="mt-2">To expand $FAN across more DEXs and eventually CEXs, we'll need to build strong liquidity pools.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "token-burning",
        question: "Will there be $FAN token burning?",
        answer: (
          <div className="space-y-4">
            <p className="mb-4">Yes, $FAN implements a deflationary mechanism through:</p>
            <div className="space-y-3">
              <p>
                Sigma is a revenue-generating platform. Every album sold and every "Inner Circle" fan membership contributes to platform income. This revenue
                covers tech, operations, and infrastructure—but a portion will also go toward buybacks and burning $FAN from the market.
              </p>
              <p className="font-semibold">It's a long-term loop: real revenue → real utility → real value.</p>
            </div>
          </div>
        ),
      },

      {
        id: "token-locks",
        question: "Will there be $FAN token locks for the project supply?",
        answer: (
          <div className="space-y-4">
            <p className="mb-4">
              This is a 100% fair launch — no presale, no VC rounds, and no team allocations upfront. Just a token, a mission, and a community-powered future
              for music.
            </p>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-2">Token Distribution at Launch:</h4>

              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Public Distribution:</h5>
                <p>over 50% of total supply will be available on the open market (Auto.Fun and Raydium).</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Project Distribution:</h5>
                <p className="mb-3">The Sigma project team managed to secure 42% of the total supply during the fair launch on 8 May 2025.</p>

                <div className="pl-4 border-l-2 border-gray-600">
                  <p className="font-semibold mb-2">Of the supply the team buys:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      80% of the supply we secured will be locked with a 3 month cliff followed by a linear vesting schedule on Streamflow for 12 months. The
                      Streamflow lock contract{" "}
                      <a
                        className="text-yellow-300 hover:text-yellow-300 transition-colors"
                        href="https://app.streamflow.finance/contract/solana/mainnet/dL8G6VNhdP1XhUrrvwE8W7JVKbbH6hSuwwSFEQGCgJ7"
                        target="_blank"
                        rel="noopener noreferrer">
                        can be found here
                      </a>
                    </li>
                    <li>10% will be used for public distribution, directly for airdrops to sigmamusic.fm app users!</li>
                    <li>10% will be used for liquidity support for new DEX/CEX listings.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "where-to-buy",
        question: "Where can you buy $FAN tokens?",
        answer: (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Buy for SOL on
                    <a
                      className="text-yellow-300 hover:text-yellow-300 transition-colors ml-2"
                      href="https://raydium.io/swap/?inputMint=D7qqKEr7JFpAd82m9nvJL2psdPmU1oW54g1LHvDUYFAN&outputMint=sol"
                      target="_blank"
                      rel="noopener noreferrer">
                      Raydium
                    </a>
                  </li>
                  <li>
                    Buy for SOL on Auto.Fun
                    <a
                      className="text-yellow-300 hover:text-yellow-300 transition-colors ml-2"
                      href="https://auto.fun/token/D7qqKEr7JFpAd82m9nvJL2psdPmU1oW54g1LHvDUYFAN"
                      target="_blank"
                      rel="noopener noreferrer">
                      Auto.Fun
                    </a>
                  </li>
                  <li>
                    Buy for USDC or swap any token for $FAN on
                    <a
                      className="text-yellow-300 hover:text-yellow-300 transition-colors ml-2"
                      href="https://jup.ag/swap/USDC-D7qqKEr7JFpAd82m9nvJL2psdPmU1oW54g1LHvDUYFAN"
                      target="_blank"
                      rel="noopener noreferrer">
                      Jupiter
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
];

export const FAQ = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Initialize all sections as expanded
    const initialExpanded = faqSections.reduce(
      (acc, section) => {
        acc[section.title] = true;
        return acc;
      },
      {} as { [key: string]: boolean }
    );
    setExpandedSections(initialExpanded);

    // Handle hash-based navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        // Wait for elements to be rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100); // Small delay to ensure elements are rendered
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const scrollToQuestion = (questionId: string) => {
    const element = document.getElementById(questionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Update URL hash without triggering a page reload
      window.history.pushState(null, "", `#${questionId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">{window.location.pathname === routeNames.whitepaper ? "Whitepaper" : "Frequently Asked Questions"}</h1>
        <button
          onClick={() => (window.location.href = `${routeNames.home}`)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors">
          Back to App
        </button>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 bg-gray-800 p-6 rounded-lg">
        <div className="space-y-4">
          {faqSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-yellow-300">{section.title}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {section.questions.map((question) => (
                  <li key={question.id}>
                    <button onClick={() => scrollToQuestion(question.id)} className="text-yellow-300 hover:text-yellow-300 transition-colors text-left">
                      {question.question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Sections */}
      {faqSections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl font-semibold  mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.questions.map((item) => (
              <div key={item.id} id={item.id} className="bg-black text-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3 !text-yellow-300">{item.question}</h3>
                <div className="text-gray-400">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
