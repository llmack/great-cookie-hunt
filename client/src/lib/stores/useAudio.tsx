import { create } from "zustand";
import { toast } from "sonner";

type SoundType = 'cookieCollect' | 'ticketCollect' | 'levelUp' | 'background' | 'walking';

interface Sound {
  element: HTMLAudioElement;
  volume: number;
  loop: boolean;
  loaded: boolean;
  error: boolean;
}

interface AudioState {
  sounds: Record<SoundType, Sound>;
  isMuted: boolean;
  isPlaying: boolean;
  hasErrors: boolean;
  
  // Setup functions
  initSounds: () => void;
  setCustomSound: (type: SoundType, url: string) => void;
  
  // Playback control
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
  stopAllSounds: () => void;
  startBackgroundMusic: () => void;
}

// Sound settings by type
const soundSettings: Record<SoundType, { volume: number, loop: boolean }> = {
  cookieCollect: { volume: 0.5, loop: false },
  ticketCollect: { volume: 0.6, loop: false },
  levelUp: { volume: 0.7, loop: false },
  background: { volume: 0.3, loop: true },
  walking: { volume: 0.2, loop: false }
};

// We can't use direct external links due to CORS restrictions
// Instead, we'll create audio procedurally with the Web Audio API
const AUDIO_ENABLED = true;

// Create or resume AudioContext to handle autoplay policy
const getAudioContext = () => {
  try {
    // Get the AudioContext constructor
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    // Create the context if it doesn't exist
    if (!window._audioContext) {
      window._audioContext = new AudioContextClass();
      console.log('Created new AudioContext');
    }
    
    // If the context is in suspended state, try to resume it
    // This is needed for browsers with autoplay policy
    if (window._audioContext.state === 'suspended') {
      console.log('AudioContext suspended, attempting to resume on user interaction');
    }
    
    return window._audioContext;
  } catch (error) {
    console.error('Error creating or accessing AudioContext:', error);
    return null;
  }
};

// Add AudioContext to window for reuse
declare global {
  interface Window {
    _audioContext: AudioContext | null;
    _audioPlayAttempted: boolean;
    trackingInterval: NodeJS.Timeout | null;
  }
}

// Initialize the global audio context and tracking
window._audioContext = null;
window._audioPlayAttempted = false;

// Create a placeholder sound object
const createEmptySound = (volume: number, loop: boolean): Sound => ({
  element: new Audio(),
  volume,
  loop,
  loaded: false,
  error: false
});

// Create synthesized audio for cookie collection
const createCookieSound = (volume: number): Sound => {
  const sound = createEmptySound(volume, false);
  
  try {
    // Get or create audio context
    const audioContext = getAudioContext();
    if (!audioContext) {
      throw new Error('Could not create AudioContext');
    }
    
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple "blip" sound
    for (let i = 0; i < audioBuffer.length; i++) {
      // Sine wave with decaying amplitude
      const decay = 1.0 - (i / audioBuffer.length);
      channelData[i] = Math.sin(i * 0.1) * decay * 0.5;
    }
    
    // Export the buffer to a WAV-formatted array buffer
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioContext.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    // Render and create URL
    offlineContext.startRendering().then(renderedBuffer => {
      const audioData = renderedBuffer.getChannelData(0).buffer;
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Create the audio element
      const audio = new Audio(url);
      audio.volume = volume;
      sound.element = audio;
      sound.loaded = true;
      sound.error = false;
    }).catch(err => {
      console.error('Error rendering cookie sound:', err);
      sound.error = true;
    });
    
    return sound;
  } catch (error) {
    console.error('Error creating cookie sound:', error);
    sound.error = true;
    return sound;
  }
};

// Create synthesized audio for ticket collection
const createTicketSound = (volume: number): Sound => {
  const sound = createEmptySound(volume, false);
  
  try {
    // Get or create audio context
    const audioContext = getAudioContext();
    if (!audioContext) {
      throw new Error('Could not create AudioContext');
    }
    
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple rising tone
    for (let i = 0; i < audioBuffer.length; i++) {
      // Sine wave with increasing frequency
      const factor = 1.0 + (i / audioBuffer.length) * 3;
      channelData[i] = Math.sin(i * 0.05 * factor) * 0.5;
    }
    
    // Export the buffer to a WAV-formatted array buffer
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioContext.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    // Render and create URL
    offlineContext.startRendering().then(renderedBuffer => {
      const audioData = renderedBuffer.getChannelData(0).buffer;
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Create the audio element
      const audio = new Audio(url);
      audio.volume = volume;
      sound.element = audio;
      sound.loaded = true;
      sound.error = false;
    }).catch(err => {
      console.error('Error rendering ticket sound:', err);
      sound.error = true;
    });
    
    return sound;
  } catch (error) {
    console.error('Error creating ticket sound:', error);
    sound.error = true;
    return sound;
  }
};

