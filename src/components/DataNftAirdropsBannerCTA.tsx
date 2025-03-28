import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { checkIfFreeDataNftGiftMinted } from "libs/sol/SolViewData";
import { sleep } from "libs/utils";
import { AirDropFreeMusicGiftSol } from "pages/BodySections/HomeSection/AirDropFreeMusicGiftSol";
import { AirDropFreeXPNft } from "pages/BodySections/HomeSection/AirDropFreeXPNft";
import { useNftsStore } from "store/nfts";
import { GetNFMeModal } from "./GetNFMeModal";

type DataNftAirdropsBannerCTAProps = {
  onRemoteTriggerOfBiTzPlayModel: any;
};

export function DataNftAirdropsBannerCTA(props: DataNftAirdropsBannerCTAProps) {
  const ALERT_IGNORE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  const { onRemoteTriggerOfBiTzPlayModel } = props;
  const { publicKey: publicKeySol } = useSolanaWallet();
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeBitzClaimed, setFreeBitzClaimed] = useState<boolean>(false);
  const [freeNfMeIdClaimed, setFreeNfMeIdClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeMintMusicGiftIntroToAction, setFreeMintMusicGiftIntroToAction] = useState<boolean>(false);
  const [freeMintXpGiftIntroToAction, setFreeMintXpGiftIntroToAction] = useState<boolean>(false);
  const { solBitzNfts, solNFMeIdNfts } = useNftsStore();
  const [showNfMeIdModal, setShowNfMeIdModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // below is only for so
  useEffect(() => {
    const checkFreeClaims = async () => {
      if (publicKeySol) {
        setFreeDropCheckLoading(true);
        const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", publicKeySol.toBase58());

        if (freeNfMeIdMinted.alreadyGifted) {
          setFreeNfMeIdClaimed(true);
        }

        await sleep(1);

        const freeBitzMinted = await checkIfFreeDataNftGiftMinted("bitzxp", publicKeySol.toBase58());

        if (freeBitzMinted.alreadyGifted) {
          setFreeBitzClaimed(true);
        }

        await sleep(1);

        const freeMusicGiftMinted = await checkIfFreeDataNftGiftMinted("musicgift", publicKeySol.toBase58());

        if (freeMusicGiftMinted.alreadyGifted) {
          setFreeMusicGiftClaimed(true);
        }

        setFreeDropCheckLoading(false);
      }
    };

    checkFreeClaims();
  }, [publicKeySol]);

  useEffect(() => {
    // Check if we should show the banner based on session storage
    const lastClosedTimestamp = sessionStorage.getItem("sig-ux-freedrops-alert");
    if (lastClosedTimestamp) {
      const timeSinceLastClose = Date.now() - parseInt(lastClosedTimestamp);
      if (timeSinceLastClose < ALERT_IGNORE_HOURS_MS) {
        setIsVisible(false);
      }
    }
  }, []);

  useEffect(() => {
    // if the user didn't have one and claimed it, the nft store will update and we can change the CTA below
    if (solBitzNfts.length > 0) {
      setFreeBitzClaimed(true);
    }
    if (solNFMeIdNfts.length > 0) {
      setFreeNfMeIdClaimed(true);
    }
  }, [solBitzNfts, solNFMeIdNfts]);

  const handleClose = () => {
    setIsVisible(false);
    // Store current timestamp in session storage
    sessionStorage.setItem("sig-ux-freedrops-alert", Date.now().toString());
  };

  // should we show the banner? (we dont need to show the banner if the user does not have a NFMe, we can do this at a different place so it's not noisy)
  const shouldShowBanner = isVisible && (!freeBitzClaimed || !freeMusicGiftClaimed);

  return (
    <>
      {!freeDropCheckLoading && shouldShowBanner && (
        <div className="py-2 px-4 md:px-0 m-5 border rounded-lg bg-[#fa882157] w-[100%] relative">
          <div className="flex flex-col md:flex-col items-center">
            <div className="flex flex-col justify-center p-2">
              <p className="dark:text-white text-2xl text-center">Hello Human, You Have some Free App NFTs to Claim!</p>
              <p className="dark:text-white text-sm text-center">
                Claim the free XP NFT to grow reputation, claim the NFMe ID to store your music and app preferences, and claim the Music Album NFT cause I love
                giving you free stuff!
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-center">
              <div className=" flex md:flex-col justify-center mt-3 ml-auto mr-auto md:mr-2">
                <Button
                  disabled={freeBitzClaimed}
                  onClick={() => {
                    setFreeMintXpGiftIntroToAction(true);
                  }}
                  className="!text-black text-sm tracking-tight relative px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 w-[220px]">
                  {freeBitzClaimed ? "Claimed XP NFT" : "Claim XP NFT"}
                </Button>
              </div>

              <div className="flex md:flex-col justify-center mt-3 ml-auto mr-auto md:mr-2">
                <Button
                  disabled={freeMusicGiftClaimed}
                  onClick={() => {
                    setFreeMintMusicGiftIntroToAction(true);
                  }}
                  className="!text-black text-sm tracking-tight relative px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 w-[220px]">
                  Claim Music Album NFT
                </Button>
              </div>
              <div className="flex md:flex-col justify-center mt-3 ml-auto mr-auto md:mr-2">
                <Button
                  disabled={freeNfMeIdClaimed}
                  onClick={() => setShowNfMeIdModal(true)}
                  className="!text-black text-sm tracking-tight relative px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 w-[220px]">
                  {freeNfMeIdClaimed ? "Claimed NFMe ID" : "Claim NFMe ID"}
                </Button>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-300 transition-colors absolute top-2 right-2" aria-label="Close banner">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {freeMintMusicGiftIntroToAction && (
        <>
          <AirDropFreeMusicGiftSol
            onCloseModal={() => {
              setFreeMintMusicGiftIntroToAction(false);
            }}
          />
        </>
      )}

      {freeMintXpGiftIntroToAction && (
        <>
          <AirDropFreeXPNft
            onCloseModal={() => {
              setFreeMintXpGiftIntroToAction(false);
            }}
            onRemoteTriggerOfBiTzPlayModel={onRemoteTriggerOfBiTzPlayModel}
          />
        </>
      )}

      {/* NFMe ID Confirmation Modal */}
      {showNfMeIdModal && <GetNFMeModal setShowNfMeIdModal={setShowNfMeIdModal} />}
    </>
  );
}
