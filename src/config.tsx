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

export const BUY_AND_MINT_ALBUM_PRICE_IN_USD = 0.5; // 0.5

export const SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS = "6WjQ42oteJmPQTiyHpjc7tufvxyenjQs9FUiJFHb1YDX";

export const SIGMA_MEME_FEATURE_WHITELIST = "7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj,7i9D7tKmrc1vnxYXCv3C6Mf8EaxK6VL2vi2ZEK1jBpLj";

export const ENABLE_FREE_ALBUM_PLAY_ON_ALBUMS =
  import.meta.env.VITE_ENV_NETWORK === "devnet"
    ? "ar22_a1,ar24_a1,ar25_a1"
    : "ar16_a1-1, ar16_a1-2,ar16_a1-3,ar16_a1-4,ar15_a1-1,ar15_a1-2,ar15_a1-3,ar15_a1-4,ar15_a1-5,ar15_a1-6,ar15_a2-1,ar15_a2-2,ar15_a2-3,ar15_a2-4,ar15_a2-5,ar4_a2-1,ar4_a2-2,ar13_a1-1,ar13_a1-2,ar13_a1-3,ar12_a1-1,ar12_a1-2,ar12_a1-3,ar12_a1-4,ar12_a1-5,ar2_a3-1,ar2_a3-2,ar9_a1-1,ar9_a1-2,ar9_a1-3,ar2_a1-1,ar2_a1-2,ar2_a1-3,ar2_a1-4,ar1_a2-1,ar1_a2-2,ar1_a2-3,ar1_a2-4,ar7_a1-1,ar7_a1-2,ar7_a1-3,ar4_a1-1,ar4_a1-2,ar22_a1-1,ar22_a1-2,ar22_a1-3,ar22_a1-4,ar22_a1-5,ar22_a1-6";

export const ENABLE_CC_PAYMENTS = import.meta.env.VITE_ENV_ENABLE_CC_PAYMENTS || "0";

export const ENABLE_SOL_PAYMENTS = import.meta.env.VITE_ENV_ENABLE_SOL_PAYMENTS || "0";

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_ENV_STRIPE_PUBLISHABLE_KEY || "";
