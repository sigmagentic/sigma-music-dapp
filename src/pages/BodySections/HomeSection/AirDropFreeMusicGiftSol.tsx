import React, { useEffect, useState } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useWallet } from "@solana/wallet-adapter-react";
import { confetti } from "@tsparticles/confetti";
import { Container } from "@tsparticles/engine";
import { Link } from "react-router-dom";
import MusicGiftPreview from "assets/img/nf-tunes/music-data-nft-gift-preview.png";
import { Modal } from "components/Modal/Modal";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature, mintMiscDataNft, fetchSolNfts, checkIfFreeDataNftGiftMinted } from "libs/sol/SolViewData";
import { sleep } from "libs/utils";
import { routeNames } from "routes";
import { useAccountStore } from "store/account";
import { useNftsStore } from "store/nfts";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";

type AirDropFreeMusicGiftSolSolProps = {
  onCloseModal: any;
};

export const AirDropFreeMusicGiftSol = (props: AirDropFreeMusicGiftSolSolProps) => {
  const { onCloseModal } = props;
  const { signMessage } = useWallet();
  const { publicKey: publicKeySol } = useSolanaWallet();
  const { updateSolNfts } = useNftsStore();
  const [getAirdropWorkflow, setGetAirdropWorkflow] = useState<boolean>(false);
  const [freeMintMusicGiftLoading, setFreeMintMusicGiftLoading] = useState<boolean>(false);
  const [errFreeMintGeneric, setErrFreeMintGeneric] = useState<string | null>(null);
  const [freeDropCheckNeededForMusicGift, setFreeDropCheckNeededForMusicGift] = useState<number>(0);
  const [freeMusicGiftClaimed, setFreeMusicGiftClaimed] = useState<boolean>(false);

  // S: Cached Signature Store Items
  const solPreaccessNonce = useAccountStore((state: any) => state.solPreaccessNonce);
  const solPreaccessSignature = useAccountStore((state: any) => state.solPreaccessSignature);
  const solPreaccessTimestamp = useAccountStore((state: any) => state.solPreaccessTimestamp);
  const updateSolPreaccessNonce = useAccountStore((state: any) => state.updateSolPreaccessNonce);
  const updateSolPreaccessTimestamp = useAccountStore((state: any) => state.updateSolPreaccessTimestamp);
  const updateSolSignedPreaccess = useAccountStore((state: any) => state.updateSolSignedPreaccess);
  // E: Cached Signature Store Items

  useEffect(() => {
    (async () => {
      if (!publicKeySol) {
        return;
      }

      setGetAirdropWorkflow(true);

      const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("musicgift", publicKeySol.toBase58());

      if (freeNfMeIdMinted.alreadyGifted) {
        setFreeMusicGiftClaimed(true);
      }
    })();
  }, [publicKeySol]);

  useEffect(() => {
    const checkFreeClaim = async () => {
      if (publicKeySol) {
        const freeDataNftMinted = await checkIfFreeDataNftGiftMinted("musicgift", publicKeySol.toBase58());

        if (freeDataNftMinted.alreadyGifted) {
          setFreeMusicGiftClaimed(true);
        }

        await sleep(1);
      }
    };

    checkFreeClaim();
  }, [freeDropCheckNeededForMusicGift]);

  async function showConfetti() {
    const animation = await confetti({
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      particleCount: 200,
      scalar: 2,
      shapes: ["emoji", "circle", "square"],
      shapeOptions: {
        emoji: {
          value: ["💎", "⭐", "✨", "💫", "🎵", "🎶", "🎸", "🎼"],
        },
      },
    });

    if (animation) {
      await sleep(10);

      animation.stop();
      // as its confetti, then we have to destroy it
      if ((animation as unknown as Container).destroy) {
        (animation as unknown as Container).destroy();
      }
    }
  }

  const handleFreeMintMusicGift = async () => {
    if (!publicKeySol) {
      return;
    }

    setFreeMintMusicGiftLoading(true);

    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage,
      publicKey: publicKeySol,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    let _errInWorkflow = null;

    try {
      const miscMintRes = await mintMiscDataNft("musicgift", publicKeySol.toBase58(), usedPreAccessSignature, usedPreAccessNonce);

      if (miscMintRes.error) {
        setErrFreeMintGeneric(miscMintRes.error || miscMintRes?.e?.toString() || "unknown error");
      } else if (miscMintRes?.newDBLogEntryCreateFailed) {
        _errInWorkflow = "Misc mint passed, but the db log failed.";
      }

      if (miscMintRes?.mintDoneMintMetaSkipped) {
        // wait some delay in seconds and check if the API in the backend to mark the free mint as done
        await sleep(15);

        setFreeDropCheckNeededForMusicGift(freeDropCheckNeededForMusicGift + 1);

        // update the NFT store now as we have a new NFT
        const _allDataNfts: DasApiAsset[] = await fetchSolNfts(publicKeySol?.toBase58());
        updateSolNfts(_allDataNfts);
      } else {
        if (miscMintRes?.error) {
          _errInWorkflow = "Error! " + miscMintRes?.error;
        } else {
          _errInWorkflow = "Error! Free minting has failed, have you met all the requirements below? if so, please try again.";
        }
      }
    } catch (e: any) {
      _errInWorkflow = e.toString();
    }

    if (!_errInWorkflow) {
      await sleep(5);
      showConfetti();
    } else {
      setErrFreeMintGeneric(_errInWorkflow);
    }

    setFreeMintMusicGiftLoading(false);
  };

  return (
    <>
      <Modal
        triggerOpen={getAirdropWorkflow}
        triggerOnClose={() => {
          if (!freeMintMusicGiftLoading) {
            setGetAirdropWorkflow(false);
            setErrFreeMintGeneric(null);
            onCloseModal();
          }
        }}
        closeOnOverlayClick={false}
        title={"Get Your Free Sample Music Album NFT Airdrop!"}
        hasFilter={false}
        filterData={[]}
        modalClassName="-mt-5"
        titleClassName={"p-6 md:!p-4 !text-2xl md:!text-3xl"}>
        {
          <div
            className=""
            style={{
              minHeight: "10rem",
            }}>
            <div className="p-8">
              <div className="flex flex-col-reverse md:flex-row items-center">
                <div className="md:pr-5">
                  <div className="text-2xl font-bold mb-2">Revolutionizing Music with AI 🚀</div>
                  <div className="mt-5">
                    Sigma Music connects AI Agents, musicians, and fans to amplify music and train AI models, empowering real-world artists and enhancing music
                    content. Get your free Music Album NFT and join this initiative!
                  </div>

                  {errFreeMintGeneric && (
                    <div className="h-[100px] text-lg mt-10">
                      <div className="text-orange-700 dark:text-orange-300 text-sm">
                        Error! Free mint of Music Album NFT is not possible right now. More Info = {errFreeMintGeneric}
                      </div>
                      <Button
                        className="text-sm mt-2 cursor-pointer !text-white"
                        variant="destructive"
                        onClick={(event: any) => {
                          // in case the modal is over another action button or method, we stop the click from propagating down to it as this may cause the state to change below the modal
                          event.stopPropagation();

                          setGetAirdropWorkflow(false);
                          setErrFreeMintGeneric(null);
                          onCloseModal();
                        }}>
                        Close & Try Again
                      </Button>
                    </div>
                  )}

                  {!errFreeMintGeneric && (
                    <div className="mt-8">
                      {!freeMusicGiftClaimed ? (
                        <>
                          <Button
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer md:w-[300px] h-[50px]"
                            disabled={freeMintMusicGiftLoading}
                            onClick={() => {
                              handleFreeMintMusicGift();
                            }}>
                            <span className="ml-2">{freeMintMusicGiftLoading ? "Minting..." : "LFG! Give Me My Airdrop!"}</span>
                          </Button>
                        </>
                      ) : (
                        <div className="bxg-blue-800 flex flex-col mt-5 text-white bg-teal-700 p-5 rounded-lg text-lg text-center">
                          🙌 Success! {`Let's`} try it out now!
                          <Button
                            onClick={() => {
                              location.href = `/?fromFreeMusicGift=1&hl=sample`;

                              setGetAirdropWorkflow(false);
                              setErrFreeMintGeneric(null);
                              onCloseModal();
                            }}
                            className="!text-black mt-5 text-xs md:text-sm tracking-tight relative px-[2.35rem] left-2 bottom-1.5 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:translate-y-1.5 hover:-translate-x-[8px] hover:scale-100">
                            Use Music Album NFT on Sigma Music
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {(!freeMusicGiftClaimed || errFreeMintGeneric) && (
                    <div className="text-xs mt-4">
                      Requirements: Only 1 per address, completely free to you, but you need SOL in your wallet, which will NOT be used but is to make sure your
                      wallet exists and can receive the NFT. {freeMintMusicGiftLoading && <>(⏳ Please wait, this can take a few minutes.)</>}
                    </div>
                  )}
                </div>

                <img src={MusicGiftPreview} className="w-[90%] md:w-[40%] mb-5 md:mb-0" />
              </div>
            </div>
          </div>
        }
      </Modal>
    </>
  );
};
