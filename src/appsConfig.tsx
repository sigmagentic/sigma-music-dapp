export const IS_DEVNET = import.meta.env.VITE_ENV_NETWORK && import.meta.env.VITE_ENV_NETWORK === "devnet";

export type app_token = {
  tokenIdentifier: string;
  nonce: number;
};
