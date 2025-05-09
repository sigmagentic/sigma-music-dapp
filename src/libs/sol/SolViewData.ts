import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { SOL_ENV_ENUM } from "config";
import { BlobDataType } from "libs/types";
import { getApiDataMarshal, getApiWeb2Apps } from "libs/utils";

export async function itheumSolPreaccess() {
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
  const preaccessUrl = `${getApiDataMarshal()}/preaccess?chainId=${chainId}`;
  const response = await fetch(preaccessUrl);
  const data = await response.json();
  return data.nonce;
}

export async function viewDataViaMarshalSol(
  assetId: string,
  nonce: string,
  signature: string,
  address: PublicKey,
  fwdHeaderKeys?: string[],
  headers?: any,
  streamInLine?: boolean,
  nestedIdxToStream?: number,
  cacheDurationSeconds?: number
): Promise<Response> {
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
  let accessUrl = `${getApiDataMarshal()}/access?nonce=${nonce}&NFTId=${assetId}&signature=${signature}&chainId=${chainId}&accessRequesterAddr=${address.toBase58()}`;
  if (streamInLine) {
    accessUrl += `&streamInLine=1`;
  }
  if (nestedIdxToStream !== undefined) {
    accessUrl += `&nestedIdxToStream=${nestedIdxToStream}`;
  }
  if (fwdHeaderKeys && fwdHeaderKeys.length > 0) {
    accessUrl += `&fwdHeaderKeys=${fwdHeaderKeys.join(",")}`;
  }
  if (cacheDurationSeconds && cacheDurationSeconds > 0) {
    accessUrl += `&cacheDurationSeconds=${cacheDurationSeconds}`;
  }
  const response = await fetch(accessUrl, { headers });
  return response;
}

export async function itheumSolViewDataInNewTab(assetId: string, nonce: string, signature: string, address: PublicKey) {
  const response = await viewDataViaMarshalSol(assetId, nonce, signature, address, import.meta.env.VITE_ENV_NETWORK);
  const data = await response.blob();
  const url = window.URL.createObjectURL(data);
  window.open(url, "_blank");
}

/*
This method will get the Solana Data Marshal access nonce and Signature
from local app cache (so we don't have to keep asking for a signature)
or if the cache is not suitable, then get a fresh nonce and sig and cache it again
*/
export async function getOrCacheAccessNonceAndSignature({
  solPreaccessNonce,
  solPreaccessSignature,
  solPreaccessTimestamp,
  signMessage,
  publicKey,
  updateSolPreaccessNonce,
  updateSolSignedPreaccess,
  updateSolPreaccessTimestamp,
  forceNewSession = false,
}: {
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  signMessage: any;
  publicKey?: any;
  updateSolPreaccessNonce: any;
  updateSolSignedPreaccess: any;
  updateSolPreaccessTimestamp: any;
  forceNewSession?: boolean;
}) {
  let usedPreAccessNonce = solPreaccessNonce;
  let usedPreAccessSignature = solPreaccessSignature;

  // Marshal Access lasts for 30 Mins. We cache it for this amount of time
  const minsMarshalAllowsForNonceCaching = 20;

  if (
    forceNewSession ||
    solPreaccessSignature === "" ||
    solPreaccessTimestamp === -2 ||
    solPreaccessTimestamp + minsMarshalAllowsForNonceCaching * 60 * 1000 < Date.now()
  ) {
    const preAccessNonce = await itheumSolPreaccess();
    const message = new TextEncoder().encode(preAccessNonce);

    if (signMessage === undefined) {
      throw new Error("signMessage is undefined");
    }

    const signature = await signMessage(message);

    // if (!preAccessNonce || !signature || !publicKey) {
    if (!preAccessNonce || !signature) {
      throw new Error("Missing data for viewData");
    }

    const encodedSignature = bs58.encode(signature);

    updateSolPreaccessNonce(preAccessNonce);
    updateSolSignedPreaccess(encodedSignature);
    updateSolPreaccessTimestamp(Date.now()); // in MS

    usedPreAccessNonce = preAccessNonce;
    usedPreAccessSignature = encodedSignature;

    console.log("getOrCacheAccessNonceAndSignature: Sig session [no-cache]");
  } else {
    console.log("getOrCacheAccessNonceAndSignature: Sig session [cache]");
  }

  return {
    usedPreAccessNonce,
    usedPreAccessSignature,
  };
}

