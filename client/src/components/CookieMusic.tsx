import React, { useRef, useEffect } from 'react';

interface CookieMusicProps {
  isPlaying: boolean;
}

const CookieMusic: React.FC<CookieMusicProps> = ({ isPlaying }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create the audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = new Audio('/sounds/coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3');
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;
    }
    
    // Control playback based on isPlaying prop
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Error playing music:', err);
        
        // Setup one-time click handler to enable audio
        if (!window._audioInitialized) {
          window._audioInitialized = true;
          
          const clickHandler = () => {
            audioRef.current?.play().catch(e => 
              console.error('Still failed to play after user interaction:', e)
            );
            document.removeEventListener('click', clickHandler);
          };
          
          document.addEventListener('click', clickHandler);
          console.log('Added document click handler for audio autoplay');
        }
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isPlaying]);
  
  // This component doesn't render anything visible
  return null;
};

// Add audio initialization flag to window
declare global {
  interface Window {
    _audioInitialized: boolean;
  }
}

if (typeof window !== 'undefined') {
  window._audioInitialized = false;
}

export default CookieMusic;