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
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple "blip" sound
    for (let i = 0; i < audioBuffer.length; i++) {
      // Sine wave with decaying amplitude
      const decay = 1.0 - (i / audioBuffer.length);
      channelData[i] = Math.sin(i * 0.1) * decay * 0.5;
    }
    
    // Create a blob URL from the buffer
    const arrayBuffer = channelData.buffer;
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Create the audio element
    const audio = new Audio(url);
    audio.volume = volume;
    sound.element = audio;
    sound.loaded = true;
    sound.error = false;
    
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
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple rising tone
    for (let i = 0; i < audioBuffer.length; i++) {
      // Sine wave with increasing frequency
      const factor = 1.0 + (i / audioBuffer.length) * 3;
      channelData[i] = Math.sin(i * 0.05 * factor) * 0.5;
    }
    
    // Create a blob URL from the buffer
    const arrayBuffer = channelData.buffer;
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Create the audio element
    const audio = new Audio(url);
    audio.volume = volume;
    sound.element = audio;
    sound.loaded = true;
    sound.error = false;
    
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
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate a simple chiptune-like melody
    const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
    const noteDuration = audioContext.sampleRate * 0.2; // 0.2 seconds per note
    
    for (let i = 0; i < audioBuffer.length; i++) {
      // Determine which note we're playing
      const noteIndex = Math.floor(i / noteDuration) % notes.length;
      const frequency = notes[noteIndex];
      
      // Calculate the sample value based on the frequency
      const t = i / audioContext.sampleRate;
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3;
      
      // Add a bit of "noise" for texture
      if (i % 20000 < 5000) {
        channelData[i] += (Math.random() * 2 - 1) * 0.05;
      }
    }
    
    // Create a blob URL from the buffer
    const arrayBuffer = channelData.buffer;
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Create the audio element
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    sound.element = audio;
    sound.loaded = true;
    sound.error = false;
    
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
  
  // Play a specific sound
  playSound: (type) => {
    const { sounds, isMuted, hasErrors } = get();
    const sound = sounds[type];
    
    // Don't try to play if we have errors or are muted
    if (isMuted || hasErrors || !sound || sound.error) return;
    
    try {
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
  
  // Start background music
  startBackgroundMusic: () => {
    const { sounds, isMuted, isPlaying, hasErrors } = get();
    
    // Don't restart if already playing or if we have errors
    if (isPlaying || hasErrors) return;
    
    const bgSound = sounds.background;
    if (bgSound && !isMuted && !bgSound.error) {
      try {
        // Only try to play if the browser allows it
        bgSound.element.addEventListener('canplaythrough', () => {
          bgSound.element.currentTime = 0;
          bgSound.element.loop = true;
          
          const playPromise = bgSound.element.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                set({ isPlaying: true });
              })
              .catch(error => {
                console.warn("Background music play prevented:", error);
              });
          }
        }, { once: true });
        
        // Try to load the audio if not already loading
        if (bgSound.element.readyState === 0) {
          bgSound.element.load();
        }
      } catch (error) {
        console.error("Error playing background music:", error);
        set({ hasErrors: true });
        toast.error("We are having an issue with our music library, but you can still enjoy the hunt!");
      }
    }
  }
}));
