import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "libComponents/Button";
import { checkIfFreeDataNftGiftMinted } from "libs/sol/SolViewData";
import { sleep } from "libs/utils";
import { AirDropFreeMusicGiftSol } from "pages/AppMarketplace/NFTunes/AirDropFreeMusicGiftSol";
import { AirDropFreeXPNft } from "pages/AppMarketplace/NFTunes/AirDropFreeXPNft";
import { useNftsStore } from "store/nfts";

type DataNftAirdropsBannerCTAProps = {
  onRemoteTriggerOfBiTzPlayModel: any;
};

export function DataNftAirdropsBannerCTA(props: DataNftAirdropsBannerCTAProps) {
  const { onRemoteTriggerOfBiTzPlayModel } = props;
  const { publicKey: publicKeySol } = useWallet();
  const [freeDropCheckLoading, setFreeDropCheckLoading] = useState<boolean>(false);
  const [freeBitzClaimed, setFreeBitzClaimed] = useState<boolean>(false);
  const [freeNfMeIdClaimed, setFreeNfMeIdClaimed] = useState<boolean>(false);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);
  const [freeMintMusicGiftIntroToAction, setFreeMintMusicGiftIntroToAction] = useState<boolean>(false);
  const [freeMintXpGiftIntroToAction, setFreeMintXpGiftIntroToAction] = useState<boolean>(false);
  const { solBitzNfts } = useNftsStore();
  const [showNfMeIdModal, setShowNfMeIdModal] = useState(false);

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
    // if the user didn't have one and claimed it, the nft store will update and we can change the CTA below
    if (solBitzNfts.length > 0) {
      setFreeBitzClaimed(true);
    }
  }, [solBitzNfts]);

  // should we show the banner?
  const shouldShowBanner = !freeBitzClaimed || !freeMusicGiftClaimed || !freeNfMeIdClaimed;

  return (
    <>
      {!freeDropCheckLoading && shouldShowBanner && (
        <div className="py-2 px-4 md:px-0 m-5 border rounded-lg bg-[#fa882157] w-[100%]">
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
      {showNfMeIdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold text-center">Claim Your NFMe ID</h3>
              <p className="text-gray-300 text-center">Taking you now to Itheum's AI Data Workforce app, where you can mint a free NFMe ID</p>
              <p className="text-gray-400 text-sm text-center">
                An NFMe ID is a special NFT that you can use to store your personal data like your music preferences etc. Your data is your business!
              </p>
              <div className="flex gap-4 justify-center mt-4">
                <Button onClick={() => setShowNfMeIdModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.open(`${publicKeySol ? "https://ai-workforce.itheum.io/nfmeid" : "https://datadex.itheum.io/nfmeid"}`, "_blank");
                    setShowNfMeIdModal(false);
                  }}
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg">
                  Proceed
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
