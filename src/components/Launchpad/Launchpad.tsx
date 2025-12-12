import React, { useMemo } from "react";
import { ExternalLink, Calendar, Music, ShoppingBag, Video, Star } from "lucide-react";
import { LaunchpadData, LaunchPlatform, MerchItem, Album } from "libs/types/common";

type LaunchpadProps = {
  launchpadData: LaunchpadData;
  album?: Album | null;
  onViewTracklist?: () => void;
};

/**
 * Detects if a URL is a YouTube Premier link
 * YouTube Premier links typically have the format:
 * https://www.youtube.com/watch?v=VIDEO_ID or
 * https://youtu.be/VIDEO_ID with premiere parameter
 */
const isYouTubePremierLink = (url: string): boolean => {
  if (!url || url === "N/A") return false;

  // Regex pattern to match YouTube URLs
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

  if (!youtubeRegex.test(url)) return false;

  // Check for premiere indicators in URL
  const premiereIndicators = [/premiere/i, /premiere=true/i, /premiere=1/i, /watch\?v=.*&.*premiere/i];

  return premiereIndicators.some((pattern) => pattern.test(url));
};

/**
 * Extracts YouTube video ID from URL for embedding
 */
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || url === "N/A") return null;

  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Parses date string in ISO format "YYYY-MM-DD" to Date object for sorting
 */
const parseReleaseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

/**
 * Formats date from ISO format "YYYY-MM-DD" to display format "1 Dec 2025"
 */
