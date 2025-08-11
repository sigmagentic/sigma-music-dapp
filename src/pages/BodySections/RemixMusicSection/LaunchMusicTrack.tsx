import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, Commitment, TransactionConfirmationStrategy } from "@solana/web3.js";
import { confetti } from "@tsparticles/confetti";
import axios from "axios";
import { Loader, ArrowLeft } from "lucide-react";
import { GENERATE_MUSIC_MEME_PRICE_IN_USD, SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS, ALL_MUSIC_GENRES, ALL_MUSIC_MOODS } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { injectXUserNameIntoTweet, toastSuccess } from "libs/utils";
import { fetchMyAlbumsFromMintLogsViaAPI, sleep } from "libs/utils";
import { fetchSolPriceViaAPI, getApiWeb2Apps, logPaymentToAPI } from "libs/utils/api";
import { getAlbumTracksFromDBViaAPI } from "libs/utils/api";
import { getArtistsAlbumsData } from "pages/BodySections/HomeSection/shared/utils";
import { useAccountStore } from "store/account";
import { useAppStore } from "store/app";

const MAX_TITLE_LENGTH = 50;

export const LaunchMusicTrack = ({ onCloseModal }: { onCloseModal: (refreshPaymentLogs: boolean) => void }) => {
  const { connection } = useConnection();
  const { sendTransaction, signMessage } = useWallet();
  const { publicKey } = useSolanaWallet();
  const [songTitle, setSongTitle] = useState("");
  const [trackGenerationRequested, setTrackGenerationRequested] = useState(false);
  const [requiredSolAmount, setRequiredSolAmount] = useState<number | null>(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [paymentTx, setPaymentTx] = useState("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [artistAlbumDataset, setArtistAlbumDataset] = useState<any[]>([]);
  const [myStoryProtocolLicenses, setMyStoryProtocolLicenses] = useState<any[]>([]);
  const [isLoadingStoryLicenses, setIsLoadingStoryLicenses] = useState(false);
  const [selectedAlbumForTrackList, setSelectedAlbumForTrackList] = useState<any>(null);
  const [selectedReferenceTrack, setSelectedReferenceTrack] = useState<any>(null);
  const [playingReferenceTrack, setPlayingReferenceTrack] = useState(false);
  const [trackStyle, setTrackStyle] = useState<"with-vocals" | "instrumental">("with-vocals");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { artistLookupEverything } = useAppStore();
  const [tweetText, setTweetText] = useState<string>("");

  // Cached Signature Store Items
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

  // Add effect to prevent body scrolling when modal is open and cleanup audio on unmount
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";

      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Load artist album dataset and SOL price
  useEffect(() => {
    (async () => {
      const { albumArtistLookupData } = await getArtistsAlbumsData();
      setArtistAlbumDataset(albumArtistLookupData);
    })();

    const fetchPrice = async () => {
      try {
        const { currentSolPrice } = await fetchSolPriceViaAPI();

        // Calculate required SOL amount based on USD price
        const solAmount = GENERATE_MUSIC_MEME_PRICE_IN_USD / currentSolPrice;
        setRequiredSolAmount(Number(solAmount.toFixed(4))); // Round to 4 decimal places
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
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
  }, [myAlbumMintLogs, artistAlbumDataset]);

  // Add effect to fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      try {
        const balance = await connection.getBalance(publicKey);
        setWalletBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

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
    // Handle track selection for AI remix
    console.log("Selected track for remix:", track);

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Reset audio player states
    setPlayingReferenceTrack(false);

    setSelectedReferenceTrack(track);
    // Keep the track list view open so user can change selection if needed
  };

  const handleBackToAlbums = () => {
    setSelectedAlbumForTrackList(null);
  };

  // Custom Reference Track List Component
  const ReferenceTrackList = ({ album, artistId, artistName, onBack }: { album: any; artistId: string; artistName: string; onBack: () => void }) => {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);

    useEffect(() => {
      const fetchTracks = async () => {
        setLoading(true);
        try {
          const tracksData = await getAlbumTracksFromDBViaAPI(artistId, album.albumId, true);
          setTracks(tracksData || []);
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
          <Loader className="animate-spin w-8 h-8 text-yellow-300" />
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
                <h2 className="text-2xl font-bold text-white flex items-center">{album.title}</h2>
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
            <div>#</div>
            <div>Title</div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isHovered = hoveredTrackIndex === index;

            return (
              <div
                key={`${track.albumTrackId || track.idx}-${index}`}
                className="group grid grid-cols-[50px_1fr] gap-4 py-3 px-2 rounded-md transition-colors hover:bg-gray-800 cursor-pointer"
                onMouseEnter={() => setHoveredTrackIndex(index)}
                onMouseLeave={() => setHoveredTrackIndex(null)}
                onClick={() => handleTrackClick(track, index)}>
                {/* Track Number / Select Icon */}
                <div className="flex items-center justify-center">
                  {isHovered ? <span className="text-purple-400 text-sm">✓</span> : <span className="text-gray-400 text-sm">{index + 1}</span>}
                </div>

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

  const handleTrackGeneration = () => {
    if (!publicKey?.toBase58() || !songTitle || !selectedReferenceTrack || !selectedGenre || !selectedMood) {
      alert("Please fill in all fields");
      return;
    }

    setShowPaymentConfirmation(true);
  };

  const handlePaymentConfirmation = async () => {
    if (!publicKey || !requiredSolAmount) return;

    setPaymentStatus("processing");

    let signature = null;

    try {
      if (requiredSolAmount > 0) {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(SIGMA_SERVICE_PAYMENT_WALLET_ADDRESS),
            lamports: Math.round(requiredSolAmount * 1e9), // Convert SOL to lamports and ensure integer
          })
        );

        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = publicKey;

        signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        const strategy: TransactionConfirmationStrategy = {
          signature: signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        };

        await connection.confirmTransaction(strategy, "finalized" as Commitment);

        // Update payment transaction hash
        setPaymentTx(signature);
      } else {
        signature = "FREE-gen-" + Date.now();
      }

      // let's get the user's signature here as we will need it for mint verification (best we get it before payment)
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      // Log payment to web2 API (placeholder)
      await logPaymentToAPI({
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        payer: publicKey.toBase58(),
        tx: signature,
        task: "remix",
        type: "sol",
        amount: requiredSolAmount.toString(),
        promptParams: {
          songTitle: songTitle,
          genre: selectedGenre,
          mood: selectedMood,
          refTrack_alId: selectedReferenceTrack.alId,
          refTrack_file: selectedReferenceTrack.file,
        },
      });

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      // custom tweet text generation
      const artistMeta = artistLookupEverything[selectedReferenceTrack.arId];

      const tweetMsg = injectXUserNameIntoTweet(
        `I am AI remixing a song by the artist _(xUsername)_ on @SigmaXMusic! Check it out and vote it up so it gets published as an official derivative work!`,
        artistMeta.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?section=ai-remix`)}&text=${encodeURIComponent(tweetMsg)}`);

      setTrackGenerationRequested(true);

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
      setPaymentStatus("idle");
    }
  };

  const handlePaymentConfirmation_Simulate = async () => {
    if (!publicKey || !requiredSolAmount) return;

    setPaymentStatus("processing");

    try {
      await sleep(5);

      toastSuccess("Payment Successful!", true);
      setPaymentStatus("confirmed");
      setShowPaymentConfirmation(false);

      // custom tweet text generation
      const artistMeta = artistLookupEverything[selectedReferenceTrack.arId];

      const tweetMsg = injectXUserNameIntoTweet(
        `I am AI remixing a song by the artist _(xUsername)_ on @SigmaXMusic! Check it out and vote it up so it gets published as an official derivative work!`,
        artistMeta.xLink
      );

      setTweetText(`url=${encodeURIComponent(`https://sigmamusic.fm?section=ai-remix`)}&text=${encodeURIComponent(tweetMsg)}`);

      setTrackGenerationRequested(true);

      // need to pull it out of the ui thread of for some reason the confetti goes first
      setTimeout(() => {
        showSuccessConfetti();
      }, 500);
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
      setPaymentStatus("idle");
    }
  };

  const showSuccessConfetti = async () => {
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
          value: ["💎", "⭐", "✨", "💫"],
        },
      },
    });

    if (animation) {
      await sleep(10);
      animation.stop();
      if ((animation as any).destroy) {
        (animation as any).destroy();
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_TITLE_LENGTH);
    setSongTitle(value);
  };

  const handlePlayReferenceTrack = () => {
    if (!selectedReferenceTrack?.file) return;

    if (playingReferenceTrack) {
      audioRef.current?.pause();
      setPlayingReferenceTrack(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(selectedReferenceTrack.file);
      audioRef.current.play();
      setPlayingReferenceTrack(true);
    }
  };

  function resetStateToPristine() {
    setShowPaymentConfirmation(false);
    setPaymentStatus("idle");
    setTrackGenerationRequested(false);
    setTweetText("");
    setSelectedReferenceTrack(null);
    setSelectedGenre("");
    setSelectedMood("");
    setSongTitle("");
    setTrackStyle("with-vocals");

    onCloseModal(true);
  }

  // Payment confirmation popup
  const PaymentConfirmationPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Confirm Payment</h3>
        <div className="space-y-4">
          <p>
            Amount to pay: {requiredSolAmount ?? "..."} SOL (${GENERATE_MUSIC_MEME_PRICE_IN_USD})
          </p>
          <p>Your wallet balance: {walletBalance?.toFixed(4) ?? "..."} SOL</p>
          <p>When you click "Proceed", you will be asked to sign a single transaction to send the payment for processing your music generation request.</p>

          {paymentStatus === "processing" ? (
            <div className="text-center flex flex-col items-center gap-2 bg-gray-800 p-4 rounded-lg">
              <Loader className="w-full text-center animate-spin hover:scale-105" />
              <p className="text-yellow-300">Payment in process... do not close this page</p>
            </div>
          ) : paymentStatus === "confirmed" ? (
            <div className="text-center text-green-500">
              <p>Payment confirmed! Your tracks are being generated. You will be notified when they are ready.</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button onClick={() => setShowPaymentConfirmation(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
              <Button onClick={handlePaymentConfirmation_Simulate} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                Proceed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // How it works modal
  const HowItWorksModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
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
              <p className="text-gray-300">Use a reference track you own the rights to and get two versions of a new unique AI remix</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold text-lg">2.</span>
            <div>
              <p className="font-medium mb-1">Pay Processing Fee</p>
              <p className="text-gray-300">
                Pay{" "}
                <span className="text-orange-400">
                  {requiredSolAmount ?? "..."} SOL (${GENERATE_MUSIC_MEME_PRICE_IN_USD})
                </span>{" "}
                per remix for AI processing and platform fees
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

  // AI Generation in progress popup
  const AiGenerationInProgressPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="!text-xl font-bold">Success! Your tracks are being generated.</h3>
        <p className="text-gray-300 mb-4">It may take a few minutes to generate. You will be notified when they are ready.</p>
        <div className="space-y-4 flex flex-col">
          <Button
            onClick={() => {
              resetStateToPristine();
            }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
            Back to Sigma Remix Home
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
      </div>
    </div>
  );

  const getTweetUrl = (sendBackOnlyText: boolean = false) => {
    const tweetText = encodeURIComponent(
      `yo @SigmaXMusic I just remixed a music single titled "${songTitle}" in ${selectedGenre} style and ${selectedMood} mood.`
    );
    return sendBackOnlyText ? tweetText : `https://twitter.com/intent/tweet?text=${tweetText}`;
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h4v12H6zm8 0h4v12h-4z" />
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
              onClick={() => {
                // Stop the track if it's playing
                if (playingReferenceTrack && audioRef.current) {
                  audioRef.current.pause();
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
          <p className="text-xs text-gray-500">Browse your commercial licenses to select a track</p>
        </div>
      )}
    </div>
  );

  const TrackStyleSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-2">Track Style</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTrackStyle("with-vocals")}
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
              <p className="text-sm font-medium text-white">With Vocals</p>
              <p className="text-xs text-gray-400">Include vocal elements</p>
            </div>
          </div>
        </button>

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
              <p className="text-sm font-medium text-white">Only Instrumental</p>
              <p className="text-xs text-gray-400">No vocal elements</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const GenreSelector = () => {
    const aiRemixGenres = ALL_MUSIC_GENRES.filter((genre) => genre.isAiRemixOption);

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">Desired Genre</label>
        <div
          className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {aiRemixGenres.map((genre) => (
            <button
              key={genre.code}
              onClick={() => setSelectedGenre(genre.code)}
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
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">Desired Mood</label>
        <div
          className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2
              dark:[&::-webkit-scrollbar-track]:bg-neutral-700
              dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {ALL_MUSIC_MOODS.map((mood) => (
            <button
              key={mood.code}
              onClick={() => setSelectedMood(mood.code)}
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {showPaymentConfirmation && <PaymentConfirmationPopup />}
      {showHowItWorks && <HowItWorksModal />}
      {trackGenerationRequested && <AiGenerationInProgressPopup />}

      <div className="relative bg-[#1A1A1A] rounded-lg p-6 max-w-5xl w-full mx-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Close button - moved outside the grid */}
        <button
          disabled={paymentStatus === "processing"}
          onClick={() => onCloseModal(false)}
          className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full text-xl transition-colors z-10">
          ✕
        </button>

        {/* Left Column - Form */}
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="!text-2xl font-bold">Generate New AI Remix</h2>
            <Button
              onClick={() => setShowHowItWorks(true)}
              variant="outline"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:text-black  py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm h-[40px] opacity-80">
              How it works?
            </Button>
          </div>

          <div className="space-y-4">
            <div className={`flex flex-col gap-4`}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Song Title
                  <span className="float-right text-gray-400">{MAX_TITLE_LENGTH - songTitle.length} characters left</span>
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

              <TrackStyleSelector />

              <GenreSelector />

              <MoodSelector />
            </div>

            <Button
              onClick={handleTrackGeneration}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              Generate Remix
            </Button>
          </div>
        </div>

        {/* Right Column - Reference Track Navigator */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6">
          {selectedAlbumForTrackList ? (
            <ReferenceTrackList
              album={selectedAlbumForTrackList}
              artistId={selectedAlbumForTrackList.albumId.split("_")[0]}
              artistName={artistLookupEverything[selectedAlbumForTrackList.albumId.split("_")[0]]?.name || "Unknown Artist"}
              onBack={handleBackToAlbums}
            />
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Reference Track Navigator</h3>
                <p className="text-sm text-gray-300">Browse and select reference tracks for your AI remixes</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#2A2A2A] rounded-lg p-4">
                  <h4 className="!text-lg font-medium mb-3">Your Commercial Licenses</h4>
                  {isLoadingStoryLicenses ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm text-gray-400">Loading licenses...</span>
                    </div>
                  ) : myStoryProtocolLicenses.length > 0 ? (
                    <div className="space-y-3">
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
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400 mb-2">You don't have any commercial licenses</p>
                      <p className="text-xs text-gray-500">Purchase album licenses to use as reference tracks</p>
                    </div>
                  )}
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
        "refTrack_file": "https://example.com/track.mp3"
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
              "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
              "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
                "refTrack_file": "https://api.itheumcloud.com/app_nftunes/assets/music_files/TKO_Ember_EDM.MP3"
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
