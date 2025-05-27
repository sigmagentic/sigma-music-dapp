import { IS_DEVNET } from "appsConfig";

export const APP_NETWORK = import.meta.env.VITE_ENV_NETWORK || "devnet";

export const apiTimeout = 10_000; // 10s

export const SHOW_NFTS_STEP = 20;

export const DEFAULT_BITZ_COLLECTION_SOL = IS_DEVNET ? "AXvaYiSwE7XKdiM4eSWTfagkswmWKVF7KzwW5EpjCDGk" : "JAWEFUJSWErkDj8RefehQXGp1nUhCoWbtZnpeo8Db8KN";

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

export const GENERATE_MUSIC_MEME_PRICE_IN_USD = 0.01; // .01 / 1.0
export const LAUNCH_MUSIC_MEME_PRICE_IN_USD = 0.01; // .01 / 1.0

export const SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS = "6WjQ42oteJmPQTiyHpjc7tufvxyenjQs9FUiJFHb1YDX";

// export const SIGMA_MEME_FEATURE_WHITELIST = "7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj,7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj";
export const SIGMA_MEME_FEATURE_WHITELIST = false;

export const ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS =
  import.meta.env.VITE_ENV_NETWORK === "devnet"
    ? "ar22_a1,ar24_a1,ar25_a1"
    : "ar16_a1, ar15_a1, ar15_a2, ar4_a2, ar14_a2, ar14_a1, ar13_a1, ar12_a1, ar2_a3, ar9_a1, ar8_a1, ar2_a1, ar1_a2, ar7_a1, ar4_a1, ar3_a1, ar1_a1, ar2_a2, ar11_a1, ar14_a3, ar17_a1, ar18_a1, ar8_a2, ar11_a3, ar19_a1, ar14_a4, ar20_a1, ar21_a1, ar11_a2, ar2_a4, ar2_a5, ar2_a6, ar2_a7, ar2_a8, ar22_a1, ar17_a2, ar11_a4, ar12_a2, ar23_a1, ar21_a2, ar21_a3, ar21_a4, ar21_a5, ar21_a6";

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

export const ALL_MUSIC_GENRES = [
  { code: "garage track", label: "Garage Track", tier: GenreTier.TIER2 },
  { code: "rnb", label: "R&B", tier: GenreTier.TIER1 },
  { code: "pop", label: "Pop", tier: GenreTier.TIER1 },
  { code: "afropop", label: "Afropop", tier: GenreTier.TIER2 },
  { code: "dnb", label: "Drum & Bass", tier: GenreTier.TIER2 },
  { code: "trance", label: "Trance", tier: GenreTier.TIER2 },
  { code: "breakbeat", label: "Breakbeat", tier: GenreTier.TIER2 },
  { code: "deep house", label: "Deep House", tier: GenreTier.TIER2 },
  { code: "boombap", label: "Boombap", tier: GenreTier.TIER2 },
  { code: "dark hip hop", label: "Dark Hip Hop", tier: GenreTier.TIER2 },
  { code: "lofi", label: "Lo-Fi", tier: GenreTier.TIER2 },
  { code: "hip hop", label: "Hip Hop", tier: GenreTier.TIER1 },
  { code: "house", label: "House", tier: GenreTier.TIER1 },
  { code: "breakcore", label: "Breakcore", tier: GenreTier.FRINGE },
  { code: "instrumental", label: "Instrumental", tier: GenreTier.TIER2 },
  { code: "rock", label: "Rock", tier: GenreTier.TIER1 },
  { code: "world beat", label: "World Beat", tier: GenreTier.TIER2 },
  { code: "trap", label: "Trap", tier: GenreTier.TIER1 },
  { code: "drill", label: "Drill", tier: GenreTier.TIER2 },
  { code: "indian pop", label: "Indian Pop", tier: GenreTier.TIER2 },
  { code: "dark trap", label: "Dark Trap", tier: GenreTier.TIER2 },
  { code: "rap", label: "Rap", tier: GenreTier.TIER1 },
  { code: "african pop", label: "African Pop", tier: GenreTier.TIER1 },
  { code: "edm", label: "EDM", tier: GenreTier.TIER1 },
  { code: "rock ballad", label: "Rock Ballad", tier: GenreTier.TIER2 },
  { code: "alternative rock", label: "Alternative Rock", tier: GenreTier.TIER2 },
  { code: "ballad", label: "Ballad", tier: GenreTier.TIER2 },
  { code: "folk", label: "Folk", tier: GenreTier.TIER2 },
  { code: "metal", label: "Metal", tier: GenreTier.TIER2 },
  { code: "electro", label: "Electro", tier: GenreTier.TIER2 },
  { code: "cyberpunk", label: "Cyberpunk", tier: GenreTier.FRINGE },
  { code: "gypsy", label: "Gypsy", tier: GenreTier.FRINGE },
  { code: "dance", label: "Dance", tier: GenreTier.TIER1 },
  { code: "pop rock", label: "Pop Rock", tier: GenreTier.TIER2 },
  { code: "jazz", label: "Jazz", tier: GenreTier.TIER2 },
  { code: "ambient", label: "Ambient", tier: GenreTier.TIER2 },
  { code: "dream pop", label: "Dream Pop", tier: GenreTier.TIER2 },
  { code: "electronica", label: "Electronica", tier: GenreTier.TIER2 },
  { code: "soundtrack", label: "Soundtrack", tier: GenreTier.TIER2 },
  { code: "spoken word", label: "Spoken Word", tier: GenreTier.FRINGE },
  { code: "dubstep", label: "Dubstep", tier: GenreTier.TIER2 },
  { code: "jungle", label: "Jungle", tier: GenreTier.TIER2 },
  { code: "alternative", label: "Alternative", tier: GenreTier.TIER1 },
  { code: "vibrant electronic", label: "Vibrant Electronic", tier: GenreTier.TIER2 },
];
