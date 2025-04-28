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
      {/* Simulated Map Background */}
      <div className="flex-1 w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Philadelphia Cookie Hunt</h2>
          <div className="p-4 bg-white rounded-lg shadow-md max-w-sm mx-auto">
            <p className="mb-4">Walk around Philadelphia to collect virtual cookies and golden tickets!</p>
            <p className="text-sm mb-3 text-gray-500">
              {isTracking 
                ? "You're collecting items as you move! Keep walking to find more." 
                : "Press 'Start Tracking' to begin your adventure."}
            </p>
            
            {/* Animated cookie when tracking */}
            {isTracking && (
              <div className="my-4 text-4xl animate-bounce">
                🍪
              </div>
            )}
          </div>
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
      <Card className="absolute bottom-4 left-0 right-0 mx-4 bg-white/90 shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Steps</p>
              <p className="text-xl font-bold">{steps}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="text-xl font-bold">{(distance / 1000).toFixed(2)} km</p>
            </div>
            <Button 
              variant={isTracking ? "destructive" : "default"}
              onClick={isTracking ? stopTracking : startTracking}
              className={isTracking ? "bg-red-500 hover:bg-red-600" : "bg-[#003DA5]"}
            >
              {isTracking ? "Stop" : "Start"} Tracking
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Welcome message for new users */}
      {!isTracking && (
        <div className="absolute top-1/3 left-0 right-0 mx-auto max-w-sm">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-bold text-lg mb-2">Start Your Cookie Hunt!</h3>
              <p className="text-sm mb-2">Press the "Start Tracking" button to begin collecting cookies and golden tickets as you walk!</p>
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