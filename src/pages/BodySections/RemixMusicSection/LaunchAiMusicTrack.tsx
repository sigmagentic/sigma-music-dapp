import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader, ArrowLeft, FileMusicIcon, Download } from "lucide-react";
import {
  GENERATE_MUSIC_MEME_PRICE_IN_USD,
  ALL_MUSIC_GENRES,
  ALL_MUSIC_MOODS_FOR_REMIX,
  ONE_USD_IN_XP,
  MUSIC_GEN_PROMPT_LIBRARY,
  MUSIC_GEN_PROMPT_FALLBACK_LIBRARY,
  DISABLE_AI_REMIX_LIVE_MODEL_USAGE,
  FREE_LICENSED_ALBUM_ID,
  FREE_LICENSED_ALBUM_DATA,
  LICENSE_BLURBS,
} from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { FastStreamTrack, Artist, MusicTrack } from "libs/types/common";
import { injectXUserNameIntoTweet, toastSuccess, fetchMyAlbumsFromMintLogsViaAPI, downloadTrackViaClientSide, toastError } from "libs/utils";
import { logPaymentToAPI, saveMediaToServerViaAPI, sendRemixJobAfterPaymentViaAPI } from "libs/utils/api";
import { getAlbumTracksFromDBViaAPI } from "libs/utils/api";
import { getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { showSuccessConfetti } from "libs/utils/uiShared";
import useSolBitzStore from "store/solBitz";
import { sendPowerUpSol, SendPowerUpSolResult } from "pages/BodySections/HomeSection/SendBitzPowerUp";
import { useNftsStore } from "store/nfts";
import { MediaUpdate } from "libComponents/MediaUpdate";
import { InfoTooltip } from "libComponents/Tooltip";

const MAX_TITLE_LENGTH = 50;

interface LaunchAiMusicTrackProps {
  renderInline?: boolean;
  onCloseModal: (refreshPaymentLogs: boolean) => void;
  navigateToDeepAppView: (e: any) => void;
}

let SIMULATE_AI_GENERATION_FLAG = false;

export const LaunchAiMusicTrack = ({ renderInline, onCloseModal, navigateToDeepAppView }: LaunchAiMusicTrackProps) => {
  const { publicKey, walletType } = useSolanaWallet();
  const addressSol = publicKey?.toBase58();
  const { web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { signMessage } = useWallet();
  const { artistLookupEverything } = useAppStore();
  const { bitzBalance: solBitzBalance, givenBitzSum: givenBitzSumSol, updateBitzBalance, updateGivenBitzSum, isSigmaWeb2XpSystem } = useSolBitzStore();
  const { solBitzNfts } = useNftsStore();
  const {
    solPreaccessNonce,
    solPreaccessSignature,
    solPreaccessTimestamp,
    updateSolPreaccessNonce,
    updateSolPreaccessTimestamp,
    updateSolSignedPreaccess,
    myAlbumMintLogs,
    updateMyAlbumMintLogs,
  } = useAccountStore();

  const [songTitle, setSongTitle] = useState("");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [remixingStatus, setRemixingStatus] = useState<"idle" | "processing" | "confirmed" | "failed">("idle");
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [myStoryProtocolLicenses, setMyStoryProtocolLicenses] = useState<any[]>([]);
  const [freeLincensedAlbums, setFreeLincensedAlbums] = useState<any[]>([]);
  const [isLoadingStoryLicenses, setIsLoadingStoryLicenses] = useState(false);
  const [selectedAlbumForTrackList, setSelectedAlbumForTrackList] = useState<any>(null);
  const [selectedReferenceTrack, setSelectedReferenceTrack] = useState<FastStreamTrack | null>(null);
  const [playingReferenceTrack, setPlayingReferenceTrack] = useState(false);
  const [trackStyle, setTrackStyle] = useState<"with-vocals" | "instrumental">("instrumental");
  const [selectedGenre, setSelectedGenre] = useState<string>("original");
  const [selectedMood, setSelectedMood] = useState<string>("original");
  const [tweetText, setTweetText] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<"sigma-ai" | "other">("sigma-ai");
  const [trackDownloadIsInProgress, setTrackDownloadIsInProgress] = useState<boolean>(false);
  const [selectedAiPlatform, setSelectedAiPlatform] = useState<string>("suno");
  const [customAiPlatform, setCustomAiPlatform] = useState<string>("");
  const [formData, setFormData] = useState({
    cover_art_url: "",
    file: "",
  }); // Form data and validation for "other" AI model
  const [errors, setErrors] = useState<{ cover_art_url?: string; file?: string }>({});
  const [newSelectedTrackCoverArtFile, setNewSelectedTrackCoverArtFile] = useState<File | null>(null);
  const [newSelectedAudioFile, setNewSelectedAudioFile] = useState<File | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const genreScrollRef = useRef<HTMLDivElement>(null);
  const moodScrollRef = useRef<HTMLDivElement>(null);

  // Add effect to prevent body scrolling when modal is open and cleanup audio on unmount
  useEffect(() => {
    // if a query string param called simulateAIGenerations=1 is present, then we will simulate the AI generations
    if (window.location.search.includes("simulateAIGenerations=1") || DISABLE_AI_REMIX_LIVE_MODEL_USAGE === "1") {
      alert("Please note: We are simulating AI generations in this demo mode. This is for testing purposes only.");
      SIMULATE_AI_GENERATION_FLAG = true;
    }

    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";

      stopPlayingAudio();
    };
  }, []);

  // Load artist album dataset
  useEffect(() => {
    (async () => {
      const { albumArtistLookupData } = await getArtistsAlbumsData();
      setArtistAlbumDataset(albumArtistLookupData);
    })();
  }, []);

  // Load Story Protocol licenses on mount
  useEffect(() => {
    if (publicKey) {
      handleRefreshMyStoryProtocolLicenses();
    }
  }, [publicKey]);

  // Process Story Protocol licenses
  useEffect(() => {
    if (myAlbumMintLogs.length > 0 && artistAlbumDataset.length > 0) {
      const _myStoryProtocolLicenses = myAlbumMintLogs
        .filter((log) => log.ipTokenId)
        .map((log) => ({
          ipTokenId: log.ipTokenId,
          storyProtocolLicenseMintingSQSMessageId: log.storyProtocolLicenseMintingSQSMessageId,
          storyProtocolLicenseTokenId: log.storyProtocolLicenseTokenId,
          storyProtocolLicenseMintingTxHash: log.storyProtocolLicenseMintingTxHash,
          createdOnTS: log.createdOnTS,
          updatedOnTS: log.updatedOnTS,
          mintTemplate: log.mintTemplate,
        }));

      // Extract albumId from mintTemplate and get album details
      const _myStoryProtocolLicensesWithAlbumDetails = _myStoryProtocolLicenses.map((log) => {
        const albumId = log.mintTemplate.split("-")[1];
        const album = artistAlbumDataset
          .map((artist) => artist.albums)
          .flat()
          .find((_album: any) => _album.albumId === albumId);
        return {
          ...log,
          albumId: albumId,
          albumName: album?.title,
          albumImage: album?.img,
        };
      });

      setMyStoryProtocolLicenses(_myStoryProtocolLicensesWithAlbumDetails);
    }

    // load a free album if no free albums are loaded
    if (freeLincensedAlbums.length === 0) {
      setFreeLincensedAlbums([FREE_LICENSED_ALBUM_DATA]);
    }
  }, [myAlbumMintLogs, artistAlbumDataset]);

  // Handle audio ended event
  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => {
        setPlayingReferenceTrack(false);
      };
      audioRef.current.addEventListener("ended", handleEnded);
      return () => {
        audioRef.current?.removeEventListener("ended", handleEnded);
      };
    }
  }, [audioRef.current]);

  const stopPlayingAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleRefreshMyStoryProtocolLicenses = async () => {
    if (!publicKey) return;

    setIsLoadingStoryLicenses(true);
    try {
      const _albumMintLogs = await fetchMyAlbumsFromMintLogsViaAPI(publicKey.toBase58());
      updateMyAlbumMintLogs(_albumMintLogs);
    } catch (error) {
      console.error("Failed to fetch Story Protocol licenses:", error);
    } finally {
      setIsLoadingStoryLicenses(false);
    }
  };

  const handleAlbumClick = (license: any) => {
    // Find the album details from the artist album dataset
    const album = artistAlbumDataset
      .map((artist) => artist.albums)
      .flat()
      .find((_album: any) => _album.albumId === license.albumId);

    if (album) {
      setSelectedAlbumForTrackList(album);
    }
  };

  const handleTrackSelection = (track: any) => {
    stopPlayingAudio();

    // Reset audio player states
    setPlayingReferenceTrack(false);

    setSelectedReferenceTrack(track);
    // Keep the track list view open so user can change selection if needed
  };

  const handleBackToAlbums = () => {
    setSelectedAlbumForTrackList(null);
  };

  const handleTrackGeneration = () => {
    if (!publicKey?.toBase58() || !songTitle || !selectedReferenceTrack) {
      alert("Please fill in all fields to generate a remix");
      return;
    }

    stopPlayingAudio();

    setShowPaymentConfirmation(true);
  };

  const handleTrackUpload = () => {
    if (!publicKey?.toBase58() || !songTitle || !selectedReferenceTrack || !newSelectedTrackCoverArtFile || !newSelectedAudioFile) {
      alert("Please fill in all fields to upload a remix");
      return;
    }

    // Validate required fields for "other" AI model
    if (selectedAiModel === "other") {
      const newErrors: { cover_art_url?: string; file?: string } = {};

      if (!newSelectedTrackCoverArtFile) {
        newErrors.cover_art_url = "Cover art URL is required";
      }

      // Check if the cover art image is less than 3MB and has valid file type
      if (newSelectedTrackCoverArtFile) {
        if (newSelectedTrackCoverArtFile.size > 3 * 1024 * 1024) {
          newErrors.cover_art_url = "Cover art image must be less than 3MB";
        }

        // Validate file type
        const fileName = newSelectedTrackCoverArtFile.name.toLowerCase();
        const validExtensions = [".gif", ".png", ".jpg"];
        const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

        if (!hasValidExtension) {
          newErrors.cover_art_url = "Cover art must be a GIF, PNG, or JPG file";
        }

        // Check for JPEG and ask to rename to JPG
        if (fileName.endsWith(".jpeg")) {
          newErrors.cover_art_url = "Please rename your JPEG file to JPG and try again";
        }
      }

      if (!formData.file.trim() && !newSelectedAudioFile) {
        newErrors.file = "Audio file URL is required";
      }

      // Check if the audio file is less than 4.5MB and has valid file type
      if (newSelectedAudioFile) {
        if (newSelectedAudioFile.size > 4.5 * 1024 * 1024) {
          newErrors.file = "Audio file must be less than 4.5MB";
        }

        // Validate file type for audio
        const fileName = newSelectedAudioFile.name.toLowerCase();
        if (!fileName.endsWith(".mp3")) {
          newErrors.file = "Audio file must be an MP3 file";
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        alert("Please fix the validation errors before proceeding");
        return;
      }
    }

    stopPlayingAudio();

    setShowPaymentConfirmation(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_TITLE_LENGTH);
    setSongTitle(value);
  };

  const handleAiPlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAiPlatform(e.target.value);
    // Clear custom platform when selecting a predefined option
    if (e.target.value !== "others") {
      setCustomAiPlatform("");
    }
  };

  const handleCustomAiPlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 100); // Limit to 100 characters
    setCustomAiPlatform(value);
  };

  const handlePlayReferenceTrack = () => {
    if (!selectedReferenceTrack?.file) return;

    if (playingReferenceTrack) {
      audioRef.current?.pause();
      setPlayingReferenceTrack(false);
    } else {
      stopPlayingAudio();
      audioRef.current = new Audio(selectedReferenceTrack.file);
      audioRef.current.play();
      setPlayingReferenceTrack(true);
    }
  };

  function resetStateToPristine(preserverUserInput: boolean = false) {
    setShowPaymentConfirmation(false);
    setPaymentStatus("idle");
    setRemixingStatus("idle");
    setTweetText("");
    setBackendErrorMessage(null);
    handleBackToAlbums(); // if the user is in a nested reference track list, we need to go back to the albums list

    if (!preserverUserInput) {
      // user selection + form items
      setSelectedReferenceTrack(null);
      setSelectedGenre("original");
      setSelectedMood("original");
      setSongTitle("");
      setTrackStyle("instrumental");
      setFormData({
        cover_art_url: "",
        file: "",
      });
      setErrors({});
      setNewSelectedTrackCoverArtFile(null);
      setNewSelectedAudioFile(null);
      setSelectedAiPlatform("suno");
      setCustomAiPlatform("");
    }

    onCloseModal(true);
  }

  const handlePaymentConfirmation_XP = async (priceInXP: number, priceInUSD: number, textPromptIfUsingGenreAndMood?: string) => {
    if (!publicKey || !addressSol || !priceInXP || !priceInUSD || !selectedReferenceTrack || !selectedReferenceTrack.arId) {
      alert("Missing required fields");
      return;
    }

    setPaymentStatus("processing");

    // // S: TEST UI WORKFLOW HERE
    // await sleep(5);
    // toastSuccess("Payment Successful!");
    // setPaymentStatus("confirmed");
    // setShowPaymentConfirmation(false);

    // handleRemixing({
    //   paymentMadeTx: "xpPaymentReceipt",
    //   solSignature: "usedPreAccessSignature",
    //   signatureNonce: "usedPreAccessNonce",
    //   selectedReferenceTrack: selectedReferenceTrack,
    // });

    // return;
    // // E: TEST UI WORKFLOW HERE

    // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
    const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
      solPreaccessNonce,
      solPreaccessSignature,
      solPreaccessTimestamp,
      signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
      publicKey,
      updateSolPreaccessNonce,
      updateSolSignedPreaccess,
      updateSolPreaccessTimestamp,
    });

    if (selectedAiModel === "other") {
      try {
        if (newSelectedTrackCoverArtFile) {
          const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedTrackCoverArtFile, solPreaccessSignature, solPreaccessNonce, addressSol);

          if (fileUploadResponse) {
            formData.cover_art_url = fileUploadResponse;
          } else {
            toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
            return;
          }
        }

        if (newSelectedAudioFile) {
          const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedAudioFile, solPreaccessSignature, solPreaccessNonce, addressSol);

          if (fileUploadResponse) {
            formData.file = fileUploadResponse;
          } else {
            toastError("Error uploading and updating profile image but other profile data was saved. Please reupload and try again later.");
            return;
          }
        }
      } catch (error) {
        alert("Error uploading your tracks media. Please try again after a few seconds. Error: " + (error as Error).message);
        return;
      }
    }

    try {
      let xpPaymentReceipt = "";

      const artistProfile: Artist = artistLookupEverything[selectedReferenceTrack?.arId];

      const sendPowerUpSolResult: SendPowerUpSolResult = await sendPowerUpSol(
        priceInXP,
        artistProfile.creatorWallet, // the artist whos track we are remxing
        artistProfile.bountyId + "-p", // the bounty id for the artist who owns the track we are remxing
        solBitzNfts,
        isSigmaWeb2XpSystem,
        publicKey,
        solBitzBalance,
        givenBitzSumSol,
        usedPreAccessNonce,
        usedPreAccessSignature
      );

      if (sendPowerUpSolResult.error) {
        throw new Error(sendPowerUpSolResult.errorMessage || "Payment failed - error returned when sending XP");
      }

      if (sendPowerUpSolResult.success && sendPowerUpSolResult.paymentReceipt !== "") {
        xpPaymentReceipt = sendPowerUpSolResult.paymentReceipt;
      } else {
        throw new Error("Payment failed - no receipt returned when sending XP");
      }

      if (xpPaymentReceipt === "") {
        throw new Error("Payment failed - no receipt returned when sending XP");
      }

      const promptParams: any = {
        songTitle: songTitle,
        refTrack_alId: selectedReferenceTrack.alId,
        refTrack_file: selectedReferenceTrack.file,
        refTrack_arId: selectedReferenceTrack.arId,
      };

      // we need to flag that this is a free licensed album so we can enfore some restrictions on the remix output
      if (selectedAlbumForTrackList && selectedAlbumForTrackList.albumId === FREE_LICENSED_ALBUM_ID) {
        promptParams.meta = {};
        promptParams.meta.isFreeLicense = "1";
      }

      // we use this way to identify if the remix is byo (i.e. use uploaded track they may elsewhere) or not
      if (selectedAiModel === "other") {
        if (!promptParams.meta) {
          promptParams.meta = {};
        }

        promptParams.meta.isByo = "1";
        promptParams.meta.byoPlatform = selectedAiPlatform === "others" ? customAiPlatform : selectedAiPlatform;
      } else {
        // these are for the sigma-ai model only
        if (selectedGenre !== "" && selectedGenre !== "original") {
          promptParams.genre = selectedGenre;
        }

        if (selectedMood !== "" && selectedMood !== "original") {
          promptParams.mood = selectedMood;
        }
      }

      if (textPromptIfUsingGenreAndMood && textPromptIfUsingGenreAndMood.length > 10) {
        promptParams.textPrompt = textPromptIfUsingGenreAndMood;
      }

      const _logPaymentToAPIResponse = await logPaymentToAPI({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        payer: publicKey.toBase58(),
        tx: xpPaymentReceipt,
        task: "remix",
        type: "xp",
        amount: priceInXP.toString(),
        priceInUSD: priceInUSD,
        promptParams: promptParams,
      });

      if (_logPaymentToAPIResponse.error) {
        throw new Error(_logPaymentToAPIResponse.errorMessage || "Payment failed");
      }

      toastSuccess("Payment Successful!");
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      // update the bitz balance and given bitz sum
      updateBitzBalance(sendPowerUpSolResult.bitzBalance);
      updateGivenBitzSum(sendPowerUpSolResult.givenBitzSum);

      handleRemixing({
        paymentMadeTx: xpPaymentReceipt,
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        selectedReferenceTrack: selectedReferenceTrack,
      });
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again - " + (error as Error).message);
      setPaymentStatus("idle");
    }
  };

  const handleRemixing = async ({
    paymentMadeTx,
    solSignature,
    signatureNonce,
    selectedReferenceTrack,
  }: {
    paymentMadeTx: string;
    solSignature: string;
    signatureNonce: string;
    selectedReferenceTrack: any;
  }) => {
    setRemixingStatus("processing");

    // // S: TEST UI WORKFLOW HERE
    // await sleep(5);
    // toastSuccess("Remixing Job Sent!");
    // setRemixingStatus("confirmed");

    // const tweetMsg = injectXUserNameIntoTweet(
    //   `I am AI remixing a song by the artist _(xUsername)_ on @SigmaXMusic! Check it out and vote it up so it gets published as an official derivative work!`,
    //   "https://x.com/sigmaxmusic"
    // );

    // setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?section=ai-remix`)}&text=${encodeURIComponent(tweetMsg)}`);

    // // need to pull it out of the ui thread of for some reason the confetti goes first
    // setTimeout(() => {
    //   showSuccessConfetti();
    // }, 500);

    // return;
    // // E: TEST UI WORKFLOW HERE

    try {
      const remixParams: any = {
        solSignature,
        signatureNonce,
        forSolAddr: publicKey?.toBase58(),
        paymentHash: paymentMadeTx,
      };

      if (SIMULATE_AI_GENERATION_FLAG) {
        remixParams._simulateAIGenerations = "1";
      }

      if (selectedAiModel === "other") {
        remixParams.remixByoFormData = formData;

        // Add byoPlatform parameter
        const byoPlatform = selectedAiPlatform === "others" ? customAiPlatform : selectedAiPlatform;
        if (byoPlatform) {
          remixParams.byoPlatform = byoPlatform;
        }
      }

      const _sendRemixJobAfterPaymentResponse = await sendRemixJobAfterPaymentViaAPI(remixParams);

      if (_sendRemixJobAfterPaymentResponse.error) {
        throw new Error(
          _sendRemixJobAfterPaymentResponse.errorMessage || (selectedAiModel === "other" ? "Remix upload sending failed" : "Remix job sending failed")
        );
      }

      toastSuccess(selectedAiModel === "other" ? "Remix Upload Sent!" : "Remixing Job Sent!");

      setRemixingStatus("confirmed");

      // custom tweet text generation
      const artistMeta = artistLookupEverything[selectedReferenceTrack.arId];

      const tweetMsg = injectXUserNameIntoTweet(
        `I am AI remixing a song by the artist _(xUsername)_ on @SigmaXMusic! Check it out and vote it up so it gets published as an official derivative work!`,
        artistMeta.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?section=ai-remix`)}&text=${encodeURIComponent(tweetMsg)}`);

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Remix job failed:", error);
      alert("Error: Remix job seems to have failed");
      setBackendErrorMessage((error as Error).message);
      setRemixingStatus("failed");
    }
  };

  const downloadTrackViaClientSideWrapper = async () => {
    setTrackDownloadIsInProgress(true);
    const artistId = selectedReferenceTrack?.arId;
    const albumId = selectedReferenceTrack?.alId?.split("-")[0] || "";
    await downloadTrackViaClientSide({
      trackMediaUrl: selectedReferenceTrack?.file || "",
      artistId: artistId || "",
      albumId,
      alId: selectedReferenceTrack?.alId || "",
      trackTitle: selectedReferenceTrack?.title || "",
    });
    setTrackDownloadIsInProgress(false);
  };

  const PaymentConfirmationPopup_XP = () => {
    const priceInUSD = selectedAiModel === "other" ? GENERATE_MUSIC_MEME_PRICE_IN_USD / 2 : GENERATE_MUSIC_MEME_PRICE_IN_USD;
    const priceInXP = Number(priceInUSD) * ONE_USD_IN_XP;
    const notEnoughXP = priceInXP > solBitzBalance;

    let textPromptIfUsingGenreAndMood = null;

    if (selectedAiModel === "sigma-ai") {
      if (selectedMood !== "original" && selectedGenre !== "original") {
        textPromptIfUsingGenreAndMood = MUSIC_GEN_PROMPT_LIBRARY[selectedMood][selectedGenre];
      } else if (selectedMood !== "original" && selectedGenre === "original") {
        textPromptIfUsingGenreAndMood = MUSIC_GEN_PROMPT_FALLBACK_LIBRARY["moodOnly"][selectedMood];
      } else if (selectedMood === "original" && selectedGenre !== "original") {
        textPromptIfUsingGenreAndMood = MUSIC_GEN_PROMPT_FALLBACK_LIBRARY["genreOnly"][selectedGenre];
      }

      if (textPromptIfUsingGenreAndMood && textPromptIfUsingGenreAndMood.length > 0) {
        textPromptIfUsingGenreAndMood = textPromptIfUsingGenreAndMood[Math.floor(Math.random() * textPromptIfUsingGenreAndMood.length)];
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">{paymentStatus === "idle" ? "Confirm XP Payment" : "Payment Transfer in Process..."}</h3>
          {selectedAiModel === "sigma-ai" && (
            <>
              <div className="text-sm bg-gray-800 p-4 rounded-lg mb-4">
                You are about to create a
                {selectedMood !== "original" && (
                  <>
                    <span className="text-yellow-300 font-bold"> {selectedMood.toUpperCase()},</span>
                  </>
                )}
                {selectedGenre !== "original" && (
                  <>
                    <span className="text-yellow-400 font-bold"> {selectedGenre.toUpperCase()},</span>
                  </>
                )}
                <span className="text-yellow-500 font-bold">
                  {" "}
                  {trackStyle === "instrumental" ? "Melody Instrumental".toUpperCase() : "rack with Vocals".toUpperCase()}
                </span>{" "}
                AI Remix of the song: <span className="text-yellow-600 font-bold">{selectedReferenceTrack?.title.toUpperCase()}</span> titled{" "}
                <span className="text-yellow-700 font-bold">{songTitle.toUpperCase()}</span>
              </div>

              {textPromptIfUsingGenreAndMood && (
                <div className="mb-4">
                  {!showPrompt && (
                    <p className="text-xs cursor-pointer" onClick={() => setShowPrompt(true)}>
                      - Click to view prompt
                    </p>
                  )}
                  {showPrompt && (
                    <div className="text-sm bg-gray-800 p-4 rounded-lg mb-4">
                      <p className="text-xs font-bold text-yellow-300">Prompt:</p>
                      <p className="text-xs">{textPromptIfUsingGenreAndMood}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {selectedAiModel === "other" && (
            <div className="text-sm bg-gray-800 p-4 rounded-lg mb-4">
              <p className="font-bold text-yellow-300">You are uploading your own remixed track. A small XP fee is required for platform costs.</p>
            </div>
          )}

          <div>
            <div className="mb-2">
              <p className="text-sm">
                Amount to pay: {priceInXP.toLocaleString()} XP <span className="text-yellow-300 text-xs">({priceInUSD.toLocaleString()} USD)</span>
              </p>
              <p className="text-sm">Your XP balance: {solBitzBalance.toLocaleString()} XP</p>
            </div>

            {paymentStatus === "processing" ? (
              <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg mt-2">
                <Loader className="w-full text-center animate-spin text-yellow-300" size={20} />
                <p className="text-yellow-300">Payment in process... do not close this page</p>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button onClick={() => setShowPaymentConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handlePaymentConfirmation_XP(priceInXP, Number(priceInUSD), textPromptIfUsingGenreAndMood);
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  disabled={notEnoughXP}>
                  Proceed
                </Button>
              </div>
            )}

            {notEnoughXP && (
              <div className="flex-1 bg-red-500 text-white p-2 rounded-lg text-sm mt-2">
                <p>You do not have enough XP to proceed. You can earn more XP or buy an XP boost. Check for options in the top app menu.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const HowItWorksModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">How it works</h3>
          <button
            onClick={() => setShowHowItWorks(false)}
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors">
            ✕
          </button>
        </div>
        <ul className="space-y-4 list-none text-sm">
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">1.</span>
            <div>
              <p className="font-medium mb-1">Upload Reference Track</p>
              <p className="text-gray-300">Use a reference track you own the rights to and get one remixed track</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">2.</span>
            <div>
              <p className="font-medium mb-1">Pay Processing Fee in XP</p>
              <p className="text-gray-300">
                Pay <span className="text-orange-400">{GENERATE_MUSIC_MEME_PRICE_IN_USD * ONE_USD_IN_XP} XP</span> per remix for AI processing and platform
                fees. You can earn or buy XP on the platform.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">3.</span>
            <div>
              <p className="font-medium mb-1">Submit for Voting</p>
              <p className="text-gray-300">Submit your remixes to Sigma's community curation feed for voting</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">4.</span>
            <div>
              <p className="font-medium mb-1">Get Published</p>
              <p className="text-gray-300">Top-voted tracks get published as official derivative works on Sigma Music</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">5.</span>
            <div>
              <p className="font-medium mb-1">Earn Revenue</p>
              <p className="text-gray-300">Earn 20% of all sales from your published tracks (original artist: 70%, Sigma: 10%)</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );

  const AiGenerationInProgressPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        {remixingStatus === "processing" && (
          <div className="space-y-4">
            <h3 className="!text-xl font-bold">Sending Remix Job...</h3>
            <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
              <Loader className="w-full text-center animate-spin text-yellow-300" size={20} />
              <p className="text-yellow-300">Job is being sent... do not close this page</p>
            </div>
          </div>
        )}

        {remixingStatus === "failed" && (
          <>
            <h3 className="!text-xl font-bold">Error! sending remix job failed.</h3>
            <div className="space-y-4 flex flex-col mt-4">
              {backendErrorMessage && (
                <div className="flex flex-col gap-4 w-full">
                  <p className="bg-red-500 p-4 rounded-lg text-sm overflow-x-auto">⚠️ {backendErrorMessage}</p>
                </div>
              )}

              <Button
                onClick={() => {
                  resetStateToPristine(true);
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Back to App
              </Button>
            </div>
          </>
        )}

        {remixingStatus === "confirmed" && (
          <>
            <h3 className="!text-xl font-bold">Success! Your tracks are being generated.</h3>
            <p className="text-gray-300 mb-4">It may take a few minutes to generate. You will be notified when they are ready.</p>
            <div className="space-y-4 flex flex-col">
              <Button
                onClick={() => {
                  resetStateToPristine();
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                Back to App
              </Button>

              <div className="bg-yellow-300 rounded-full p-[10px] -z-1 ">
                <a
                  className="z-1 bg-yellow-300 text-black rounded-3xl gap-2 flex flex-row justify-center items-center"
                  href={"https://twitter.com/intent/tweet?" + tweetText}
                  data-size="large"
                  target="_blank"
                  rel="noreferrer">
                  <span className=" [&>svg]:h-4 [&>svg]:w-4 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                    </svg>
                  </span>
                  <p className="z-10">Share this news on X</p>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const ReferenceTrackList = ({ album, artistId, artistName, onBack }: { album: any; artistId: string; artistName: string; onBack: () => void }) => {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);

    useEffect(() => {
      const fetchTracks = async () => {
        setLoading(true);
        try {
          const tracksData: MusicTrack[] = await getAlbumTracksFromDBViaAPI(artistId, album.albumId, true);
          setTracks(tracksData);
        } catch (error) {
          console.error("Error fetching tracks:", error);
          setTracks([]);
        } finally {
          setLoading(false);
        }
      };

      fetchTracks();
    }, [artistId, album.albumId]);

    const handleTrackClick = (track: any, trackIndex: number) => {
      handleTrackSelection(track);
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-yellow-300" size={20} />
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Header */}
        <div>
          <Button variant="outline" className="text-sm px-3 py-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Albums
          </Button>
          <div className="flex items-center justify-between mb-6 mt-3">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="!text-xl font-bold text-white flex items-center">{album.title}</h2>
                <p className="text-gray-400">{artistName}</p>
                <div className="text-gray-400 text-xs mt-1">Select a track to use as reference for AI remix</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {album.img && (
                <div className="hidden md:block md:w-24 md:h-24 rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={album.img}
                    alt={`${album.title} cover`}
                    className="w-full h-full object-cover"
                    onError={({ currentTarget }) => {
                      currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track List Header */}
        <div className="border-b border-gray-700 pb-2 mb-4">
          <div className="grid grid-cols-[50px_1fr] gap-4 text-gray-400 text-sm font-medium">
            <div>Title</div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {tracks.map((track: MusicTrack, index) => {
            const isHovered = hoveredTrackIndex === index;
            const isNotAvailable = track?.hideOrDelete === "2" || track?.hideOrDelete === "1";

            return (
              <div
                key={`${track.albumTrackId || track.idx}-${index}`}
                className={`${isNotAvailable ? "hidden" : ""} group grid grid-cols-[50px_1fr] gap-4 py-3 px-2 rounded-md transition-colors hover:bg-gray-800 cursor-pointer`}
                onMouseEnter={() => setHoveredTrackIndex(index)}
                onMouseLeave={() => setHoveredTrackIndex(null)}
                onClick={() => handleTrackClick(track, index)}>
                {/* Track Title */}
                <div className="flex flex-col">
                  <span className="text-sm text-white">{track.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ReferenceTrackSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-2">Selected Reference Track to Remix</label>

      {selectedReferenceTrack ? (
        <div className="p-4 rounded-lg border border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayReferenceTrack}
              disabled={!selectedReferenceTrack.file}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                !selectedReferenceTrack.file
                  ? "bg-gray-600 cursor-not-allowed opacity-50"
                  : playingReferenceTrack
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-orange-500 hover:to-yellow-500 hover:scale-105 cursor-pointer"
              }`}>
              {playingReferenceTrack ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{selectedReferenceTrack.title}</p>
              <p className="text-xs text-gray-400">
                {selectedAlbumForTrackList?.title} • {artistLookupEverything[selectedReferenceTrack.arId]?.name || "Unknown Artist"}
              </p>
            </div>
            <button
              className={`text-gray-400 hover:text-white transition-colors`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent track click handler from firing
                downloadTrackViaClientSideWrapper();
              }}
              disabled={trackDownloadIsInProgress}
              title="Download track">
              {trackDownloadIsInProgress ? <Loader className="w-4 h-4 animate-spin text-yellow-300" /> : <Download className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                // Stop the track if it's playing
                if (playingReferenceTrack && audioRef.current) {
                  stopPlayingAudio();
                  setPlayingReferenceTrack(false);
                }
                setSelectedReferenceTrack(null);
              }}
              className="p-2 rounded-full hover:bg-black/30 text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-gray-600 bg-[#2A2A2A] text-center">
          <p className="text-sm text-gray-400 mb-2">No reference track selected</p>
          <p className="text-xs text-gray-500">Use Reference Track Navigator to browse your commercial licenses to select a track</p>
        </div>
      )}
    </div>
  );

  const TrackStyleSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-2">Track Style</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTrackStyle("instrumental")}
          className={`p-4 rounded-lg border transition-all duration-300 text-left ${
            trackStyle === "instrumental"
              ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
              : "border-gray-600 hover:border-yellow-500 bg-[#2A2A2A]"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trackStyle === "instrumental" ? "bg-yellow-500" : "bg-gray-600"}`}>
              <span className="text-white text-sm">🎹</span>
            </div>
            <div>
              <p className="text-xs font-medium text-white">Melody Instrumental</p>
              <p className="text-xs text-gray-400">No vocal elements</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setTrackStyle("with-vocals")}
          disabled
          className={`p-4 rounded-lg border transition-all duration-300 text-left ${
            trackStyle === "with-vocals"
              ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
              : "border-gray-600 hover:border-yellow-500 bg-[#2A2A2A]"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trackStyle === "with-vocals" ? "bg-yellow-500" : "bg-gray-600"}`}>
              <span className="text-white text-sm">🎤</span>
            </div>
            <div>
              <p className="text-xs font-medium text-white">With Vocals</p>
              <p className="text-xs text-gray-400">Coming soon...</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const GenreSelector = () => {
    const aiRemixGenres = ALL_MUSIC_GENRES.filter((genre) => genre.isAiRemixOption);

    aiRemixGenres.splice(0, 0, {
      code: "original",
      label: "Match Reference Track",
      tier: "tier1" as any,
      tileImgBg: "",
      isAiRemixOption: true,
    });

    const handleGenreClick = (genreCode: string) => {
      // Store current scroll positions for both containers
      const genreScrollLeft = genreScrollRef.current?.scrollLeft || 0;
      const moodScrollLeft = moodScrollRef.current?.scrollLeft || 0;

      // Update the selected genre
      setSelectedGenre(genreCode);

      // Restore both scroll positions after state update
      setTimeout(() => {
        if (genreScrollRef.current) {
          genreScrollRef.current.scrollLeft = genreScrollLeft;
        }
        if (moodScrollRef.current) {
          moodScrollRef.current.scrollLeft = moodScrollLeft;
        }
      }, 0);
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">Desired Genre</label>
        <div
          ref={genreScrollRef}
          className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {aiRemixGenres.map((genre) => (
            <button
              key={genre.code}
              onClick={() => handleGenreClick(genre.code)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 whitespace-nowrap ${
                selectedGenre === genre.code
                  ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-white"
                  : "border-gray-600 hover:border-yellow-500 bg-[#2A2A2A] text-gray-300 hover:text-white"
              }`}>
              {genre.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const MoodSelector = () => {
    const handleMoodClick = (moodCode: string) => {
      // Store current scroll positions for both containers
      const genreScrollLeft = genreScrollRef.current?.scrollLeft || 0;
      const moodScrollLeft = moodScrollRef.current?.scrollLeft || 0;

      // Update the selected mood
      setSelectedMood(moodCode);

      // Restore both scroll positions after state update
      setTimeout(() => {
        if (genreScrollRef.current) {
          genreScrollRef.current.scrollLeft = genreScrollLeft;
        }
        if (moodScrollRef.current) {
          moodScrollRef.current.scrollLeft = moodScrollLeft;
        }
      }, 0);
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">Desired Mood</label>
        <div
          ref={moodScrollRef}
          className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {ALL_MUSIC_MOODS_FOR_REMIX.map((mood) => (
            <button
              key={mood.code}
              onClick={() => handleMoodClick(mood.code)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 whitespace-nowrap ${
                selectedMood === mood.code
                  ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-white"
                  : "border-gray-600 hover:border-yellow-500 bg-[#2A2A2A] text-gray-300 hover:text-white"
              }`}>
              {mood.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`${renderInline ? "w-full h-full" : "fixed inset-0 bg-yellow-400 bg-opacity-30 flex items-center justify-center z-50"}`}>
      {showPaymentConfirmation && <PaymentConfirmationPopup_XP />}
      {showHowItWorks && <HowItWorksModal />}
      {(remixingStatus === "processing" || remixingStatus === "confirmed" || remixingStatus === "failed") && <AiGenerationInProgressPopup />}

      <div
        className={`${renderInline ? "w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-2" : "relative bg-[#1A1A1A] rounded-lg p-6 max-w-5xl w-full mx-4 grid grid-cols-1 lg:grid-cols-2 gap-6"}`}>
        {/* Close button - moved outside the grid */}
        {!renderInline && (
          <button
            disabled={paymentStatus === "processing"}
            onClick={() => onCloseModal(false)}
            className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
            ✕
          </button>
        )}

        {/* Left Column - Prompt Form */}
        <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-lg p-6">
          {!renderInline && (
            <div className="mb-6 flex justify-between items-center">
              <h2 className="!text-xl font-bold">Generate New AI Remix</h2>
              <Button
                onClick={() => setShowHowItWorks(true)}
                variant="outline"
                className="bg-gradient-to-r from-gray-200 to-gray-500 text-black hover:text-black  py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm h-[40px] opacity-80">
                How it works?
              </Button>
            </div>
          )}

          {/* Pick AI Model To Use */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-200">AI Model Selection</label>
            {SIMULATE_AI_GENERATION_FLAG && (
              <div className="text-xs text-gray-300 mb-3">
                <span className="text-red-500 font-bold">Simulating AI generations</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedAiModel("sigma-ai")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedAiModel === "sigma-ai"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/25 text-black"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600"
                }`}>
                SigmaAI V1
              </button>
              <button
                onClick={() => setSelectedAiModel("other")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedAiModel === "other"
                    ? "bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-yellow-500/25 text-black"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600"
                }`}>
                Suno, Udio or Others
              </button>
            </div>
          </div>

          {/* Prompt Generation Form Elements */}
          <div className="space-y-4">
            <>
              <div className={`flex flex-col gap-4`}>
                {selectedAiModel === "other" && (
                  <>
                    <p className="text-xs text-gray-300">
                      Want to use Suno, Udio or others to remix your track and then launch it on Sigma Music? You can do that here...
                    </p>

                    <div className="">
                      <label className="block text-sm font-medium mb-2">What AI platform are you using?</label>

                      <div className="flex flex-row gap-2">
                        <div className="flex-1">
                          <select
                            value={selectedAiPlatform}
                            onChange={handleAiPlatformChange}
                            className="w-full text-sm p-3 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none text-white h-[40px]">
                            <option value="suno">Suno</option>
                            <option value="udio">Udio</option>
                            <option value="others">Others</option>
                          </select>
                        </div>
                        {selectedAiPlatform === "others" ? (
                          <div>
                            <input
                              type="text"
                              value={customAiPlatform}
                              onChange={handleCustomAiPlatformChange}
                              maxLength={100}
                              placeholder="AI platform name..."
                              className="w-full text-sm p-3 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none text-white placeholder-gray-400 h-[40px]"
                            />
                          </div>
                        ) : (
                          <div className="flex-1"></div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-2">
                  <label className="block text-sm font-medium mb-2">
                    Your Track Name
                    <span className="float-right text-gray-400 text-xs">{MAX_TITLE_LENGTH - songTitle.length} characters left</span>
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={handleTitleChange}
                    maxLength={MAX_TITLE_LENGTH}
                    className="w-full p-2 rounded-lg bg-[#2A2A2A] border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <ReferenceTrackSelector />

                {selectedAiModel === "sigma-ai" && (
                  <>
                    <TrackStyleSelector />

                    <GenreSelector />

                    <MoodSelector />
                  </>
                )}

                {selectedAiModel === "other" && (
                  <>
                    {/* Asset Uploads */}
                    <div className="flex flex-row gap-4 w-full md:col-span-2">
                      {/* Cover Art URL */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Remix Track Art <span className="text-red-400">*</span>
                        </label>

                        <div className="mb-3">
                          <MediaUpdate
                            imageUrl={formData.cover_art_url}
                            size="md"
                            onFileSelect={(file) => {
                              setNewSelectedTrackCoverArtFile(file);
                              // Clear error when file is selected
                              if (errors.cover_art_url) {
                                setErrors((prev) => ({ ...prev, cover_art_url: undefined }));
                              }
                            }}
                            onFileRevert={() => {
                              setNewSelectedTrackCoverArtFile(null);
                            }}
                            alt="Track Cover"
                            imgPlaceholder="image"
                          />
                        </div>

                        {errors.cover_art_url && <p className="text-red-400 text-xs mt-1">{errors.cover_art_url}</p>}
                        <p className="text-gray-400 text-xs mt-1">
                          Must be a GIF, JPG, or PNG file (Max size: 3MB). Note: JPEG files should be renamed to JPG.
                        </p>
                      </div>

                      {/* File URL */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Remix Audio File <span className="text-red-400">*</span>
                        </label>

                        <div className="mb-3">
                          <MediaUpdate
                            mediaUrl={formData.file}
                            size="md"
                            onFileSelect={(file) => {
                              setNewSelectedAudioFile(file);
                              // Clear error when file is selected
                              if (errors.file) {
                                setErrors((prev) => ({ ...prev, file: undefined }));
                              }
                            }}
                            onFileRevert={() => {
                              setNewSelectedAudioFile(null);
                            }}
                            alt="Audio File"
                            imgPlaceholder="audio"
                            isAudio={true}
                          />
                        </div>

                        {errors.file && <p className="text-red-400 text-xs mt-1">{errors.file}</p>}
                        <p className="text-gray-400 text-xs mt-1">Must be an MP3 file (Max size: 4.5MB)</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>

            <Button
              onClick={selectedAiModel === "sigma-ai" ? handleTrackGeneration : handleTrackUpload}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-lg font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              <FileMusicIcon className="w-6 h-6 mr-2" />
              {selectedAiModel === "sigma-ai" ? "Generate Remix" : "Upload Remix"}
            </Button>
          </div>
        </div>

        {/* Right Column - Reference Track Navigator */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-6">
          {selectedAlbumForTrackList ? (
            <ReferenceTrackList
              album={selectedAlbumForTrackList}
              artistId={selectedAlbumForTrackList.albumId.split("_")[0]}
              artistName={artistLookupEverything[selectedAlbumForTrackList.albumId.split("_")[0]]?.name || "Unknown Artist"}
              onBack={handleBackToAlbums}
            />
          ) : (
            <>
              <div className="mb-2">
                <h3 className="!text-lg font-bold mb-1">Reference Track Navigator</h3>
                <p className="text-sm text-gray-300">Browse and select reference tracks for your AI remixes</p>
              </div>

              {/* Your Commercial Licenses */}
              <div className="space-y-4">
                <div className="bg-[#2A2A2A] rounded-lg p-4">
                  <h4 className="!text-lg font-medium">Your Commercial Licenses</h4>
                  <p className="text-xs text-gray-300 mb-3">Own full rights to remixes made using music from these albums</p>
                  {isLoadingStoryLicenses ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader className="animate-spin text-yellow-300 mr-2" size={20} />
                      <span className="text-sm text-gray-400">Loading licenses...</span>
                    </div>
                  ) : myStoryProtocolLicenses.length > 0 ? (
                    <>
                      <div className="space-y-3 overflow-y-auto max-h-[calc(80vh-200px)]">
                        {myStoryProtocolLicenses.map((license: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 hover:bg-[#3A3A3A] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-600"
                            onClick={() => handleAlbumClick(license)}>
                            {license.albumImage ? (
                              <img src={license.albumImage} alt={license.albumName} className="w-12 h-12 object-cover rounded-lg" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                <span className="text-lg text-gray-400">🎵</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{license.albumName || "Unknown Album"}</p>
                              <p className="text-xs text-gray-400">Commercial License</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Button
                          onClick={() => {
                            navigateToDeepAppView({
                              toSection: "albums",
                              toView: "with_ai_remix_licenses",
                            });
                          }}
                          variant="outline"
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:text-black py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm h-[40px] mt-5">
                          Buy More Commercial Licenses
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400 mb-2">
                        <span className="text-xl">⚠️</span> <br />
                        You need a commercial license to generate new AI remixes and you don't have any yet.
                      </p>

                      <Button
                        onClick={() => {
                          navigateToDeepAppView({
                            toSection: "albums",
                            toView: "with_ai_remix_licenses",
                          });
                        }}
                        variant="outline"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:text-black py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm h-[40px]">
                        Buy Commercial Licenses
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Albums Anyone Can Remix */}
              <div className="space-y-4 mt-5">
                <div className="bg-[#2A2A2A] rounded-lg p-4">
                  <h4 className="!text-lg font-medium">Free Albums You Can Remix</h4>
                  <p className="text-xs text-gray-300 mb-3">
                    Remix for personal use only{" "}
                    <InfoTooltip content={`You get a CC BY-NC 4.0 license - ${LICENSE_BLURBS["CC BY-NC 4.0"].blurb}`} position="right" />{" "}
                  </p>
                  <div className="space-y-3 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {freeLincensedAlbums.map((license: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 hover:bg-[#3A3A3A] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-600"
                        onClick={() => handleAlbumClick(license)}>
                        {license.albumImage ? (
                          <img src={license.albumImage} alt={license.albumName} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg text-gray-400">🎵</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{license.albumName || "Unknown Album"}</p>
                          <p className="text-xs text-gray-400">Free Album</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/*
      the payment API pushes the job to the SQS queue with the body params 
      {
        "songTitle": "Starlight Gaze",
        "genre": "Pop",
        "mood": "Happy",
        "refTrack_alId": "1234567890",
        "refTrack_file": "https://example.com/track.mp3",
        "refTrack_arId": "ar1"
      }

      the job then stores the SQS message ID against the payment log. this will be called asyncTaskJobTraceId in the payment log. 
      
      AT THIS STATE - The DB item will be like this (the payment log):

      {
      "payer": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "tx": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNxP",
      "createdOn": 1753952235552,
      "task": "remix",
      "type": "sol",
      "amount": "0.2696",
      "paymentStatus": "new",
      "promptParams": {
              "songTitle": "Starlight Gaze",
              "genre": "Pop",
              "mood": "Happy",
              "refTrack_alId": "ar21_a3-1",
              "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
              "refTrack_arId": "ar1"
            },
            "asyncTaskJobTraceId": "sqs-mgs01"
      }

      paymentStatus will have the status "new", "success", "failed", "uncertain". new means we collected payment but the job is not yet processed. success means the job is processed and the newLaunches table is updated.

      the SQS queue picks it up and processes it and then we get an item in the newLaunches table.
      

      AT THIS STATE - The DB item will be like this (the newLaunches table):

      {
      "launchId": "asdt2",
      "createdOn": 1754019336,
      "image": "https://gateway.lighthouse.storage/ipfs/bafkreib5yrl3qsdhsn2hc4huslicokinm4ephem7zj2pxkwv5fb6im2azq",
      "lastStatusUpdateOn": 1754019336,
      "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNxP",
      "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "status": "new",
      "promptParams": {
                "songTitle": "Starlight Gaze",
                "genre": "Pop",
                "mood": "Happy",
                "refTrack_alId": "ar21_a3-1",
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
                "refTrack_arId": "ar1"
              },
      "versions": [
        {
        "bountyId": "asdt2-1",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
        },
        {
        "bountyId": "asdt2-2",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq"
        }
      ]
      }


      the paymentTxHash is the linking item between the payment log and the newLaunches table.

      At this point, we also need to update the payment log to have the updated status "success"

      "payer": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "tx": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNxP",
      "createdOn": 1753952235552,
      "task": "remix",
      "type": "sol",
      "amount": "0.2696",
      "paymentStatus": "success",
      "promptParams": {
              "songTitle": "Starlight Gaze",
              "genre": "Pop",
              "mood": "Happy",
              "refTrack_alId": "ar21_a3-1",
              "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
              "refTrack_arId": "ar1"
            },
            "asyncTaskJobTraceId": "sqs-mgs01"
      }




      newLaunches will have the status "new", "graduated", "published"


      the graduated version looks like this:
       {
      "launchId": "asdt2",
      "createdOn": 1754019336,
      "image": "https://gateway.lighthouse.storage/ipfs/bafkreib5yrl3qsdhsn2hc4huslicokinm4ephem7zj2pxkwv5fb6im2azq",
      "lastStatusUpdateOn": 1754019336,
      "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNxP",
      "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "status": "graduated",
      "promptParams": {
                "songTitle": "Starlight Gaze",
                "genre": "Pop",
                "mood": "Happy",
                "refTrack_alId": "ar21_a3-1",
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
                "refTrack_arId": "ar1"
              },
      "versions": [
        {
        "bountyId": "asdt2-1",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
        },
        {
        "bountyId": "asdt2-2",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq"
        }
      ]
      }


      the "published" version indicates that the track get put inside an album so we need to link the album-track id (alid) to the launchId.
 
 {
      "launchId": "asdt2",
      "createdOn": 1754019336,
      "image": "https://gateway.lighthouse.storage/ipfs/bafkreib5yrl3qsdhsn2hc4huslicokinm4ephem7zj2pxkwv5fb6im2azq",
      "lastStatusUpdateOn": 1754019336,
      "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNxP",
      "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "status": "published",
      "promptParams": {
                "songTitle": "Starlight Gaze",
                "genre": "Pop",
                "mood": "Happy",
                "refTrack_alId": "ar21_a3-1",
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
                "refTrack_arId": "ar1"
              },
      "albumId": "asdt2-1",
      "versions": [
        {
        "bountyId": "asdt2-1",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
        },
        {
        "bountyId": "asdt2-2",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq"
        }
      ]
      }









      TEST -- new workflow:
      
      1 step:
      {
 "payer": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
 "tx": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNx1",
 "amount": "0.2696",
 "asyncTaskJobTraceId": "sqs-mgs02",
 "createdOn": 1754631672,
 "paymentStatus": "new",
 "promptParams": {
  "genre": "Rock",
  "mood": "Sad",
  "refTrack_alId": "ar21_a3-1",
  "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
  "refTrack_arId": "ar1"
  "songTitle": "Rockstar Gaze"
 },
 "task": "remix",
 "type": "sol"
}

      2 step:

      {
      "launchId": "asdt4",
      "createdOn": 1754631672,
      "image": "https://api.itheumcloud.com/app_nftunes/assets/img/Bobby_Ibo_Underdogs.JPG",
      "lastStatusUpdateOn": 1754019336,
      "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNx1",
      "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
      "status": "new",
      "promptParams": {
                "songTitle": "Rockstar Gaze",
                "genre": "Rock",
                "mood": "Sad",
                "refTrack_alId": "ar21_a3-1",
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
                "refTrack_arId": "ar1"
              },
      "versions": [
        {
        "bountyId": "asdt4-1",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
        },
        {
        "bountyId": "asdt4-2",
        "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq"
        }
      ]
      },
      "ref_artistId": "ar21"

      && 

      paymentStatus: "success" on the payment log



      3 step: (on the UI XP is given to promote it)


  {
 "launchId": "asdt4",
 "createdOn": 1754631672,
 "image": "https://api.itheumcloud.com/app_nftunes/assets/img/Bobby_Ibo_Underdogs.JPG",
 "lastStatusUpdateOn": 1754638158649,
 "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNx1",
 "promptParams": {
  "genre": "Rock",
  "mood": "Sad",
  "refTrack_alId": "ar21_a3-1",
  "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
  "refTrack_arId": "ar1"
  "songTitle": "Rockstar Gaze"
 },
 "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
 "status": "graduated",
 "versions": [
  {
   "bountyId": "asdt4-1",
   "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
  },
  {
   "bountyId": "asdt4-2",
   "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq"
  }
 ],
 "ref_artistId": "ar21"
}

4 step


  {
 "launchId": "asdt4",
 "createdOn": 1754631672,
 "image": "https://api.itheumcloud.com/app_nftunes/assets/img/Bobby_Ibo_Underdogs.JPG",
 "lastStatusUpdateOn": 1754638158649,
 "paymentTxHash": "52XAngqsCMcaVkj4tmdrfMmM5YWsscYf7unCQSpNeGWMNaxB5AGcSziw9wAuEAAaRVC8e8ZjhvyQm3uqyuJNxNx1",
 "promptParams": {
  "genre": "Rock",
  "mood": "Sad",
  "refTrack_alId": "ar21_a3-1",
  "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3",
  "refTrack_arId": "ar1"
  "songTitle": "Rockstar Gaze"
 },
 "remixedBy": "PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
 "status": "published", 
 "versions": [
  {
   "bountyId": "asdt4-1",
   "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeihhl7gghewocewzkgal2mzrnekel2opmfp3e25ghdh6pr3fenckp4"
  },
  {
   "bountyId": "asdt4-2",
   "streamUrl": "https://gateway.lighthouse.storage/ipfs/bafybeiamazbh6gdjztniyhmkj3gwbk627jr2gcvrtbnfviq3pzdgitpazq",
    "deepLinkSlugToTrackInAlbum": "young-tusk~ar135_a1"
  }
 ],
 "ref_artistId": "ar21"
}
      */
