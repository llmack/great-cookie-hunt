import React from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAudio } from '@/lib/stores/useAudio';

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
  const { collectItem } = useUserStore();
  const { playSuccess } = useAudio();

  // This component doesn't need to render anything in the simplified version
  // The items are visually represented in the SimpleMap component

  return null;
};

export default GameItems;