import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { Button } from '@/components/ui/button';

export function AudioControls() {
  const {
    isMuted,
    toggleMute,
    initSounds,
    startBackgroundMusic,
    hasErrors,
    isPlaying
  } = useAudio();
  
  const [showPlayButton, setShowPlayButton] = useState(true);

  // Initialize sounds when component mounts
  useEffect(() => {
    initSounds();
    
    // Check if audio context is already running and update UI accordingly
    if (isPlaying) {
      setShowPlayButton(false);
    }
  }, [initSounds, isPlaying]);
  
  // Handle play button click
  const handlePlayClick = () => {
    startBackgroundMusic();
    setShowPlayButton(false);
  };
  
  // Handle mute toggle with explicit user interaction
  const handleMuteToggle = () => {
    // This is also a good opportunity to try starting the music
    // since we have a user gesture
    if (!isPlaying) {
      startBackgroundMusic();
    }
    
    toggleMute();
  };

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
      {/* Play Button - Only shown before music starts */}
      {showPlayButton && !isPlaying && !hasErrors && (
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handlePlayClick}
          className="bg-white shadow-md animate-pulse"
          title="Play Background Music"
        >
          <PlayCircle size={20} className="text-green-600" />
        </Button>
      )}
      
      {/* Mute/Unmute Button */}
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={handleMuteToggle}
        className="bg-white shadow-md"
        title={hasErrors ? "Audio unavailable" : (isMuted ? "Unmute" : "Mute")}
        disabled={hasErrors}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>
    </div>
  );
}

export default AudioControls;