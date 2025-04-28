import { create } from "zustand";

type SoundType = 'cookieCollect' | 'ticketCollect' | 'levelUp' | 'background' | 'walking';

interface Sound {
  element: HTMLAudioElement;
  volume: number;
  loop: boolean;
}

interface AudioState {
  sounds: Record<SoundType, Sound | null>;
  isMuted: boolean;
  isPlaying: boolean;
  theme: 'mario' | 'cookie' | 'custom';
  
  // Setup functions
  initSounds: () => void;
  setTheme: (theme: 'mario' | 'cookie' | 'custom') => void;
  setCustomSound: (type: SoundType, url: string) => void;
  
  // Playback control
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
  stopAllSounds: () => void;
  startBackgroundMusic: () => void;
}

// Path to sound files based on theme
const getSoundPath = (type: SoundType, theme: 'mario' | 'cookie' | 'custom'): string => {
  if (theme === 'mario') {
    switch (type) {
      case 'cookieCollect': return '/audio/mario-coin.mp3';
      case 'ticketCollect': return '/audio/mario-powerup.mp3';
      case 'levelUp': return '/audio/mario-level-complete.mp3';
      case 'background': return '/audio/mario-theme-remix.mp3';
      case 'walking': return '/audio/mario-step.mp3';
      default: return '';
    }
  } else if (theme === 'cookie') {
    switch (type) {
      case 'cookieCollect': return '/audio/cookie-munch.mp3';
      case 'ticketCollect': return '/audio/cookie-wow.mp3';
      case 'levelUp': return '/audio/cookie-celebrate.mp3';
      case 'background': return '/audio/cookie-theme.mp3';
      case 'walking': return '/audio/cookie-walk.mp3';
      default: return '';
    }
  }
  return '';
};

// Audio instance creation with error handling
const createAudio = (url: string, volume: number = 1.0, loop: boolean = false): Sound | null => {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.loop = loop;
    return { element: audio, volume, loop };
  } catch (error) {
    console.error(`Error creating audio for ${url}:`, error);
    return null;
  }
};

export const useAudio = create<AudioState>((set, get) => ({
  sounds: {
    cookieCollect: null,
    ticketCollect: null,
    levelUp: null,
    background: null,
    walking: null
  },
  isMuted: false,
  isPlaying: false,
  theme: 'cookie', // Default theme
  
  // Initialize sounds based on selected theme
  initSounds: () => {
    const { theme } = get();
    const sounds: Record<SoundType, Sound | null> = {
      cookieCollect: createAudio(getSoundPath('cookieCollect', theme), 0.5),
      ticketCollect: createAudio(getSoundPath('ticketCollect', theme), 0.6),
      levelUp: createAudio(getSoundPath('levelUp', theme), 0.7),
      background: createAudio(getSoundPath('background', theme), 0.3, true),
      walking: createAudio(getSoundPath('walking', theme), 0.2),
    };
    set({ sounds });
  },
  
  // Change sound theme - reinitializes all sounds
  setTheme: (theme) => {
    set({ theme });
    get().initSounds();
  },
  
  // Set a custom sound by providing URL
  setCustomSound: (type, url) => {
    const { sounds } = get();
    const volume = sounds[type]?.volume || 0.5;
    const loop = sounds[type]?.loop || false;
    const newSound = createAudio(url, volume, loop);
    
    set({ 
      sounds: { ...sounds, [type]: newSound },
      theme: 'custom' 
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
    const { sounds, isMuted } = get();
    const sound = sounds[type];
    
    if (sound && !isMuted) {
      try {
        // For non-looping sounds, reset to beginning to ensure they play
        if (!sound.loop) {
          sound.element.currentTime = 0;
        }
        
        const playPromise = sound.element.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`Could not play sound (${type}):`, error);
          });
        }
      } catch (error) {
        console.error(`Error playing ${type} sound:`, error);
      }
    }
  },
  
  // Stop a specific sound
  stopSound: (type) => {
    const { sounds } = get();
    const sound = sounds[type];
    
    if (sound) {
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
      if (sound) {
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
    const { sounds, isMuted, isPlaying } = get();
    
    // Don't restart if already playing
    if (isPlaying) return;
    
    const bgSound = sounds.background;
    if (bgSound && !isMuted) {
      try {
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
      } catch (error) {
        console.error("Error playing background music:", error);
      }
    }
  }
}));
