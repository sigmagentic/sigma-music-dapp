import React, { useState, useEffect } from "react";
import { Button } from "libComponents/Button";

interface Slide {
  image: string;
  imageCustomClass?: string;
  alt: string;
  buttonText: string;
  onClick: () => void;
}

interface SlideshowProps {
  slides: Slide[];
  autoSlideInterval?: number; // in milliseconds
}

export const Slideshow: React.FC<SlideshowProps> = ({ slides, autoSlideInterval = 6000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, autoSlideInterval);
      return () => clearInterval(interval);
    }
  }, [isHovered, slides.length, autoSlideInterval]);

  return (
    <div className="campaign-cta-slides flex flex-col md:mt-0 flex-1 relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative h-[200px] w-full overflow-hidden rounded-sm mt-2">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide select-none h-full w-full bg-[#0F0F0F]/25 absolute flex flex-col items-center justify-center transition-transform duration-500 ${
              currentSlide === index ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
            }`}>
            <div
              className={`w-full h-full bg-cover bg-center bg-no-repeat ${slide.imageCustomClass || ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-black/50"></div>
            <Button
              onClick={slide.onClick}
              className="!text-black text-sm tracking-tight absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-300 to-orange-500 transition ease-in-out delay-150 duration-300 hover:bg-gradient-to-l">
              <>
                <span className="ml-2">{slide.buttonText}</span>
              </>
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-sm transition-all duration-300 ${currentSlide === index ? "bg-yellow-400 scale-125" : "bg-gray-400 hover:bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
};
