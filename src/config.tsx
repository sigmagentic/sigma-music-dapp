import { IS_DEVNET } from "appsConfig";
import { AlbumSaleTypeOption } from "libs/types";

export const APP_NETWORK = import.meta.env.VITE_ENV_NETWORK || "devnet";

export const apiTimeout = 10_000; // 10s

export const DEFAULT_BITZ_COLLECTION_SOL = IS_DEVNET ? "AXvaYiSwE7XKdiM4eSWTfagkswmWKVF7KzwW5EpjCDGk" : "JAWEFUJSWErkDj8RefehQXGp1nUhCoWbtZnpeo8Db8KN";

export const FREE_LICENSED_ALBUM_ID = IS_DEVNET ? "ar142_a1" : "ar137_a1";

export const FREE_LICENSED_ALBUM_DATA = IS_DEVNET
  ? {
      albumId: FREE_LICENSED_ALBUM_ID,
      albumImage: "https://api.itheumcloud-stg.com/app_sigmamusic/HYzBq-TYmRa/img/dj-sigma-mix-tape-1-1756778980811.png",
      albumName: "Sigma Mix Tape Vol. 1",
      createdOnTS: 1756779201513,
      ipTokenId: "",
      mintTemplate: "",
      storyProtocolLicenseMintingSQSMessageId: "",
      storyProtocolLicenseMintingTxHash: "",
      storyProtocolLicenseTokenId: "",
      updatedOnTS: 1756779215006,
    }
  : {
      albumId: FREE_LICENSED_ALBUM_ID,
      albumImage: "https://api.itheumcloud.com/app_sigmamusic/HH3F8-SborL/img/ai-remix-vol-1-1758332627595.png",
      albumName: "Sigma IP Safe Mix Tape Vol. 1",
      createdOnTS: 1758414018590,
      ipTokenId: "",
      mintTemplate: "",
      storyProtocolLicenseMintingSQSMessageId: "",
      storyProtocolLicenseMintingTxHash: "",
      storyProtocolLicenseTokenId: "",
      updatedOnTS: 1758414018590,
    };

export const MARSHAL_CACHE_DURATION_SECONDS = import.meta.env.VITE_ENV_MARSHAL_CACHE_DURATION_SECONDS
  ? parseInt(import.meta.env.VITE_ENV_MARSHAL_CACHE_DURATION_SECONDS, 10)
  : 300; // 5 minutes

export const SOLANA_NETWORK_RPC = import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC;

export enum SOL_ENV_ENUM {
  devnet = "SD",
  mainnet = "S1",
}

export enum MVX_ENV_ENUM {
  devnet = "ED",
  mainnet = "E1",
}

export const DISABLE_BITZ_FEATURES = import.meta.env.VITE_ENV_DISABLE_BITZ_FEATURES || false;
export const DISABLE_REMIX_LAUNCH_BUTTON = import.meta.env.VITE_ENV_DISABLE_REMIX_LAUNCH || false;
export const DISABLE_COMMERCIAL_LICENSE_BUY_OPTION = import.meta.env.VITE_ENV_DISABLE_COMMERCIAL_LICENSE_BUY_OPTION || "1";
export const DISABLE_AI_REMIX_FEATURES = import.meta.env.VITE_ENV_DISABLE_AI_REMIX_FEATURES || "1";
export const DISABLE_AI_REMIX_LIVE_MODEL_USAGE = import.meta.env.VITE_ENV_DISABLE_AI_REMIX_LIVE_MODEL_USAGE || "1";

export const GENERATE_MUSIC_MEME_PRICE_IN_USD = 0.04; // how much for a single version

export const SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS = "6WjQ42oteJmPQTiyHpjc7tufvxyenjQs9FUiJFHb1YDX";

// export const SIGMA_MEME_FEATURE_WHITELIST = "7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj,7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj";
export const SIGMA_MEME_FEATURE_WHITELIST = false;

export const ENABLE_CC_PAYMENTS = import.meta.env.VITE_ENV_ENABLE_CC_PAYMENTS || "0";

export const ENABLE_SOL_PAYMENTS = import.meta.env.VITE_ENV_ENABLE_SOL_PAYMENTS || "0";

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_ENV_STRIPE_PUBLISHABLE_KEY || "";

export const ENABLE_WSB_CAMPAIGN = import.meta.env.VITE_ENV_ENABLE_WSB_CAMPAIGN || "0";