// Any method that wants to open a data nft via the marshal, can call this wrapper with viewDataArgs and tokenId
export async function viewDataWrapperSol(publicKeySol: PublicKey, usedPreAccessNonce: string, usedPreAccessSignature: string, viewDataArgs: any, tokenId: any) {
  try {
    if (!publicKeySol) {
      throw new Error("Missing data for viewData");
    }

    const res = await viewDataViaMarshalSol(
      tokenId,
      usedPreAccessNonce,
      usedPreAccessSignature,
      publicKeySol,
      viewDataArgs.fwdHeaderKeys,
      viewDataArgs.headers
    );

    let blobDataType = BlobDataType.TEXT;
    let data;

    if (res.ok) {
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      return { data, blobDataType, contentType };
    } else {
      console.error(res.statusText);

      return undefined;
    }
  } catch (err) {
    return undefined;
  }
}

export async function sigmaWeb2XpSystem(
  publicKeySol: PublicKey,
  usedPreAccessNonce: string,
  usedPreAccessSignature: string,
  viewDataArgs: any,
  tokenId: any,
  justSendRawResponse = false
): Promise<any> {
  try {
    const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

    const headersToSend = {
      ...viewDataArgs.headers,
      "itm-marshal-fwd-chainid": chainId,
      "itm-marshal-fwd-tokenid": tokenId,
      "itm-marshal-fwd-accessrequesteraddr": publicKeySol.toBase58(),
      "itm-marshal-fwd-accessrequestersignature": usedPreAccessSignature,
      "itm-marshal-fwd-accessrequestersignednonce": usedPreAccessNonce,
      "x-sigma-xp-usage": "1",
    };

    let accessUrl = `${getApiWeb2Apps()}/datadexapi/sigmaXp`;

    const res = await fetch(accessUrl, { headers: headersToSend });

    if (justSendRawResponse) {
      return res;
    }

    let blobDataType = BlobDataType.TEXT;
    let data;

    if (res.ok) {
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      return { data, blobDataType, contentType };
    } else {
      console.error(res.statusText);

      return undefined;
    }
  } catch (err) {
    return undefined;
  }
}

export async function mintMiscDataNft(mintTemplate: string, mintForSolAddr: string, solSignature: string, signatureNonce: string) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
    const requestBody = { mintTemplate, mintForSolAddr, solSignature, signatureNonce, chainId };

    const res = await fetch(`${getApiWeb2Apps()}/datadexapi/solNftUtils/mintMiscDataNft`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    return data;
  } catch (e) {
    return {
      error: true,
      e,
    };
  }
}

export async function checkIfFreeDataNftGiftMinted(mintTemplate: string, checkForSolAddr: string) {
  const res = await fetch(
    `${getApiWeb2Apps()}/datadexapi/solNftUtils/checkIfFreeDataNftGiftMinted?mintTemplate=${mintTemplate}&checkForSolAddr=${checkForSolAddr}`,
    {
      method: "GET",
    }
  );

  const data = await res.json();

  return data;
}

export async function fetchSolNfts(solAddress: string | undefined): Promise<DasApiAsset[]> {
  if (!solAddress) {
    return [];
  } else {
    const resp = await fetch(`${getApiWeb2Apps()}/datadexapi/bespoke/sol/getDataNFTsByOwner?publicKeyb58=${solAddress}`);
    const data = await resp.json();
    // filter out burnt nfts (@TODO should be fixed in the backend)
    const nfts: DasApiAsset[] = data.nfts.filter((nft: DasApiAsset) => !nft.burnt);

    return nfts;
  }
}
