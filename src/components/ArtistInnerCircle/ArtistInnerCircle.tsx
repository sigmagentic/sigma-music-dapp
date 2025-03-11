import React, { useEffect, useState } from "react";
import { SparklesIcon, ComputerDesktopIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { getApiWeb2Apps } from "libs/utils/misc";

interface Perk {
  name: string;
  type: "physical" | "virtual";
  description: string;
  terms?: string;
}

interface MembershipType {
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

export const ArtistInnerCircle: React.FC<ArtistInnerCircleProps> = ({ artistName, creatorWallet }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [membershipData, setMembershipData] = useState<MembershipData>({});
  const [selectedMembership, setSelectedMembership] = useState<string>("base");
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);

  useEffect(() => {
    const fetchMembershipData = async () => {
      try {
        // Mock API call - replace with actual API endpoint
        // const response = await fetch(`${getApiWeb2Apps()}/datadexapi/artist/memberships?creatorWallet=${creatorWallet}`);

        // if (!response.ok) {
        //   throw new Error("Failed to fetch membership data");
        // }

        // const data = await response.json();

        // const data = {
        //   base: {
        //     priceUSD: 10,
        //     term: "lifetime" as const,
        //     perks: [
        //       {
        //         name: "Free Highest Rarity Tier Album Airdrop",
        //         type: "virtual" as const,
        //         description: "Each time I drop a new Music Album NFT, you get the highest rarity tier airdropped to you",
        //         terms: "",
        //       },
        //       {
        //         name: "10 Min Meet and Greet at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to meet me",
        //         terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
        //       },
        //       {
        //         name: "25% Off My Merchandise",
        //         type: "physical" as const,
        //         description: "Get 25% off official merchandise",
        //         terms: "",
        //       },
        //       {
        //         name: "20 Min Voice Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 20-minute voice call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //       },
        //       {
        //         name: "10 Min Video Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 10-minute video call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //       },
        //     ],
        //   },
        //   premium: {
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

        // const data = {
        //   base: {
        //     priceUSD: 10,
        //     term: "lifetime" as const,
        //     perks: [
        //       {
        //         name: "Free Highest Rarity Tier Album Airdrop",
        //         type: "virtual" as const,
        //         description: "Each time I drop a new Music Album NFT, you get the highest rarity tier airdropped to you",
        //         terms: "",
        //       },
        //       {
        //         name: "10 Min Meet and Greet at My Performances",
        //         type: "physical" as const,
        //         description: "If I perform at an event, you can use your NFT to meet me",
        //         terms: "Note that this only applies to performances that have a meet and greet planned (which are most events with paid tickets)",
        //       },
        //       {
        //         name: "25% Off My Merchandise",
        //         type: "physical" as const,
        //         description: "Get 25% off official merchandise",
        //         terms: "",
        //       },
        //       {
        //         name: "20 Min Voice Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 20-minute voice call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //       },
        //       {
        //         name: "10 Min Video Call",
        //         type: "virtual" as const,
        //         description: "I'll give you a 10-minute video call to chat",
        //         terms: "Can be redeemed once a month per user who holds this tier",
        //       },
        //     ],
        //   },
        // };

        const data = {};

        setMembershipData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching membership data:", error);
        setIsLoading(false);
      }
    };

    fetchMembershipData();
  }, [creatorWallet]);

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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (Object.keys(membershipData).length === 0) {
    return (
      <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
          No Inner Circle Available
        </h2>
        <p className="text-gray-400 text-center md:text-left">{artistName} hasn't set up their Inner Circle fan membership program yet.</p>
      </div>
    );
  }

  const hasMultipleMemberships = Object.keys(membershipData).length > 1;

  return (
    <div className="max-w-4xl mx-auto md:m-[initial] p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left">
        Join {artistName}'s Inner Circle
      </h2>
      <p className="text-gray-400 mb-8 text-center md:text-left">An exclusive fan membership program for hardcore fans</p>

      {hasMultipleMemberships ? (
        // Multiple membership types view
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(membershipData).map(([type, data]) => (
              <div
                key={type}
                onClick={() => setSelectedMembership(type)}
                className={`
                  p-6 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedMembership === type ? "border-yellow-500 bg-yellow-500/10" : "border-gray-700 hover:border-gray-600"}
                `}>
                <h3 className="text-xl font-semibold mb-2 capitalize">{type}</h3>
                <div className="text-2xl font-bold mb-2">{formatPrice(data.priceUSD)}</div>
                <div className="text-sm text-gray-400">{formatTerm(data.term)}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:text-left">
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Subscribe Now
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Perks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {membershipData[selectedMembership].perks.map((perk, index) => (
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
            <div className="text-3xl font-bold mb-2">{formatPrice(membershipData.base.priceUSD)}</div>
            <div className="text-gray-400">{formatTerm(membershipData.base.term)}</div>
          </div>

          <div className="mt-8 text-center">
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Subscribe Now
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Perks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {membershipData.base.perks.map((perk, index) => (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-2">{selectedPerk.name}</h3>
            <p className="text-gray-400 mb-4">{selectedPerk.description}</p>
            {selectedPerk.terms && (
              <div className="text-sm text-gray-500">
                <strong>Terms:</strong> {selectedPerk.terms}
              </div>
            )}
            <button onClick={() => setSelectedPerk(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
