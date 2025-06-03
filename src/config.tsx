import { IS_DEVNET } from "appsConfig";
import { AlbumSaleTypeOption } from "libs/types";

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

export const isUIDebugMode = () => {
  const _isUIDebugMode = sessionStorage.getItem("sig-adm-ui-debug");
  return _isUIDebugMode === "true";
};

// 15 vibrant colors for rotating backgrounds
export const RANDOM_COLORS = [
  "#FF6B6B", // Red
  "#FFD93D", // Yellow
  "#6BCB77", // Green
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
  "#EA5455", // Coral
  "#00C9A7", // Aqua
];

export const ALL_MUSIC_GENRES = [
  { code: "garage track", label: "Garage Track", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "rnb", label: "R&B", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/Beats_By_Scooby_TAOTS_Album_Cover.png" },
  { code: "pop", label: "Pop", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/HachiMugenInfinitySeries.jpg" },
  { code: "afropop", label: "Afropop", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "dnb", label: "Drum & Bass", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
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
  { code: "hip hop", label: "Hip Hop", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Streetz_Cover.jpg" },
  { code: "house", label: "House", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/YFGP_Corners_Cover.jpg" },
  { code: "breakcore", label: "Breakcore", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "instrumental", label: "Instrumental", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  {
    code: "rock",
    label: "Rock",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/deep-forest.jpg?tpos=bottom",
  },
  { code: "world beat", label: "World Beat", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "trap", label: "Trap", tier: GenreTier.TIER1, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "drill", label: "Drill", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "indian pop", label: "Indian Pop", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/Uncomplex.jpg?tpos=bottom" },
  { code: "dark trap", label: "Dark Trap", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  {
    code: "rap",
    label: "Rap",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/bogden-cobra.png?tpos=center&ppos=right",
  },
  {
    code: "african pop",
    label: "African Pop",
    tier: GenreTier.TIER1,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/MASTERLOOPZ_TMF_Cover_Art.jpg",
  },
  { code: "edm", label: "EDM", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/PixelJedi_Absolute.jpg" },
  { code: "rock ballad", label: "Rock Ballad", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "alternative rock", label: "Alternative Rock", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "ballad", label: "Ballad", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "folk", label: "Folk", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "metal", label: "Metal", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "electro", label: "Electro", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "cyberpunk", label: "Cyberpunk", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "gypsy", label: "Gypsy", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "dance", label: "Dance", tier: GenreTier.TIER1, tileImgBg: "https://api.itheumcloud.com/app_nftunes/assets/img/TheArtOfSelfDestruction.jpg" },
  {
    code: "pop rock",
    label: "Pop Rock",
    tier: GenreTier.TIER2,
    tileImgBg: "https://api.itheumcloud.com/app_nftunes/images/artist_profile/deep-forest.jpg?tpos=bottom",
  },
  { code: "jazz", label: "Jazz", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "ambient", label: "Ambient", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "dream pop", label: "Dream Pop", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "electronica", label: "Electronica", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "soundtrack", label: "Soundtrack", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
  { code: "spoken word", label: "Spoken Word", tier: GenreTier.FRINGE, tileImgBg: "https://i.imgur.com/4AiXzf8.png" },
  { code: "dubstep", label: "Dubstep", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/5M0pF6u.png" },
  { code: "jungle", label: "Jungle", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/1bX5QH6.png" },
  { code: "alternative", label: "Alternative", tier: GenreTier.TIER1, tileImgBg: "https://i.imgur.com/2nCt3Sbl.png" },
  { code: "vibrant electronic", label: "Vibrant Electronic", tier: GenreTier.TIER2, tileImgBg: "https://i.imgur.com/3GvwNBf.png" },
];

export const LICENSE_TERMS_MAP = {
  [AlbumSaleTypeOption.priceOption1]: {
    shortDescription: "CC BY-NC-ND 4.0: Attribution, Non Commercial, No Derivatives",
    urlToLicense: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  [AlbumSaleTypeOption.priceOption2]: {
    shortDescription: "CC BY-NC-ND 4.0: Attribution, Non Commercial, No Derivatives",
    urlToLicense: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  [AlbumSaleTypeOption.priceOption3]: {
    shortDescription: "CC BY 4.0: Attribution Only. Commercial Use + Derivatives + Redistribution Allowed",
    urlToLicense: "https://creativecommons.org/licenses/by/4.0/",
  },
};
