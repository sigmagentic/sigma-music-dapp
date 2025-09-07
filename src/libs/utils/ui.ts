import { clsx, ClassValue } from "clsx";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";
import { AiRemixRawTrack, AiRemixLaunch, MusicTrack, Album } from "libs/types";

/*
    UI should import Toaster
    /////////////////////////////////////////////
    import { Toaster } from 'react-hot-toast';
    <Toaster />
    /////////////////////////////////////////////
*/

export const toastError = (message: string, showTopCenter?: boolean) => {
  toast.error(message, {
    position: showTopCenter ? "top-center" : "top-right",
    duration: 6000,
  });
};

export const toastSuccess = (message: string, showTopCenter?: boolean) => {
  toast.success(message, {
    position: showTopCenter ? "top-center" : "top-right",
    duration: 6000,
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const scrollToSection = (sectionId: string, addMoreOffset?: number) => {
  const section = document.getElementById(sectionId);

  if (section) {
    window.scrollTo({
      top: section.offsetTop + (addMoreOffset || 0),
      behavior: "smooth",
    });
  }
};

export function timeUntil(lockPeriod: number): { count: number; unit: string } {
  const seconds = lockPeriod;

  const intervals = [
    { seconds: 3153600000, unit: "century" },
    { seconds: 31536000, unit: "year" },
    { seconds: 2592000, unit: "month" },
    { seconds: 86400, unit: "day" },
    { seconds: 3600, unit: "hour" },
    { seconds: 60, unit: "minute" },
    { seconds: 1, unit: "second" },
  ];
  const interval = intervals.find((i) => i.seconds <= seconds) ?? intervals[0];

  const count = Math.floor(seconds / interval!.seconds);
  const unit = count === 1 ? interval!.unit : interval!.unit + "s";

  return { count, unit };
}

export function timeSince(unixTimestamp: number): string {
  const seconds = Math.floor((new Date().getTime() - unixTimestamp * 1000) / 1000);

  const intervals = [
    { seconds: 3153600000, unit: "century" },
    { seconds: 31536000, unit: "year" },
    { seconds: 2592000, unit: "month" },
    { seconds: 86400, unit: "day" },
    { seconds: 3600, unit: "hour" },
    { seconds: 60, unit: "minute" },
    { seconds: 1, unit: "second" },
  ];
  const interval = intervals.find((i) => i.seconds <= seconds) ?? intervals[0];

  const count = Math.floor(seconds / interval!.seconds);
  const unit = count === 1 ? interval!.unit : interval!.unit + "s";

  return `${count} ${unit}`;
}

export const scrollToTopOnMainContentArea = (addMoreOffset?: number) => {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.scrollTo({
      top: 0 + (addMoreOffset || 0),
      behavior: "smooth",
    });
  }
};

/**
 * Converts a lighthouse.storage URL to an itheumcloud.com URL for token images
 * @param tokenImg - The original token image URL
 * @returns The converted URL or the original URL if conversion is not needed
 */
export const convertTokenImageUrl = (tokenImg: string): string => {
  if (!tokenImg) return tokenImg;

  // Check if the URL is from lighthouse.storage
  if (tokenImg.includes("lighthouse.storage")) {
    try {
      // Extract the filename from the URL
      const url = new URL(tokenImg);
      const pathParts = url.pathname.split("/");

      const fileName = pathParts[pathParts.length - 1];

      // Extract the artist identifier (e.g., 'loonyoT1.gif' from '733_loonyoT1.gif')
      // also 5242_img_WsbNzlRzkArohaT1.gif format of files (pull out WsbNzlRzkArohaT1.gif)
      let artistIdentifier = fileName.split("_")[1];

      if (fileName.includes("img_")) {
        artistIdentifier = fileName.split("img_")[1];
      }

      if (artistIdentifier) {
        return `https://api.itheumcloud.com/app_nftunes/assets/token_img/${artistIdentifier}`;
      }
    } catch (error) {
      console.error("Error converting token image URL:", error);
    }
  }

  return tokenImg;
};

export async function mergeImages(
  baseImageUrl: string,
  overlayImageUrl: string
): Promise<{
  base64ForApi: string; // base64 without data:image/png;base64, prefix
  base64ForPreview: string; // complete base64 with data:image/png;base64, prefix for <img> tags
}> {
  // Create new Image objects
  const loadImage = async (
    url: string
  ): Promise<{
    element: HTMLImageElement;
    base64: string;
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS

      // Create a canvas to get base64
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      img.onload = () => {
        if (tempCtx) {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          tempCtx.drawImage(img, 0, 0);
          const base64String = tempCanvas.toDataURL("image/png");
          resolve({
            element: img,
            base64: base64String,
          });
        } else {
          reject(new Error("Failed to get temporary canvas context"));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    // Load both images
    const [baseImage, overlayImage] = await Promise.all([loadImage(baseImageUrl), loadImage(overlayImageUrl)]);

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas size to base image dimensions
    canvas.width = baseImage.element.width;
    canvas.height = baseImage.element.height;

    // Draw base image
    ctx.drawImage(baseImage.element, 0, 0);

    // Calculate position to center the overlay image
    const x = (canvas.width - overlayImage.element.width) / 2;
    const y = (canvas.height - overlayImage.element.height) / 2;

    // Draw overlay image in the center
    ctx.drawImage(overlayImage.element, x, y);

    // Get base64 of the merged result
    const fullBase64 = canvas.toDataURL("image/png", 1.0); // Using max quality

    // For API: Remove the data:image/png;base64, prefix
    const base64ForApi = fullBase64.replace(/^data:image\/png;base64,/, "");

    return {
      base64ForApi: base64ForApi, // Use this when sending to API
      base64ForPreview: fullBase64, // Use this for <img> tags
    };
  } catch (error) {
    console.error("Error merging images:", error);
    throw error;
  }
}

// Helper to format date as '4 May at 7:30PM'
export const formatFriendlyDate = (dateNum: number) => {
  const date = new Date(dateNum);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${day} ${month} at ${hours}:${minutesStr}${ampm}`;
};

export const injectXUserNameIntoTweet = (tweet: string, xUserNameFullUrl?: string) => {
  if (!xUserNameFullUrl || xUserNameFullUrl === "") return tweet.replace("_(xUsername)_", ``); // just do it as is and remove the placeholder

  // need to pull out duodomusica from https://x.com/duodomusica
  const xUserName = xUserNameFullUrl.split("/").pop();

  return tweet.replace("_(xUsername)_", `(@${xUserName}) `);
};

export const removeAllDeepSectionParamsFromUrlExceptSection = (section: string, searchParams: URLSearchParams) => {
  const currentParams = Object.fromEntries(searchParams.entries());
  currentParams["section"] = section;
  delete currentParams["campaign"];
  delete currentParams["artist"];
  delete currentParams["tab"];
  // delete currentParams["action"];
  delete currentParams["country"];
  delete currentParams["team"];
  return currentParams;
};

export const mergeRawAiRemixTracks = (newTracks: AiRemixLaunch[], graduatedTracks: AiRemixLaunch[] = [], publishedTracks: AiRemixLaunch[] = []) => {
  const allAiRemixRawTracks: AiRemixRawTrack[] = [...newTracks, ...graduatedTracks, ...publishedTracks].flatMap((track: any) =>
    track.versions.map((version: any, index: number) => ({
      createdOn: track.createdOn,
      songTitle: track.promptParams.songTitle + ` (V${index + 1})`,
      genre: track.promptParams.genre,
      mood: track.promptParams.mood,
      image: fixImgIconForRemixes(track.image),
      streamUrl: version.streamUrl,
      bountyId: version.bountyId,
      status: track.status,
      refTrack_alId: track.promptParams.refTrack_alId,
    }))
  );

  return allAiRemixRawTracks;
};

export function mapRawAiRemixTracksToMusicTracks(allMyRemixes: AiRemixRawTrack[]) {
  // lets create a "virtual album" for the user that contains all their remixes
  const virtualAlbum: Album = {
    albumId: "virtual-album-PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
    title: "My AI Remixes",
    desc: "My AI Remixes",
    ctaPreviewStream: "",
    ctaBuy: "",
    dripSet: "",
    bountyId: "",
    img: "",
    isExplicit: "",
    isPodcast: "",
    isFeatured: "",
    isSigmaRemixAlbum: "",
    solNftName: "",
  };

  // next, lets map all the AiRemixRawTrack into stadard MusicTrack objects
  const allMyRemixesAsMusicTracks: MusicTrack[] = allMyRemixes.map((remix: AiRemixRawTrack, index: number) => ({
    idx: index,
    artist: "My AI Remixes",
    category: "Remix",
    album: "My AI Remixes",
    cover_art_url: fixImgIconForRemixes(remix.image),
    title: remix.songTitle,
    stream: remix.streamUrl,
    bountyId: remix.bountyId,
  }));

  return { virtualAlbum, allMyRemixesAsMusicTracks };
}

export function isUserArtistType(profileTypes: string[]): boolean {
  if (profileTypes?.includes("remixer") || profileTypes?.includes("composer")) {
    return true;
  }

  return false;
}

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

export function fixImgIconForRemixes(dbImage: string) {
  if (dbImage === "[blob_it]") {
    return "https://placehold.co/300x300/ffc75f/black?font=Noto%20Sans&text=pending";
  } else {
    return dbImage;
  }
}
