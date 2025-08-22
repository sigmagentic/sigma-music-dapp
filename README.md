# Sigma Music

**Sigma Music** (https://sigmamusic.fm) is a next-gen music platform built on the intersection of music, fan engagement and AI. Built with web3 and AI technology under the hood but designed for a mainstream web2 experience, Sigma combines the best of platforms like Bandcamp and SoundCloud with powerful new monetization tools — including tokenized music assets, AI remix licensing, and IP finance.

We believe in building in the open. This repo is part of our effort to make the future of music infrastructure community-owned and developer-friendly.

---

## 🚀 App Features

- 🔮 Exclusive music! (original music only available to stream or buy via Sigma Music)
- 🎧 Fast, modern streaming experience
- 📩 Web2 login via email (no wallet required to start)
- 💳 Purchase albums, EPs, or singles with SOL or credit card
- 🎟️ NFT-powered collectibles tied to music purchases
- 👑 Fan memberships & gated fan clubs for experiences, early ticket access
- 💸 XP-based revenue share system for top fans
- 🕹️ Music-driven mini-games
- 🤖 One-click AI music remixing & instant monetization
- 🎼 Artist-first control over IP rights & licensing

---

## 🔧 How It Works

Sigma Music consists of a performant frontend + several backend services that abstract away blockchain complexity to deliver a smooth user experience.

We integrate:

- **Solana** for compressed NFT music assets
- **SUI (Walrus)** and **IPFS/Filecoin** for storage
- **Story Protocol** for commercial IP protection & remix licensing
- **ElizaOS AI agents** for remix generation and music enhancement

When artists or AI agents create music, our backend:

1. Publishes the IP to **Story Protocol** on mainnet
2. Mints a **Solana compressed NFT** representing the music
3. Links the NFT to the IP asset on Story via metadata
4. Issues story wallets to artists and fans (behind the scenes)
5. Enables licensing, royalty distribution, and remix collaboration

Example: Try it with [TKO's music](https://sigmamusic.fm/?artist=tko)

---

## 🧠 IP Licensing via Story Protocol

Sigma Music uses a **custom Story Protocol collection** to manage IP rights:  
🔗 [StoryScan Collection](https://www.storyscan.io/token/0xc192CA30dC953Be84eBbB3d37d51D84c326E3E7d)

- Each **artist** is issued a Story Mainnet wallet to own and monetize their music IP
- Each **user** who purchases or remixes music receives a Story wallet (auto-assigned)
- Wallets are non-custodial and claimable, but login is frictionless (email-based by default)

We currently use:

- **Story SDKs and API**
- **Crossmint StoryKit SDK + APIs** for IP asset registration, metadata, and licensing
- **Alchemy** for redundancy on APIs and RPCs

Currently working on integrating:

- **Yakoa's API** for content authentication of our original exclusive music

---

## 🔮 What's Next with Story Protocol integration

We're building the future of IP-powered music infrastructure. Coming soon:

- Port all music with commercial rights to Story Protocol IP assets
- Add in-app features for:
  - 💰 License payments
  - 🎁 Artist tipping
  - ⚖️ Dispute handling
  - 🔄 IP trading
  - 📈 IPFi (DeFi for Music IP): pools, staking, yield for music assets

Stay tuned — Sigma is just getting started.

---

## 🤝 Contributing & Bug Bounties

We welcome open-source contributions! Whether you're a dev, designer, musician, or fan — your ideas and input are valuable.

### Ways to contribute:

- Help improve the frontend or backend code
- Suggest features or UI/UX improvements
- Translate Sigma to other languages
- Build integrations with other music or AI tools

### Found a bug?

Submit an issue or a pull request! We actively monitor reports and fix them quickly.

🪙 **Earn $FAN tokens** — our official ecosystem token — for valid code contributions and bug discoveries. Contributors will be featured on our community leaderboard and early supporter registry.

Start by reaching out to us on [Telegram](https://t.me/SigmaXMusicOfficial).

---

Built with ❤️ for fans and artists.

{
"artistId": "ar140",
"altMainPortfolioLink": "https://soundcloud.com/a-capellas-fussion-record",
"bio": "I foo and bar!",
"bountyId": "mus_ar140",
"createdOn": 1755761947543,
"creatorPaymentsWallet": "3CYHT9NT8xGrp8DdrVNweYGgva896L3nDZLauSCHRojo",
"creatorWallet": "3CYHT9NT8xGrp8DdrVNweYGgva896L3nDZLauSCHRojo",
"group": "mus",
"idNum": 140,
"img": "https://static.wikia.nocookie.net/finalfantasy/images/a/a1/Foobar-ffxii.png/revision/latest?cb=20130712061639",
"instaLink": "https://instagram.com/itheumofficial",
"name": "Foo Bar",
"slug": "foo-bar",
"tikTokLink": "https://www.tiktok.com/@immifaith",
"updatedOn": 1755761947543,
"webLink": "https://en.wikipedia.org/wiki/Foo_Fighters",
"xLink": "https://x.com/itheum",
"ytLink": "https://www.youtube.com/@LangChain"
}
