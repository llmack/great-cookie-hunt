// Type definitions for Google Maps API
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      setOptions(options: MapOptions): void;
      panTo(latlng: LatLng | LatLngLiteral): void;
      panBy(x: number, y: number): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      maxZoom?: number;
      minZoom?: number;
      disableDefaultUI?: boolean;
      styles?: any[];
      mapTypeControl?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
      toString(): string;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng | LatLngLiteral): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
      zIndex?: number;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
      close(): void;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
    }

    interface MapsEventListener {
      remove(): void;
    }

    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(from: LatLng | LatLngLiteral, to: LatLng | LatLngLiteral): number;
      }
    }
  }
}

export {};