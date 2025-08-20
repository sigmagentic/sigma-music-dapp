import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@solana/wallet-adapter-react";
import { GetNFMeModal } from "components/GetNFMeModal";
import { NFMePreferencesModal } from "components/NFMePreferencesModal";
import { SOL_ENV_ENUM } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { MusicTrack } from "libs/types";
import { isUserArtistType, toastError, toastSuccess, updateUserProfileOnBackEndAPI } from "libs/utils";
import { useAccountStore } from "store/account";
import { ArtistProfile } from "./ArtistProfile";
import { EditProfileModal, ProfileFormData } from "./EditProfileModal";

type MyProfileProps = {
  navigateToDeepAppView: (e: any) => any;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
  onCloseMusicPlayer: () => void;
};

type ProfileTab = "artist" | "profile";

export const MyProfile = ({ navigateToDeepAppView, viewSolData, onCloseMusicPlayer }: MyProfileProps) => {
  const { userInfo, publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { signMessage } = useWallet();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const [showNfMeIdModal, setShowNfMeIdModal] = useState<boolean>(false);
  const [showNfMePreferencesModal, setShowNfMePreferencesModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const { userWeb2AccountDetails, myPaymentLogs, myMusicAssetPurchases, updateUserWeb2AccountDetails } = useAccountStore();

  // Tab state - default to "artist" if user is an artist, otherwise "profile"
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    isUserArtistType(userWeb2AccountDetails.isVerifiedArtist, userWeb2AccountDetails.profileTypes) ? "artist" : "profile"
  );

  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  // Cached Signature Store Items
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  // Profile type mapping function
  const getProfileTypeLabel = (profileTypes: string[]): string => {
    if (profileTypes.length === 0) {
      return "Not Specified";
    }

    const allUserProfileTypes: string[] = [];

    if (profileTypes.includes("remixer")) {
      allUserProfileTypes.push("Remixer");
    }

    if (profileTypes.includes("composer")) {
      allUserProfileTypes.push("Composer");
    }

    if (profileTypes.includes("fan")) {
      allUserProfileTypes.push("Fan");
    }

    return allUserProfileTypes.join(", ");
  };

  // Handle profile edit save
  const handleProfileSave = async (data: ProfileFormData) => {
    try {
      // Here you would typically make an API call to update the user's profile
      console.log("Saving profile data:", data);

      const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey: solanaPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to valid signature to prove account ownership");
      }

      const profileDataToSave: Record<string, any> = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        addr: displayPublicKey, // this should match the creatorWallet on the artist profile (if user is an artist)
        chainId: chainId,
        displayName: data.name,
        billingEmail: data.billingEmail,
        profileTypes: data.profileTypes,
        profileImage: data.profileImage,
      };

      // If the user is using a native wallet, we need to save the primary account email
      if (walletType !== "web3auth" && data.primaryAccountEmail) {
        profileDataToSave.primaryAccountEmail = data.primaryAccountEmail;
      }

      const response = await updateUserProfileOnBackEndAPI(profileDataToSave);
      console.log("Profile saved:", response);

      const updatedUserWeb2AccountDetails = { ...response };
      delete updatedUserWeb2AccountDetails.chainId;

      updateUserWeb2AccountDetails(updatedUserWeb2AccountDetails);

      toastSuccess("Profile saved successfully", true);

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Error updating profile - " + (error as Error).message, true);
      throw error;
    }
  };

  // Render the app profile content
  const renderAppProfile = () => (
    <>
      {/* User Details Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your Details</h2>
          {userWeb2AccountDetails.isVerifiedArtist && (
            <div className="text-lg text-yellow-300 font-bold border-2 border-yellow-300 rounded-lg p-2">Verified Artist Account</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="w-32 h-32 rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
            {userInfo.profileImage || userWeb2AccountDetails.profileImage ? (
              <img src={userWeb2AccountDetails.profileImage || userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <UserIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="flex flex-col space-y-2 overflow-x-auto w-full">
            <>
              <div>
                <label className="text-gray-400 text-sm flex items-center">Profile Type</label>
                <p className="text-lg">{getProfileTypeLabel(userWeb2AccountDetails.profileTypes || [])}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <p className="text-lg">{userInfo.name || userWeb2AccountDetails.displayName || "Not provided"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Account Email</label>
                <p className="text-lg">{userInfo.email || userWeb2AccountDetails.primaryAccountEmail || "Not provided"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Billing Email</label>
                <p className="text-lg">{userWeb2AccountDetails.billingEmail || "Not provided"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Solana Wallet Address</label>
                <p className="text-lg font-mono">{displayPublicKey ? displayPublicKey.toString() : "Not connected"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Story Protocol Address</label>
                <p className="text-lg font-mono">{userWeb2AccountDetails.storyProtocolAddress || "Not connected"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Last Login Session</label>
                <p className="text-lg font-mono">
                  {userWeb2AccountDetails.lastLoginTS ? new Date(userWeb2AccountDetails.lastLoginTS).toLocaleString() : "Not Known"}
                </p>
              </div>
              {/* Edit Profile Button */}
              <div className="flex justify-center md:justify-start">
                <button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                  onClick={() => setShowEditProfileModal(true)}>
                  Edit Profile Information
                </button>
              </div>
            </>
          </div>
        </div>
      </div>

      {/* App Preferences Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your App Preferences</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex flex-col space-y-2">
            <button
              className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]"
              onClick={() => {
                setShowNfMePreferencesModal(true);
              }}>
              Save Music Genre Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Music Asset Purchases Section */}
      <div className="bg-black rounded-lg p-6">
        <h2 className="!text-2xl font-bold mb-4">Your Music Asset Purchases</h2>
        {myMusicAssetPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">What You Bought</th>
                  <th className="pb-3">Sale Type</th>
                </tr>
              </thead>
              <tbody>
                {myMusicAssetPurchases.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3">{new Date(log.purchasedOn).toLocaleString()}</td>
                    <td className="py-3">
                      <>
                        <div
                          className="cursor-pointer hover:underline text-blue-400"
                          onClick={() => navigateToDeepAppView({ artistSlug: log._artistSlug, albumId: log.albumId })}>
                          Album: {log._albumName} by {log._artistName}
                        </div>
                      </>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-400">
                        {log.albumSaleTypeOption === "1" && "Digital Album + Download Only"}
                        {log.albumSaleTypeOption === "2" && "Digital Album + Download + Collectible (NFT)"}
                        {log.albumSaleTypeOption === "3" && "Digital Album + Commercial License + Download + Collectible (NFT)"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Purchase Log Section */}
      <div className="bg-black rounded-lg p-6">
        <h2 className="!text-2xl font-bold mb-4">Your Full Purchase Log</h2>
        {myPaymentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">What You Bought</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {myPaymentLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3">{new Date(log.createdOn).toLocaleString()}</td>
                    <td className="py-3">
                      {log.task === "buyAlbum" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => navigateToDeepAppView({ artistSlug: log._artistSlug, albumId: log.albumId })}>
                            Album: {log._albumName} by {log._artistName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {log.albumSaleTypeOption === "1" && "Digital Album + Download Only"}
                            {log.albumSaleTypeOption === "2" && "Digital Album + Download + Collectible (NFT)"}
                            {log.albumSaleTypeOption === "3" && "Digital Album + Commercial License + Download + Collectible (NFT)"}
                          </div>
                        </>
                      )}

                      {log.task === "joinFanClub" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => {
                              const campaign = log._artistCampaignCode;
                              const country = log._artistSubGroup1Code;
                              const team = log._artistSubGroup2Code;

                              if (campaign && country && team) {
                                navigateToDeepAppView({
                                  artistCampaignCode: campaign,
                                  artistSubGroup1Code: country,
                                  artistSubGroup2Code: team,
                                  artistSlug: log._artistSlug,
                                  artistProfileTab: "fan",
                                });
                              } else {
                                navigateToDeepAppView({ artistSlug: log._artistSlug, artistProfileTab: "fan" });
                              }
                            }}>
                            Artist: {log._artistName}
                          </div>
                          <div>Membership ID: {log.membershipId}</div>
                        </>
                      )}

                      {log.task === "remix" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => navigateToDeepAppView({ appSection: "remix", sectionView: "myRemixJobs" })}>
                            Remix Track: {log.promptParams?.songTitle} based on {log.promptParams?.refTrack_alId}
                          </div>
                        </>
                      )}

                      {log.task === "buyXP" && (
                        <>
                          <div className="cursor-pointer hover:underline text-blue-400">XP Boost for {log?.XPBeingBought || "N/A"} XP</div>
                        </>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded ${
                          log.paymentStatus === "success"
                            ? "bg-green-900 text-green-300"
                            : log.paymentStatus === "failed"
                              ? "bg-red-900 text-red-300"
                              : "bg-yellow-900 text-yellow-300"
                        }`}>
                        {log.task === "remix" && log.paymentStatus === "new" && "Pending AI Remix..."}
                        {!(log.task === "remix" && log.paymentStatus === "new") && log.paymentStatus.charAt(0).toUpperCase() + log.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">{log.type === "cc" ? `$${log.amount}` : `${log.amount} SOL`}</td>
                    <td className="py-3">{log.type === "sol" ? "SOL" : "Credit Card"}</td>
                    <td className="py-3">
                      {log.type === "sol" && log.tx && (
                        <a href={`https://solscan.io/tx/${log.tx}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          View on Blockchain Explorer
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col w-full px-4">
      {/* Tab Navigation - Only show if user is an artist */}
      <div className="mt-3 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "profile" ? "bg-yellow-300 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            }`}>
            App Profile
          </button>

          {isUserArtistType(userWeb2AccountDetails.isVerifiedArtist, userWeb2AccountDetails.profileTypes) && (
            <button
              onClick={() => setActiveTab("artist")}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "artist" ? "bg-yellow-300 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}>
              Artist Profile
            </button>
          )}
        </div>
      </div>

      {/* Render content based on active tab */}
      {activeTab === "artist" ? <ArtistProfile onCloseMusicPlayer={onCloseMusicPlayer} viewSolData={viewSolData} /> : renderAppProfile()}

      {/* NFMe ID Claim Modal */}
      {showNfMeIdModal && <GetNFMeModal setShowNfMeIdModal={setShowNfMeIdModal} setShowNfMePreferencesModal={setShowNfMePreferencesModal} />}

      {/* NFMe Preferences Modal */}
      <NFMePreferencesModal isOpen={showNfMePreferencesModal} onClose={() => setShowNfMePreferencesModal(false)} />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSave={handleProfileSave}
        walletType={walletType || ""}
        initialData={{
          profileTypes: userWeb2AccountDetails.profileTypes || [],
          name: userInfo.name || userWeb2AccountDetails.displayName || "",
          primaryAccountEmail: userInfo.email || userWeb2AccountDetails.primaryAccountEmail || "",
          billingEmail: userWeb2AccountDetails.billingEmail || "",
          profileImage: userInfo.profileImage || userWeb2AccountDetails.profileImage || "",
        }}
      />
    </div>
  );
};
