import React, { useState, useEffect } from 'react';
import { PlayCircle, MapPin, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

interface PermissionsDialogProps {
  audioState: { 
    showAudioButton: boolean; 
    hasAudioErrors: boolean;
    onEnableAudio: () => void;
  };
  locationState: {
    locationPermission: 'granted' | 'denied' | 'prompt';
    onRequestLocation: () => Promise<any>;
  };
  onAllGranted: () => void;
}

const PermissionsDialog = ({ 
  audioState, 
  locationState,
  onAllGranted
}: PermissionsDialogProps) => {
  const [permissionsComplete, setPermissionsComplete] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(
    locationState.locationPermission === 'granted'
  );
  
  // Check if all permissions are ready
  useEffect(() => {
    if (
      (audioEnabled || !audioState.showAudioButton) && 
      (locationEnabled || locationState.locationPermission === 'granted')
    ) {
      setPermissionsComplete(true);
      
      // Call the callback for when all permissions are granted
      setTimeout(() => {
        onAllGranted();
      }, 500);
    }
  }, [
    audioEnabled, 
    locationEnabled, 
    audioState.showAudioButton, 
    locationState.locationPermission,
    onAllGranted
  ]);
  
  // Request both permissions
  const handleEnableAudio = () => {
    audioState.onEnableAudio();
    setAudioEnabled(true);
  };
  
  const handleEnableLocation = async () => {
    try {
      await locationState.onRequestLocation();
      setLocationEnabled(true);
      toast.success("Location services enabled!");
    } catch (error) {
      console.error("Error enabling location:", error);
      toast.error("Could not enable location services. Using simulated location.");
      // Still consider it "enabled" for the user to proceed
      setLocationEnabled(true);
    }
  };
  
  // When permissions are already granted, don't show dialog
  if (!audioState.showAudioButton && locationState.locationPermission === 'granted') {
    return null;
  }
  
  // Once all permissions are granted, don't show dialog
  if (permissionsComplete) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
      <Card className="max-w-md w-full mx-4 bg-white shadow-lg">
        <CardHeader className="text-center pb-2">
          <h2 className="text-xl font-bold text-[#003DA5]">Welcome to GreatCookieHunt!</h2>
          <p className="text-sm text-muted-foreground">Let's set up your experience</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2 pb-4">
          {/* Audio Permission */}
          {audioState.showAudioButton && !audioEnabled && !audioState.hasAudioErrors && (
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex gap-3 items-center mb-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Volume2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Enable Game Audio</h3>
                  <p className="text-sm text-muted-foreground">For the full experience with chiptune music</p>
                </div>
              </div>
              <Button 
                onClick={handleEnableAudio}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Enable Audio
              </Button>
            </div>
          )}
          
          {/* Location Permission */}
          {locationState.locationPermission !== 'granted' && !locationEnabled && (
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex gap-3 items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Enable Location Services</h3>
                  <p className="text-sm text-muted-foreground">To collect cookies as you explore Philadelphia</p>
                </div>
              </div>
              <Button 
                onClick={handleEnableLocation}
                className="w-full bg-[#003DA5] hover:bg-blue-800 text-white"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location
              </Button>
            </div>
          )}
          
          {/* Skip Option */}
          <div className="text-center mt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setAudioEnabled(true);
                setLocationEnabled(true);
              }}
              className="text-sm"
            >
              Skip and use simulated data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsDialog;