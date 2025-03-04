import React from "react";
import { Button } from "libComponents/Button";

interface GetNFMeModalProps {
  setShowNfMeIdModal: (show: boolean) => void;
  setShowNfMePreferencesModal?: (show: boolean) => void;
}

export function GetNFMeModal({ setShowNfMeIdModal, setShowNfMePreferencesModal }: GetNFMeModalProps) {
  const handleSavePreferencesLater = () => {
    sessionStorage.setItem("sig-nfme-later", "1");
    setShowNfMeIdModal(false);
    setShowNfMePreferencesModal?.(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-center">Claim Your NFMe ID</h3>
            <p className="text-gray-300 text-center">Taking you now to Itheum's AI Data Workforce app, where you can mint a FREE NFMe ID</p>
            <p className="text-gray-400 text-sm text-center">
              Your NFMe ID is a special NFT that you can use to store your personal data like your music preferences which is then used to personalize your
              Sigma Music experience!
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <Button
                onClick={() => window.open("https://ai-workforce.itheum.io", "_blank")}
                className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg">
                Proceed to Mint FREE NFMe ID
              </Button>
              <Button onClick={handleSavePreferencesLater} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">
                I'll do this later, let me save app preferences
              </Button>
              <Button onClick={() => setShowNfMeIdModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
