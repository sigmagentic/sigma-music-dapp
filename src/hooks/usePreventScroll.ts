import { useEffect } from "react";
import { isMostLikelyMobile } from "libs/utils/functions";

/**
 * Hook that prevents body scrolling on non-mobile screens
 * This is useful for modals and overlays that should prevent background scrolling
 * but only on desktop/tablet devices where it makes sense
 */
export const usePreventScroll = () => {
  useEffect(() => {
    // Only prevent scrolling on non-mobile screens
    if (!isMostLikelyMobile()) {
      // Prevent scrolling on mount
      document.body.style.overflow = "hidden";

      // Re-enable scrolling on unmount
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, []);
};
