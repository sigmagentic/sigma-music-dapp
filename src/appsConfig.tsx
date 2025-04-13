export const IS_DEVNET = import.meta.env.VITE_ENV_NETWORK && import.meta.env.VITE_ENV_NETWORK === "devnet";

export const IS_LIVE_DEMO_MODE = import.meta.env.VITE_ENV_LIVE_DEMO_MODE && import.meta.env.VITE_ENV_LIVE_DEMO_MODE === "1";

export type app_token = {
  tokenIdentifier: string;
  nonce: number;
};
