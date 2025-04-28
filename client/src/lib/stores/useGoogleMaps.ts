import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GoogleMapsState {
  isLoaded: boolean;
  map: google.maps.Map | null;
  currentCenter: google.maps.LatLngLiteral;
  zoom: number;
  
  // Actions
  setMap: (map: google.maps.Map) => void;
  setCenter: (center: google.maps.LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  panTo: (position: google.maps.LatLngLiteral) => void;
}

// Philadelphia City Hall coordinates as default center
const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 };
const DEFAULT_ZOOM = 16;

export const useGoogleMaps = create<GoogleMapsState>()(
  subscribeWithSelector((set, get) => ({
    isLoaded: false,
    map: null,
    currentCenter: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    
    setMap: (map) => {
      set({ map, isLoaded: true });
    },
    
    setCenter: (center) => {
      set({ currentCenter: center });
      const { map } = get();
      if (map) {
        map.setCenter(center);
      }
    },
    
    setZoom: (zoom) => {
      set({ zoom });
      const { map } = get();
      if (map) {
        map.setZoom(zoom);
      }
    },
    
    panTo: (position) => {
      set({ currentCenter: position });
      const { map } = get();
      if (map) {
        map.panTo(position);
      }
    }
  }))
);

// Helper to load Google Maps API
export const loadGoogleMapsApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Create callback for Google Maps to call when loaded
    const callbackName = 'googleMapsInitialized';
    window[callbackName as keyof Window] = () => {
      resolve();
      delete window[callbackName as keyof Window];
    };

    // Get API key from environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    // Create script element to load the API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    
    document.head.appendChild(script);
  });
};
