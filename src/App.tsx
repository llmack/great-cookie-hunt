import { useState, useEffect, useRef } from 'react';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Howl } from 'howler';
import { 
  createCookieCollectSound, 
  createTicketCollectSound,
  createStartTrackingSound,
  createStopTrackingSound
} from './utils/SoundGenerator';

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Cookie and ticket icons (define these however you want)
const cookieIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/541/541732.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const ticketIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/4474/4474723.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Types
interface Item {
  id: string;
  type: 'cookie' | 'ticket';
  position: [number, number];
  value: number;
  collected: boolean;
}

interface PlayerStats {
  steps: number;
  distance: number; // in meters
  cookies: number;
  tickets: number;
}

// Location tracking component
function LocationMarker({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  
  const map = useMapEvents({
    locationfound(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
      onLocationChange(lat, lng);
    }
  });
  
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true, watch: true });
    
    return () => {
      map.stopLocate();
    };
  }, [map]);
  
  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

function App() {
  const [tracking, setTracking] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<PlayerStats>({
    steps: 0,
    distance: 0,
    cookies: 0,
    tickets: 0
  });
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  
  // Sound effects with our custom music
  const sounds = {
    background: new Howl({
      src: ['/sounds/coming-of-age-chiptune-retro-80s-nintendo-pcm-fm-instrumental-151693.mp3'],
      loop: true,
      volume: 0.4,
      autoplay: false,
      mute: audioMuted,
      html5: true, // Better for longer sounds
      preload: true
    }),
    backgroundAlt: new Howl({
      src: ['/sounds/un-jeu-dx27enfant-284529.mp3'],
      loop: true,
      volume: 0.4,
      autoplay: false,
      mute: audioMuted,
      html5: true,
      preload: true
    }),
    collectCookie: new Howl({
      src: ['/sounds/cookie_collect.mp3'],
      volume: 0.6,
      mute: audioMuted,
      preload: true
    }),
    collectTicket: new Howl({
      src: ['/sounds/ticket_collect.mp3'],
      volume: 0.7,
      mute: audioMuted,
      preload: true
    }),
    startTracking: new Howl({
      src: ['/sounds/start_tracking.mp3'],
      volume: 0.5,
      mute: audioMuted,
      preload: true
    }),
    stopTracking: new Howl({
      src: ['/sounds/stop_tracking.mp3'],
      volume: 0.5,
      mute: audioMuted,
      preload: true
    })
  };
  
  // Calculate distance between two points (in meters)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  };
  
  // Generate random nearby items
  const generateNearbyItems = (lat: number, lng: number) => {
    const newItems: Item[] = [];
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 items
    
    for (let i = 0; i < count; i++) {
      // Random position within ~100 meters
      const randomLat = lat + (Math.random() - 0.5) * 0.002;
      const randomLng = lng + (Math.random() - 0.5) * 0.002;
      
      const isCookie = Math.random() > 0.2; // 80% chance of cookie, 20% chance of ticket
      
      newItems.push({
        id: Date.now().toString() + i,
        type: isCookie ? 'cookie' : 'ticket',
        position: [randomLat, randomLng],
        value: isCookie ? Math.floor(Math.random() * 3) + 1 : 1,
        collected: false
      });
    }
    
    setItems(prevItems => [...prevItems, ...newItems]);
  };
  
  // Handle location updates
  const handleLocationChange = (lat: number, lng: number) => {
    const newLocation: [number, number] = [lat, lng];
    
    // First location update
    if (!userLocation) {
      setUserLocation(newLocation);
      generateNearbyItems(lat, lng);
      return;
    }
    
    // Calculate distance from last position
    const distanceMoved = calculateDistance(
      userLocation[0], userLocation[1], 
      newLocation[0], newLocation[1]
    );
    
    // Only update if moved more than 5 meters
    if (distanceMoved > 5) {
      // Roughly estimate steps (average step = 0.75m)
      const estimatedSteps = Math.floor(distanceMoved / 0.75);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        steps: prev.steps + estimatedSteps,
        distance: prev.distance + distanceMoved
      }));
      
      // Check if we should generate new items (every ~50 meters)
      if (Math.random() < distanceMoved / 100) {
        generateNearbyItems(lat, lng);
      }
      
      // Check if user collected any items
      checkItemCollection(newLocation);
      
      // Update user location
      setUserLocation(newLocation);
    }
  };
  
  // Check if user has collected any items
  const checkItemCollection = (userPos: [number, number]) => {
    const collectionRadius = 15; // meters
    
    const updatedItems = items.map(item => {
      if (item.collected) return item;
      
      const distance = calculateDistance(
        userPos[0], userPos[1],
        item.position[0], item.position[1]
      );
      
      if (distance <= collectionRadius) {
        // Collect item!
        if (item.type === 'cookie') {
          sounds.collectCookie.play();
          setStats(prev => ({
            ...prev,
            cookies: prev.cookies + item.value
          }));
        } else {
          sounds.collectTicket.play();
          setStats(prev => ({
            ...prev,
            tickets: prev.tickets + item.value
          }));
        }
        
        return { ...item, collected: true };
      }
      
      return item;
    });
    
    setItems(updatedItems);
  };
  
  // Toggle tracking
  const toggleTracking = () => {
    if (!tracking) {
      // Start tracking
      setTracking(true);
      if (!audioMuted) {
        sounds.background.play();
      }
    } else {
      // Stop tracking
      setTracking(false);
      sounds.background.stop();
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    const newMutedState = !audioMuted;
    setAudioMuted(newMutedState);
    
    // Update all sounds
    Object.values(sounds).forEach(sound => {
      sound.mute(newMutedState);
    });
  };
  
  // Default position (Philadelphia City Hall)
  const defaultPosition: [number, number] = [39.9526, -75.1652];

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer 
          center={userLocation || defaultPosition} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Location tracking */}
          {tracking && <LocationMarker onLocationChange={handleLocationChange} />}
          
          {/* Display items */}
          {items.map(item => !item.collected && (
            <Marker 
              key={item.id}
              position={item.position}
              icon={item.type === 'cookie' ? cookieIcon : ticketIcon}
            >
              <Popup>
                {item.type === 'cookie' 
                  ? `Cookie (${item.value})` 
                  : `Golden Ticket (${item.value})`}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Audio controls */}
        <button 
          className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
          onClick={toggleAudio}
        >
          {audioMuted ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* Stats and controls */}
      <div className="bg-white p-4 shadow-md">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-700">Steps: {stats.steps}</p>
            <p className="text-gray-700">Distance: {stats.distance.toFixed(0)}m</p>
          </div>
          <div>
            <p className="text-amber-600 font-bold">🍪 Cookies: {stats.cookies}</p>
            <p className="text-yellow-500 font-bold">🎫 Tickets: {stats.tickets}</p>
          </div>
        </div>
        
        <button
          className={`w-full py-3 rounded-lg font-bold ${
            tracking 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}
          onClick={toggleTracking}
        >
          {tracking ? 'STOP TRACKING' : 'START TRACKING'}
        </button>
      </div>
    </div>
  );
}

export default App;