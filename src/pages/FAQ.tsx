import { useEffect, useState } from "react";

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
    title: "App & Project",
    questions: [
      {
        id: "about-sigma-music",
        question: "About Sigma Music",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold mb-4">Sigma Music's vision is ambitious yet simple.</p>

            <div className="space-y-4">
              <p>There are over 9 billion people on Earth. While we may differ in countless ways, one thing unites us all: we're all fans of music.</p>

              <p className="text-lg font-semibold text-yellow-400">
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

              <p className="text-lg font-semibold mt-6">Sigma is the world's first fan-first music platform.</p>
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
                  <li>🌟 Inner Circle Fan Membership NFTs</li>
                  <li>💰 $SIGMA tokens worth at least $9.99 (the price of a fan membership)</li>
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
    ],
  },
  {
    title: "$SIGMA Token",
    questions: [
      {
        id: "sigma-token-utility",
        question: "$SIGMA Token Utility",
        answer: (
          <div className="space-y-6">
            <p className="mb-4">
              The utility of $SIGMA is powerful—yet simple.
              <br />
              Sigma Music is unique in how it shares value. By holding the $SIGMA token, fans become true participants in the music economy.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-2">1. Revenue Sharing for Fans</h4>
                <p className="mb-2">Sigma shares up to 10% of all platform revenue back with die-hard fans through raffles. To enter, you need:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>A "inner circle" fan membership or music NFT (your raffle ticket)</li>
                  <li>At least $9.99 worth of $SIGMA (each multiple gives you more chances)</li>
                </ul>
                <p className="mt-2">This creates a model where fans are incentivized to support artists—and win alongside them.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-yellow-400">
                  ⚠️ Note: The revenue share model is still being finalized. We intend to launch with the above structure and iterate based on community
                  feedback and platform performance.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">2. Token-Gated Features & Access</h4>
                <p className="mb-2">Holding $SIGMA unlocks powerful perks and gated features:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Generation of longer tracks in Sigma REMiX, our AI-powered remixing tool</li>
                  <li>Exclusive discounts on platform-wide music subscriptions</li>
                  <li>Buy IP rights to music for remixing, social sharing, and influencer licensing</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">3. Governance & Community-Led Growth</h4>
                <p>
                  Our aim is to evolve $SIGMA into a governance token as well. Token holders can vote on reward distribution rules, platform direction, and
                  incentive structures—ensuring that artists, fans, and creators grow together in a fair, community-owned ecosystem.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "sigma-tokenomics",
        question: "$SIGMA Token – Tokenomics",
        answer: (
          <div className="space-y-6">
            <p className="text-lg font-semibold">Total Supply: 1,000,000,000 $SIGMA</p>

            <div className="space-y-4">
              <p>
                Sigma is built to generate real revenue—just like Web2 platforms—but with one big difference: we don't want to rely on selling tokens to
                survive.
              </p>
              <p>
                Too many Web3 projects dump tokens for revenue. That's a short-term play and a long-term loss—for everyone. Instead, $SIGMA is designed to grow
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
                  <p className="mt-2">To expand $SIGMA across more DEXs and eventually CEXs, we'll need to build strong liquidity pools.</p>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg mt-6">
                <p className="text-gray-300">Once our token sale wraps up and we have a better picture of allocations, we'll share full tokenomics details.</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "token-burning",
        question: "Will there be $SIGMA token burning?",
        answer: (
          <div className="space-y-4">
            <p className="mb-4">Yes, $SIGMA implements a deflationary mechanism through:</p>
            <div className="space-y-3">
              <p>
                Sigma is a revenue-generating platform. Every album sold and every "inner circle" fan membership contributes to platform income. This revenue
                covers tech, operations, and infrastructure—but a portion will also go toward buybacks and burning $SIGMA from the market.
              </p>
              <p className="font-semibold">It's a long-term loop: real revenue → real utility → real value.</p>
            </div>
          </div>
        ),
      },
      {
        id: "token-locks",
        question: "Will there be $SIGMA token locks for the project supply?",
        answer: (
          <div className="space-y-4">
            <p className="mb-4">
              This is a 100% fair launch — no presale, no VC rounds, and no team allocations upfront. Just a token, a mission, and a community-powered future
              for music.
            </p>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-2">Token Distribution at Launch:</h4>

              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Market Distribution:</h5>
                <p>50% of total supply will be available on the open market (Auto.Fun and Raydium).</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Team Allocation:</h5>
                <p className="mb-3">The Sigma team will buy 50% of the total supply directly from the market to support platform growth.</p>

                <div className="pl-4 border-l-2 border-gray-600">
                  <p className="font-semibold mb-2">Of the supply the team buys:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      80% will be locked with a 3 month cliff and 18-month linear vesting schedule on Streamflow (we’ll share the vesting links at launch).
                    </li>
                    <li>10% will be used for public distribution, directly for airdrops to sigmamusic.fm app users</li>
                    <li>10% will be used for liquidity support for new DEX/CEX listings.</li>
                  </ul>
                </div>
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
      <h1 className="text-3xl font-bold mb-8 text-white">Frequently Asked Questions</h1>

      {/* Table of Contents */}
      <div className="mb-12 bg-gray-800 p-6 rounded-lg">
        <div className="space-y-4">
          {faqSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-yellow-400">{section.title}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {section.questions.map((question) => (
                  <li key={question.id}>
                    <button onClick={() => scrollToQuestion(question.id)} className="text-yellow-400 hover:text-yellow-300 transition-colors text-left">
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
                <h3 className="text-lg font-semibold mb-3 !text-yellow-400">{item.question}</h3>
                <div className="text-gray-400">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
