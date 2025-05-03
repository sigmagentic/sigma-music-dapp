import React, { useEffect, useState, useRef } from "react";
import { Gift, Dice1, Music2, X, Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Pause, ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import Countdown from "react-countdown";
import { PlayBitzModal } from "components/PlayBitzModal/PlayBitzModal";
import { DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { MusicTrack } from "libs/types";
import { useNftsStore } from "store/nfts";
import useSolBitzStore from "store/solBitz";

// Type definitions for mini games
interface MiniGame {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  requiresNFT?: boolean;
  requiresLogin: boolean;
  ActionButton: React.FC<{ onClick: () => void; isLoggedIn: boolean }>;
}

// XP Roulette Action Button Component
const XPRouletteButton: React.FC<{ onClick: () => void; isLoggedIn: boolean }> = ({ onClick, isLoggedIn }) => {
  const cooldown = useSolBitzStore((state: any) => state.cooldown);
  const { updateCooldown } = useSolBitzStore();

  if (!isLoggedIn) {
    return (
      <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] opacity-50 cursor-not-allowed">
        <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium text-gray-400 backdrop-blur-3xl">
          Connect wallet to play
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] cursor-pointer" onClick={onClick}>
      <span className="absolute hover:bg-[#fde047] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
      <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#fde047] w-full items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
        {cooldown === -2 ? (
          <span className="blinkMe">Click to Get Sigma XP</span>
        ) : cooldown > 0 ? (
          <Countdown
            date={cooldown}
            onComplete={() => updateCooldown(0)}
            renderer={(props: { hours: number; minutes: number; seconds: number; completed: boolean }) => {
              if (props.completed) {
                return (
                  <div className="flex flex-row justify-center items-center">
                    <Gift className="mx-2 text-[#fde047]" />
                    <span className="text-[12px] md:text-sm">Collect Your Sigma XP</span>
                  </div>
                );
              }
              return (
                <div className="flex flex-row justify-center items-center">
                  <span className="ml-1 text-center">
                    Play again in <br />
                    {props.hours > 0 ? `${props.hours}${props.hours === 1 ? " Hour " : " Hours "}` : ""}
                    {props.minutes > 0 ? props.minutes + " Min " : ""}
                    {props.seconds} Sec
                  </span>
                </div>
              );
            }}
          />
        ) : (
          <div className="flex flex-row justify-center items-center">
            <Gift className="mx-2 text-[#fde047]" />
            <span className="text-[12px] md:text-sm">Collect Your Sigma XP</span>
          </div>
        )}
      </span>
    </div>
  );
};

// Mini Game Tile Component
const GameTile: React.FC<{ game: MiniGame; isLoggedIn: boolean }> = ({ game, isLoggedIn }) => {
  const shouldDisable = game.requiresLogin && !isLoggedIn;

  return (
    <div
      className={`bg-black/20 backdrop-blur-sm rounded-xl p-6 ${shouldDisable ? "opacity-70" : "hover:bg-black/30"} transition-all border border-gray-800 hover:border-gray-700`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">{game.icon}</div>
          <div>
            <h3 className="text-lg font-semibold">{game.name}</h3>
            <p className="text-sm text-gray-400">{game.description}</p>
          </div>
        </div>
        <div className="mt-2">
          {game.isEnabled ? <game.ActionButton onClick={() => {}} isLoggedIn={isLoggedIn} /> : <div className="text-sm text-gray-500">Coming Soon</div>}
        </div>
      </div>
    </div>
  );
};

// Memory Game Components
interface Card {
  id: number;
  coverArt: string;
  isFlipped: boolean;
  isMatched: boolean;
  trackName: string;
}

// Add AudioPlayer Component
const AudioPlayer: React.FC<{ tracks: MusicTrack[] }> = ({ tracks }) => {
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // for games that use radio tracks in the BG for entertainment
  const currentTrack = tracks[currentTrackIndex];

  // useEffect(() => {
  //   if (audioRef.current) {
  //     audioRef.current.src = currentTrack.stream;
  //   }
  // }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true; // Enable looping
    }
  }, [volume]);

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full bg-black/30 backdrop-blur-md rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src={currentTrack.cover_art_url} alt={currentTrack.title} className="w-10 h-10 rounded-md object-cover" />
          <div>
            <p className="text-xs font-medium text-white">Now Playing:</p>
            <p className="text-xs text-gray-400">
              {currentTrack.title} by {currentTrack.artist}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button onClick={handlePrevTrack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={handleNextTrack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {volume === 0 ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-gray-400" />}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500"
            />
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={currentTrack.stream} autoPlay key={currentTrackIndex} />
    </div>
  );
};

const MemoryGame: React.FC<{ onClose: () => void; tracks: MusicTrack[]; appMusicPlayerIsPlaying: boolean }> = ({
  onClose,
  tracks,
  appMusicPlayerIsPlaying,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [backgroundTracks, setBackgroundTracks] = useState<MusicTrack[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("memory-game-high-score") || "0");
  });

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Initialize game and select background music
  useEffect(() => {
    // Select 3 random non-explicit tracks for background music
    const nonExplicitTracks = tracks.filter((track) => track.isExplicit !== "1");
    const randomTracks = [...nonExplicitTracks].sort(() => Math.random() - 0.5).slice(0, 3);
    setBackgroundTracks(randomTracks);

    // Initialize game cards - ensure background tracks are included
    const remainingTracks = tracks.filter((track) => !randomTracks.includes(track));
    const additionalTracks = [...remainingTracks].sort(() => Math.random() - 0.5).slice(0, 5); // We only need 5 more since we have 3 from background

    // Combine background tracks with additional random tracks
    const selectedTracks = [...randomTracks, ...additionalTracks].map((track) => ({
      coverArt: track.cover_art_url,
      trackName: track.title,
    }));

    const cardPairs = [...selectedTracks, ...selectedTracks]
      .sort(() => Math.random() - 0.5)
      .map((track, index) => ({
        id: index,
        coverArt: track.coverArt,
        trackName: track.trackName,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(cardPairs);
    setMoves(0);
  }, [tracks]);

  // Handle card click
  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return; // Prevent flipping while checking
    if (cards[id].isMatched) return; // Prevent clicking matched cards
    if (flippedCards.includes(id)) return; // Prevent clicking same card

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves((m) => m + 1);

      // Check for match
      const [first, second] = newFlippedCards;
      if (cards[first].coverArt === cards[second].coverArt) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);

          // Check if game is complete
          if (matchedCards.every((card) => card.isMatched)) {
            const finalScore = moves + 1;
            handleGameComplete(finalScore);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const unflippedCards = [...cards];
          unflippedCards[first].isFlipped = false;
          unflippedCards[second].isFlipped = false;
          setCards(unflippedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const handleGameComplete = (finalScore: number) => {
    setScore(finalScore);

    // Update high score if needed - lower is better
    if (highScore === 0 || finalScore < highScore) {
      setHighScore(finalScore);
      localStorage.setItem("memory-game-high-score", finalScore.toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
      <div className="bg-[#1A1A1A] rounded-xl p-6 max-w-lg w-full">
        {backgroundTracks.length > 0 && !appMusicPlayerIsPlaying && <AudioPlayer tracks={backgroundTracks} />}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Music Album Memory</h2>
            <div className="text-sm text-gray-400 mt-1">
              Moves: {moves} | Best Score: {highScore > 0 ? highScore : "-"} moves
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-lg transition-all transform relative overflow-hidden
                ${card.isFlipped || card.isMatched ? "rotate-0" : "bg-gray-800 rotate-180"}
                ${card.isMatched ? "opacity-50" : ""}`}
              disabled={card.isMatched}>
              <div className={`w-full h-full transition-opacity duration-300 ${card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"}`}>
                <img src={card.coverArt} alt={card.trackName} className="w-full h-full object-cover" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => {
              // Randomly select 8 tracks from the radio tracks
              const selectedTracks = [...tracks]
                .sort(() => Math.random() - 0.5)
                .slice(0, 8)
                .map((track) => ({
                  coverArt: track.cover_art_url,
                  trackName: track.title,
                }));

              // Create pairs of cards from selected tracks
              const cardPairs = [...selectedTracks, ...selectedTracks]
                .sort(() => Math.random() - 0.5)
                .map((track, index) => ({
                  id: index,
                  coverArt: track.coverArt,
                  trackName: track.trackName,
                  isFlipped: false,
                  isMatched: false,
                }));

              setCards(cardPairs);
              setMoves(0);
              setFlippedCards([]);
            }}
            className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors">
            New Game
          </button>
          <div className="text-sm text-gray-400">{cards.every((card) => card.isMatched) ? "🎉 Complete!" : "Match the album covers"}</div>
        </div>

        {cards.every((card) => card.isMatched) && (
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold">Game Complete!</h3>
            <p className="text-lg mt-2">Your Score: {score} moves</p>
            {highScore === 0 || score < highScore ? <p className="text-emerald-400 mt-1">New Best Score!</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};

// Memory Game Button Component
const MemoryGameButton: React.FC<{ onClick: () => void; isLoggedIn: boolean }> = ({ onClick, isLoggedIn }) => {
  return (
    <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] cursor-pointer" onClick={onClick}>
      <span className="absolute hover:bg-[#fde047] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
      <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#fde047] w-full items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
        <div className="flex flex-row justify-center items-center">
          <Music2 className="mx-2 text-[#fde047]" />
          <span className="text-[12px] md:text-sm">Play Game</span>
        </div>
      </span>
    </div>
  );
};

// Match Artist Game Button Component
const MatchArtistButton: React.FC<{ onClick: () => void; isLoggedIn: boolean }> = ({ onClick, isLoggedIn }) => {
  return (
    <div className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] cursor-pointer" onClick={onClick}>
      <span className="absolute hover:bg-[#4ade80] inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF03,#45d4ff_50%,#111111_50%)]" />
      <span className="inline-flex h-full hover:bg-gradient-to-tl from-background to-[#4ade80] w-full items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium backdrop-blur-3xl">
        <div className="flex flex-row justify-center items-center">
          <Music2 className="mx-2 text-[#4ade80]" />
          <span className="text-[12px] md:text-sm">Play Game</span>
        </div>
      </span>
    </div>
  );
};

// Match Artist Game Component
const MatchArtistGame: React.FC<{ onClose: () => void; tracks: MusicTrack[] }> = ({ onClose, tracks }) => {
  const [selectedTracks, setSelectedTracks] = useState<MusicTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [preloadedAudio, setPreloadedAudio] = useState<HTMLAudioElement[]>([]);
  const [artistOrder, setArtistOrder] = useState<string[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("sig-game-match-artist-high-score") || "0");
  });
  const [isLoading, setIsLoading] = useState<number | null>(null);

  // Initialize game state
  const initializeGame = () => {
    // Stop any currently playing audio
    if (currentlyPlaying !== null) {
      preloadedAudio[currentlyPlaying]?.pause();
      preloadedAudio[currentlyPlaying].currentTime = 0;
    }

    // Stop and cleanup all preloaded audio
    preloadedAudio.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });

    // Clear audio states
    setCurrentlyPlaying(null);
    setPreloadedAudio([]);

    // Initialize new game
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    setSelectedTracks(selected);

    // Create and shuffle the artist list
    const artists = selected.map((track) => track.artist);
    setArtistOrder([...artists].sort(() => Math.random() - 0.5));

    // Preload new audio files
    const audioElements = selected.map((track) => {
      const audio = new Audio(track.stream);
      audio.load();
      return audio;
    });

    setPreloadedAudio(audioElements);
    setGameComplete(false);
    setResults([]);
    setScore(0);
  };

  // Initialize on first load
  useEffect(() => {
    initializeGame();

    // Cleanup function
    return () => {
      preloadedAudio.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      setCurrentlyPlaying(null);
    };
  }, [tracks]);

  // Handle audio playback
  const handlePlayPause = (index: number) => {
    // If this track is currently playing, stop it
    if (currentlyPlaying === index) {
      const audio = preloadedAudio[index];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setCurrentlyPlaying(null);
      return;
    }

    // Stop any currently playing track
    if (currentlyPlaying !== null) {
      const currentAudio = preloadedAudio[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Play the selected track
    const audio = preloadedAudio[index];
    if (audio) {
      setIsLoading(index); // Set loading state for this button

      const playTrack = () => {
        const duration = audio.duration;
        if (duration && isFinite(duration)) {
          const middlePoint = Math.floor(duration / 2);
          audio.currentTime = middlePoint;

          const playPromise = audio.play();
          if (playPromise) {
            playPromise
              .then(() => {
                setIsLoading(null); // Clear loading state
                setCurrentlyPlaying(index);
                // Stop after 15 seconds
                setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                  setCurrentlyPlaying(null);
                }, 15000);
              })
              .catch((error) => {
                console.error("Playback failed:", error);
                setIsLoading(null); // Clear loading state on error
              });
          }
        }
      };

      if (audio.readyState >= 2) {
        // HAVE_CURRENT_DATA or better
        playTrack();
      } else {
        audio.addEventListener("canplay", playTrack, { once: true });
      }
    }
  };

  // Move artist up or down
  const moveArtist = (index: number, direction: "up" | "down") => {
    const newOrder = [...artistOrder];
    if (direction === "up" && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === "down" && index < artistOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setArtistOrder(newOrder);
  };

  // Submit answers
  const handleSubmit = () => {
    const newResults = selectedTracks.map((track, index) => track.artist.toLowerCase() === artistOrder[index].toLowerCase());
    setResults(newResults);

    const correctAnswers = newResults.filter((result) => result).length;
    const finalScore = Math.floor((correctAnswers / 4) * 100); // Updated for 4 songs
    setScore(finalScore);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("sig-game-match-artist-high-score", finalScore.toString());
    }

    setGameComplete(true);
  };

  // Handle cleanup when closing
  const handleClose = () => {
    // Stop any currently playing audio
    if (currentlyPlaying !== null) {
      preloadedAudio[currentlyPlaying]?.pause();
      preloadedAudio[currentlyPlaying].currentTime = 0;
    }

    // Stop and cleanup all preloaded audio
    preloadedAudio.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });

    // Clear states
    setCurrentlyPlaying(null);
    setPreloadedAudio([]);

    // Call the original onClose
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] rounded-xl p-6 max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Match Artist to Song</h2>
            <div className="text-sm text-gray-400 mt-1">High Score: {highScore}</div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Track List - Left side */}
          <div className="space-y-3">
            {selectedTracks.map((track, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg h-[72px] md:w-[240px]">
                  <img src={track.cover_art_url} alt="Album Art" className="w-12 h-12 rounded" />
                  <button
                    onClick={() => handlePlayPause(index)}
                    className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 relative"
                    disabled={isLoading === index}>
                    {isLoading === index ? (
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : currentlyPlaying === index ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  {gameComplete && (
                    <div className="ml-auto">
                      {results[index] ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                    </div>
                  )}
                </div>
                {gameComplete && (
                  <div className="text-sm text-gray-400 px-3 md:w-[240px]">
                    <span className="text-emerald-400">{track.title}</span> from {track.artist}'s <span className="text-yellow-400">{track.album}</span> album
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Artist List - Right side */}
          <div className="space-y-3">
            {" "}
            {artistOrder.map((artist, index) => (
              <div key={index} className="flex items-center gap-3 ">
                {" "}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveArtist(index, "up")}
                    disabled={index === 0 || gameComplete}
                    className={`p-1 ${index === 0 || gameComplete ? "text-gray-600" : "hover:text-emerald-400"}`}>
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveArtist(index, "down")}
                    disabled={index === artistOrder.length - 1 || gameComplete}
                    className={`p-1 ${index === artistOrder.length - 1 || gameComplete ? "text-gray-600" : "hover:text-emerald-400"}`}>
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-3 bg-gray-800 rounded-lg flex items-center h-[72px]">
                  {" "}
                  <span className="text-white font-medium">{artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          {" "}
          {!gameComplete ? (
            <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
              Submit Answers
            </button>
          ) : (
            <button onClick={initializeGame} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
              Play Again
            </button>
          )}
        </div>
        {gameComplete && (
          <div className="mt-4 text-center">
            {" "}
            <h3 className="text-xl font-bold">Game Complete!</h3>
            <p className="text-lg mt-2">Your Score: {score}%</p>
            {score > highScore && <p className="text-emerald-400 mt-1">New High Score!</p>}
          </div>
        )}
      </div>
    </div>
  );
};

interface MiniGamesProps {
  radioTracks: MusicTrack[];
  appMusicPlayerIsPlaying: boolean;
}

export const MiniGames = (props: MiniGamesProps) => {
  const { radioTracks, appMusicPlayerIsPlaying } = props;
  const { isConnected: isLoggedInSol } = useSolanaWallet();
  const { solBitzNfts } = useNftsStore();
  const [showPlayBitzModal, setShowPlayBitzModal] = useState<boolean>(false);
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [showMatchArtistModal, setShowMatchArtistModal] = useState<boolean>(false);

  // Define available mini games
  const games: MiniGame[] = [
    {
      id: "xp-roulette",
      name: "XP Roulette",
      description: "Spin the wheel to earn Sigma XP rewards",
      icon: <Dice1 className="w-6 h-6 text-yellow-500" />,
      isEnabled: true,
      requiresNFT: true,
      requiresLogin: true,
      ActionButton: ({ onClick, isLoggedIn }) => (
        <XPRouletteButton
          onClick={() => {
            if (solBitzNfts.length > 0) {
              setShowPlayBitzModal(true);
            } else {
              alert(
                "You need to claim your free Sigma XP NFT to play XP Roulette, if you already have it, make sure you have connected your wallet and signed the login message"
              );
            }
          }}
          isLoggedIn={isLoggedIn}
        />
      ),
    },
    {
      id: "memory-game",
      name: "Music Album Memory",
      description: "Test your memory by matching album covers from our music library",
      icon: <Music2 className="w-6 h-6 text-green-400" />,
      isEnabled: true,
      requiresNFT: false,
      requiresLogin: false,
      ActionButton: ({ onClick, isLoggedIn }) => (
        <MemoryGameButton
          onClick={() => {
            setShowMemoryModal(true);
          }}
          isLoggedIn={isLoggedIn}
        />
      ),
    },
    {
      id: "match-artist",
      name: "Match Artist to Song",
      description: "Listen to song snippets and match them to their artists",
      icon: <Music2 className="w-6 h-6 text-emerald-400" />,
      isEnabled: true,
      requiresNFT: false,
      requiresLogin: false,
      ActionButton: ({ onClick, isLoggedIn }) => (
        <MatchArtistButton
          onClick={() => {
            setShowMatchArtistModal(true);
          }}
          isLoggedIn={isLoggedIn}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col justify-center items-center w-full">
        <div className="flex flex-col mb-8 justify-center w-[100%] items-center xl:items-start">
          <div className="text-2xl xl:text-3xl cursor-pointer mb-6 w-full">
            <div className="flex flex-col md:flex-row justify-between w-full">
              <span className="text-center md:text-left text-3xl bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 text-transparent font-bold">
                Mini Games
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {games.map((game) => (
              <GameTile key={game.id} game={game} isLoggedIn={isLoggedInSol} />
            ))}
          </div>
        </div>
      </div>

      {!DISABLE_BITZ_FEATURES && showPlayBitzModal && (
        <PlayBitzModal showPlayBitzModel={showPlayBitzModal} handleHideBitzModel={() => setShowPlayBitzModal(false)} />
      )}

      {showMemoryModal && <MemoryGame onClose={() => setShowMemoryModal(false)} tracks={radioTracks} appMusicPlayerIsPlaying={appMusicPlayerIsPlaying} />}

      {showMatchArtistModal && <MatchArtistGame onClose={() => setShowMatchArtistModal(false)} tracks={radioTracks} />}
    </>
  );
};
