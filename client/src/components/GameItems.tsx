import { useEffect, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface ItemProps {
  items: {
    id: string;
    type: 'cookie' | 'ticket';
    position: Location;
    value: number;
    collected: boolean;
  }[];
  userLocation: Location | null;
}

const GameItems = ({ items, userLocation }: ItemProps) => {
  const [visibleItems, setVisibleItems] = useState<JSX.Element[]>([]);

  // Calculate screen positions of items based on map
  useEffect(() => {
    if (!userLocation) return;

    try {
      // Get all visible uncollected items and render them on screen
      const itemElements = items
        .filter(item => !item.collected)
        .map(item => {
          try {
            // Calculate rough position on screen based on relative GPS coordinates
            // This is a simplified approach - in a real app you'd use map projection
            const relLat = item.position.lat - userLocation.lat;
            const relLng = item.position.lng - userLocation.lng;
            
            // Scale factor to convert GPS coords to screen pixels
            // Adjust these values based on your map zoom level
            const latScale = 10000;
            const lngScale = 10000;
            
            // Calculate screen position - centered on user with offset
            const screenX = 50 + (relLng * lngScale);
            const screenY = 50 - (relLat * latScale);
            
            // Only show items that would be on screen (approximately)
            if (screenX < -20 || screenX > 120 || screenY < -20 || screenY > 120) {
              return null;
            }
            
            return (
              <div 
                key={item.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 animate-bounce"
                style={{ 
                  left: `${screenX}%`, 
                  top: `${screenY}%`,
                }}
              >
                {item.type === 'cookie' ? (
                  <div className="relative">
                    <span className="text-4xl filter drop-shadow-lg">🍪</span>
                    {item.value > 1 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.value}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-4xl filter drop-shadow-lg">🎫</span>
                )}
              </div>
            );
          } catch (error) {
            console.error("Error rendering item:", error);
            return null;
          }
        })
        .filter(Boolean) as JSX.Element[];
      
      setVisibleItems(itemElements);
    } catch (error) {
      console.error("Error in GameItems render:", error);
      setVisibleItems([]);
    }
  }, [items, userLocation]);

  // If no user location, show nothing
  if (!userLocation) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {visibleItems}
    </div>
  );
};

export default GameItems;
