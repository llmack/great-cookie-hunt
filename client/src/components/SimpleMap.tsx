import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAudio } from '@/lib/stores/useAudio';
import AudioControls from './AudioControls';
import CookieMusic from './CookieMusic';
import PermissionsDialog from './PermissionsDialog';

const DEFAULT_LOCATION = { lat: 39.9526, lng: -75.1652 }; // Philadelphia City Hall

interface Location {
  lat: number;
  lng: number;
}

const SimpleMap = () => {
  // Game state
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  
  // Permission states
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showAudioButton, setShowAudioButton] = useState(true);
  const [hasAudioErrors, setHasAudioErrors] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [permissionsReady, setPermissionsReady] = useState(false);
  
  // Store
  const { addSteps, addDistance, collectItem } = useUserStore();
  
  // Initialize permissions when component mounts
  useEffect(() => {
    // Try to create a silent audio context to help with future audio playback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(audioCtx);
      
      if (audioCtx.state === 'suspended') {
        console.log('AudioContext suspended, will resume on user interaction');
      } else if (audioCtx.state === 'running') {
        // Audio context is already running, no need to show the audio button
        setShowAudioButton(false);
      }
    } catch (e) {
      console.error('Error initializing audio context:', e);
      setHasAudioErrors(true);
    }
    
    // Check location permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
          };
        })
        .catch(err => {
          console.error('Error checking geolocation permission:', err);
        });
    }
  }, []);

  // Request location permissions
  const requestLocationPermission = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationPermission('granted');
            resolve(position);
          },
          (error) => {
            setLocationPermission('denied');
            toast.error("Location access denied. Using simulated location instead.");
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationPermission('denied');
        toast.error("Geolocation is not supported by this browser. Using simulated location.");
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Start tracking (with permission checks)
  const startTracking = async () => {
    if (isTracking) return;
    
    try {
      // Request location permission if needed
      if (locationPermission !== 'granted') {
        await requestLocationPermission();
      }
      
      // Play background music
      useAudio.getState().startBackgroundMusic();
      
      toast.success("Started tracking your movement!");
      setIsTracking(true);
      
      // Simulate collecting items and walking
      const interval = setInterval(() => {
        // Simulate steps
        const newSteps = Math.floor(Math.random() * 25) + 10;
        const newDistance = newSteps * 0.75;
        
        // Update UI
        setSteps(s => s + newSteps);
        setDistance(d => d + newDistance);
        
        // Update store
        addSteps(newSteps);
        addDistance(newDistance);
        
        // Simulate finding items occasionally
        if (Math.random() > 0.7) {
          const isCookie = Math.random() > 0.2;
          if (isCookie) {
            const value = Math.floor(Math.random() * 3) + 1;
            collectItem('cookie', value);
            // Play success sound
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              
              osc.type = 'sine';
              osc.frequency.setValueAtTime(600, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.2);
              
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
              
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch (e) {
              console.error("Audio error:", e);
            }
            
            toast.success(`You found ${value} cookie${value > 1 ? 's' : ''}!`);
          } else {
            collectItem('ticket', 1);
            // Play special sound for ticket
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              
              osc.type = 'square';
              osc.frequency.setValueAtTime(440, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
              
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch (e) {
              console.error("Audio error:", e);
            }
            
            toast.success("You found a golden ticket!");
          }
        }
      }, 4000);
      
      // Store interval ID in window for cleanup
      window.trackingInterval = interval;
    } catch (error) {
      console.error("Error starting tracking:", error);
      
      // Still allow tracking with simulation even if permissions fail
      toast.warning("Using simulated location for demonstration");
      setIsTracking(true);
      
      // Start simulation anyway (just without real location)
      const interval = setInterval(() => {
        const newSteps = Math.floor(Math.random() * 25) + 10;
        const newDistance = newSteps * 0.75;
        
        setSteps(s => s + newSteps);
        setDistance(d => d + newDistance);
        
        addSteps(newSteps);
        addDistance(newDistance);
        
        if (Math.random() > 0.7) {
          const isCookie = Math.random() > 0.2;
          if (isCookie) {
            const value = Math.floor(Math.random() * 3) + 1;
            collectItem('cookie', value);
            toast.success(`You found ${value} cookie${value > 1 ? 's' : ''}!`);
          } else {
            collectItem('ticket', 1);
            toast.success("You found a golden ticket!");
          }
        }
      }, 4000);
      
      window.trackingInterval = interval;
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (!isTracking) return;
    
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
    
    // Stop background music
    useAudio.getState().stopAllSounds();
    
    setIsTracking(false);
    toast.info("Stopped tracking your movement");
    
    // Play a sound on stop too
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  // Helper function to create a simple beep on button press 
  // (This helps with audio permission too)
  const playButtonSound = () => {
    try {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Error resuming context:", e));
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 800;
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
      console.log("Button sound played");
    } catch (e) {
      console.error("Button sound error:", e);
    }
  };
  
  // Function to enable audio context - simplified with new AudioControls component
  const enableAudio = () => {
    console.log('Audio enabled through permissions dialog');
    setShowAudioButton(false);
    
    // Now AudioControls component will handle the actual audio playback
    // When showPlayButton is set to false, AudioControls will start playing music
    playButtonSound();
  };
  
  // Handle when all permissions are ready
  const handlePermissionsReady = () => {
    console.log("All permissions ready!");
    setPermissionsReady(true);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Simulated Map Background - Philadelphia style map */}
      <div className="flex-1 w-full h-full bg-blue-50 overflow-hidden">
        {/* Philly-themed map background with grid */}
        <div className="h-full w-full relative">
          {/* Map title */}
          <div className="absolute top-2 left-2 right-2 text-center z-10">
            <h2 className="text-xl font-bold text-[#003DA5] bg-white/80 inline-block px-4 py-2 rounded-lg shadow">
              GreatCookieHunt - Philadelphia
            </h2>
          </div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-200"></div>
            ))}
          </div>
          
          {/* Landmarks */}
          <div className="absolute top-1/4 left-1/4 bg-blue-500 rounded-full w-3 h-3"></div>
          <div className="absolute top-2/3 left-1/3 bg-blue-500 rounded-full w-3 h-3"></div>
          <div className="absolute top-1/3 left-3/4 bg-blue-500 rounded-full w-3 h-3"></div>
          <div className="absolute top-1/2 left-1/2 bg-red-500 rounded-full w-4 h-4 animate-pulse"></div>
          
          {/* Roads */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-300"></div>
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-300"></div>
          <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-300"></div>
          <div className="absolute top-0 bottom-0 left-1/4 w-1 bg-gray-300"></div>
          <div className="absolute top-0 bottom-0 left-3/4 w-1 bg-gray-300"></div>
          
          {/* Animated items when tracking */}
          {isTracking && (
            <>
              <div className="absolute top-[30%] left-[40%] text-xl animate-bounce">🍪</div>
              <div className="absolute top-[70%] left-[60%] text-xl animate-bounce delay-150">🍪</div>
              <div className="absolute top-[50%] left-[20%] text-xl animate-bounce delay-300">🎫</div>
            </>
          )}
        </div>
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="bg-white shadow-md"
          onClick={playButtonSound}
        >
          <Target size={20} />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="bg-white shadow-md"
          onClick={playButtonSound}
        >
          <Compass size={20} />
        </Button>
      </div>
      
      {/* Audio Controls */}
      <AudioControls />
      
      {/* Background Music - plays only during tracking */}
      <CookieMusic isPlaying={isTracking} />
      
      {/* Simplified Stats and Tracking Button for better visibility */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-16 pt-4 bg-gradient-to-t from-white to-transparent">
        {/* Stats Panel */}
        <div className="mx-auto max-w-xs mb-4">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Steps</p>
                  <p className="text-xl font-bold">{steps}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-xl font-bold">{(distance / 1000).toFixed(2)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Large Visible Tracking Button */}
        <div className="flex justify-center mx-4 mb-4">
          <Button 
            variant={isTracking ? "destructive" : "default"}
            onClick={() => {
              playButtonSound();
              isTracking ? stopTracking() : startTracking();
            }}
            className={`${isTracking ? "bg-red-500 hover:bg-red-600" : "bg-[#003DA5]"} 
              w-full max-w-xs py-6 text-white font-bold text-xl tracking-wide shadow-lg rounded-xl`}
          >
            {isTracking ? "STOP" : "START"} TRACKING
          </Button>
        </div>
      </div>
      
      {/* Welcome message for new users - only show when not tracking */}
      {!isTracking && (
        <div className="absolute top-[15%] left-0 right-0 mx-auto max-w-sm z-10">
          <Card className="bg-white/95 shadow-lg border-2 border-[#003DA5]">
            <CardContent className="p-5 text-center">
              <h3 className="font-bold text-xl mb-2 text-[#003DA5]">Start Your Cookie Hunt!</h3>
              <p className="mb-2">Walk around Philadelphia to collect virtual cookies and golden tickets!</p>
              <p className="text-sm mb-2">Look for the blue "START TRACKING" button at the bottom of your screen.</p>
              <p className="text-xs text-muted-foreground">(For this demo, we'll simulate movement around Philadelphia)</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Combined Permissions Dialog */}
      <PermissionsDialog 
        audioState={{
          showAudioButton: showAudioButton,
          hasAudioErrors: hasAudioErrors,
          onEnableAudio: enableAudio
        }}
        locationState={{
          locationPermission: locationPermission,
          onRequestLocation: requestLocationPermission
        }}
        onAllGranted={handlePermissionsReady}
      />
    </div>
  );
};

// Add window.trackingInterval to the global scope
declare global {
  interface Window {
    trackingInterval: NodeJS.Timeout | null;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// Initialize the tracking interval property
window.trackingInterval = null;

export default SimpleMap;