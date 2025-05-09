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
