import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Album } from "libs/types";

export const computeRemainingCooldown = (startTime: number, cooldown: number) => {
  const timePassedFromLastPlay = Date.now() - startTime;
  const _cooldown = cooldown - timePassedFromLastPlay;

  return _cooldown > 0 ? _cooldown + Date.now() : 0;
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

export const sleep = (sec: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, sec * 1000);
  });
};

export const isMostLikelyMobile = () => {
  return window?.screen?.width <= 450;
};

export function checkIfUserOwnsAlbumBasedOnNft(ownedNft: DasApiAsset, albumToCheck: Album) {
  /*
      this should match:
      Old Format: "MUSG20 - Olly'G - MonaLisa Rap" (nftNamePrefix) should match (albumNamePrefix) "MUSG20-Olly'G-MonaLisa Rap" or "MUSG20 - Olly'G-MonaLisa Rap"
      New format From Dec 2025: "MUSSM-MP-Frequency-ar140_a4" (we made this change so that the name looks better in the actual crypto wallet and we dont have dont codes like MUSSMar140_a4, 
      but this breaks the matching as eveything now gets matched via the MUSSM code). so we have to handle both cases). so we have to handle both cases -- T2 looks like MUSSM-MP-Frequency-ar140_a4-T2

      this should NOT match:
      Old Format: "MUSG20 - Olly'G - MonaLisa Rap" (nftNamePrefix) should not match (albumNamePrefix) "MUSG19-Olly'G-MonaLisa Rap" or "MUSG21 - Olly'G-MonaLisa Rap"
      New formats From Dec 2025: "MUSSM-MP-Frequency-ar140_a4" (nftNamePrefix) should not match (albumNamePrefix) "MUSM20-FooBar Rap"
    */

  function extractCorrectNftOrAlbumPrefixForNewNamingFormat(originalFullName: string) {
    const splitsByDash = originalFullName.split("-");
    let newPrefix = "";

    if (originalFullName.includes("-T")) {
      // need to also accomodate the T case (i.e. T2, T3 etc)
      newPrefix = `${newPrefix}-${splitsByDash[splitsByDash.length - 2]}-{${splitsByDash[splitsByDash.length - 1]}}`; // originally it was MUSSM and now we get MUSSM-ar140_a4-T2
    } else {
      newPrefix = `${newPrefix}-${splitsByDash[splitsByDash.length - 1]}`; // originally it was MUSSM and now we get MUSSM-ar140_a4
    }

    return newPrefix;
  }

  // Get the prefix before first "-" or space from both strings
  let nftNamePrefix = ownedNft.content.metadata.name.split(/[-\s]/)[0]; // e.g. we get: MUSG20 (old), MUSSM (new)

  if (nftNamePrefix === "MUSSM") {
    nftNamePrefix = extractCorrectNftOrAlbumPrefixForNewNamingFormat(ownedNft.content.metadata.name);
  }

  let albumNamePrefix = !albumToCheck.solNftName ? "" : albumToCheck.solNftName.split(/[-\s]/)[0]; // e.g.we get:  MUSG20 (old), MUSSM (new)

  if (albumNamePrefix === "MUSSM") {
    albumNamePrefix = extractCorrectNftOrAlbumPrefixForNewNamingFormat(albumToCheck.solNftName);
  }

  // for solNftAltCodes, solNftAltCodes will be MUSSM28T1 or MUSSM28T1:MUSSM28T2 (i.e. the T1 or T2) or for new format, MUSSM-ar140_a4-T2:MUSSM-ar140_a4-T3
  return (
    nftNamePrefix.toLowerCase() === albumNamePrefix.toLowerCase() ||
    (albumToCheck.solNftAltCodes !== "" && albumToCheck.solNftAltCodes?.includes(nftNamePrefix))
  );
}
