import React, { useEffect, useState } from "react";
import { Music, Users, Tag } from "lucide-react";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { Artist } from "libs/types/common";
import { CollectibleMetadataModal } from "./CollectibleMetadataModal";
import { formatFriendlyDate, toastError, toastSuccess } from "libs/utils/ui";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useAccountStore } from "store/account";
import { useWallet } from "@solana/wallet-adapter-react";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { managementCreateStoryAccount, updateArtistProfileOnBackEndAPI } from "libs/utils";

interface ArtistListProps {
  artists: Artist[];
  onArtistSelect: (artistId: string, artistName: string) => void;
}

export const ArtistList: React.FC<ArtistListProps> = ({ artists, onArtistSelect }) => {
  // Collectible metadata modal state
  const [isCollectibleModalOpen, setIsCollectibleModalOpen] = useState(false);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string>("");
  const [selectedCollectibleTier, setSelectedCollectibleTier] = useState<string>("");
  const [selectedArtistTitle, setSelectedArtistTitle] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [sortedArtists, setSortedArtists] = useState<Artist[]>([]);
  const [loadingStoryAccountForWallet, setLoadingStoryAccountForWallet] = useState<string | null>(null);

  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();

  useEffect(() => {
    console.log("artists", artists);
    // lets move artists who a lastIndexOn value to the top of the list
    const sortedArtists = artists.sort((a, b) => {
      if (a.lastIndexOn && !b.lastIndexOn) return -1;
      if (!a.lastIndexOn && b.lastIndexOn) return 1;
      return 0;
    });
    setSortedArtists(sortedArtists);
  }, [artists]);

  const handleViewCollectibleMetadata = async (artistName: string, artistId: string, creatorPaymentsWallet: string, tier: string) => {
    const collectibleId = `${creatorPaymentsWallet}-${artistId}-${tier}`;
    setSelectedCollectibleId(collectibleId);
    setSelectedArtistTitle(artistName);
    setSelectedCollectibleTier(tier || "");
    setIsCollectibleModalOpen(true);
    setSelectedArtist(sortedArtists.find((artist) => artist.artistId === artistId) || null);
  };

  const handleCloseCollectibleModal = () => {
    setIsCollectibleModalOpen(false);
    setSelectedCollectibleId("");
    setSelectedCollectibleTier("");
    setSelectedArtist(null);
  };

  const handleCollectibleMetadataUpdated = () => {
    // Optionally refresh any data if needed
    console.log("Collectible metadata updated");
  };

  const handlePromoteToVerifiedArtist = async (artistId: string) => {
    alert(`Promoting artist ${artistId} to verified artist`);

    try {
      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      // only send the changed form data to the server to save
      const changedFormData = { isVerifiedArtist: "1" };

      const artistProfileDataToSave = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        adminWallet: publicKey?.toBase58() || "",
        artistId: artistId, // this will trigger the edit workflow
        artistFieldsObject: changedFormData,
      };

      const response = await updateArtistProfileOnBackEndAPI(artistProfileDataToSave);

      toastSuccess("Artist promoted to verified artist successfully. Reload page to verify update.");

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Error updating profile - " + (error as Error).message);
      throw error;
    }
  };

  const getOrCreateStoryAccountForArtist = async (creatorWallet: string, onlyCheckIfAccountExists: boolean = false) => {
    // Validation checks
    if (!creatorWallet) {
      toastError("Creator wallet address is required");
      return;
    }

    if (!publicKey) {
      toastError("Please connect your wallet first");
      return;
    }

    // Prevent multiple simultaneous requests for the same wallet
    if (loadingStoryAccountForWallet === creatorWallet) {
      return;
    }

    setLoadingStoryAccountForWallet(creatorWallet);

    try {
      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      const storyAccountControlResponse = await managementCreateStoryAccount({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        adminWallet: publicKey.toBase58(),
        "userDefaultAddress": creatorWallet,
        "onlyCheckIfAccountExists": onlyCheckIfAccountExists ? "1" : "0",
      });

      /*
    a successful response will look like this:
      {
          "success": true,
          "storyProtocolAddress": "0x9DfF03BE3f0eb7967F3DA78De0A1CF2De61d0D5d",
          "wasNewAccountCreated": false
      }

    lets find the artist in the sortedArtists array and update the _runtimeInjected_storyProtocolAddress field
    */

      if (storyAccountControlResponse.success) {
        if (storyAccountControlResponse.storyProtocolAddress === "") {
          toastError("This user does not have a story account yet!");
        } else {
          // Find the artist and create a new object with the updated story protocol address
          setSortedArtists((prevArtists) =>
            prevArtists.map((artist) => {
              if (artist.creatorWallet === creatorWallet) {
                return {
                  ...artist,
                  _runtimeInjected_storyProtocolAddress: storyAccountControlResponse.storyProtocolAddress,
                };
              }
              return artist;
            })
          );

          if (!onlyCheckIfAccountExists) {
            if (storyAccountControlResponse.wasNewAccountCreated) {
              toastSuccess("New story account created successfully.");
            } else {
              toastSuccess("Story account already exists.");
            }
          } else {
            toastSuccess("Story account found and displayed.");
          }
        }
      } else {
        toastError("Error creating story account: " + (storyAccountControlResponse.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error getting or creating story account: ", error);
      toastError("Error getting or creating story account: " + (error as Error).message);
    } finally {
      setLoadingStoryAccountForWallet(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Music Catalog</h2>
          <p className="text-gray-600 mt-1">Manage artists and their albums</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="">
            {sortedArtists.length} Artists
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedArtists.map((artist) => (
          <Card key={artist.artistId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{artist.name}</h3>
                <a href={`/?artist=${artist.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 mb-2 hover:underline">
                  <p className="text-sm text-gray-500 mb-2">@{artist.slug}</p>
                </a>
                {!artist.lastIndexOn && <div className="text-xs text-gray-500 mb-2 bg-red-500 text-white px-2 py-1 rounded-md">LEGACY ARTIST</div>}
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 mb-2">{artist.artistId}</p>
                  <p className="text-xs text-gray-500 mb-2 text-green-500">
                    Last Index On: {artist.lastIndexOn ? formatFriendlyDate(artist.lastIndexOn) : "N/A"}
                  </p>
                </div>
                <div className="flex flex-col text-sm text-gray-600">
                  {artist.creatorWallet && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Creator wallet:</span>
                      <div className="relative group">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(artist.creatorWallet);
                              toastSuccess("Wallet copied to clipboard!");
                            } catch (err) {
                              console.error("Failed to copy: ", err);
                              toastError("Failed to copy to clipboard");
                            }
                          }}
                          className="text-gray-300 hover:text-gray-200 hover:underline cursor-pointer transition-colors">
                          <span className="font-mono text-xs">
                            {artist.creatorWallet.slice(0, 6)}...{artist.creatorWallet.slice(-4)}
                          </span>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Click to Copy
                        </div>
                      </div>
                    </div>
                  )}
                  {artist.creatorPaymentsWallet && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Creator payment wallet:</span>
                      <div className="relative group">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(artist.creatorPaymentsWallet);
                              toastSuccess("Wallet copied to clipboard!");
                            } catch (err) {
                              console.error("Failed to copy: ", err);
                              toastError("Failed to copy to clipboard");
                            }
                          }}
                          className="text-gray-300 hover:text-gray-200 hover:underline cursor-pointer transition-colors">
                          <span className="font-mono text-xs">
                            {artist.creatorPaymentsWallet.slice(0, 6)}...{artist.creatorPaymentsWallet.slice(-4)}
                          </span>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Click to Copy
                        </div>
                      </div>
                    </div>
                  )}
                  {artist.lastIndexOn && (
                    <>
                      {artist._runtimeInjected_storyProtocolAddress && (
                        <div className="flex items-center space-x-1 mt-2">
                          <span className="text-xs">Story Account:</span>
                          <span className="text-xs">{artist._runtimeInjected_storyProtocolAddress}</span>
                        </div>
                      )}
                      {!artist._runtimeInjected_storyProtocolAddress && artist.creatorWallet && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Button
                            variant="outline"
                            className="text-xs"
                            onClick={() => getOrCreateStoryAccountForArtist(artist.creatorWallet!, true)}
                            disabled={loadingStoryAccountForWallet === artist.creatorWallet}>
                            {loadingStoryAccountForWallet === artist.creatorWallet ? "Loading..." : "Get Story Account"}
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs"
                            onClick={() => getOrCreateStoryAccountForArtist(artist.creatorWallet!)}
                            disabled={loadingStoryAccountForWallet === artist.creatorWallet}>
                            {loadingStoryAccountForWallet === artist.creatorWallet ? "Loading..." : "Create New Story Account"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {artist.artistCampaignCode && (
              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  Campaign: {artist.artistCampaignCode}
                </Badge>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button onClick={() => handleViewCollectibleMetadata(artist.name, artist.artistId, artist.creatorPaymentsWallet, "t1")}>
                <Tag className="w-4 h-4 mr-2" />
                Fan Collectible Metadata
              </Button>
              <Button onClick={() => onArtistSelect(artist.artistId, artist.name)}>View Albums</Button>

              {!artist.isVerifiedArtist ? (
                <Button
                  onClick={() => {
                    handlePromoteToVerifiedArtist(artist.artistId);
                  }}>
                  Promote to Verified Artist
                </Button>
              ) : (
                <p className="text-xs text-gray-500 mb-2 bg-green-800 text-white px-2 py-1 rounded-md">Artist is Already Verified!</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {sortedArtists.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Artists Found</h3>
          <p className="text-gray-600">No artists are currently available in the catalog.</p>
        </div>
      )}

      <CollectibleMetadataModal
        isOpen={isCollectibleModalOpen}
        onClose={handleCloseCollectibleModal}
        collectibleTitle={selectedArtistTitle}
        collectibleId={selectedCollectibleId}
        collectibleTier={selectedCollectibleTier}
        selectedArtist={selectedArtist}
        isFanCollectible={true}
        onMetadataUpdated={handleCollectibleMetadataUpdated}
      />
    </div>
  );
};
