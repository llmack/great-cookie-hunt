import React, { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { Button } from '@/components/ui/button';

export function AudioControls() {
  const {
    isMuted,
    toggleMute,
    initSounds,
    startBackgroundMusic,
    hasErrors
  } = useAudio();

  // Initialize sounds when component mounts
  useEffect(() => {
    initSounds();
    // Start background music with a slight delay to avoid browser autoplay restrictions
    const timer = setTimeout(() => {
      startBackgroundMusic();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initSounds, startBackgroundMusic]);

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
      {/* Mute/Unmute Button */}
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={toggleMute}
        className="bg-white shadow-md"
        title={hasErrors ? "Audio unavailable" : (isMuted ? "Unmute" : "Mute")}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>
    </div>
  );
}

export default AudioControls;