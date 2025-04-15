import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const AlertBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const ALERT_IGNORE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  useEffect(() => {
    // Check if we should show the banner based on session storage
    const lastClosedTimestamp = sessionStorage.getItem("sig-ux-ca-alert");
    if (lastClosedTimestamp) {
      const timeSinceLastClose = Date.now() - parseInt(lastClosedTimestamp);
      if (timeSinceLastClose < ALERT_IGNORE_HOURS_MS) {
        setIsVisible(false);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Store current timestamp in session storage
    sessionStorage.setItem("sig-ux-ca-alert", Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div
      className="hidden mt-2 mx-2 relative overflow-hidden bg-gradient-to-r from-yellow-500/25 via-red-500/30 to-yellow-500/25 border-b border-red-500/40"
      style={{
        animation: "gradient 3s ease infinite",
        backgroundSize: "200% 200%",
        backdropFilter: "blur(8px)",
      }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <p className="text-md md:text-lg font-medium text-gray-100">
              🚨 Heads up, Sigma fam! No official CA token yet - don't fall for imposters! Follow us on
              <a href="https://x.com/SigmaXMusic" target="_blank" className="text-blue-400 hover:text-blue-300 mx-1">
                X
              </a>
              or
              <a href="https://t.me/SigmaXMusicOfficial" target="_blank" className="text-blue-400 hover:text-blue-300 mx-1">
                Telegram
              </a>
              for the real deal when it drops! Stay smart, stay safe! 🛡️
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-300 transition-colors" aria-label="Close banner">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