export const ENABLE_APP_OFFLINE = import.meta.env.VITE_ENV_ENABLE_APP_OFFLINE || "0";

export const LOG_STREAM_EVENT_METRIC_EVERY_SECONDS = 30;

export const MINTER_WALLET = APP_NETWORK === "devnet" ? "5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY" : "33iDRaAJCFY8GVTCFhnhfHMvtMqfMbTxcCgEkr6eRQnT";

export enum GenreTier {
  TIER1 = "tier1",
  TIER2 = "tier2",
  FRINGE = "fringe",
}

export const isUIDebugMode = () => {
  const _isUIDebugMode = sessionStorage.getItem("sig-adm-ui-debug");
  return _isUIDebugMode === "true";
};

// 15 vibrant colors for rotating backgrounds
export const RANDOM_COLORS = [
  "#FF6B6B", // Red
  "#00C9A7", // Aqua
  "#4D96FF", // Blue
  "#FF6F91", // Pink
  "#845EC2", // Purple
  "#FFC75F", // Orange
  "#0081CF", // Deep Blue
  "#f9b571", // Yellow Shade
  "#F96D00", // Deep Orange
  "#43AA8B", // Teal
  "#B983FF", // Lavender
  "#F7B801", // Gold
  "#6BCB77", // Green
  "#EA5455", // Coral
  "#FFD93D", // Yellow
];

