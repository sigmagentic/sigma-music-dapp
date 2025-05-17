import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { DISABLE_BITZ_FEATURES } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Button } from "libComponents/Button";

interface Slide {
  image: string;
  text: string;
}

const slides: Slide[] = [
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-1-most-streamed.png",
    text: "Start Radio for free personalized music or view the most streamed songs",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-2-a-listen-to-free-albums.png",
    text: "Listen to any music album for free",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-2-b-music-player.png",
    text: "Stream and enjoy all music albums",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-2-c-buy-premium-albums-as-nfts.png",
    text: "Love an album? Buy a limited edition premium album with bonus tracks as a Music Collectible (pay via Solana or Credit Card!)",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-3-join-fan-membership.png",
    text: "Love a musician? Join their Inner Circle fan membership and get a unique fan collectible, perks, and share in revenue!",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-4-join-live-campaigns-for-irl-collectibles.png",
    text: "Join Real World Events via Campaigns like the World Supremacy Battleground Dance Competition, collect unique collectibles, support artists, and share in revenue!",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-4a-reward-pools.png",
    text: "Participate in Reward Pools and win a share of app revenue!",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-5-collect-free-xp.png",
    text: "Play an XP game every 6 hours and get free app XP",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-6-climb-xp-leaderboards.png",
    text: "Give XP to your favorite content and climb XP leaderboards to get free airdrops and rewards",
  },
  {
    image: "https://api.itheumcloud.com/app_nftunes/assets/misc/step-7-launch-ai-meme-coins.png",
    text: "REMIX any music content on our platform using AI, mint them as Music NFTs or launch them as Music Meme Coins!",
  },
];

// Utility function to preload images
const preloadImages = (imageUrls: string[]): Promise<void[]> => {
  return Promise.all(
    imageUrls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        })
    )
  );
};

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  handleShowBitzModel: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ isOpen, onClose, handleShowBitzModel }) => {
  const { isConnected: isLoggedInSol } = useSolanaWallet();
  const [currentSlide, setCurrentSlide] = useState(-1);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  // Preload images when component mounts
  useEffect(() => {
    const loadImages = async () => {
      try {
        await preloadImages(slides.map((slide) => slide.image));
        setImagesLoaded(true);
      } catch (error) {
        console.error("Error preloading images:", error);
        // Still set imagesLoaded to true to not block the tour
        setImagesLoaded(true);
      }
    };

    loadImages();
  }, []);

  // Reset slide when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(-1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < slides.length) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > -1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-[100]">
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-3xl w-full mx-4 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>

          <div className="flex flex-col items-center">
            {currentSlide === -1 ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Welcome to Sigma Music!</h2>
                <p className="text-lg mb-8">Let's take a few seconds to see what you can do with this app. Click next to get started.</p>
                <Button onClick={handleNext} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-2 rounded-lg">
                  Next
                </Button>
              </div>
            ) : currentSlide === slides.length ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Get Started!</h2>
                <p className="text-lg mb-8">OK, let's get you using Sigma Music.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <Button onClick={onClose} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-2 rounded-lg">
                    Let Me Try It Out!
                  </Button>
                  {!DISABLE_BITZ_FEATURES && isLoggedInSol && (
                    <div className={`relative group overflow-hidden rounded-lg p-[1.5px] w-full md:w-[200px] bottom-[2px]`}>
                      {/* Animated border background */}
                      <div className="animate-border-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(from_0deg,#22c55e_0deg,#f97316_180deg,transparent_360deg)]"></div>

                      <Button
                        onClick={() => {
                          handleShowBitzModel();
                          onClose();
                        }}
                        className={`relative z-2 !text-black text-sm px-[2.35rem] w-full bg-gradient-to-r from-green-300 to-orange-500 hover:from-orange-500 hover:to-green-300 !opacity-100`}>
                        Get Some Free XP First!
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <img
                  src={slides[currentSlide].image}
                  alt={`Slide ${currentSlide + 1}`}
                  className={`w-full max-h-[400px] object-contain mb-6 transition-opacity duration-300 ${imagesLoaded ? "opacity-100" : "opacity-0"}`}
                />
                <p className="text-lg text-center mb-6">{slides[currentSlide].text}</p>
                <div className="flex gap-4">
                  <Button onClick={handlePrevious} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg" disabled={currentSlide === 0}>
                    <ChevronLeft size={20} />
                  </Button>
                  <Button onClick={handleNext} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-lg">
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
