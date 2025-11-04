import { useEffect, useRef } from "react";
import { MusicTrack } from "libs/types";

// Type definitions for Media Session API
// These align with the browser's MediaSession API types
export interface MediaSessionActionDetails {
  action: MediaSessionAction;
  seekOffset?: number;
}

export interface MediaSessionSeekToActionDetails extends MediaSessionActionDetails {
  seekTime?: number;
  fastSeek?: boolean;
}

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onStop?: () => void;
  onSeekBackward?: (details: MediaSessionActionDetails) => void;
  onSeekForward?: (details: MediaSessionActionDetails) => void;
  onSeekTo?: (details: MediaSessionSeekToActionDetails) => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
}

interface UseMediaSessionProps {
  currentTrack: MusicTrack | undefined;
  isPlaying: boolean;
  handlers: MediaSessionHandlers;
  enabled?: boolean;
}

/**
 * Custom hook to integrate Media Session API with the music player
 * This allows the player to be controlled via OS-level media controls,
 * lock screens, notifications, and hardware media keys.
 */
export const useMediaSession = ({ currentTrack, isPlaying, handlers, enabled = true }: UseMediaSessionProps) => {
  const handlersRef = useRef(handlers);

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Check if Media Session API is supported
    if (!enabled || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    // Update metadata when track changes
    if (currentTrack) {
      try {
        // Prepare artwork array with multiple sizes for better platform support
        const artwork: MediaImage[] = [];

        if (currentTrack.cover_art_url) {
          // Add multiple sizes for better platform compatibility
          const sizes = [96, 128, 192, 256, 384, 512];
          sizes.forEach((size) => {
            artwork.push({
              src: currentTrack.cover_art_url,
              sizes: `${size}x${size}`,
              type: "image/png", // Most platforms handle PNG well
            });
          });
        }

        mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || "Unknown Title",
          artist: currentTrack.artist || "Unknown Artist",
          album: currentTrack.album || "Unknown Album",
          artwork: artwork.length > 0 ? artwork : undefined,
        });
      } catch (error) {
        console.warn("Failed to set Media Session metadata:", error);
      }
    }

    // Update playback state
    try {
      mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch (error) {
      console.warn("Failed to set Media Session playback state:", error);
    }
  }, [currentTrack, isPlaying, enabled]);

  useEffect(() => {
    // Check if Media Session API is supported
    if (!enabled || !("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    // Set up action handlers
    const setupHandlers = () => {
      try {
        // Play action
        mediaSession.setActionHandler("play", () => {
          handlersRef.current.onPlay();
        });

        // Pause action
        mediaSession.setActionHandler("pause", () => {
          handlersRef.current.onPause();
        });

        // Stop action (optional)
        if (handlersRef.current.onStop) {
          mediaSession.setActionHandler("stop", () => {
            handlersRef.current.onStop?.();
          });
        }

        // Seek backward action (optional)
        if (handlersRef.current.onSeekBackward) {
          mediaSession.setActionHandler("seekbackward", (details) => {
            handlersRef.current.onSeekBackward?.(details);
          });
        }

        // Seek forward action (optional)
        if (handlersRef.current.onSeekForward) {
          mediaSession.setActionHandler("seekforward", (details) => {
            handlersRef.current.onSeekForward?.(details);
          });
        }

        // Seek to action (optional)
        if (handlersRef.current.onSeekTo) {
          mediaSession.setActionHandler("seekto", (details) => {
            handlersRef.current.onSeekTo?.(details);
          });
        }

        // Previous track action
        mediaSession.setActionHandler("previoustrack", () => {
          handlersRef.current.onPreviousTrack();
        });

        // Next track action
        mediaSession.setActionHandler("nexttrack", () => {
          handlersRef.current.onNextTrack();
        });
      } catch (error) {
        // Some actions may not be supported on all platforms
        console.warn("Failed to set some Media Session action handlers:", error);
      }
    };

    setupHandlers();

    // Cleanup: Remove action handlers when component unmounts
    return () => {
      try {
        // Clear all action handlers
        mediaSession.setActionHandler("play", null);
        mediaSession.setActionHandler("pause", null);
        mediaSession.setActionHandler("stop", null);
        mediaSession.setActionHandler("seekbackward", null);
        mediaSession.setActionHandler("seekforward", null);
        mediaSession.setActionHandler("seekto", null);
        mediaSession.setActionHandler("previoustrack", null);
        mediaSession.setActionHandler("nexttrack", null);
      } catch (error) {
        console.warn("Failed to clear Media Session action handlers:", error);
      }
    };
  }, [enabled]);

  // Cleanup metadata when component unmounts or when disabled
  useEffect(() => {
    return () => {
      if (!enabled || !("mediaSession" in navigator)) {
        return;
      }

      try {
        navigator.mediaSession.metadata = null;
      } catch (error) {
        console.warn("Failed to clear Media Session metadata:", error);
      }
    };
  }, [enabled]);
};
