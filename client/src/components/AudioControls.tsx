import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';

function AudioControls() {
  // Use our audio store to manage audio state
  const { toggleMute, isMuted } = useAudio();
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={toggleMute}
        className="bg-white shadow-md"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>
    </div>
  );
}

export default AudioControls;