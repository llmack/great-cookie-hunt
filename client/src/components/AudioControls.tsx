import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function AudioControls() {
  // State for audio controls
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // Use ref for audio element
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Initialize audio context
  useEffect(() => {
    try {
      // Create audio context
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      console.log('AudioContext created with state:', ctx.state);
      
      // If already running, no need for play button
      if (ctx.state === 'running') {
        setShowPlayButton(false);
      }
    } catch (e) {
      console.error('Error initializing audio context:', e);
      setHasErrors(true);
    }
  }, []);
  
  // Handle mute toggle
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      console.log('Muting audio');
      audioRef.current.pause();
    } else if (!showPlayButton) {
      console.log('Unmuting audio, attempting to play');
      playMusic();
    }
  }, [isMuted, showPlayButton]);
  
  // Play music 
  const playMusic = () => {
    if (!audioRef.current || isMuted) return;
    
    try {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Music playing successfully');
          })
          .catch(e => {
            console.error('Error playing music:', e);
            // Try again with user interaction
            if (e.name === 'NotAllowedError') {
              setShowPlayButton(true);
            }
          });
      }
    } catch (e) {
      console.error('Error playing music:', e);
    }
  };
  
  // Play a success sound
  const playSuccessSound = () => {
    if (!audioContext || isMuted) return;
    
    try {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc.start();
      osc.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Error playing success sound:', e);
    }
  };
  
  // Handle play button click
  const handlePlayClick = () => {
    if (!audioContext) return;
    
    // Resume audio context (needed for Chrome's autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
        
        playMusic();
        setShowPlayButton(false);
        
        // Play a success sound
        playSuccessSound();
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
        toast.error('Could not start audio. Please try again.');
      });
    } else {
      // Context is already running
      playMusic();
      setShowPlayButton(false);
    }
  };
  
  // Play a click sound when toggling
  const playClickSound = () => {
    if (!audioContext || isMuted) return;
    
    try {
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 500;
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc.start();
      osc.stop(audioContext.currentTime + 0.1);
      
      console.log('Button sound played');
    } catch (e) {
      console.error('Error playing click sound:', e);
    }
  };
  
  // Handle mute toggle
  const handleMuteToggle = () => {
    console.log('Mute toggle clicked, current state:', isMuted);
    
    // Resume audio context if needed
    if (audioContext?.state === 'suspended') {
      audioContext.resume().catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    }
    
    // Toggle mute state
    setIsMuted(prev => !prev);
    
    // Play a click sound
    playClickSound();
  };
  
  return (
    <>
      {/* Hidden Audio Element for Music */}
      <audio
        ref={audioRef}
        src="/sounds/coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
        onError={(e) => {
          console.error('Audio element error:', e);
          setHasErrors(true);
        }}
      />
      
      {/* Mute/Unmute Button */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
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
      
      {/* Play Button Dialog - Shown only when needed */}
      {showPlayButton && !hasErrors && (
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