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
    <>
      {/* Main Audio Control UI */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
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
      
      {/* Prominent Play Button - Centered on screen for visibility */}
      {showPlayButton && !isPlaying && !hasErrors && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white p-5 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-medium mb-2">Enable Game Audio</h3>
            <p className="text-sm text-gray-600 mb-4">Click to enable chiptune music and sound effects</p>
            <Button 
              variant="default"
              size="lg"
              onClick={handlePlayClick}
              className="bg-green-600 hover:bg-green-700 animate-pulse flex items-center gap-2"
            >
              <PlayCircle size={24} />
              <span>Play Music</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default AudioControls;