export const ALL_MUSIC_GENRES = [
  {
    code: "ai music",
    label: "AIM (AI Music)",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/OllyGMonaLisaRapSymphony.jpg",
  },
  {
    code: "simremix",
    label: "SigmaAI Remixes",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud-stg.com/app_sigmamusic/HYzBq-TYmRa/img/dj-sigma-square-1756778226645.jpg",
  },
  {
    code: "electronic",
    label: "Electronic",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/PixelJedi_Absolute.jpg",
    isAiRemixOption: true,
  },
  {
    code: "dnb",
    label: "Drum & Bass",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/PhysixDudeAnglesOfIdentity.jpg",
  },
  {
    code: "hip hop",
    label: "Hip Hop",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Streetz_Cover.jpg",
    isAiRemixOption: true,
  },
  {
    code: "rock",
    label: "Rock",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/deep-forest.jpg?tpos=bottom",
    isAiRemixOption: true,
  },
  {
    code: "rnb",
    label: "R&B",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/Beats_By_Scooby_TAOTS_Album_Cover.png",
  },
  { code: "jazz", label: "Jazz", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/HachiMugenInfinitySeries.jpg" },
  {
    code: "folk",
    label: "Folk",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/Waveborn_Luminex_Lost_And_Wondering.jpeg",
  },
  {
    code: "pop",
    label: "Pop",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/WavebornLuminexGalacticGravity.jpg",
    isAiRemixOption: true,
  },

  { code: "house", label: "House", tier: GenreTier.TIER2, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Corners_Cover.jpg" },
  { code: "trap", label: "Trap", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "indian pop", label: "Indian Pop", tier: GenreTier.TIER2, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/Uncomplex.jpg?tpos=bottom" },
  {
    code: "rap",
    label: "Rap",
    tier: GenreTier.TIER2,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/bogden-cobra.png?tpos=center&ppos=right",
  },
  {
    code: "african pop",
    label: "African Pop",
    tier: GenreTier.TIER2,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/MASTERLOOPZ_TMF_Cover_Art.jpg",
  },

  { code: "dance", label: "Dance", tier: GenreTier.TIER2, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/TheArtOfSelfDestruction.jpg" },
  { code: "alternative", label: "Alternative", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },

  { code: "country", label: "Country", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "classical", label: "Classical", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "edm", label: "EDM", tier: GenreTier.TIER2, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/PixelJedi_Absolute.jpg" },
  { code: "garage track", label: "Garage Track", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "afropop", label: "Afropop", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },

  { code: "trance", label: "Trance", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "breakbeat", label: "Breakbeat", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "deep house", label: "Deep House", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "boombap", label: "Boombap", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  {
    code: "dark hip hop",
    label: "Dark Hip Hop",
    tier: GenreTier.TIER2,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Streetz_Cover.jpg",
  },
  { code: "lofi", label: "Lo-Fi", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "instrumental", label: "Instrumental", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "world beat", label: "World Beat", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "drill", label: "Drill", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "dark trap", label: "Dark Trap", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "rock ballad", label: "Rock Ballad", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "alternative rock", label: "Alternative Rock", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "ballad", label: "Ballad", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },

  { code: "metal", label: "Metal", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "electro", label: "Electro", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },

  { code: "ambient", label: "Ambient", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "dream pop", label: "Dream Pop", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "electronica", label: "Electronica", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "soundtrack", label: "Soundtrack", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "dubstep", label: "Dubstep", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "jungle", label: "Jungle", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "vibrant electronic", label: "Vibrant Electronic", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  {
    code: "pop rock",
    label: "Pop Rock",
    tier: GenreTier.TIER2,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/deep-forest.jpg?tpos=bottom",
  },
  { code: "breakcore", label: "Breakcore", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "cyberpunk", label: "Cyberpunk", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "gypsy", label: "Gypsy", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "spoken word", label: "Spoken Word", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
];

export const ALL_MUSIC_MOODS_FOR_REMIX = [
  {
    code: "original",
    label: "Match Reference Track",
  },
  {
    code: "energetic",
    label: "Energetic",
  },
  {
    code: "happy",
    label: "Happy",
  },
  {
    code: "quirky",
    label: "Quirky",
  },
  {
    code: "sentimental",
    label: "Sentimental",
  },
];

export const MUSIC_GEN_PROMPT_LIBRARY: any = {
  "energetic": {
    "rock": [
      "High-energy rock instrumental with driving electric guitars, powerful riffs, punchy drums, and a grooving bassline. Bright, fast-paced, and energetic mood, building intensity into a soaring guitar lead that explodes into a powerful chorus.",
      "Fast, energetic rock with gritty electric guitar riffs, hard-hitting drums, and a strong bass groove. Builds momentum into an explosive and powerful chorus with a bold lead guitar line.",
      "Up-tempo rock track with distorted guitar chords, dynamic drumming, and a pulsing bassline. High-energy progression that surges into an electrifying guitar solo and driving finale.",
    ],
    "pop": [
      "Upbeat pop instrumental with bright synths, catchy guitar chords, and a steady danceable beat. Energetic and uplifting, with melodies that build into an anthemic chorus.",
      "Fast-paced pop groove with punchy drums, shimmering synths, and infectious hooks. High-energy vibe designed to get people moving with a feel-good chorus drop.",
      "Driving pop anthem with layered vocals, pulsing bass, and vibrant melodies. Energetic build-up that bursts into a powerful, catchy chorus.",
    ],
    "hip hop": [
      "Energetic hip hop beat with punchy 808s, crisp hi-hats, and a driving bassline. Fast flow rhythm with hype melodies that build into a head-nodding drop.",
      "High-energy trap-inspired beat with booming kicks, sharp snares, and layered synth leads. Energetic and powerful vibe built for fast rap flows.",
      "Fast hip hop instrumental with hard-hitting drums, bouncy rhythm, and aggressive bass. Energetic and bold, driving into a climactic hook section.",
    ],
    "electronic": [
      "High-energy EDM track with pulsing synths, heavy bass, and a driving four-on-the-floor beat. Bright melodies build into an explosive drop.",
      "Fast-paced electronic instrumental with arpeggiated synths, punchy kick drum, and euphoric build-ups that explode into a powerful drop.",
      "Energetic dance track with layered synths, pulsing bass, and intense rhythmic drive. Builds into a festival-style drop with soaring leads.",
    ],
  },
  "happy": {
    "rock": [
      "Feel-good rock with jangly guitars, upbeat drumming, and a cheerful rhythm. Bright melodies and a joyful chorus full of positive energy.",
      "Happy rock instrumental with sunny guitar riffs, grooving bass, and lighthearted drum beats. Playful and uplifting mood throughout.",
      "Upbeat rock jam with catchy guitar hooks, energetic drums, and a warm, optimistic tone. Ends on a bright and cheerful chord.",
    ],
    "pop": [
      "Cheerful pop instrumental with bouncy synths, catchy guitar strums, and a playful beat. Bright and uplifting with a carefree vibe.",
      "Happy pop groove with light synth melodies, clapping rhythms, and feel-good energy. Playful and fun with an anthemic chorus.",
      "Upbeat pop tune with sparkling melodies, steady drums, and a joyful atmosphere. Built around catchy hooks and a positive mood.",
    ],
    "hip hop": [
      "Happy hip hop beat with bouncy drums, playful melodies, and a groovy bassline. Lighthearted and fun with a cheerful energy.",
      "Upbeat hip hop instrumental with funky rhythms, jazzy chords, and positive vibes. Playful groove with a smile-inducing beat.",
      "Feel-good hip hop track with laid-back drums, melodic synths, and a fun, cheerful bounce. Positive and uplifting mood.",
    ],
    "electronic": [
      "Happy electronic instrumental with bright synth arpeggios, bouncy bass, and playful rhythms. Cheerful build that bursts with joy.",
      "Upbeat EDM track with sunny melodies, fun rhythms, and sparkling synths. Happy and carefree mood with a playful drop.",
      "Lighthearted electronic track with bouncy beats, shimmering synths, and a joyful groove. Positive and energetic throughout.",
    ],
  },
  "quirky": {
    "rock": [
      "Playful rock instrumental with odd rhythms, twangy guitars, and cheeky drum fills. Quirky, fun, and unpredictable energy.",
      "Quirky rock jam with unusual chord changes, bouncy riffs, and lighthearted drumming. Playful and offbeat vibe.",
      "Funky, quirky rock with syncopated guitar riffs, eccentric rhythms, and a fun, mischievous mood.",
    ],
    "pop": [
      "Quirky pop instrumental with playful synths, bouncy rhythms, and fun sound effects. Lighthearted and whimsical tone.",
      "Eccentric pop track with cheerful melodies, clapping beats, and offbeat hooks. Fun, quirky, and unpredictable.",
      "Playful pop tune with cartoon-like melodies, quirky rhythms, and a happy-go-lucky groove.",
    ],
    "hip hop": [
      "Quirky hip hop beat with offbeat rhythms, playful melodies, and a bouncy groove. Fun and lighthearted energy.",
      "Playful hip hop instrumental with funky bass, cartoonish synths, and cheeky drum patterns. Quirky and upbeat.",
      "Eccentric hip hop groove with unusual percussion, bouncy melodies, and a fun, unpredictable vibe.",
    ],
    "electronic": [
      "Quirky electronic instrumental with playful synth patterns, bouncing basslines, and whimsical sound effects. Fun and eccentric.",
      "Playful EDM track with quirky rhythms, unusual melodies, and a mischievous vibe. Energetic and fun.",
      "Whimsical electronic tune with cartoon-like synths, quirky beats, and a lighthearted groove.",
    ],
  },
  "sentimental": {
    "rock": [
      "Emotional rock ballad with clean guitar arpeggios, steady drums, and heartfelt melodies. Builds into a moving and sentimental chorus.",
      "Sentimental rock instrumental with soaring guitar leads, gentle rhythms, and a nostalgic tone. Melancholic yet uplifting.",
      "Heartfelt rock tune with expressive guitar melodies, soft drumming, and an emotional build into a powerful climax.",
    ],
    "pop": [
      "Sentimental pop ballad with gentle piano chords, warm synths, and emotional melodies. Nostalgic and heartfelt mood.",
      "Emotional pop instrumental with soft beats, touching melodies, and a reflective atmosphere. Sentimental and moving.",
      "Heartfelt pop track with lush harmonies, steady rhythm, and warm emotional tone. Builds into a powerful, sentimental chorus.",
    ],
    "hip hop": [
      "Sentimental hip hop beat with mellow piano chords, smooth drums, and an emotional atmosphere. Reflective and heartfelt mood.",
      "Emotional hip hop instrumental with soulful melodies, laid-back rhythm, and nostalgic energy. Sentimental and introspective.",
      "Heartfelt hip hop track with soft beats, gentle melodies, and a reflective, emotional tone. Evokes deep feeling.",
    ],
    "electronic": [
      "Sentimental electronic instrumental with lush pads, emotional synth leads, and a reflective atmosphere. Deep and heartfelt mood.",
      "Emotional electronic track with mellow beats, dreamy melodies, and nostalgic harmonies. Sentimental and moving.",
      "Heartfelt electronic instrumental with warm synth layers, soft rhythms, and a tender emotional tone. Builds with sentimentality.",
    ],
  },
};

export const MUSIC_GEN_PROMPT_FALLBACK_LIBRARY: any = {
  "genreOnly": {
    "rock": [
      "Rock instrumental with driving electric guitars, steady drums, and a bold groove.",
      "Energetic rock track with distorted riffs, strong bass, and dynamic drumming.",
      "Powerful rock jam with catchy guitar melodies, rhythmic drive, and intensity.",
    ],
    "pop": [
      "Pop instrumental with catchy melodies, bright synths, and a danceable beat.",
      "Upbeat pop track with shimmering chords, groovy bass, and a fun rhythm.",
      "Catchy pop tune with playful melodies, layered synths, and a vibrant hook.",
    ],
    "hip hop": [
      "Hip hop beat with booming 808s, crisp snares, and a smooth groove.",
      "Punchy hip hop track with rhythmic drums, deep bass, and flowing melodies.",
      "Laid-back hip hop instrumental with jazzy chords, tight beats, and bounce.",
    ],
    "electronic": [
      "Electronic track with pulsing synths, steady beats, and layered textures.",
      "Uplifting electronic instrumental with arpeggiated melodies and a strong drop.",
      "Dance-inspired electronic tune with rhythmic bass and euphoric leads.",
    ],
  },
  "moodOnly": {
    "energetic": [
      "High-energy instrumental with driving rhythms, bold melodies, and an uplifting build.",
      "Fast-paced track with powerful beats, intense melodies, and a lively mood.",
      "Energetic tune with pulsing basslines, dynamic rhythms, and a soaring climax.",
    ],
    "happy": [
      "Upbeat instrumental with cheerful melodies, playful rhythms, and a bright tone.",
      "Joyful track with bouncy beats, sunny harmonies, and a carefree mood.",
      "Feel-good tune with catchy hooks, lively energy, and a positive atmosphere.",
    ],
    "quirky": [
      "Playful instrumental with unusual rhythms, quirky melodies, and a fun, eccentric vibe.",
      "Whimsical track with bouncy beats, offbeat melodies, and a cheeky mood.",
      "Lighthearted tune with quirky hooks, cartoonish sounds, and a fun groove.",
    ],
    "sentimental": [
      "Emotional instrumental with soft melodies, reflective harmonies, and heartfelt mood.",
      "Sentimental track with gentle chords, nostalgic tones, and expressive build.",
      "Moving tune with warm instrumentation, reflective atmosphere, and deep emotion.",
    ],
  },
};

export const LICENSE_BLURBS: any = {
  "CC BY-NC 4.0": {
    blurb: "Attribution Needed, Non Commercial Use, Derivatives and Distribution allowed",
    oneLinerBlurb: "Personal, Non-Commercial Use Only",
    link: "https://creativecommons.org/licenses/by-nc/4.0/",
  },
  "CC BY-NC-ND 4.0": {
    blurb: "Attribution Needed, Non Commercial Use, Derivatives allowed but Distribution not allowed",
    oneLinerBlurb: "Personal, Non-Commercial Use Only",
    link: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  "CC BY 4.0": {
    blurb: "Attribution Only. Commercial Use, Derivatives and Distribution allowed",
    oneLinerBlurb: "Commercial Use allowed. Only Attribution Needed",
    link: "https://creativecommons.org/licenses/by/4.0/",
  },
};

export const LICENSE_TERMS_MAP = {
  [AlbumSaleTypeOption.priceOption1]: {
    shortDescription: LICENSE_BLURBS["CC BY-NC-ND 4.0"].blurb,
    urlToLicense: LICENSE_BLURBS["CC BY-NC-ND 4.0"].link,
  },
  [AlbumSaleTypeOption.priceOption2]: {
    shortDescription: LICENSE_BLURBS["CC BY-NC-ND 4.0"].blurb,
    urlToLicense: LICENSE_BLURBS["CC BY-NC-ND 4.0"].link,
  },
  [AlbumSaleTypeOption.priceOption3]: {
    shortDescription: `${LICENSE_BLURBS["CC BY 4.0"].blurb}. Comes with Story Protocol license`,
    urlToLicense: LICENSE_BLURBS["CC BY 4.0"].link,
  },
  [AlbumSaleTypeOption.priceOption4]: {
    shortDescription: `${LICENSE_BLURBS["CC BY 4.0"].blurb}. Comes with Story Protocol license`,
    urlToLicense: "https://creativecommons.org/licenses/by/4.0/",
  },
};

export const ONE_USD_IN_XP = 1000; // conversion rate from USD to XP
