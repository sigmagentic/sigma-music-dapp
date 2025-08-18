import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = "", position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();

      // Calculate tooltip position relative to viewport
      let newPosition = position;
      let top = 0;
      let left = 0;

      // Estimate tooltip dimensions (adjust these values based on your content)
      const tooltipWidth = 300; // matches w-[300px]
      const tooltipHeight = 80; // estimated height

      // Check if tooltip would go off-screen and adjust position
      if (position === "top") {
        if (rect.top < tooltipHeight + 20) {
          newPosition = "bottom";
          top = rect.bottom + 8;
        } else {
          top = rect.top - tooltipHeight - 8;
        }
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (position === "bottom") {
        if (rect.bottom + tooltipHeight + 20 > window.innerHeight) {
          newPosition = "top";
          top = rect.top - tooltipHeight - 8;
        } else {
          top = rect.bottom + 8;
        }
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (position === "left") {
        if (rect.left < tooltipWidth + 20) {
          newPosition = "right";
          left = rect.right + 8;
        } else {
          left = rect.left - tooltipWidth - 8;
        }
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
      } else if (position === "right") {
        if (rect.right + tooltipWidth + 20 > window.innerWidth) {
          newPosition = "left";
          left = rect.left - tooltipWidth - 8;
        } else {
          left = rect.right + 8;
        }
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
      }

      // Ensure tooltip stays within viewport bounds
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));

      setActualPosition(newPosition);
      setTooltipStyle({ top, left });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    switch (actualPosition) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-l-gray-800";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-r-gray-800";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800";
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}>
        {children}
      </div>

      {/* Portal-based Tooltip */}
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              top: tooltipStyle.top,
              left: tooltipStyle.left,
            }}
            role="tooltip"
            aria-hidden="true">
            <div className="bg-gray-800 text-white text-xs rounded-lg px-4 py-3 max-w-sm shadow-lg border border-gray-700 whitespace-normal leading-relaxed w-[300px]">
              {content}
              {/* Arrow */}
              <div className={`absolute w-0 h-0 ${getArrowClasses()}`}></div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// Info icon with tooltip component for common use case
interface InfoTooltipProps {
  content: string;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = "", position = "top" }) => {
  return (
    <Tooltip content={content} position={position}>
      <Info className={`w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help inline-block ml-1 ${className}`} />
    </Tooltip>
  );
};
