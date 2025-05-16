import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AudioControls() {
  // Audio states
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element on mount
  useEffect(() => {
    // Create a new audio element
    const audio = new Audio('/sounds/coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    
    // Set up event listeners
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio loaded and ready to play');
      audio.play().catch(e => console.error('Error auto-playing:', e));
    });
    
    // Store audio reference
    audioRef.current = audio;
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Handle mute toggle
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.pause();
      console.log('Audio muted');
    } else {
      audioRef.current.play().catch(e => console.error('Error playing after unmute:', e));
      console.log('Audio unmuted');
    }
  }, [isMuted]);
  
  // Handle mute button click
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  return (
    <div className="fixed top-4 right-4 z-40">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={handleMuteToggle}
        className="bg-white shadow-md"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>
    </div>
  );
}

export default AudioControls;