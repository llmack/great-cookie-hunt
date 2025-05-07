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

// Main background music path - direct link to Pixabay audio file
const BACKGROUND_MUSIC_PATH = 'https://cdn.pixabay.com/download/audio/2022/11/05/audio_0d5eb59e6c.mp3';

// Create a placeholder sound object
const createEmptySound = (volume: number, loop: boolean): Sound => ({
  element: new Audio(),
  volume,
  loop,
  loaded: false,
  error: false
});

// Create audio with proper error handling
const createAudio = (url: string, volume: number, loop: boolean): Sound => {
  // Create a placeholder sound first
  const sound = createEmptySound(volume, loop);
  
  try {
    const audio = new Audio(url);
    
    // Set up event listeners
    audio.addEventListener('canplaythrough', () => {
      sound.loaded = true;
      sound.error = false;
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`Error loading audio from ${url}:`, e);
      sound.error = true;
      sound.loaded = false;
    });
    
    // Configure audio
    audio.volume = volume;
    audio.loop = loop;
    sound.element = audio;
    
    // Start loading the audio
    audio.load();
    
    return sound;
  } catch (error) {
    console.error(`Error creating audio for ${url}:`, error);
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
  
  // Initialize sounds - focus only on background music from Pixabay
  initSounds: () => {
    try {
      console.log("Loading music from:", BACKGROUND_MUSIC_PATH);
      
      // Only load the main background music from Pixabay
      const bgSound = createAudio(BACKGROUND_MUSIC_PATH, 0.3, true);
      
      // Use the same sound for collection sounds (but with different volumes)
      const cookieSound = createAudio(BACKGROUND_MUSIC_PATH, 0.2, false);
      const ticketSound = createAudio(BACKGROUND_MUSIC_PATH, 0.2, false);
      
      // Update the store with our sounds
      set(state => ({
        sounds: {
          ...state.sounds,
          background: bgSound,
          cookieCollect: cookieSound,
          ticketCollect: ticketSound
        }
      }));
      
      // Check for errors after a short delay to let loading events fire
      setTimeout(() => {
        const { sounds } = get();
        const hasAnyErrors = Object.values(sounds).some(sound => sound.error);
        
        if (hasAnyErrors) {
          console.error("Audio loading errors detected");
          set({ hasErrors: true });
          toast.error("We are having an issue with our music library, but you can still enjoy the hunt!");
        } else {
          console.log("Audio loaded successfully");
        }
      }, 2000);
    } catch (error) {
      console.error("Error initializing sounds:", error);
      set({ hasErrors: true });
      toast.error("We are having an issue with our music library, but you can still enjoy the hunt!");
    }
  },
  
  // Set a custom sound by providing URL
  setCustomSound: (type, url) => {
    const { sounds } = get();
    const settings = soundSettings[type];
    const newSound = createAudio(url, settings.volume, settings.loop);
    
    set({ 
      sounds: { ...sounds, [type]: newSound }
    });
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