const formatReleaseDate = (dateStr: string): string => {
  const date = parseReleaseDate(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Formats price value for display
 */
const formatPrice = (price: number | "n/a"): string => {
  if (price === "n/a") return "N/A";
  return typeof price === "number" ? `$${price.toFixed(2)}` : price;
};

/**
 * Calculates the number of days between two dates
 */
const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Formats days difference as a human-readable string
 */
const formatDaysDifference = (days: number): string => {
  if (days === 0) return "Same day";
  if (days === 1) return "1 day later";
  return `${days} days later`;
};

/**
 * Calculates days until a future date (returns negative if date is in the past)
 */
const getDaysUntil = (date: Date): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const Launchpad: React.FC<LaunchpadProps> = ({ launchpadData, album, onViewTracklist }) => {
  // Sort platforms by release date (earliest first)
  const sortedPlatforms = useMemo(() => {
    return [...launchpadData.launchPlatforms].sort((a, b) => {
      const dateA = parseReleaseDate(a.releaseDate);
      const dateB = parseReleaseDate(b.releaseDate);
      return dateA.getTime() - dateB.getTime(); // Ascending order (earliest first)
    });
  }, [launchpadData.launchPlatforms]);

  const isYouTubePremier = useMemo(() => {
    return isYouTubePremierLink(launchpadData.teaserVideoLink);
  }, [launchpadData.teaserVideoLink]);

  const youtubeVideoId = useMemo(() => {
    return extractYouTubeVideoId(launchpadData.teaserVideoLink);
  }, [launchpadData.teaserVideoLink]);

  const renderPlatformCard = (platform: LaunchPlatform, index: number, isLast: boolean) => {
    const freeStreamingText = platform.freeStreaming === "Full Album" ? "Full Album" : `First ${platform.freeStreamingTrackCount || 0} tracks`;
    const currentDate = parseReleaseDate(platform.releaseDate);
    const nextDate = !isLast ? parseReleaseDate(sortedPlatforms[index + 1].releaseDate) : null;
    const daysDifference = nextDate ? getDaysDifference(currentDate, nextDate) : 0;

    return (
      <div key={`${platform.platform}-${index}`} className="relative flex gap-6">
        {/* Timeline Line and Date Column */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Release Date - Prominent */}
          <div
            className={`relative z-10 rounded-lg px-4 py-2 min-w-[120px] text-center ${
              platform.premiere ? "bg-gradient-to-r from-yellow-300 to-orange-500 text-black font-bold" : "bg-gray-700 text-white"
            }`}>
            <div className="!text-sm font-semibold">{formatReleaseDate(platform.releaseDate)}</div>
            {platform.premiere && (
              <div className="flex items-center justify-center gap-1 !text-xs mt-1">
                <Star className="w-3 h-3" />
                PREMIERE
              </div>
            )}
          </div>

          {/* Connecting Line with Days Difference Label */}
          {!isLast && (
            <div className="flex flex-col items-center mt-3 relative h-full">
              {/* Vertical Line */}
              <div className={`w-0.5 ${platform.premiere ? "bg-yellow-500/50" : "bg-gray-600"}`} style={{ height: "100%" }} />

              {/* Days Difference Label - positioned on the line */}
              {!isLast && daysDifference > 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 text-gray-300 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                  {formatDaysDifference(daysDifference)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Platform Details Card */}
        <div
          className={`flex-1 border rounded-lg p-5 mb-6 transition-all ${
            platform.premiere ? "border-yellow-500 bg-yellow-500/10" : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
          }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="!text-lg font-bold text-white mb-4">{platform.platform}</h3>

              <div className="space-y-3 !text-sm">
                {/* Free Streaming - only show if not N/A */}
                {freeStreamingText && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Music className="w-4 h-4" />
                    <span>Free Streaming: {freeStreamingText}</span>
                  </div>
                )}

                {/* Purchase Options - displayed as badges */}
                <div>
                  <div className="font-medium text-gray-300 mb-2 !text-sm">Purchase Options:</div>
                  {platform.purchaseOptions && platform.purchaseOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {platform.purchaseOptions.map((option, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-md !text-xs font-medium">
                          {option}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block px-2.5 py-1 bg-gray-700/50 border border-gray-600 text-gray-400 rounded-md !text-xs font-medium">
                      Streaming Only
                    </span>
                  )}
                </div>

                {/* Purchase Type */}
                <div className="text-gray-300">
                  <span className="font-medium">Purchase Type: </span>
                  <span>{platform.purchaseType}</span>
                </div>

                {/* Pricing - only show if not N/A, highlighted as badges */}
                <div className="grid grid-cols-2 gap-4 text-gray-300">
                  {platform.usdPriceAlbum !== "n/a" && (
                    <div>
                      <span className="font-medium">USD Price / Album: </span>
                      <span className="inline-block ml-1.5 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded !text-xs font-semibold">
                        {formatPrice(platform.usdPriceAlbum)}
                      </span>
                    </div>
                  )}
                  {platform.usdPriceTrack !== "n/a" && (
                    <div>
                      <span className="font-medium">USD Price / Track: </span>
                      <span className="inline-block ml-1.5 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded !text-xs font-semibold">
                        {formatPrice(platform.usdPriceTrack)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pay More Supported */}
                {platform.payMoreSupported && <div className="text-green-400 !text-xs font-medium">✓ Pay More Supported</div>}
              </div>
            </div>

            {/* Direct Link Button */}
            <div className="flex-shrink-0">
              <a
                href={platform.directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 !text-sm bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-yellow-400 hover:to-orange-600 text-black font-medium rounded-md transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Platform
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMerchItem = (merch: MerchItem, index: number) => {
    return (
      <div key={`${merch.type}-${index}`} className="border border-gray-700 rounded-lg p-4 bg-gray-800/30 hover:border-gray-600 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-yellow-400" />
              <h4 className="!text-base font-semibold text-white">{merch.type}</h4>
            </div>
            <div className="flex items-center gap-2 !text-sm text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Release Date: {formatReleaseDate(merch.releaseDate)}</span>
            </div>
          </div>
          <a
            href={merch.directLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 !text-sm bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-yellow-400 hover:to-orange-600 text-black font-medium rounded-md transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            View Merch
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 mt-5">
      {/* Header Section */}
      <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/30 mb-8">
        <h1 className="!text-lg font-bold text-white mb-6">Album launch in progress!</h1>
        {album && (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <img src={album.img} alt={album.title} className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover" />
            <div className="flex-1">
              <h2 className="!text-lg font-bold text-white mb-2">{album.title}</h2>
              {album.desc && <p className="text-gray-400 !text-sm line-clamp-2">{album.desc}</p>}
            </div>
            {onViewTracklist && (
              <button
                onClick={onViewTracklist}
                className="px-4 py-2 !text-sm bg-gradient-to-r from-yellow-300 to-orange-500 hover:from-yellow-400 hover:to-orange-600 text-black font-medium rounded-md transition-all whitespace-nowrap">
                View Tracklist
              </button>
            )}
          </div>
        )}
      </div>

      {/* Launch Platforms Section */}
      <div>
        <h2 className="!text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Music className="w-5 h-5 text-yellow-400" />
          Launch Timeline
        </h2>

        {/* Countdown to First Release */}
        {sortedPlatforms.length > 0 &&
          (() => {
            const firstReleaseDate = parseReleaseDate(sortedPlatforms[0].releaseDate);
            const daysUntil = getDaysUntil(firstReleaseDate);

            if (daysUntil > 0) {
              return (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-center">
                  <div className="!text-xl font-bold text-yellow-400">
                    {daysUntil} More {daysUntil === 1 ? "Day" : "Days"} for official Launch!
                  </div>
                </div>
              );
            }
            return null;
          })()}

        <div className="space-y-0">
          {sortedPlatforms.length > 0 ? (
            sortedPlatforms.map((platform, index) => renderPlatformCard(platform, index, index === sortedPlatforms.length - 1))
          ) : (
            <p className="text-gray-400">No launch platforms configured.</p>
          )}
        </div>
      </div>

      {/* Merch Section */}
      {launchpadData.merch.length > 0 && (
        <div>
          <h2 className="!text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-yellow-400" />
            Merch
          </h2>
          <div className="space-y-4">{launchpadData.merch.map((merch, index) => renderMerchItem(merch, index))}</div>
        </div>
      )}

      {/* Other Links Section */}
      <div>
        <h2 className="!text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Video className="w-5 h-5 text-yellow-400" />
          Other Links
        </h2>
        <div className="space-y-4">
          {launchpadData.teaserVideoLink && launchpadData.teaserVideoLink !== "N/A" ? (
            isYouTubePremier && youtubeVideoId ? (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="!text-base font-semibold text-white mb-4">Teaser / Premier Video</h3>
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title="YouTube Premier Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                <h3 className="!text-base font-semibold text-white mb-2">Teaser / Premier Video Link</h3>
                <a
                  href={launchpadData.teaserVideoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  {launchpadData.teaserVideoLink}
                </a>
              </div>
            )
          ) : (
            <p className="text-gray-400">No teaser video link available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
