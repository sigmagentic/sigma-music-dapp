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

export const LOG_STREAM_EVENT_METRIC_EVERY_SECONDS = 30;

export const MINTER_WALLET = APP_NETWORK === "devnet" ? "5QrQzQk5nnTJbBhdnwwwmQr94AQUkMEaZkDbU5HsvKMY" : "33iDRaAJCFY8GVTCFhnhfHMvtMqfMbTxcCgEkr6eRQnT";

export const FAN_MEMBERHSIP_NFT_NAME_TO_ARTIST_SLUG_MAP = {
  "FANG10-LLLUNA01-T1": {
    slug: "llluna01",
  },
  "FANG1-YFGP-T1": {
    slug: "yfgp",
  },
  "FANG8-WsbFgcKayleigh-T1": {
    slug: "wsb-zaf-fgc-kayleigh",
    campaignCode: "wsb",
  },
  "FANG9-WsbVubVishwas-T1": {
    slug: "wsb-ind-vub-vishwas",
    campaignCode: "wsb",
  },
  "FANG6-JusticeCrew-T1": {
    slug: "justice-crew",
  },
  "FANG7-JusticeCrew-T2": {
    slug: "justice-crew",
  },
  "FANG4-7g0Strike-T2": {
    slug: "7g0strike",
  },
  "FANG5-Loonyo-T1": {
    slug: "dj-loonyo",
  },
  "FANG11-WsbFgcAbdul-T1": {
    slug: "wsb-zaf-fgc-abdul",
    campaignCode: "wsb",
  },
  "FANG12-WsbFgcIsabella-T1": {
    slug: "wsb-zaf-fgc-isabella",
    campaignCode: "wsb",
  },
  "FANG13-WsbFgcKatia-T1": {
    slug: "wsb-zaf-fgc-katia",
    campaignCode: "wsb",
  },
  "FANG14-WsbFgcKatiso-T1": {
    slug: "wsb-zaf-fgc-katiso",
    campaignCode: "wsb",
  },
  "FANG15-WsbFgcLinda-T1": {
    slug: "wsb-zaf-fgc-linda",
    campaignCode: "wsb",
  },
  "FANG16-WsbFgcThabang-T1": {
    slug: "wsb-zaf-fgc-thabang",
    campaignCode: "wsb",
  },
  "FANG17-WsbVubAakash-T1": {
    slug: "wsb-ind-vub-aakash",
    campaignCode: "wsb",
  },
  "FANG18-WsbVubAjay-T1": {
    slug: "wsb-ind-vub-ajay",
    campaignCode: "wsb",
  },
  "FANG19-WsbVubAkash-T1": {
    slug: "wsb-ind-vub-akash-1",
    campaignCode: "wsb",
  },
  "FANG20-WsbVubAkash-T1": {
    slug: "wsb-ind-vub-akash-2",
    campaignCode: "wsb",
  },
  "FANG21-WsbVubAkash-T1": {
    slug: "wsb-ind-vub-akash-3",
    campaignCode: "wsb",
  },
  "FANG22-WsbVubAnju-T1": {
    slug: "wsb-ind-vub-anju",
    campaignCode: "wsb",
  },
  "FANG23-WsbVubAshish-T1": {
    slug: "wsb-ind-vub-ashish",
    campaignCode: "wsb",
  },
  "FANG24-WsbVubAyush-T1": {
    slug: "wsb-ind-vub-ayush",
    campaignCode: "wsb",
  },
  "FANG25-WsbVubBittu-T1": {
    slug: "wsb-ind-vub-bittu",
    campaignCode: "wsb",
  },
  "FANG26-WsbVubGaurav-T1": {
    slug: "wsb-ind-vub-gaurav",
    campaignCode: "wsb",
  },
  "FANG27-WsbVubLaxman-T1": {
    slug: "wsb-ind-vub-laxman",
    campaignCode: "wsb",
  },
  "FANG28-WsbVubMohit-T1": {
    slug: "wsb-ind-vub-mohit",
    campaignCode: "wsb",
  },
  "FANG29-WsbVubNaresh-T1": {
    slug: "wsb-ind-vub-naresh",
    campaignCode: "wsb",
  },
  "FANG30-WsbVubPrakash-T1": {
    slug: "wsb-ind-vub-prakash",
    campaignCode: "wsb",
  },
  "FANG31-WsbVubPrem-T1": {
    slug: "wsb-ind-vub-prem",
    campaignCode: "wsb",
  },
  "FANG32-WsbVubRaj-T1": {
    slug: "wsb-ind-vub-raj",
    campaignCode: "wsb",
  },
  "FANG33-WsbVubRamesh-T1": {
    slug: "wsb-ind-vub-ramesh",
    campaignCode: "wsb",
  },
  "FANG34-WsbVubRohan-T1": {
    slug: "wsb-ind-vub-rohan",
    campaignCode: "wsb",
  },
  "FANG35-WsbVubSahil-T1": {
    slug: "wsb-ind-vub-sahil",
    campaignCode: "wsb",
  },
  "FANG36-WsbVubShiva-T1": {
    slug: "wsb-ind-vub-shiva",
    campaignCode: "wsb",
  },
  "FANG37-WsbVubSohan-T1": {
    slug: "wsb-ind-vub-sohan",
    campaignCode: "wsb",
  },
  "FANG38-WsbVubSonu-T1": {
    slug: "wsb-ind-vub-sonu",
    campaignCode: "wsb",
  },
  "FANG39-WsbVubSudharma-T1": {
    slug: "wsb-ind-vub-sudharma",
    campaignCode: "wsb",
  },
  "FANG40-WsbVubSumit-T1": {
    slug: "wsb-ind-vub-sumit",
    campaignCode: "wsb",
  },
  "FANG41-WsbVubSuraj-T1": {
    slug: "wsb-ind-vub-suraj",
    campaignCode: "wsb",
  },
  "FANG42-WsbVubTirth-T1": {
    slug: "wsb-ind-vub-tirth",
    campaignCode: "wsb",
  },
  "FANG43-WsbVubVishal-T1": {
    slug: "wsb-ind-vub-vishal",
    campaignCode: "wsb",
  },

  "FANG45-WsbPhlJhuven-T1": {
    slug: "wsb-phl-mrw-jhuvenl",
    campaignCode: "wsb",
  },
  "FANG46-WsbPhlMarlouie-T1": {
    slug: "wsb-phl-mrw-marlouie",
    campaignCode: "wsb",
  },
  "FANG47-WsbPhlMelchor-T1": {
    slug: "wsb-phl-mrw-melchor",
    campaignCode: "wsb",
  },
  "FANG48-WsbPhlDavid-T1": {
    slug: "wsb-phl-mrw-david",
    campaignCode: "wsb",
  },
  "FANG49-WsbPhlLoonyo-T1": {
    slug: "wsb-phl-mrw-loonyo",
    campaignCode: "wsb",
  },
  "FANG50-WsbPhlAira-T1": {
    slug: "wsb-phl-mrw-aira",
    campaignCode: "wsb",
  },
  "FANG51-WsbPhlJade-T1": {
    slug: "wsb-phl-mrw-jade",
    campaignCode: "wsb",
  },
  "FANG52-WsbPhlRichard-T1": {
    slug: "wsb-phl-mrw-richard",
    campaignCode: "wsb",
  },
  "FANG53-WsbPhlRd-T1": {
    slug: "wsb-phl-mrw-rd",
    campaignCode: "wsb",
  },
  "FANG54-WsbPhlRalph-T1": {
    slug: "wsb-phl-mrw-ralph",
    campaignCode: "wsb",
  },
  "FANG55-WsbPhlMannex-T1": {
    slug: "wsb-phl-mrw-mannex",
    campaignCode: "wsb",
  },
  "FANG56-WsbPhlKliff-T1": {
    slug: "wsb-phl-mrw-kliff",
    campaignCode: "wsb",
  },
};
