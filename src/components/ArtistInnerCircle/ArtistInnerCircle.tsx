import React, { useEffect, useState } from "react";
import { SparklesIcon, ComputerDesktopIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { useWallet } from "@solana/wallet-adapter-react";
import { INNER_CIRCLE_PRICE_IN_USD } from "config";
import { fetchSolPrice, getApiWeb2Apps } from "libs/utils/misc";
import { JoinInnerCircle } from "./JoinInnerCircle";

interface Perk {
  name: string;
  type: "physical" | "virtual";
  description: string;
  terms?: string;
  howToClaim?: string;
}

interface MyFanMembershipType {
  creatorSlug: string;
  membershipId: string;
  joinedOn: number;
}

interface MembershipType {
  id: string;
  priceUSD: number;
  term: "lifetime" | "annual" | "monthly";
  perks: Perk[];
}

interface MembershipData {
  [key: string]: MembershipType;
}

interface ArtistInnerCircleProps {
  artistName: string;
  creatorWallet: string;
  artistSlug: string;
}

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

export const ArtistInnerCircle: React.FC<ArtistInnerCircleProps> = ({ artistName, creatorWallet, artistSlug }) => {
  const { publicKey: publicKeySol } = useWallet();
  const addressSol = publicKeySol?.toBase58();
  const [isLoading, setIsLoading] = useState(true);
  const [artistsMembershipOptions, setArtistMembershipOptions] = useState<MembershipData>({});
  const [allMyFanMemberships, setAllMyFanMemberships] = useState<MyFanMembershipType[] | []>([]);
  const [selectedArtistMembership, setSelectedArtistMembership] = useState<string>("base");
  const [myActiveFanMembershipsForArtist, setMyActiveFanMembershipsForArtist] = useState<MyFanMembershipType[] | []>([]);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [joinInnerCircleModalOpen, setJoinInnerCircleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { currentSolPrice } = await fetchSolPrice();

        // Calculate required SOL amount based on USD price
        const solAmount = INNER_CIRCLE_PRICE_IN_USD / currentSolPrice;
        setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
  }, []);

  useEffect(() => {
    const fetchMembershipData = async () => {
      try {
        // Mock API call - replace with actual API endpoint
        // const response = await fetch(`${getApiWeb2Apps()}/sigma/artistMembershipOptions?creatorSlug=${artistSlug}`);

        // if (!response.ok) {
        //   throw new Error("Failed to fetch membership options ");
        // }

        // const data = await response.json();

        // const data = {
        //   base: {
        //     id: "base",
        //     priceUSD: 10,
        //     term: "lifetime" as const,
        //     perks: [
        //       {
        //         name: "20% Discount on All Music NFTs",
        //         type: "physical" as const,
        //         description: "Each time I drop a new Music NFT, you get a 20% discount on it",
        //         terms: "",
        //       },
        //       {
        //         name: "20% Discount on All Merchandise",
        //         type: "physical" as const,
        //         description: "Get 20% off all merchandise on my store",
        //         terms: "",
        //       },

        //       {
        //         name: "Monthly Video Group Call with all Fans",
        //         type: "physical" as const,
        //         description: "I'll give you a 10-minute video call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //         howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
        //       },
        //     ],
        //   },
        //   premium: {
        //     id: "premium",
        //     priceUSD: 100,
        //     term: "annual" as const,
        //     perks: [
        //       {
        //         name: "Everything in the Base Tier",
        //         type: "physical" as const,
        //         description: "Access to everything in the base tier",
        //         terms: "",
        //       },
        //       {
        //         name: "10 Min Meet and Greet at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to meet me",
        //         terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
        //         howToClaim:
        //           "Hold the inner circle fan membership NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
        //       },
        //       {
        //         name: "25% Revenue Share on All Music NFTs Sales",
        //         type: "physical" as const,
        //         description: "Help promote my music and share in the revenue from all sales",
        //         terms: "",
        //       },
        //       {
        //         name: "Access to VIP Lounge at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to chill at my VIP lounge",
        //         terms: "Note that this only applies to performances that have a VIP lounge planned",
        //       },
        //       {
        //         name: "Personalized Video Message",
        //         type: "physical" as const,
        //         description: "I'll record a personalized video message for you",
        //         terms: "",
        //       },
        //       {
        //         name: "20 Min Voice Call",
        //         type: "physical" as const,
        //         description: "I'll give you a 20-minute voice call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //       },
        //     ],
        //   },
        // };

        // const data = {
        //   base: {
        //     id: "base",
        //     priceUSD: 10,
        //     term: "lifetime" as const,
        //     perks: [
        //       {
        //         name: "Free Highest Rarity Tier Album Airdrop",
        //         type: "virtual" as const,
        //         description: "Each time I drop a new Music Album NFT, you get the highest rarity tier for free",
        //         terms: "",
        //       },
        //       {
        //         name: "10 Min Meet and Greet at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to meet me",
        //         terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
        //         howToClaim:
        //           "Hold the inner circle fan membership NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
        //       },
        //       {
        //         name: "20 Min Voice Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 20-minute voice call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //         howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
        //       },
        //       {
        //         name: "10 Min Video Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 10-minute video call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //         howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
        //       },
        //     ],
        //   },
        //   premium: {
        //     id: "premium",
        //     priceUSD: 100,
        //     term: "annual" as const,
        //     perks: [
        //       {
        //         name: "Everything in the Base Tier",
        //         type: "virtual" as const,
        //         description: "Access to everything in the base tier",
        //         terms: "",
        //       },
        //       {
        //         name: "Access to VIP Lounge at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to chill at my VIP lounge",
        //         terms: "Note that this only applies to performances that have a VIP lounge planned",
        //       },
        //     ],
        //   },
        // };

        /*
        const data = {
          base: {
            id: "base",
            priceUSD: 10,
            term: "lifetime" as const,
            perks: [
              {
                name: "Free Highest Rarity Tier Album Airdrop",
                type: "virtual" as const,
                description: "Each time I drop a new Music Album NFT, you get the highest rarity tier for free",
                terms: "",
                howToClaim:
                  "Hold the inner circle fan membership NFT and you'll automatically receive the highest rarity tier for free each time the artist releases a new Music Album NFT",
              },
              {
                name: "10 Min Meet and Greet at My Performances",
                type: "physical" as const,
                description: "If I perform at an event, you can use your NFT to meet me",
                terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
                howToClaim: "Hold the inner circle fan membership NFT and show it to the artist's crew at the event",
              },
              {
                name: "20 Min Voice Call",
                type: "virtual" as const,
                description: "I'll give you a 20-minute voice call to chat",
                terms: "Can be redeemed once a month per user who holds this tier",
                howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
              },
              {
                name: "10 Min Video Call",
                type: "virtual" as const,
                description: "I'll give you a 10-minute video call to chat",
                terms: "Can be redeemed once a month per user who holds this tier",
                howToClaim: "Hold the inner circle fan membership NFT, DM me on X and we can arrange a time to chat",
              },
            ],
          },
        };
        */

        const data = {};

        setArtistMembershipOptions(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching membership data:", error);
        setIsLoading(false);
      }
    };

    fetchMembershipData();
    fetchMyFanMemberships();
  }, [creatorWallet]);

  useEffect(() => {
    if (allMyFanMemberships.length > 0) {
      const myActiveFanMembershipList = allMyFanMemberships.filter((membership) => membership.creatorSlug === artistSlug);

      if (myActiveFanMembershipList.length > 0) {
        setMyActiveFanMembershipsForArtist(myActiveFanMembershipList);
      }
    }
  }, [allMyFanMemberships]);

  const fetchMyFanMemberships = async () => {
    try {
      // Mock API call - replace with actual API endpoint
      // const response = await fetch(`${getApiWeb2Apps()}/sigma/myMemberships?userAddr=${addressSol}`);

      // if (!response.ok) {
      //   throw new Error("Failed to fetch your memberships");
      // }

      // const data = await response.json();

      // const data = [
      //   {
      //     creatorSlug: "7g0strike",
      //     membershipId: "base",
      //     joinedOn: 1741831205,
      //   },
      //   {
      //     creatorSlug: "yfgp",
      //     membershipId: "base",
      //     joinedOn: 1741831338,
      //   },
      // ];

      const data: MyFanMembershipType[] = [];

      setAllMyFanMemberships(data);
    } catch (error) {
      console.error("Error fetching membership data:", error);
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

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-800 rounded w-3/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-800 rounded"></div>
        ))}
      </div>
    </div>
  );

  const SubscribeButton = () => (
    <>
      <button
        disabled={!addressSol}
        onClick={() => setJoinInnerCircleModalOpen(true)}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
        Subscribe Now
      </button>
      {!addressSol && <p className="text-gray-400 text-sm mt-2">Login first to subscribe</p>}
      {addressSol && requiredSolAmount && (
        <p className="text-gray-400 text-sm mt-2">
          Amount to pay: {requiredSolAmount.toFixed(4)} SOL (${INNER_CIRCLE_PRICE_IN_USD})
        </p>
      )}
    </>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (Object.keys(artistsMembershipOptions).length === 0) {
    return (
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          No Inner Circle Available
        </h2>
        <p className="text-gray-400 text-center md:text-left">{artistName} hasn't set up their Inner Circle fan membership program yet.</p>
      </div>
    );
  }

  const hasMultipleMemberships = Object.keys(artistsMembershipOptions).length > 1;

  return (
    <>
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          Join {artistName}'s Inner Circle
        </h2>
        <p className="text-gray-400 mb-8 text-center md:text-left">An exclusive fan membership program for hardcore fans</p>

        {myActiveFanMembershipsForArtist.length > 0 && (
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                🌟 Your Exclusive Inner Circle Access
              </h3>
              <p className="text-gray-300 mb-6 text-center md:text-left">
                You're part of {artistName}'s exclusive inner circle! Here are your active memberships:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {myActiveFanMembershipsForArtist.map((membership, index) => (
                  <div key={index} className="p-4 rounded-lg bg-black/40 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-500/10">
                        <SparklesIcon className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">{membership.membershipId} Membership</h4>
                        <p className="text-sm text-gray-400">Joined {new Date(membership.joinedOn * 1000).toLocaleDateString()}</p>
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
            {myActiveFanMembershipsForArtist.length > 0 && (
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
                  <h3 className="text-xl font-semibold mb-2 capitalize">{type}</h3>
                  <div className="text-2xl font-bold mb-2">{formatPrice(data.priceUSD)}</div>
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
                          <h4 className="font-medium">{perk.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{perk.description}</p>
                        </div>
                      </div>
                      {perk.terms && (
                        <div className="relative group">
                          <SparklesIcon className="h-6 w-6 text-gray-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {perk.terms}
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
              <div className="text-3xl font-bold mb-2">{formatPrice(artistsMembershipOptions.base.priceUSD)}</div>
              <div className="text-gray-400">{formatTerm(artistsMembershipOptions.base.term)}</div>
            </div>

            <div className="mt-8 text-center">
              <SubscribeButton />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Perks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artistsMembershipOptions.base.perks.map((perk, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPerk(perk)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${getPerkTypeColor(perk.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPerkTypeIcon(perk.type)}
                        <div>
                          <h4 className="font-medium">{perk.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{perk.description}</p>
                        </div>
                      </div>
                      {perk.terms && (
                        <div className="relative group">
                          <SparklesIcon className="h-6 w-6 text-gray-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {perk.terms}
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
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-4">
                {getPerkTypeIcon(selectedPerk.type)}
                <h3 className="text-xl font-semibold">{selectedPerk.name}</h3>
              </div>
              <p className="text-gray-400 mb-4">{selectedPerk.description}</p>
              {selectedPerk.howToClaim && (
                <div className="text-sm text-gray-500 mt-4">
                  <strong className="text-white">How to Claim:</strong> {selectedPerk.howToClaim}
                </div>
              )}
              {selectedPerk.terms && (
                <div className="text-sm text-gray-500 mt-4">
                  <strong className="text-white">Terms:</strong> {selectedPerk.terms}
                </div>
              )}
              <button onClick={() => setSelectedPerk(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <>
        {joinInnerCircleModalOpen && (
          <JoinInnerCircle
            artistName={artistName}
            artistSlug={artistSlug}
            creatorWallet={creatorWallet}
            membershipId={selectedArtistMembership}
            onCloseModal={(isMintingSuccess: boolean) => {
              setJoinInnerCircleModalOpen(false);

              if (isMintingSuccess) {
                fetchMyFanMemberships();
              }
            }}
          />
        )}
      </>
    </>
  );
};
