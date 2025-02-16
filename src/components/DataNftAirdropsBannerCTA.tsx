import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "react-router-dom";
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
  // const shouldShowBanner = (!freeBitzClaimed && !freeMusicGiftClaimed) || (location.pathname === routeNames.home && !freeNfMeIdClaimed);
  const shouldShowBanner = !freeBitzClaimed;

  return (
    <>
      {!freeDropCheckLoading && shouldShowBanner && (
        <div className="py-2 px-4 md:px-0 m-5 border rounded-lg bg-[#fa882157] w-[100%]">
          <div className="flex flex-col md:flex-col items-center">
            <div className="flex flex-col justify-center p-2">
              <p className="dark:text-white text-2xl text-center">Hello Human, You Have a Free XP NFTs to Claim!</p>
              <p className="dark:text-white text-md text-center">
                Claim the free XP NFT, join the AI Data Workforce, grow your reputation, curate music with me and get rewarded
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
                  Claim XP Data NFT
                </Button>
              </div>

              <div className="hidden flex md:flex-col justify-center mt-3 ml-auto mr-auto md:mr-2">
                <Button
                  disabled={freeMusicGiftClaimed}
                  onClick={() => {
                    setFreeMintMusicGiftIntroToAction(true);
                  }}
                  className="!text-black text-sm tracking-tight relative px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 w-[220px]">
                  Claim Music Data NFT
                </Button>
              </div>
              <div className="hidden flex md:flex-col justify-center ml-auto mr-auto md:mr-2">
                <Link
                  to={`${publicKeySol ? "https://ai-workforce.itheum.io/nfmeid" : "https://datadex.itheum.io/nfmeid"}`}
                  target="_blank"
                  className="text-base hover:!no-underline hover:text-black">
                  <Button
                    disabled={freeNfMeIdClaimed}
                    className="!text-black text-sm tracking-tight relative px-[2.35rem] bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100 w-[220px]">
                    Claim NFMe ID
                  </Button>
                </Link>
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
    </>
  );
}
