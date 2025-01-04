export const getApiDataMarshal = (chainID: string) => {
  const envKey = chainID.includes("1") ? "VITE_ENV_DATAMARSHAL_MAINNET_API" : "VITE_ENV_DATAMARSHAL_DEVNET_API";
  const defaultUrl = chainID.includes("1")
    ? "https://api.itheumcloud.com/datamarshalapi/router/v1"
    : "https://api.itheumcloud-stg.com/datamarshalapi/router/v1";
  return import.meta.env[envKey] || defaultUrl;
};

export const sleep = (sec: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });
};

export const getApiWeb2Apps = (chainID?: string) => {
  // we can call this without chainID (e.g. solana mode or no login mode), and we get the API endpoint based on ENV
  if (!chainID) {
    if (import.meta.env.VITE_ENV_NETWORK === "mainnet") {
      return "https://api.itheumcloud.com";
    } else {
      return "https://api.itheumcloud-stg.com";
    }
  }

  const envKey = chainID === "1" ? "VITE_ENV_WEB2_APPS_MAINNET_API" : "VITE_ENV_WEB2_APPS_DEVNET_API";
  const defaultUrl = chainID === "1" ? "https://api.itheumcloud.com" : "https://api.itheumcloud-stg.com";

  return import.meta.env[envKey] || defaultUrl;
};

export const isMostLikelyMobile = () => {
  return window?.screen?.width <= 450;
};

export const gtagGo = (category: string, action: any, label?: any, value?: any) => {
  /*
  e.g.
  Category: 'Videos', Action: 'Play', Label: 'Gone With the Wind'
  Category: 'Videos'; Action: 'Play - Mac Chrome'
  Category: 'Videos', Action: 'Video Load Time', Label: 'Gone With the Wind', Value: downloadTime

  // AUTH
  Category: 'Auth', Action: 'Login', Label: 'Metamask'
  Category: 'Auth', Action: 'Login - Success', Label: 'Metamask'
  Category: 'Auth', Action: 'Login', Label: 'DeFi'
  Category: 'Auth', Action: 'Login', Label: 'Ledger'
  Category: 'Auth', Action: 'Login', Label: 'xPortalApp'
  Category: 'Auth', Action: 'Login', Label: 'WebWallet'

  Category: 'Auth', Action: 'Logout', Label: 'WebWallet'
  */

  if (!action || !category) {
    console.error("gtag tracking needs both action and category");
    return;
  }

  const eventObj: Record<string, string> = {
    event_category: category,
  };

  if (label) {
    eventObj["event_label"] = label;
  }

  if (value) {
    eventObj["event_value"] = value;
  }

  // only track mainnet so we have good data on GA
  if (window.location.hostname !== "localhost" && import.meta.env.VITE_ENV_NETWORK === "mainnet") {
    (window as any).gtag("event", action, eventObj);
  }
};
