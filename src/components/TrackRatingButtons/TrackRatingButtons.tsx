import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { logAssetRatingToAPI } from "libs/utils";
import { toastError, toastSuccess } from "libs/utils/ui";

interface TrackRatingButtonsProps {
  bountyId: string;
  userVotedOptions: Record<string, Set<"up" | "down">>;
  onlyShowLike?: boolean;
  setUserVotedOptions: (value: Record<string, Set<"up" | "down">>) => void;
}

export const TrackRatingButtons: React.FC<TrackRatingButtonsProps> = ({ bountyId, userVotedOptions, onlyShowLike = false, setUserVotedOptions }) => {
  const { publicKey: publicKeySol } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();

  const [isVotingUp, setIsVotingUp] = useState(false);
  const [isVotingDown, setIsVotingDown] = useState(false);

  const hasUserVotedOption = (bountyId: string, rating: "up" | "down"): boolean => {
    return userVotedOptions[bountyId]?.has(rating) || false;
  };

  const saveVotedOptionToSessionStorage = (bountyId: string, votedOptions: Set<"up" | "down">) => {
    try {
      sessionStorage.setItem(`sig-ux-track-voted-${bountyId}`, JSON.stringify(Array.from(votedOptions)));
    } catch (error) {
      console.error("Error saving to session storage:", error);
    }
  };

  const handleTrackRating = async (bountyId: string, rating: "up" | "down") => {
    if (!addressSol) {
      toastError("You must be logged in to vote on a track!");
      return;
    }

    // Check if user has already voted this specific option
    if (hasUserVotedOption(bountyId, rating)) {
      toastError(`You have already ${rating === "up" ? "liked" : "disliked"} this track!`);
      return;
    }

    try {
      if (rating === "up") {
        setIsVotingUp(true);
      } else {
        setIsVotingDown(true);
      }
      console.log(`Sending vote to API: ${bountyId} - ${rating}`);

      await logAssetRatingToAPI({ assetId: bountyId, rating, address: addressSol });

      // Update local state to prevent spam
      const newVotedOptions = new Set(userVotedOptions[bountyId] || []);
      newVotedOptions.add(rating);
      const updated: Record<string, Set<"up" | "down">> = { ...userVotedOptions, [bountyId]: newVotedOptions };

      // Save to session storage
      saveVotedOptionToSessionStorage(bountyId, newVotedOptions as Set<"up" | "down">);

      setUserVotedOptions(updated);

      // Show feedback to user
      toastSuccess(`Track ${rating === "up" ? "liked" : "disliked"}!`);
    } catch (error) {
      console.error("Error sending vote:", error);
      toastError("Failed to submit vote. Most likely you have already voted on this track. Please try again later.");
    } finally {
      if (rating === "up") {
        setIsVotingUp(false);
      } else {
        setIsVotingDown(false);
      }
    }
  };

  const hasVotedUp = hasUserVotedOption(bountyId, "up");
  const hasVotedDown = hasUserVotedOption(bountyId, "down");

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          handleTrackRating(bountyId, "up");
          e.stopPropagation();
        }}
        disabled={hasVotedUp || isVotingUp}
        className={`p-1 rounded transition-colors ${
          hasVotedUp || isVotingUp ? "text-green-400 cursor-not-allowed" : "text-white hover:text-green-400 hover:bg-green-400/10"
        }`}
        title={hasVotedUp ? "You already liked this track" : "Like this track"}>
        {(isVotingUp && <Loader className="w-4 h-4 animate-spin" />) || <ThumbsUp className="w-4 h-4" />}
      </button>
      {!onlyShowLike && (
        <button
          onClick={(e) => {
            handleTrackRating(bountyId, "down");
            e.stopPropagation();
          }}
          disabled={isVotingDown}
          className={`p-1 rounded transition-colors ${hasVotedDown || isVotingDown ? "text-red-400 cursor-not-allowed" : "text-white hover:text-red-400 hover:bg-red-400/10"}`}
          title={hasVotedDown ? "You already disliked this track" : "Dislike this track"}>
          {(isVotingDown && <Loader className="w-4 h-4 animate-spin" />) || <ThumbsDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
