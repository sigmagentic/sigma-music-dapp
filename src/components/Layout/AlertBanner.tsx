import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const AlertBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const ALERT_IGNORE_HOURS_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

  useEffect(() => {
    // Check if we should show the banner based on session storage
    const lastClosedTimestamp = localStorage.getItem("sig-ux-ca-alert");

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
    localStorage.setItem("sig-ux-ca-alert", Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div
      className="mt-2 mx-2 relative overflow-hidden bg-gradient-to-r from-yellow-500/25 via-red-500/30 to-yellow-500/25 border-b border-red-500/40"
      style={{
        animation: "gradient 3s ease infinite",
        backgroundSize: "200% 200%",
        backdropFilter: "blur(8px)",
      }}>
      <div className="mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">🚨 </span>
            <p className="text-md font-medium text-gray-100">
              Rewards Pools are now live! Fan can share in app revenue!
              <a href="/?section=reward-pools" className="text-yellow-400 hover:text-yellow-300 mx-1">
                Check it out
              </a>
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
