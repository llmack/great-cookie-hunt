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
  
  // Play a simple background music loop
  const playBackgroundMusic = () => {
    if (!audioContext || isMuted) return;
    
    try {
      // Create oscillator for simple background music (looping notes)
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set up a simple melody
      osc.type = 'sine';
      osc.frequency.value = 440; // A4
      
      // Create a simple pattern by changing frequency over time
      const now = audioContext.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(494, now + 0.5); // B4
      osc.frequency.setValueAtTime(523, now + 1.0); // C5
      osc.frequency.setValueAtTime(587, now + 1.5); // D5
      osc.frequency.setValueAtTime(659, now + 2.0); // E5
      osc.frequency.setValueAtTime(587, now + 2.5); // D5
      osc.frequency.setValueAtTime(523, now + 3.0); // C5
      osc.frequency.setValueAtTime(494, now + 3.5); // B4
      
      // Set volume
      gainNode.gain.value = 0.1;
      
      // Connect nodes
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop
      osc.start();
      osc.stop(now + 4.0);
      
      // Loop by scheduling the next call
      setTimeout(() => {
        if (!isMuted) playBackgroundMusic();
      }, 4000);
      
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
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    }
    
    // If previously muted and now unmuting, try playing
    if (isMuted && !showPlayButton) {
      playBackgroundMusic();
    }
    
    setIsMuted(!isMuted);
    
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