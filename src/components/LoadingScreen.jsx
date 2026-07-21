import React, { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingScreen = ({ onComplete }) => {
  const containerRef = useRef(null);
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateY(-100%)';
        containerRef.current.style.opacity = '0';
        setTimeout(onComplete, 800);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#E7E1D5] transition-all duration-800 ease-in-out"
      style={{ 
        willChange: 'transform, opacity',
        transform: 'translateY(0)',
        opacity: 1
      }}
    >
      <div className="flex flex-col items-center space-y-12 max-w-4xl w-full px-4">
        <div className="flex flex-col items-center space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-[#57ABB2]">Upasana</span>
            <span className="text-[#DE9A0E]"> Wellness</span>
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-[#57ABB2] via-[#E39D17] to-[#DE9A0E] rounded-full"></div>
          <p className="text-gray-500 text-sm tracking-wider uppercase">Your Path to Holistic Health</p>
        </div>

        {/* Lottie Animation with fallback */}
        <div className="w-96 h-96 md:w-[500px] md:h-[500px]">
          {!animationError ? (
            <DotLottieReact
              src="animations/Loading.lottie"
              loop
              autoplay
              className="w-full h-full"
              onError={() => setAnimationError(true)}
            />
          ) : (
            // Fallback animation - simple CSS animation if Lottie fails
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full border-8 border-[#57ABB2]/20"></div>
                <div className="absolute inset-0 rounded-full border-8 border-[#57ABB2] border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">🧘</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-[#57ABB2] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-[#DE9A0E] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-[#E39D17] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-3 h-3 bg-[#AE261B] rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
          </div>
          <p className="text-[#57ABB2] font-medium tracking-[0.2em] uppercase text-xs">
            Loading your wellness journey...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;