// Create synthesized background music
const createBackgroundMusic = (volume: number): Sound => {
  const sound = createEmptySound(volume, true);
  
  try {
    // Get or create audio context
    const audioContext = getAudioContext();
    if (!audioContext) {
      throw new Error('Could not create AudioContext');
    }
    
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple chiptune-like melody with Super Mario influence
    // C major (Super Mario-like) scale: C, D, E, F, G, A, B
    const notes = [
      261.63, // C4
      293.66, // D4
      329.63, // E4 
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25  // C5
    ];
    
    const noteDuration = audioContext.sampleRate * 0.15; // 0.15 seconds per note
    // Create a looping melody pattern (Super Mario-ish)
    const pattern = [0, 2, 4, 0, 2, 7, 4, 2];
    
    for (let i = 0; i < audioBuffer.length; i++) {
      // Determine which note we're playing
      const patternPosition = Math.floor(i / noteDuration) % pattern.length;
      const noteIndex = pattern[patternPosition];
      const frequency = notes[noteIndex];
      
      // Calculate the sample value based on the frequency
      const t = i / audioContext.sampleRate;
      
      // Create a more complex waveform for a richer "chiptune" sound
      let sample = 0;
      // Fundamental frequency (square-ish wave with smoothing)
      sample += 0.3 * Math.tanh(3 * Math.sin(2 * Math.PI * frequency * t));
      // Add harmonics
      sample += 0.1 * Math.sin(2 * Math.PI * frequency * 2 * t); // Octave
      sample += 0.05 * Math.sin(2 * Math.PI * frequency * 3 * t); // Fifth above octave
      
      // Apply envelope
      const noteProgress = (i % noteDuration) / noteDuration;
      const envelope = noteProgress < 0.1 
        ? noteProgress * 10 // Attack: quick ramp up
        : (1 - noteProgress) * 0.5 + 0.5; // Decay/sustain
        
      channelData[i] = sample * envelope * 0.4; // Apply envelope and scale volume
    }
    
    // Export the buffer to a WAV-formatted array buffer
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioContext.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    // Render and create URL
    offlineContext.startRendering().then(renderedBuffer => {
      const audioData = renderedBuffer.getChannelData(0).buffer;
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Create the audio element
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = volume;
      sound.element = audio;
      sound.loaded = true;
      sound.error = false;
    }).catch(err => {
      console.error('Error rendering background music:', err);
      sound.error = true;
    });
    
    return sound;
  } catch (error) {
    console.error('Error creating background music:', error);
    sound.error = true;
    return sound;
  }
};

