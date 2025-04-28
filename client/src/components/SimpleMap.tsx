import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/useUserStore';

const DEFAULT_LOCATION = { lat: 39.9526, lng: -75.1652 }; // Philadelphia City Hall

interface Location {
  lat: number;
  lng: number;
}

const SimpleMap = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const { addSteps, addDistance, collectItem } = useUserStore();

  // Start tracking (simplified simulation)
  const startTracking = () => {
    if (isTracking) return;
    
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
          toast.success(`You found ${value} cookie${value > 1 ? 's' : ''}!`);
        } else {
          collectItem('ticket', 1);
          toast.success("You found a golden ticket!");
        }
      }
    }, 4000);
    
    // Store interval ID in window for cleanup
    window.trackingInterval = interval;
  };

  // Stop tracking
  const stopTracking = () => {
    if (!isTracking) return;
    
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
    
    setIsTracking(false);
    toast.info("Stopped tracking your movement");
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
        >
          <Target size={20} />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="bg-white shadow-md"
        >
          <Compass size={20} />
        </Button>
      </div>
      
      {/* Stats Card */}
      <Card className="absolute bottom-4 left-0 right-0 mx-4 bg-white shadow-lg z-20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Steps</p>
                <p className="text-xl font-bold">{steps}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="text-xl font-bold">{(distance / 1000).toFixed(2)} km</p>
              </div>
            </div>
            <Button 
              variant={isTracking ? "destructive" : "default"}
              onClick={isTracking ? stopTracking : startTracking}
              className={`${isTracking ? "bg-red-500 hover:bg-red-600" : "bg-[#003DA5]"} px-6 py-2 text-white font-bold text-base`}
              size="lg"
            >
              {isTracking ? "STOP" : "START"} TRACKING
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Welcome message for new users - only show when not tracking */}
      {!isTracking && (
        <div className="absolute top-[20%] left-0 right-0 mx-auto max-w-sm z-10">
          <Card className="bg-white/95 shadow-lg border-2 border-[#003DA5]">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-xl mb-3 text-[#003DA5]">Start Your Cookie Hunt!</h3>
              <p className="mb-3">Walk around Philadelphia to collect virtual cookies and golden tickets!</p>
              <p className="text-sm mb-4">Press the "Start Tracking" button to begin your adventure.</p>
              <p className="text-xs text-muted-foreground">(For this demo, we'll simulate movement around Philadelphia)</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Add window.trackingInterval to the global scope
declare global {
  interface Window {
    trackingInterval: NodeJS.Timeout | null;
  }
}

// Initialize the tracking interval property
window.trackingInterval = null;

export default SimpleMap;