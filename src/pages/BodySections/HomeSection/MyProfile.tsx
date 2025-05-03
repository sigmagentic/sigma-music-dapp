import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { GetNFMeModal } from "components/GetNFMeModal";
import { NFMePreferencesModal } from "components/NFMePreferencesModal";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";

const nfMeIdBrandingHide = true;

export const MyProfile = () => {
  const { userInfo, publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { solNFMeIdNfts } = useNftsStore();
  const [showNfMeIdModal, setShowNfMeIdModal] = useState<boolean>(false);
  const [showNfMePreferencesModal, setShowNfMePreferencesModal] = useState<boolean>(false);
  const [nfMeIdImageUrl, setNfMeIdImageUrl] = useState<string | null>(null);
  const { userWeb2AccountDetails } = useAccountStore();
  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  React.useEffect(() => {
    if (solNFMeIdNfts.length > 0) {
      const nfMeId = solNFMeIdNfts[0] as (DasApiAsset & { content: NFMeIdContent }) | undefined;
      const nfmeImg = nfMeId?.content?.links?.image;
      if (nfmeImg) {
        sessionStorage.removeItem("sig-nfme-later");
        setNfMeIdImageUrl(nfmeImg);
      } else {
        setNfMeIdImageUrl(null);
      }
    }
  }, [solNFMeIdNfts]);

  return (
    <div className="flex flex-col w-full px-4">
      {/* User Details Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your Details</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-900 border-2 border-gray-700">
            {userInfo.profileImage ? (
              <img src={userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <UserIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="flex flex-col space-y-2 overflow-x-auto w-full">
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
              <label className="text-gray-400 text-sm">Wallet Address</label>
              <p className="text-lg font-mono">{displayPublicKey ? displayPublicKey.toString() : "Not connected"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Last Login Session</label>
              <p className="text-lg font-mono">
                {userWeb2AccountDetails.lastLoginTS ? new Date(userWeb2AccountDetails.lastLoginTS).toLocaleString() : "Not Known"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NFMe ID Section */}
      <div className="bg-black hidden rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your NFMe ID</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* NFMe ID Image */}
          <div className="w-32 h-32 rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
            {nfMeIdImageUrl ? (
              <img src={nfMeIdImageUrl} alt="NFMe ID" className="w-full h-full object-cover cursor-pointer" onClick={() => setShowNfMePreferencesModal(true)} />
            ) : (
              <div
                onClick={() => setShowNfMeIdModal(true)}
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer">
                <UserIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* NFMe ID Information */}
          <div className="flex flex-col space-y-2">
            <div>
              <label className="text-gray-400 text-sm">Status</label>
              <p className="text-lg">{nfMeIdImageUrl ? "Connected" : "Not Connected"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Description</label>
              <p className="text-lg">
                Your NFMe ID is a special NFT that you can use to store your personal data like your music preferences which is then used to personalize your
                Sigma Music experience!
              </p>
            </div>
            {!nfMeIdImageUrl && (
              <button
                onClick={() => setShowNfMeIdModal(true)}
                className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]">
                Claim Your NFMe ID
              </button>
            )}
            <button
              className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]"
              onClick={() => setShowNfMePreferencesModal(true)}>
              Save App Preferences
            </button>
          </div>
        </div>
      </div>

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

      {/* Orders Section */}
      <div className="bg-black rounded-lg p-6 hidden">
        <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl text-gray-400">Coming Soon</p>
          <p className="text-sm text-gray-500 mt-2">Your purchase history will be displayed here</p>
        </div>
      </div>

      {/* NFMe ID Claim Modal */}
      {showNfMeIdModal && <GetNFMeModal setShowNfMeIdModal={setShowNfMeIdModal} setShowNfMePreferencesModal={setShowNfMePreferencesModal} />}

      {/* NFMe Preferences Modal */}
      <NFMePreferencesModal isOpen={showNfMePreferencesModal} onClose={() => setShowNfMePreferencesModal(false)} nfMeIdBrandingHide={nfMeIdBrandingHide} />
    </div>
  );
};

interface NFMeIdContent {
  links: {
    image: string;
  };
  metadata: {
    name: string;
    description: string;
  };
}