export const useAudio = create<AudioState>((set, get) => ({
  sounds: {
    // Initialize all sounds as empty
    cookieCollect: createEmptySound(0.5, false),
    ticketCollect: createEmptySound(0.6, false),
    levelUp: createEmptySound(0.7, false),
    background: createEmptySound(0.3, true),
    walking: createEmptySound(0.2, false)
  },
  isMuted: false,
  isPlaying: false,
  hasErrors: false,
  
  // Initialize sounds with procedurally generated audio
  initSounds: () => {
    try {
      console.log("Generating procedural audio...");
      
      // Create our sounds using Web Audio API
      const bgSound = createBackgroundMusic(0.3);
      const cookieSound = createCookieSound(0.5);
      const ticketSound = createTicketSound(0.6);
      
      // Update the store with our sounds
      set(state => ({
        sounds: {
          ...state.sounds,
          background: bgSound,
          cookieCollect: cookieSound,
          ticketCollect: ticketSound
        }
      }));
      
      console.log("Audio generated successfully");
    } catch (error) {
      console.error("Error initializing sounds:", error);
      set({ hasErrors: true });
      toast.error("We are having an issue with our music library, but you can still enjoy the hunt!");
    }
  },
  
  // Set a custom sound by providing URL from file upload
  setCustomSound: (type, url) => {
    const { sounds } = get();
    const settings = soundSettings[type];
    
    // Create a placeholder sound first
    const sound = createEmptySound(settings.volume, settings.loop);
    
    try {
      const audio = new Audio(url);
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        sound.loaded = true;
        sound.error = false;
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`Error loading custom audio from ${url}:`, e);
        sound.error = true;
        sound.loaded = false;
        toast.error("Couldn't load your custom sound. Try a different file.");
      });
      
      // Configure audio
      audio.volume = settings.volume;
      audio.loop = settings.loop;
      sound.element = audio;
      
      // Start loading the audio
      audio.load();
      
      // Update the store
      set({ 
        sounds: { ...sounds, [type]: sound }
      });
      
      // If this is background music and it should be playing, start it
      if (type === 'background' && !get().isMuted) {
        setTimeout(() => {
          if (sound.loaded && !sound.error) {
            sound.element.play()
              .then(() => {
                set({ isPlaying: true });
              })
              .catch(error => {
                console.warn("Custom background music play prevented:", error);
              });
          }
        }, 500);
      }
    } catch (error) {
      console.error(`Error creating custom audio for ${url}:`, error);
      sound.error = true;
      toast.error("Failed to use your custom audio. Try a different file format.");
    }
  },
  
  // Toggle mute state
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Apply mute to all currently loaded sounds
    const { sounds } = get();
    Object.values(sounds).forEach(sound => {
      if (sound?.element) {
        sound.element.muted = newMutedState;
      }
    });
    
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  // Play a specific sound with modern browser compatibility
  playSound: (type) => {
    const { sounds, isMuted, hasErrors } = get();
    const sound = sounds[type];
    
    // Don't try to play if we have errors or are muted
    if (isMuted || hasErrors || !sound || sound.error) return;
    
    try {
      // Make sure AudioContext is resumed (needed for Chrome/Safari)
      const audioContext = getAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
          console.warn('Failed to resume AudioContext:', err);
        });
      }
      
      // For non-looping sounds, reset to beginning to ensure they play
      if (!sound.loop) {
        sound.element.currentTime = 0;
      }
      
      // Only attempt to play if the sound is loaded
      if (sound.loaded) {
        const playPromise = sound.element.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`Could not play sound (${type}):`, error);
            
            // If we've never tried to play audio and this fails, let's
            // set up a one-time click handler on the document
            if (!window._audioPlayAttempted) {
              window._audioPlayAttempted = true;
              console.log('Setting up document click listener for audio autoplay');
              
              document.addEventListener('click', () => {
                // Try to play the sound again
                sound.element.play().catch(e => {
                  console.error(`Still could not play ${type} sound after user click:`, e);
                });
                
                // Also try to start background music
                const bgSound = sounds.background;
                if (bgSound && !bgSound.error) {
                  bgSound.element.play().catch(() => {});
                }
              }, { once: true });
              
              toast.info('Click anywhere to enable sound effects', {
                duration: 5000
              });
            }
          });
        }
      } else {
        // If not loaded yet, set up an event listener
        sound.element.addEventListener('canplaythrough', () => {
          sound.element.play().catch(err => console.warn("Delayed play failed:", err));
        }, { once: true });
        
        // Try to load if not already loading
        if (sound.element.readyState === 0) {
          sound.element.load();
        }
      }
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  },
  
  // Stop a specific sound
  stopSound: (type) => {
    const { sounds } = get();
    const sound = sounds[type];
    
    if (sound && sound.loaded && !sound.error) {
      try {
        sound.element.pause();
        sound.element.currentTime = 0;
      } catch (error) {
        console.error(`Error stopping ${type} sound:`, error);
      }
    }
  },
  
  // Stop all sounds
  stopAllSounds: () => {
    const { sounds } = get();
    Object.entries(sounds).forEach(([type, sound]) => {
      if (sound && sound.loaded && !sound.error) {
        try {
          sound.element.pause();
          sound.element.currentTime = 0;
        } catch (error) {
          console.error(`Error stopping ${type} sound:`, error);
        }
      }
    });
    
    set({ isPlaying: false });
  },
  
  // Start background music - uses user gesture to resume AudioContext
  startBackgroundMusic: () => {
    const { sounds, isMuted, isPlaying, hasErrors } = get();
    
    // Don't restart if already playing or if we have errors
    if (isPlaying || hasErrors) return;
    
    // First make sure AudioContext is resumed since this is usually called from a user gesture
    const audioContext = getAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      console.log('Resuming AudioContext on user gesture');
      audioContext.resume().catch(err => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }
    
    const bgSound = sounds.background;
    if (bgSound && !isMuted && !bgSound.error) {
      try {
        console.log('Attempting to play background music');
        
        // Make sure properties are set
        bgSound.element.loop = true;
        bgSound.element.volume = 0.3;
        
        // Reset playback position if it was playing before
        if (bgSound.element.currentTime > 0) {
          bgSound.element.currentTime = 0;
        }
        
        // Direct play attempt - modern browsers need this from a user gesture
        const playPromise = bgSound.element.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Background music started successfully');
              set({ isPlaying: true });
            })
            .catch(error => {
              console.warn("Background music play prevented:", error);
              
              // If autoplay was prevented, set up a one-time click listener on the document
              if (!window._audioPlayAttempted) {
                window._audioPlayAttempted = true;
                console.log('Setting up document click listener for audio autoplay');
                
                // This will trigger on the next user click anywhere on the page
                document.addEventListener('click', () => {
                  console.log('Document click detected, trying to play audio again');
                  bgSound.element.play()
                    .then(() => {
                      console.log('Background music started on user click');
                      set({ isPlaying: true });
                    })
                    .catch(e => {
                      console.error('Still could not play audio after user click:', e);
                      set({ hasErrors: true });
                    });
                }, { once: true });
                
                toast.info('Click anywhere to enable audio', {
                  duration: 5000
                });
              }
            });
        }
      } catch (error) {
        console.error("Error playing background music:", error);
        set({ hasErrors: true });
        toast.error("We are having an issue with our music library, but you can still enjoy the hunt!");
      }
    }
  }
}));
