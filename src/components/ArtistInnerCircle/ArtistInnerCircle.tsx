import React, { useEffect, useState } from "react";
import { SparklesIcon, ComputerDesktopIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { Loader, ShoppingCart } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { MembershipData, MyFanMembershipType, Perk } from "libs/types/common";
import { fetchCreatorFanMembershipAvailabilityViaAPI, fetchMyFanMembershipsForArtistViaAPI, fetchSolPrice } from "libs/utils/misc";
import { convertTokenImageUrl, scrollToTopOnMainContentArea } from "libs/utils/ui";
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
            Physical Perk
          </div>
        </div>
      );
    case "virtual":
      return (
        <div className="relative group">
          <ComputerDesktopIcon className="h-6 w-6 text-purple-400" />
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
      return "border-purple-500/20 hover:border-purple-500/40";
  }
};

interface ArtistInnerCircleProps {
  artistName: string;
  artistSlug: string;
  creatorPaymentsWallet: string;
  artistId: string;
}

export const ArtistInnerCircle: React.FC<ArtistInnerCircleProps> = ({ artistName, artistSlug, creatorPaymentsWallet, artistId }) => {
  const { publicKey: publicKeySol, walletType } = useSolanaWallet();
  const addressSol = publicKeySol?.toBase58();
  const [isLoading, setIsLoading] = useState(true);
  const [artistsMembershipOptions, setArtistMembershipOptions] = useState<MembershipData | null>(null);
  const [creatorFanMembershipAvailability, setCreatorFanMembershipAvailability] = useState<Record<string, any> | null>(null);
  const [selectedArtistMembership, setSelectedArtistMembership] = useState<string>("t1");
  const [myActiveFanMembershipsForArtist, setMyActiveFanMembershipsForArtist] = useState<MyFanMembershipType[] | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [joinInnerCircleModalOpen, setJoinInnerCircleModalOpen] = useState<boolean>(false);
  const [selectedTokenImg, setSelectedTokenImg] = useState<string | null>(null);

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
      scrollToTopOnMainContentArea(300);
    }
  }, [isLoading]);

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

      const { currentSolPrice } = await fetchSolPrice();

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

  const fetchMembershipData = async (fanMembershipAvailabilityData: Record<string, { tokenImg: string; perkIdsOffered: string[] }> | null) => {
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

  const SubscribeButton = () => (
    <>
      <div className={`relative group w-[200px] overflow-hidden rounded-lg p-[1.5px] ${!addressSol ? "cursor-not-allowed" : "cursor-pointer"}`}>
        {/* Animated border background */}
        <div className="animate-border-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(from_0deg,#22c55e_0deg,#f97316_180deg,transparent_360deg)]"></div>
        <Button
          onClick={() => {
            if (addressSol) {
              setJoinInnerCircleModalOpen(true);
            } else {
              window.location.href = `${routeNames.login}?from=${encodeURIComponent(location.pathname + location.search + "&action=buy")}`;
            }
          }}
          className={`relative z-2 !text-black text-sm px-[2.35rem] w-full bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 !opacity-100`}>
          <>
            <ShoppingCart />
            <span className="ml-2">{addressSol ? "Subscribe Now" : "Login to Subscribe"}</span>
          </>
        </Button>
      </div>

      {addressSol && requiredSolAmount && (
        <p className="text-gray-400 text-sm mt-2 text-center md:text-left">
          Amount to pay: {requiredSolAmount.toFixed(4)} SOL (${artistsMembershipOptions?.[selectedArtistMembership]?.defaultPriceUSD} USD)
        </p>
      )}
    </>
  );

  const cleanupActionBuyParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("action");
    window.history.replaceState({}, "", url.toString());
  };

  const closeJoinModal = () => {
    setJoinInnerCircleModalOpen(false);
    cleanupActionBuyParam();
  };

  if (isLoading) {
    return (
      <div className="h-[100px] flex items-center justify-center">
        <Loader className="animate-spin" size={30} />
      </div>
    );
  }

  if (creatorFanMembershipAvailability && Object.keys(creatorFanMembershipAvailability).length === 0) {
    return (
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          No Inner Circle Available
        </h2>
        <p className="text-gray-400 text-center md:text-left">{artistName} hasn't set up their Inner Circle fan membership program yet.</p>
      </div>
    );
  }

  const hasMultipleMemberships = artistsMembershipOptions && Object.keys(artistsMembershipOptions).length > 1;

  return (
    <>
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          Join {artistName}'s Inner Circle
        </h2>
        <p className="text-gray-400 mb-8 text-center md:text-left">An exclusive fan membership program for hardcore fans</p>

        {myActiveFanMembershipsForArtist && myActiveFanMembershipsForArtist.length > 0 && (
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                🌟 Your Exclusive Inner Circle Access
              </h3>
              <p className="text-gray-300 mb-6 text-center md:text-left">
                You're part of {artistName}'s exclusive inner circle! Here are your active memberships:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {myActiveFanMembershipsForArtist.map((membership: MyFanMembershipType, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-black/40 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer"
                    onClick={() => membership.tokenImg && setSelectedTokenImg(convertTokenImageUrl(membership.tokenImg))}>
                    <div className="flex items-center gap-4">
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
                        <h4 className="font-semibold capitalize">{membership.membershipLabel} Membership</h4>
                        <p className="text-sm text-gray-400">Joined {new Date(membership.createdOnTS).toLocaleDateString()}</p>
                        {membership.expiresInDays !== undefined && (
                          <p className="text-sm mt-1">
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Valid for {membership.expiresInDays} days</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                  You are already a member of {artistName}'s inner circle! But you can buy more memberships if you choose to, as memberships are NFTs and you
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
                  ${selectedArtistMembership === type ? "border-yellow-500 bg-yellow-500/10" : "border-gray-700 hover:border-gray-600"}
                `}>
                  <h3 className="text-xl font-semibold mb-2 capitalize">{data.label}</h3>
                  <div className="text-2xl font-bold mb-2">{formatPrice(data.defaultPriceUSD)} USD</div>
                  <div className="text-sm text-gray-400">{formatTerm(data.term)}</div>
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
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">Launching Soon</span>
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
              <div className="text-3xl font-bold mb-2">{formatPrice(artistsMembershipOptions?.t1.defaultPriceUSD || 0)} USD</div>
              <div className="text-gray-400">{formatTerm(artistsMembershipOptions?.t1.term || "")}</div>
            </div>

            <div className="mt-8 text-center">
              <SubscribeButton />
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
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">Launching Soon</span>
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
        )}

        {/* Perk Details Modal */}
        {selectedPerk && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
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
              <button onClick={() => setSelectedPerk(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Token Image Modal */}
      {selectedTokenImg && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <img src={selectedTokenImg} alt="Membership Token" className="w-[90%] h-auto m-auto rounded-lg" />
            <button
              onClick={() => setSelectedTokenImg(null)}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
              Close
            </button>
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
