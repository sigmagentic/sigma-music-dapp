import { useState, useEffect } from "react";

interface UseTrackVotingProps {
  bountyIds: string[];
}

export const useTrackVoting = ({ bountyIds }: UseTrackVotingProps) => {
  const [userVotedOptions, setUserVotedOptions] = useState<Record<string, Set<"up" | "down">>>({});

  const getVotedOptionsFromSessionStorage = (bountyId: string): Set<"up" | "down"> => {
    try {
      const votedOptions = sessionStorage.getItem(`sig-ux-track-voted-${bountyId}`);
      if (votedOptions) {
        const options = JSON.parse(votedOptions);
        return new Set(options);
      }
      return new Set();
    } catch (error) {
      console.error("Error reading from session storage:", error);
      return new Set();
    }
  };

  // Load existing voted options from session storage on component mount
  useEffect(() => {
    const loadExistingVotedOptions = () => {
      const existingVotedOptions: Record<string, Set<"up" | "down">> = {};
      bountyIds.forEach((bountyId) => {
        const votedOptions = getVotedOptionsFromSessionStorage(bountyId);
        if (votedOptions.size > 0) {
          existingVotedOptions[bountyId] = votedOptions;
        }
      });

      if (Object.keys(existingVotedOptions).length > 0) {
        setUserVotedOptions(existingVotedOptions);
      }
    };

    if (bountyIds.length > 0) {
      loadExistingVotedOptions();
    }
  }, [bountyIds]);

  return {
    userVotedOptions,
    setUserVotedOptions,
  };
};
