import { clsx, ClassValue } from "clsx";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

/*
    UI should import Toaster
    /////////////////////////////////////////////
    import { Toaster } from 'react-hot-toast';
    <Toaster />
    /////////////////////////////////////////////
*/

export const toastError = (message: string) => {
  toast.error(message, {
    position: "top-right",
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

      // Extract the artist identifier (e.g., 'loonyoT1' from '733_loonyoT1.gif')
      const artistIdentifier = fileName.split("_")[1];

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
