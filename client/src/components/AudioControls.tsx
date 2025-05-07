import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AudioControls() {
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [hasErrors, setHasErrors] = useState(false);
  
  // Initialize audio context when component mounts
  useEffect(() => {
    try {
      // Try creating audio context, but it might be suspended until user interaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const context = new AudioContextClass();
        setAudioContext(context);
        
        // If already running, don't show play button
        if (context.state === 'running') {
          setShowPlayButton(false);
        }
        
        console.log(`AudioContext created with state: ${context.state}`);
      } else {
        console.warn('AudioContext not supported in this browser');
        setHasErrors(true);
      }
    } catch (e) {
      console.error('Error initializing audio context:', e);
      setHasErrors(true);
    }
  }, []);
  
  // Audio element for background music
  const [musicElement, setMusicElement] = useState<HTMLAudioElement | null>(null);
  
  // Initialize the audio element for background music
  useEffect(() => {
    // Create an audio element for the selected music
    const audio = new Audio('/coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    setMusicElement(audio);
    
    // Add event listeners
    audio.addEventListener('error', (e) => {
      console.error('Error loading music:', e);
      setHasErrors(true);
    });
    
    // Clean up
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // Control music state using the audio element directly
  useEffect(() => {
    if (!musicElement) return;
    
    if (isMuted) {
      console.log('Muting music');
      musicElement.pause();
    } else if (!showPlayButton) {
      // Only play if user has clicked the play button
      console.log('Playing music');
      musicElement.play().catch(err => {
        console.error('Error playing music:', err);
      });
    }
  }, [isMuted, showPlayButton, musicElement]);
  
  // Play background music
  const playBackgroundMusic = () => {
    if (!musicElement || isMuted) return false;
    
    try {
      // Play using the audio element
      const playPromise = musicElement.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Music playing successfully');
          return true;
        }).catch(e => {
          console.error('Error playing music:', e);
          return false;
        });
      }
      
      return true;
    } catch (e) {
      console.error('Error playing background music:', e);
      return false;
    }
  };
  
  // Handle play button click
  const handlePlayClick = () => {
    if (!audioContext) return;
    
    // Resume audio context (needed for Chrome's autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
        const success = playBackgroundMusic();
        if (success) {
          setShowPlayButton(false);
          // Play a success sound
          playSuccessSound();
        }
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
        toast.error('Could not start audio. Please try again.');
      });
    } else {
      // Context is already running
      const success = playBackgroundMusic();
      if (success) {
        setShowPlayButton(false);
      }
    }
  };
  
  // Play a simple success sound
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
  
  // Handle mute toggle with explicit user interaction
  const handleMuteToggle = () => {
    console.log('Mute toggle clicked, current state:', isMuted);
    
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    }
    
    // Toggle mute state first
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // If we're unmuting and have music, play it
    if (!newMuteState && !showPlayButton && musicElement) {
      console.log('Unmuting, attempting to play music');
      playBackgroundMusic();
    }
    
    // Play a click sound when toggling (helps with permission too)
    if (!isMuted && audioContext) {
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
      } catch (e) {
        console.error('Error playing click sound:', e);
      }
    }
    
    console.log('Mute state after toggle:', newMuteState);
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
      
      {/* We no longer show the dialog here - it's managed in PermissionsDialog.tsx */}
    </>
  );
}

export default AudioControls;