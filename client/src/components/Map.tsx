import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Target, MapPin } from 'lucide-react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAudio } from '@/lib/stores/useAudio';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
import GameItems from './GameItems';
import { landmarks } from '@/assets/landmarks';

// Type definitions for location and items
interface Location {
  lat: number;
  lng: number;
}

interface NearbyItem {
  id: string;
  type: 'cookie' | 'ticket';
  position: Location;
  value: number;
  collected: boolean;
}

const DEFAULT_LOCATION = { lat: 39.9526, lng: -75.1652 }; // Philadelphia City Hall

const Map = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const { addSteps, addDistance, collectItem } = useUserStore();
  const { playSuccess } = useAudio();
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Wait for Google Maps to load
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
      } else {
        // Check again in 500ms
        setTimeout(checkGoogleMapsLoaded, 500);
      }
    };
    
    checkGoogleMapsLoaded();
    
    // This will run when the component unmounts
    return () => {
      // Clean up resources
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(watchId as unknown as NodeJS.Timeout);
      }
    };
  }, []);

  // Initialize map when component mounts and Google Maps is loaded
  useEffect(() => {
    // Only initialize the map once when Google Maps is loaded and mapRef is available
    if (mapRef.current && !googleMapRef.current && isGoogleMapsLoaded) {
      try {
        initMap();
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("There was an error loading the map. Please try again.");
      }
    }
    
    // Clean up function for this specific effect
    return () => {
      // Clean up markers when this effect is cleaned up
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [isGoogleMapsLoaded]);

  // Initialize Google Map
  const initMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    try {
      // Create the map centered on Philadelphia
      const mapOptions: google.maps.MapOptions = {
        center: DEFAULT_LOCATION,
        zoom: 15,
        maxZoom: 18,
        minZoom: 12,
        disableDefaultUI: true,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
        ],
        mapTypeControl: false,
        zoomControl: false,
        streetViewControl: false,
      };

      googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);
      setMapLoaded(true);

      // Add landmarks to map
      addLandmarksToMap();

      // Generate some initial items around default location
      generateNearbyItems(DEFAULT_LOCATION);

      // Try to get user location
      setTimeout(() => {
        getUserLocation();
      }, 1000);
    } catch (error) {
      console.error("Error in initMap:", error);
      toast.error("Failed to initialize the map. Please refresh the page.");
    }
  };

  // Add Philadelphia landmarks to the map
  const addLandmarksToMap = () => {
    if (!googleMapRef.current || !window.google) return;

    try {
      landmarks.forEach(landmark => {
        const marker = new google.maps.Marker({
          position: landmark.position,
          map: googleMapRef.current,
          title: landmark.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>${landmark.name}</strong><p>${landmark.description}</p></div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });
      });
    } catch (error) {
      console.error("Error adding landmarks:", error);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // Center map on user
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(userPos);
          }

          // Create or update user marker
          updateUserMarker(userPos);

          // Generate nearby items
          generateNearbyItems(userPos);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. For demo purposes, we'll use Philadelphia's center.");
          
          // Use default location for demo
          const defaultPos = DEFAULT_LOCATION;
          setUserLocation(defaultPos);
          
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(defaultPos);
          }
          
          updateUserMarker(defaultPos);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error("Error in getUserLocation:", error);
      toast.error("There was a problem with location services.");
    }
  };

  // Update user marker on map
  const updateUserMarker = (position: Location) => {
    if (!googleMapRef.current || !window.google) return;

    try {
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(position);
      } else {
        userMarkerRef.current = new google.maps.Marker({
          position: position,
          map: googleMapRef.current,
          title: "You are here",
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          zIndex: 1000
        });
      }
    } catch (error) {
      console.error("Error updating user marker:", error);
    }
  };

  // Generate nearby items based on user location
  const generateNearbyItems = (userPos: Location) => {
    try {
      const items: NearbyItem[] = [];
      
      // Generate 5-10 cookies within 500m
      const cookieCount = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < cookieCount; i++) {
        const itemPos = generateRandomNearbyPosition(userPos, 500);
        items.push({
          id: `cookie-${Date.now()}-${i}`,
          type: 'cookie',
          position: itemPos,
          value: Math.floor(Math.random() * 3) + 1,
          collected: false
        });
      }
      
      // Generate 1-3 tickets within 800m
      const ticketCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < ticketCount; i++) {
        const itemPos = generateRandomNearbyPosition(userPos, 800);
        items.push({
          id: `ticket-${Date.now()}-${i}`,
          type: 'ticket',
          position: itemPos,
          value: 1,
          collected: false
        });
      }
      
      setNearbyItems(items);
    } catch (error) {
      console.error("Error generating nearby items:", error);
    }
  };

  // Generate a random position within a radius of the user's position
  const generateRandomNearbyPosition = (center: Location, radiusInMeters: number): Location => {
    // Convert radius from meters to degrees (approximately)
    const radiusInDegrees = radiusInMeters / 111320;
    
    // Generate random angle
    const randomAngle = Math.random() * Math.PI * 2;
    
    // Generate random radius within the given radius
    const randomRadius = Math.random() * radiusInDegrees;
    
    // Calculate new point
    const newLat = center.lat + randomRadius * Math.cos(randomAngle);
    const newLng = center.lng + randomRadius * Math.sin(randomAngle);
    
    return { lat: newLat, lng: newLng };
  };

  // Start tracking user movement
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    try {
      let stepCount = 0;
      let totalDistance = 0;
      let lastPosition: Location | null = null;

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newUserPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Update user location and marker
          setUserLocation(newUserPos);
          updateUserMarker(newUserPos);
          
          // Center map on user
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(newUserPos);
          }
          
          // Calculate distance if we have a previous position
          if (lastPosition && window.google) {
            try {
              const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(lastPosition.lat, lastPosition.lng),
                new google.maps.LatLng(newUserPos.lat, newUserPos.lng)
              );
              
              // Only update if moved more than 2 meters to filter out GPS jitter
              if (distanceInMeters > 2) {
                totalDistance += distanceInMeters;
                setDistance(Math.round(totalDistance));
                
                // Approximate step count (average step is about 0.75 meters)
                const newSteps = Math.floor(distanceInMeters / 0.75);
                stepCount += newSteps;
                setSteps(stepCount);
                
                // Update user store
                addSteps(newSteps);
                addDistance(distanceInMeters);
                
                // Check for item collection
                checkItemCollection(newUserPos);
              }
            } catch (error) {
              console.error("Error calculating distance:", error);
            }
          }
          
          lastPosition = newUserPos;
        },
        (error) => {
          console.error("Error tracking location:", error);
          toast.error("Unable to track your location. Using simulated movement for demo.");
          
          // For demo purposes, simulate movement
          simulateMovement();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      toast.success("Started tracking your movement!");
    } catch (error) {
      console.error("Error in startTracking:", error);
      toast.error("Failed to start location tracking.");
    }
  };

  // Simulate movement for demo purposes
  const simulateMovement = () => {
    let stepCount = 0;
    let totalDistance = 0;
    let currentPos = userLocation || DEFAULT_LOCATION;
    
    const interval = setInterval(() => {
      // Generate small random movement
      const newPos = {
        lat: currentPos.lat + (Math.random() - 0.5) * 0.0005,
        lng: currentPos.lng + (Math.random() - 0.5) * 0.0005
      };
      
      // Update user location and marker
      setUserLocation(newPos);
      updateUserMarker(newPos);
      
      // Center map
      if (googleMapRef.current) {
        googleMapRef.current.setCenter(newPos);
      }
      
      // Calculate simulated distance
      try {
        if (window.google) {
          const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(currentPos.lat, currentPos.lng),
            new google.maps.LatLng(newPos.lat, newPos.lng)
          );
          
          totalDistance += distanceInMeters;
          setDistance(Math.round(totalDistance));
          
          // Simulate steps
          const newSteps = Math.floor(distanceInMeters / 0.75);
          stepCount += newSteps;
          setSteps(stepCount);
          
          // Update user store
          addSteps(newSteps);
          addDistance(distanceInMeters);
          
          // Check for item collection
          checkItemCollection(newPos);
        }
      } catch (error) {
        console.error("Error in simulation:", error);
      }
      
      currentPos = newPos;
    }, 2000);
    
    // Store interval ID for cleanup
    setWatchId(interval as unknown as number);
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(watchId as unknown as NodeJS.Timeout);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.info("Stopped tracking your movement");
  };

  // Check if user is near any collectible items
  const checkItemCollection = (userPos: Location) => {
    if (!window.google) return;
    
    try {
      const updatedItems = nearbyItems.map(item => {
        if (item.collected) return item;
        
        // Calculate distance to item
        try {
          const distanceToItem = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userPos.lat, userPos.lng),
            new google.maps.LatLng(item.position.lat, item.position.lng)
          );
          
          // If within 20 meters, collect the item
          if (distanceToItem <= 20) {
            // Play success sound
            playSuccess();
            
            // Show notification
            if (item.type === 'cookie') {
              toast.success(`You found ${item.value} cookie${item.value > 1 ? 's' : ''}!`);
            } else {
              toast.success("You found a golden ticket!");
            }
            
            // Update user store
            collectItem(item.type, item.value);
            
            // Mark as collected
            return { ...item, collected: true };
          }
        } catch (error) {
          console.error("Error calculating item distance:", error);
        }
        
        return item;
      });
      
      setNearbyItems(updatedItems);
    } catch (error) {
      console.error("Error checking item collection:", error);
    }
  };

  // Center map on user location
  const centerOnUser = () => {
    if (googleMapRef.current && userLocation) {
      googleMapRef.current.setCenter(userLocation);
      googleMapRef.current.setZoom(16);
    } else {
      getUserLocation();
    }
  };

  // Refresh items around the user
  const refreshItems = () => {
    if (userLocation) {
      // Remove collected items
      const filtered = nearbyItems.filter(item => !item.collected);
      
      // Only refresh if more than half of the items are collected
      if (filtered.length < nearbyItems.length / 2) {
        generateNearbyItems(userLocation);
        toast.info("New items have appeared nearby!");
      } else {
        toast.info("Collect more items before refreshing!");
      }
    }
  };

  // Log user steps to the server for analytics
  useEffect(() => {
    if (steps > 0 && steps % 100 === 0) {
      // Log steps to the server every 100 steps
      apiRequest('POST', '/api/steps', { steps, distance })
        .catch(err => console.error('Failed to log steps:', err));
    }
  }, [steps]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Container */}
      <div ref={mapRef} className="flex-1 w-full h-full">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Game Items Layer - Only render when map and user location are available */}
      {mapLoaded && userLocation && (
        <GameItems items={nearbyItems} userLocation={userLocation} />
      )}
      
      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={centerOnUser} 
          className="bg-white shadow-md"
        >
          <Target size={20} />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={refreshItems} 
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
      {mapLoaded && !isTracking && (
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

export default Map;
