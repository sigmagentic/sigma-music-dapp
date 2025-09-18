import React, { useState, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@solana/wallet-adapter-react";
import { NFMePreferencesModal } from "components/NFMePreferencesModal";
import { SOL_ENV_ENUM } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { MusicTrack } from "libs/types";
import { toastError, toastSuccess, updateUserProfileOnBackEndAPI } from "libs/utils";
import { useAccountStore } from "store/account";
import { ArtistProfile } from "./ArtistProfile";
import { EditUserProfileModal, ProfileFormData } from "./EditUserProfileModal";
import { Button } from "libComponents/Button";

type MyProfileProps = {
  navigateToDeepAppView: (e: any) => any;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
  onCloseMusicPlayer: () => void;
  setHomeMode: (homeMode: string) => void;
};

export const MyProfile = ({ navigateToDeepAppView, viewSolData, onCloseMusicPlayer, setHomeMode }: MyProfileProps) => {
  const { userInfo, publicKey: web3AuthPublicKey, web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { signMessage } = useWallet();
  const { userWeb2AccountDetails, myPaymentLogs, myMusicAssetPurchases, updateUserWeb2AccountDetails } = useAccountStore();
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();

  const [showNfMePreferencesModal, setShowNfMePreferencesModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [tabsOrdered, setTabsOrdered] = useState<string[]>(["profile"]);
  const [activeTab, setActiveTab] = useState<"artist" | "profile">("profile");

  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey; // Use the appropriate public key based on wallet type

  useEffect(() => {
    console.log("userWeb2AccountDetails.profileTypes", userWeb2AccountDetails.profileTypes);

    // from the URL we can get these optional params: view=artistProfile&action=createAlbum
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");
    const action = urlParams.get("action");

    if (view === "artistProfile") {
      setActiveTab("artist");
      setTabsOrdered(["profile", "artist"]);
    }
  }, [userWeb2AccountDetails.profileTypes]);

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

  const handleProfileSave = async (data: ProfileFormData) => {
    try {
      // Here you would typically make an API call to update the user's profile
      console.log("Saving profile data:", data);

      if (Object.keys(data).length === 0) {
        toastError("Nothing changed so skipped saving");
        return true;
      }

      const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
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
      };

      if (data.name) {
        profileDataToSave.displayName = data.name.trim();
      }

      if (data.billingEmail) {
        profileDataToSave.billingEmail = data.billingEmail.trim();
      }

      if (data.profileImage) {
        profileDataToSave.profileImage = data.profileImage.trim();
      }

      if (data.profileTypes) {
        profileDataToSave.profileTypes = data.profileTypes;
      }

      // If the user is using a solana wallet, only then we allow primary account email to be manually overridden (web3auth users cant do this)
      if (walletType !== "web3auth" && data.primaryAccountEmail) {
        profileDataToSave.primaryAccountEmail = data.primaryAccountEmail.trim();
      }

      const response = await updateUserProfileOnBackEndAPI(profileDataToSave);

      const updatedUserWeb2AccountDetails = { ...response };
      delete updatedUserWeb2AccountDetails.chainId;

      updateUserWeb2AccountDetails(updatedUserWeb2AccountDetails);
      toastSuccess("Profile saved successfully");

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Error updating profile - " + (error as Error).message);
      throw error;
    }
  };

  const renderAppProfile = () => (
    <>
      {/* User Details Section */}
      <div className="rounded-lg p-6 mb-6 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-xl !md:text-xl font-bold mb-4 text-center md:text-left">Your User Profile</h2>
          {/* <div
            className={`text-md font-bold border-2 rounded-lg p-2 ${userWeb2AccountDetails.isVerifiedUser ? "bg-yellow-300text-black" : "bg-gray-500 text-white"}`}>
            {userWeb2AccountDetails.isVerifiedUser ? "Verified User Account" : "Unverified User Account"}
          </div> */}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="w-32 h-32 md:w-60 md:h-[auto] md:aspect-square rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
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
                <p className="text-lg">{userWeb2AccountDetails.displayName || userInfo.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Account Email</label>
                <p className="text-lg">{userWeb2AccountDetails.primaryAccountEmail || userInfo.email || "Not provided"}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Billing / Payouts Email</label>
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
              <div className="flex justify-center md:justify-end">
                <Button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                  onClick={() => {
                    setShowEditProfileModal(true);
                  }}>
                  Edit Account Profile
                </Button>
              </div>
            </>
          </div>
        </div>
      </div>

      {/* App Preferences Section */}
      <div className="hidden rounded-lg p-6 mb-6 border-b border-gray-800">
        <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your App Preferences</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex flex-col space-y-2">
            <button
              className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg"
              onClick={() => {
                setShowNfMePreferencesModal(true);
              }}>
              Save Music Genre Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Music Asset Purchases Section */}
      <div className="rounded-lg p-6 mb-6 border-b border-gray-800">
        <h2 className="!text-xl font-bold mb-4">Your Music Asset Purchases</h2>
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
                        {log.albumSaleTypeOption === "4" && "Digital Album + Commercial License + Download"}
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
      <div className="rounded-lg p-6 border-b border-gray-800">
        <h2 className="!text-xl font-bold mb-4">Your Full Purchase Log</h2>
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
                            {log.albumSaleTypeOption === "4" && "Digital Album + Commercial License + Download"}
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
                          <div className="">XP Boost for {log?.XPBeingBought || "N/A"} XP</div>
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
                    <td className="py-3">{log.type === "cc" ? `$${log.amount}` : log.type === "xp" ? `${log.amount} XP` : `${log.amount} SOL`}</td>
                    <td className="py-3">{log.type === "sol" ? "SOL" : log.type === "xp" ? "XP" : "Credit Card"}</td>
                    <td className="py-3">
                      {log.type === "sol" && log.tx ? (
                        <a href={`https://solscan.io/tx/${log.tx}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          View on Blockchain Explorer
                        </a>
                      ) : (
                        <div className="text-gray-400">N/A</div>
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
      <div className="artist-tabs flex flex-col items-start w-full">
        {/* Tabs Navigation */}
        <div className="tabs-menu w-full overflow-x-auto pb-5 md:pb-0 mb-3 border-b border-gray-800">
          <div className="flex space-x-8 whitespace-nowrap min-w-max">
            {tabsOrdered.includes("profile") && (
              <button
                onClick={() => {
                  setActiveTab("profile");
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "profile"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                Account Details
              </button>
            )}
            {tabsOrdered.includes("artist") && (
              <button
                onClick={() => {
                  setActiveTab("artist");
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors relative
                                  ${
                                    activeTab === "artist"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-transparent text-gray-300 hover:text-orange-400 hover:border-orange-400"
                                  }
                                `}>
                Artist Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render content based on active tab */}
      {activeTab === "artist" ? (
        <ArtistProfile
          onCloseMusicPlayer={onCloseMusicPlayer}
          viewSolData={viewSolData}
          setHomeMode={setHomeMode}
          navigateToDeepAppView={navigateToDeepAppView}
        />
      ) : (
        renderAppProfile()
      )}

      {/* Preferences Modal */}
      <NFMePreferencesModal isOpen={showNfMePreferencesModal} onClose={() => setShowNfMePreferencesModal(false)} />

      {/* Edit User Profile Modal */}
      <EditUserProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSave={handleProfileSave}
        initialData={{
          profileTypes: userWeb2AccountDetails.profileTypes || [],
          name: userWeb2AccountDetails.displayName || userInfo.name || "",
          primaryAccountEmail: userWeb2AccountDetails.primaryAccountEmail || userInfo.email || "",
          billingEmail: userWeb2AccountDetails.billingEmail || "",
          profileImage: userWeb2AccountDetails.profileImage || userInfo.profileImage || "",
        }}
      />
    </div>
  );
};
