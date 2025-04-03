import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";

export const MyProfile = () => {
  const { userInfo, publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();

  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  return (
    <div className="flex flex-col w-full px-4">
      {/* User Details Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Details</h2>
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
          <div className="flex flex-col space-y-2">
            <div>
              <label className="text-gray-400 text-sm">Name</label>
              <p className="text-lg">{userInfo.name || "Not provided"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <p className="text-lg">{userInfo.email || "Not provided"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Wallet Address</label>
              <p className="text-lg font-mono">{displayPublicKey ? displayPublicKey.toString() : "Not connected"}</p>
            </div>
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
    </div>
  );
};
