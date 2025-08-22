import React, { useEffect, useState } from "react";
import { SparklesIcon, ComputerDesktopIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { confetti } from "@tsparticles/confetti";
import { Loader, ShoppingCart } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { MembershipData, MyFanMembershipType, Perk } from "libs/types/common";
import {
  fetchCreatorFanMembershipAvailabilityViaAPI,
  fetchMintsByTemplatePrefix,
  fetchMyFanMembershipsForArtistViaAPI,
  fetchSolPriceViaAPI,
  sleep,
} from "libs/utils";
import { convertTokenImageUrl, formatFriendlyDate, injectXUserNameIntoTweet, scrollToTopOnMainContentArea } from "libs/utils/ui";
import { routeNames } from "routes";
import { JoinInnerCircleCC } from "./JoinInnerCircleCC";
import { JoinInnerCircleSOL } from "./JoinInnerCircleSOL";
import { tierData, perksData } from "./tierData";

const getPerkTypeIcon = (type: "virtual" | "physical" | "virtual") => {
  switch (type) {
    case "physical":
      return (
        <div className="relative group">
          <UserGroupIcon className="h-6 w-6 text-green-400" />
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Real-Life Perk
          </div>
        </div>
      );
    case "virtual":
      return (
        <div className="relative group">
          <ComputerDesktopIcon className="h-6 w-6 text-orange-500" />
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Virtual Perk
          </div>
        </div>
      );
  }
};

const getPerkTypeColor = (type: "virtual" | "physical" | "virtual") => {
  switch (type) {
    case "physical":
      return "border-green-500/20 hover:border-green-500/40";
    case "virtual":
      return "border-orange-500/20 hover:border-orange-500/40";
  }
};

interface ArtistInnerCircleProps {
  artistName: string;
  artistSlug: string;
  artistXLink?: string;
  creatorPaymentsWallet: string;
  artistId: string;
  filterByArtistCampaignCode?: string | number;
  nftMarketplaceLink?: string; // for fan memberships, we use the artists otherLink1 to put the nft marketplace link in (not ideal, as artist can have more fan tiers and they are all seperate links)
}

export const ArtistInnerCircle: React.FC<ArtistInnerCircleProps> = ({
  artistName,
  artistSlug,
  artistXLink,
  creatorPaymentsWallet,
  artistId,
  filterByArtistCampaignCode,
  nftMarketplaceLink,
}) => {
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const [isLoading, setIsLoading] = useState(true);
  const [liveMintStats, setLiveMintStats] = useState<{ mints: number; lastBought: number; maxMints: number } | null>(null);
  const [artistsMembershipOptions, setArtistMembershipOptions] = useState<MembershipData | null>(null);
  const [creatorFanMembershipAvailability, setCreatorFanMembershipAvailability] = useState<Record<string, any> | null>(null);
  const [selectedArtistMembership, setSelectedArtistMembership] = useState<string>("t1");
  const [myActiveFanMembershipsForArtist, setMyActiveFanMembershipsForArtist] = useState<MyFanMembershipType[] | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [joinInnerCircleModalOpen, setJoinInnerCircleModalOpen] = useState<boolean>(false);
  const [selectedTokenImg, setSelectedTokenImg] = useState<string | null>(null);
  const [tweetText, setTweetText] = useState<string>("");

  useEffect(() => {
    if (!creatorPaymentsWallet) {
      return;
    }

    const fetchAllData = async () => {
      const fanMembershipAvailabilityData = await checkAndloadCreatorFanMembershipAvailability();
      await fetchMembershipData(fanMembershipAvailabilityData);
    };

    fetchAllData();
  }, [walletType, creatorPaymentsWallet]);

  useEffect(() => {
    if (walletType === "phantom" && artistsMembershipOptions && selectedArtistMembership) {
      fetchPriceInSol();
    }
  }, [selectedArtistMembership, walletType, artistsMembershipOptions]);

  useEffect(() => {
    if (!addressSol) {
      if (artistsMembershipOptions && creatorFanMembershipAvailability) {
        setIsLoading(false);
      }
    } else {
      if (
        artistsMembershipOptions &&
        creatorFanMembershipAvailability &&
        myActiveFanMembershipsForArtist &&
        (walletType === "phantom" ? requiredSolAmount : true)
      ) {
        setIsLoading(false);
      }
    }
  }, [addressSol, artistsMembershipOptions, creatorFanMembershipAvailability, myActiveFanMembershipsForArtist, requiredSolAmount]);

  useEffect(() => {
    if (!addressSol) {
      return;
    }

    if (artistsMembershipOptions && creatorFanMembershipAvailability) {
      // we need data from creatorFanMembershipAvailability to augment the myActiveFanMembershipsForArtist data
      fetchMyFanMembershipsForThisArtist();
    }
  }, [addressSol, artistsMembershipOptions, creatorFanMembershipAvailability]);

  useEffect(() => {
    if (!isLoading) {
      // -1 means we are NOT in a campaign mode, only do this if we are in a campaign mode
      if (filterByArtistCampaignCode !== -1) {
        scrollToTopOnMainContentArea(300);
      }
    }
  }, [isLoading, filterByArtistCampaignCode]);

  // Add new useEffect for handling action=buy URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");

    if (action === "buy" && addressSol) {
      // Wait for 1 second before opening the modal
      const timer = setTimeout(() => {
        setJoinInnerCircleModalOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [addressSol]); // Only re-run if addressSol changes

  // we can do a live check of how many mints have been sold for the selected membership
  useEffect(() => {
    if (selectedArtistMembership && artistId && creatorPaymentsWallet && artistsMembershipOptions && Object.keys(artistsMembershipOptions).length > 0) {
      setLiveMintStats(null);
      const templatePrefix = `fan-${creatorPaymentsWallet.toLowerCase()}-${artistId}-${selectedArtistMembership}`;

      const maxMintsForSelectedMembership = artistsMembershipOptions[selectedArtistMembership].maxMints;

      const fetchLiveMintStats = async () => {
        const _liveMintStats: {
          mintTemplatePrefix: string;
          lastBought: number;
          nftType: string;
          mints: number;
          maxMints: number;
        } = await fetchMintsByTemplatePrefix(templatePrefix);

        setLiveMintStats({ mints: _liveMintStats.mints || 0, lastBought: _liveMintStats.lastBought, maxMints: maxMintsForSelectedMembership || 0 });
      };

      fetchLiveMintStats();
    }
  }, [selectedArtistMembership, artistId, creatorPaymentsWallet, artistsMembershipOptions]);

  useEffect(() => {
    if (artistName && artistName !== "") {
      const tweetMsg = injectXUserNameIntoTweet(
        `I am part of ${artistName}'s _(xUsername)_exclusive Inner Circle fan club on @SigmaXMusic. Come join me!`,
        artistXLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm${location.search}`)}&text=${encodeURIComponent(tweetMsg)}`);
    }
  }, [artistName, artistXLink]);

  const fetchPriceInSol = async () => {
    try {
      if (!artistsMembershipOptions || !selectedArtistMembership) {
        return;
      }

      // user has not set up their membership options yet, so sel the required sol abount to -1 so we can move from the loading state
      if (Object.keys(artistsMembershipOptions).length === 0) {
        setRequiredSolAmount(-1);
        return;
      }

      const { currentSolPrice } = await fetchSolPriceViaAPI();

      // Calculate required SOL amount based on USD price
      const solAmount = artistsMembershipOptions[selectedArtistMembership].defaultPriceUSD / currentSolPrice;
      setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
    } catch (error) {
      console.error("Failed to fetch SOL price:", error);
      setRequiredSolAmount(null);
    }
  };

  // Note that we may have bought a membership and thent he artist stopped selling memberships (i.e. checkAndloadCreatorFanMembershipAvailability return false). So we still need to fetch the memberships and show it in the UI
  const fetchMyFanMembershipsForThisArtist = async (bypassCacheAsNewDataAdded = false) => {
    if (!addressSol || !creatorPaymentsWallet) {
      return;
    }

    try {
      const data: MyFanMembershipType[] = await fetchMyFanMembershipsForArtistViaAPI(addressSol, creatorPaymentsWallet, artistId, bypassCacheAsNewDataAdded);

      // Augment the data with membership information
      const augmentedData = data.map((membership) => {
        // Extract membership type from mintTemplate (e.g., t1 or t2)
        const match = membership.mintTemplate.match(/-t(\d+)-/);
        const membershipType = match ? `t${match[1]}` : "-2";

        // Get the token image URL from creatorFanMembershipAvailability
        const tokenImg = creatorFanMembershipAvailability?.[membershipType]?.tokenImg || null;

        // Get the membership label from artistsMembershipOptions
        const membershipLabel = artistsMembershipOptions?.[membershipType]?.label || undefined;

        // Create the augmented membership object
        const augmentedMembership = {
          ...membership,
          membershipId: membershipType,
          membershipLabel,
          tokenImg,
        };

        // For t2 memberships, calculate days until expiration
        if (membershipType === "t2") {
          const createdDate = new Date(membership.createdOnTS);
          const expirationDate = new Date(createdDate);
          expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Add 1 year

          const today = new Date();
          const timeDiff = expirationDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          augmentedMembership.expiresInDays = daysRemaining;
        }

        return augmentedMembership;
      });

      // if there is a url param called action=justjoined, then find the latest item from augmentedData (using the createdOnTS) and then show some confettit and
      // ... so this so the token img loads in big view:  setSelectedTokenImg(convertTokenImageUrl(membership.tokenImg))
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get("action");

      if (action === "justjoined" && augmentedData.length > 0) {
        // remove action from the url (as we dont want them share that on X for e.g)
        const url = new URL(window.location.href);
        url.searchParams.delete("action");
        window.history.replaceState({}, "", url.toString());

        const latestMembership = augmentedData.sort((a, b) => new Date(b.createdOnTS).getTime() - new Date(a.createdOnTS).getTime())[0];

        if (latestMembership) {
          setSelectedTokenImg(convertTokenImageUrl(latestMembership.tokenImg));

          // need to pull it out of the ui thread of for some reason the confetti goes first
          setTimeout(() => {
            showSuccessConfetti();
          }, 500);
        }
      }

      setMyActiveFanMembershipsForArtist(augmentedData);
    } catch (error) {
      console.error("Error fetching my fan memberships data for artist:", error);
      setMyActiveFanMembershipsForArtist([]);
    }
  };

  const checkAndloadCreatorFanMembershipAvailability = async () => {
    try {
      const data: Record<string, any> = await fetchCreatorFanMembershipAvailabilityViaAPI(creatorPaymentsWallet, artistId);

      if (data && Object.keys(data).length > 0) {
        setCreatorFanMembershipAvailability(data);
        return data;
      } else {
        setCreatorFanMembershipAvailability({});
        return null;
      }
    } catch (error) {
      console.error("Error fetching membership data:", error);
      setCreatorFanMembershipAvailability({});
      return null;
    }
  };

  const fetchMembershipData = async (
    fanMembershipAvailabilityData: Record<string, { tokenImg: string; perkIdsOffered: string[]; maxMints?: string }> | null
  ) => {
    try {
      if (fanMembershipAvailabilityData) {
        // Create a deep copy of tierData to avoid mutating the original
        const extendedTierData = JSON.parse(JSON.stringify(tierData));

        // If fanMembershipAvailabilityData has mintableItems, extend the tiers with perks
        Object.entries(fanMembershipAvailabilityData).forEach(([key, item]) => {
          const membershipId = key;
          const perkIds = item.perkIdsOffered || [];

          // Find the corresponding perks from perksData
          const perks = perkIds.map((perkId: string) => perksData.find((perk) => perk.pid === perkId)).filter(Boolean); // Remove any undefined values

          // Update the tier with the perks
          if (extendedTierData[membershipId]) {
            extendedTierData[membershipId].perks = perks;
          }

          // Update the tier with the maxMints
          if (extendedTierData[membershipId]) {
            if (item.maxMints) {
              extendedTierData[membershipId].maxMints = parseInt(item.maxMints);
            } else {
              extendedTierData[membershipId].maxMints = 0; // 0 means unlimited
            }
          }
        });

        // Remove tiers that don't have any perks
        Object.keys(extendedTierData).forEach((key) => {
          if (!extendedTierData[key].perks || extendedTierData[key].perks.length === 0) {
            delete extendedTierData[key];
          }
        });

        setArtistMembershipOptions(extendedTierData);
      } else {
        setArtistMembershipOptions({}); // null means we are still loading, so we set it to {} to show there is no membership options
      }
    } catch (error) {
      console.error("Error fetching membership data:", error);
      setArtistMembershipOptions({});
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatTerm = (term: string) => {
    return term.charAt(0).toUpperCase() + term.slice(1);
  };

  const cleanupActionBuyParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("action");
    window.history.replaceState({}, "", url.toString());
  };

  const closeJoinModal = () => {
    setJoinInnerCircleModalOpen(false);
    cleanupActionBuyParam();
  };

  const showSuccessConfetti = async () => {
    const animation = await confetti({
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      particleCount: 200,
      scalar: 2,
      shapes: ["emoji", "circle", "square"],
      shapeOptions: {
        emoji: {
          value: ["💎", "⭐", "✨", "💫"],
        },
      },
    });

    if (animation) {
      await sleep(10);
      animation.stop();
      if ((animation as any).destroy) {
        (animation as any).destroy();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100px] flex items-center justify-center">
        <Loader className="animate-spin text-yellow-300" size={30} />
      </div>
    );
  }

  if (creatorFanMembershipAvailability && Object.keys(creatorFanMembershipAvailability).length === 0) {
    return (
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="!text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          No Inner Circle Available
        </h2>
        <p className="text-gray-400 text-center md:text-left">{artistName} hasn't set up their Inner Circle fan club program yet.</p>
      </div>
    );
  }

  const hasMultipleMemberships = artistsMembershipOptions && Object.keys(artistsMembershipOptions).length > 1;

  // some mints mave a max amount of mints, so we need to check if the mints are sold out
  const isSoldOut = liveMintStats && liveMintStats.maxMints > 0 && liveMintStats.mints > 0 && liveMintStats.mints >= liveMintStats.maxMints;

  const SubscribeButton = ({ isSingleBuy = false }: { isSingleBuy?: boolean }) => (
    <>
      <div
        className={`${isSoldOut ? "opacity-50" : ""}  relative group w-[260px] md:w-[320px] overflow-hidden rounded-lg p-[2px] ${!addressSol ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <div className="animate-border-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(from_0deg,#22c55e_0deg,#f97316_180deg,transparent_360deg)]"></div>
        <Button
          disabled={isSoldOut ? true : false}
          onClick={() => {
            if (addressSol) {
              setJoinInnerCircleModalOpen(true);
            } else {
              window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search + "&action=buy")}`;
            }
          }}
          className={`relative z-2 !text-black text-base font-semibold px-8 py-4 w-full h-14 md:h-[56px] bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 !opacity-100 flex items-center justify-center gap-2`}>
          <>
            <ShoppingCart className="w-6 h-6" />

            {isSoldOut ? (
              <span className="ml-2">Sold Out!</span>
            ) : (
              <span className="ml-2">{addressSol ? `${isSingleBuy ? "Buy" : "Subscribe"} Now` : `Login to ${isSingleBuy ? "Buy" : "Subscribe"} Now`}</span>
            )}
          </>
        </Button>
      </div>

      {addressSol && requiredSolAmount && (
        <p className="text-gray-400 text-sm mt-2 text-center md:text-left">
          Amount to pay: {requiredSolAmount.toFixed(4)} SOL (${artistsMembershipOptions?.[selectedArtistMembership]?.defaultPriceUSD})
        </p>
      )}
    </>
  );

  console.log("------");
  console.log("isSoldOut", isSoldOut);
  console.log("liveMintStats", liveMintStats);
  console.log("------");

  return (
    <>
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="!text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          Join {artistName}'s Inner Circle
        </h2>
        <p className="text-gray-400 mb-8 text-center md:text-left">An exclusive fan membership program only for hardcore fans!</p>

        {myActiveFanMembershipsForArtist && myActiveFanMembershipsForArtist.length > 0 && (
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                🌟 Your Exclusive Inner Circle Access
              </h3>
              <p className="text-gray-300 mb-6 text-center md:text-left">
                You're part of {artistName}'s exclusive Inner Circle! Here are your active memberships:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {myActiveFanMembershipsForArtist.map((membership: MyFanMembershipType, index: number) => (
                  <div
                    key={index}
                    className="relative p-4 rounded-lg bg-black/40 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer"
                    onClick={() => membership.tokenImg && setSelectedTokenImg(convertTokenImageUrl(membership.tokenImg))}>
                    <div className="flex items-center gap-4">
                      {membership.totalQuantityInBatch && membership.totalQuantityInBatch > 1 && membership.totalQtySentFlag === 0 && (
                        <div className="group">
                          <div className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">
                            {membership.totalQuantityInBatch}
                          </div>
                          <div className="absolute top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            The collectible has {membership.totalQuantityInBatch} copies
                          </div>
                        </div>
                      )}
                      {membership.tokenImg && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden">
                          <img
                            src={convertTokenImageUrl(membership.tokenImg)}
                            alt={`${membership.membershipLabel} Membership Token`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{membership.membershipLabel}</h3>
                        </div>
                        <p className="text-sm text-gray-400">Joined {new Date(membership.createdOnTS).toLocaleDateString()}</p>
                        {membership.expiresInDays !== undefined && (
                          <p className="text-sm mt-1">
                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Valid for {membership.expiresInDays} days</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-300 rounded-full p-[10px] -z-1 mt-4">
                <a
                  className="z-1 bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
                  href={"https://twitter.com/intent/tweet?" + tweetText}
                  data-size="large"
                  target="_blank"
                  rel="noreferrer">
                  <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                    </svg>
                  </span>
                  <p className="z-10">Share this news on X</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {hasMultipleMemberships ? (
          // Multiple membership types view
          <div className="space-y-8">
            {myActiveFanMembershipsForArtist && myActiveFanMembershipsForArtist.length > 0 && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <h2 className="!text-xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Get additional memberships
                </h2>
                <div className="text-gray-300 text-center md:text-left">
                  You are already a member of {artistName}'s Inner Circle! But you can buy more memberships if you choose to, as memberships are NFTs and you
                  can hold multiple of them or trade of gift them.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(artistsMembershipOptions).map(([type, data]) => (
                <div
                  key={type}
                  onClick={() => setSelectedArtistMembership(type)}
                  className={`
                  p-6 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedArtistMembership === type ? "border-yellow-500 bg-yellow-500/10" : "border-gray-800 hover:border-gray-700"}
                `}>
                  <h3 className="text-xl font-semibold mb-2 capitalize">{data.label}</h3>
                  <div className="text-2xl font-bold mb-2">{formatPrice(data.defaultPriceUSD)}</div>
                  <div className="text-sm text-gray-400">{formatTerm(data.term)}</div>
                  <div className="text-yellow-300">{data.maxMints && data.maxMints > 0 ? `Only ${data.maxMints.toLocaleString()} will be sold!` : ""}</div>
                  {liveMintStats && liveMintStats.mints && liveMintStats.mints > 0 ? (
                    <div className="text-yellow-300 mt-2 text-sm">
                      {liveMintStats.mints.toLocaleString()} sold so far. Last purchase: {formatFriendlyDate(liveMintStats.lastBought)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:text-left">
              <SubscribeButton />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Perks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artistsMembershipOptions[selectedArtistMembership].perks.map((perk, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPerk(perk)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${getPerkTypeColor(perk.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPerkTypeIcon(perk.type)}
                        <div>
                          <h4 className="font-medium flex items-center gap-2">{perk.name}</h4>
                          {perk.comingSoon && (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/40">Launching Soon</span>
                          )}
                          <p className="text-sm text-gray-400 mt-1">{perk.description}</p>
                        </div>
                      </div>
                      {perk.terms && (
                        <div className="hidden md:block relative group">
                          <SparklesIcon className="h-6 w-6 text-gray-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[120px] p-2 bg-gray-800 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Click for terms
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Single membership type view
          <div className="space-y-8">
            <div className="p-6 rounded-lg border-2 cursor-pointer transition-all border-yellow-500 bg-yellow-500/10 text-center">
              <div className="text-3xl font-bold mb-2">{formatPrice(artistsMembershipOptions?.t1.defaultPriceUSD || 0)}</div>
              <div className="text-gray-400">{formatTerm(artistsMembershipOptions?.t1.term || "")}</div>
              <div className="text-yellow-300">
                {artistsMembershipOptions?.t1.maxMints && artistsMembershipOptions?.t1.maxMints > 0 ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="animate-pulse">🔥</span>
                    <span className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40 font-medium">
                      Only {artistsMembershipOptions?.t1.maxMints.toLocaleString()} will be sold!
                    </span>
                    <span className="animate-pulse">🔥</span>
                  </div>
                ) : (
                  ""
                )}
                {liveMintStats && liveMintStats.mints && liveMintStats.mints > 0 ? (
                  <div className="text-yellow-300 mt-2 text-sm">
                    {liveMintStats.mints.toLocaleString()} sold so far. Last purchase: {formatFriendlyDate(liveMintStats.lastBought)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 text-center">
              <SubscribeButton isSingleBuy={true} />
            </div>

            <div className="!mt-[10px] opacity-80">
              {nftMarketplaceLink && nftMarketplaceLink !== "" && (
                <div>
                  <Button
                    className="text-sm cursor-pointer !text-orange-500 dark:!text-yellow-300 mr-2"
                    variant="outline"
                    onClick={() => {
                      window.open(nftMarketplaceLink)?.focus();
                    }}>
                    <>
                      <ShoppingCart />
                      <span className="ml-2">Or Buy on NFT Market</span>
                    </>
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Perks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artistsMembershipOptions?.t1.perks.map((perk, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPerk(perk)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${getPerkTypeColor(perk.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPerkTypeIcon(perk.type)}
                        <div>
                          <h4 className="font-medium flex items-center gap-2">{perk.name}</h4>
                          {perk.comingSoon && (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/40">Launching Soon</span>
                          )}
                          <p className="text-sm text-gray-400 mt-1">{perk.description}</p>

                          {perk.linkedRewardPool && (
                            <div
                              className="text-sm text-gray-400 mt-3"
                              onClick={(e) => {
                                window.open(`/?section=reward-pools&poolId=${perk.linkedRewardPool}`, "_blank");
                                e.stopPropagation();
                              }}>
                              <span className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40 font-medium">$ View Reward Pool</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {perk.terms && (
                        <div className="hidden md:block relative group">
                          <SparklesIcon className="h-6 w-6 text-gray-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[120px] p-2 bg-gray-800 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Click for terms
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <span className="text-xs text-gray-700 ml-2 text-left mt-10">
          id: {`fan-${creatorPaymentsWallet.toLowerCase()}-${artistId}-${selectedArtistMembership}`}
        </span>

        {/* Perk Details Modal */}
        {selectedPerk && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-4">
                {getPerkTypeIcon(selectedPerk.type)}
                <h3 className="text-xl font-semibold">{selectedPerk.name}</h3>
              </div>
              <p className="text-gray-400 mb-4">{selectedPerk.description}</p>
              {selectedPerk.howToClaim && (
                <div className="text-sm text-gray-500 mt-4">
                  <strong className="text-white mr-1">How to Claim:</strong> {selectedPerk.howToClaim}
                </div>
              )}
              {selectedPerk.terms && (
                <div className="text-sm text-gray-500 mt-4">
                  <strong className="text-white mr-1">Terms:</strong> {selectedPerk.terms}
                </div>
              )}
              {selectedPerk.linkedRewardPool && (
                <div
                  className="text-sm text-gray-400 mt-3 cursor-pointer"
                  onClick={(e) => {
                    window.open(`/?section=reward-pools&poolId=${selectedPerk.linkedRewardPool}`, "_blank");
                    e.stopPropagation();
                  }}>
                  <span className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40 font-medium">$ View Reward Pool</span>
                </div>
              )}
              <button onClick={() => setSelectedPerk(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Token Image Modal */}
      {selectedTokenImg && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <img src={selectedTokenImg} alt="Membership Token" className="w-[75%] h-auto m-auto rounded-lg" />
            <div>
              <div className="bg-yellow-300 rounded-full p-[10px] -z-1 mt-4">
                <a
                  className="z-1 bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
                  href={"https://twitter.com/intent/tweet?" + tweetText}
                  data-size="large"
                  target="_blank"
                  rel="noreferrer">
                  <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                    </svg>
                  </span>
                  <p className="z-10">Share this news on X</p>
                </a>
              </div>
              <button
                onClick={() => {
                  setSelectedTokenImg(null);
                }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <>
        {joinInnerCircleModalOpen && (
          <>
            {walletType === "phantom" ? (
              <JoinInnerCircleSOL
                artistName={artistName}
                artistSlug={artistSlug}
                artistXLink={artistXLink}
                creatorPaymentsWallet={creatorPaymentsWallet}
                membershipId={selectedArtistMembership}
                artistId={artistId}
                creatorFanMembershipAvailability={creatorFanMembershipAvailability || {}}
                onCloseModal={(isMintingSuccess: boolean) => {
                  closeJoinModal();
                  if (isMintingSuccess) {
                    fetchMyFanMembershipsForThisArtist(true);
                  }
                }}
              />
            ) : (
              <JoinInnerCircleCC
                artistName={artistName}
                artistSlug={artistSlug}
                artistXLink={artistXLink}
                creatorPaymentsWallet={creatorPaymentsWallet}
                membershipId={selectedArtistMembership}
                artistId={artistId}
                creatorFanMembershipAvailability={creatorFanMembershipAvailability || {}}
                onCloseModal={() => {
                  closeJoinModal();
                }}
              />
            )}
          </>
        )}
      </>
    </>
  );
};
