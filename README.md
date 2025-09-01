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

---

## Primary User Stories

### FAN Stories

1/
As a FAN
I want to buy a Music Album Collectible with my Credit Card / SOL / XP
To support my favorite artist and also stream/download the full album with bonus tracks

- Digital Album Only - (SOL / XP pass)
- Album + Commercial License - [used Cereals SOL -- PASS] [used TKO for XP -- PASS]
- NFT + Digital Album

- Ultimate Package

2/
As a FAN
I want to buy a Inner Circle Fan NFT with my Credit Card / SOL / XP
To support my favorite artist

3/
As a FAN
I want to stream free music albums
To enjoy music

## Primary User Stories

### REMIX ARTIST Stories

1/
As a REMIX ARTIST
I want to buy a Commercial Music Licence with my Credit Card / SOL / XP
So I can use the AI Remix section to remix my own tracks using the licnesed tracks as reference

2/
As a REMIX ARTIST
I want to have the public vote with XP for my AI Remix tool remixed tracks
So If my track becomes the higest rated track every week, it gets added to a official "Sigma mix tape" album and I get $5 and earn a share (% HOW MUCH?) of any public sales

[5$ bounty per week for BEST remix track. 5$ is also given to the COMPOSING ARTIST who's track was used]

3/ \*\*\*\*
As a REMIX ARTIST
I want to buy a Commercial Music Licence with my Credit Card / SOL / XP
So I can down my favorite track, take to Suno, remix it and bring it back to Sigma Music and publish it as regular track in my own album.

[REMIX ARTISTs make 80% of everything that's sold on the platform that's linked to their work BUT ONLY IF they own a license for the work]

### COMPOSING ARTIST

1/
As a COMPOSING ARTIST
I want to use sigma music to list my music tracks in album format
So I ca list it for Free or sell it as a digital album, as a collectible or with a Story Protocol AI Remix licnese so others can but it and their own deravative works

1/
As a COMPOSING ARTIST
I want to lauch my own fan club
So my inner circle fans get access to some perks IRL or virtual

[COMPOSING ARTISTs make 80% of everything that's sold on the platform that's linked to their work]
[COMPOSING ARTISTs make 10% of every derative work sold that a REMIX ARTIST's SOLD that used a license]
[COMPOSING ARTISTs get 5$ a week if their tracks are used to make the weekly award for best AI REMIX]
