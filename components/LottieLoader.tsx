import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottieLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  useEffect(() => {
    if (containerRef.current) {
      // Load the animation
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/loader.json'
      });

      return () => {
        // Cleanup animation on unmount
        if (animationRef.current) {
          animationRef.current.destroy();
        }
      };
    }
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div ref={containerRef} className={sizeClasses[size]} />
      {text && (
        <p className="mt-3 text-gray-600 font-medium text-sm">{text}</p>
      )}
    </div>
  );
};

export default LottieLoader;
