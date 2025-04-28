import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Music, Upload } from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Custom audio file upload interface
interface CustomSoundUpload {
  type: 'cookieCollect' | 'ticketCollect' | 'levelUp' | 'background' | 'walking';
  file: File | null;
}

export function AudioControls() {
  const {
    isMuted,
    theme,
    toggleMute,
    setTheme,
    initSounds,
    setCustomSound,
    startBackgroundMusic
  } = useAudio();

  const [selectedSound, setSelectedSound] = useState<CustomSoundUpload>({
    type: 'cookieCollect',
    file: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize sounds when component mounts
  useEffect(() => {
    initSounds();
    // Start background music with a slight delay to avoid browser autoplay restrictions
    const timer = setTimeout(() => {
      startBackgroundMusic();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initSounds, startBackgroundMusic]);

  // Handle theme change
  const handleThemeChange = (value: string) => {
    if (value === 'mario' || value === 'cookie') {
      setTheme(value);
      // Restart background music with new theme
      setTimeout(() => {
        startBackgroundMusic();
      }, 100);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedSound({
        ...selectedSound,
        file: files[0]
      });
    }
  };

  // Trigger file input click
  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload and set custom sound
  const handleUploadSound = () => {
    if (selectedSound.file) {
      const url = URL.createObjectURL(selectedSound.file);
      setCustomSound(selectedSound.type, url);
      // Reset file selection
      setSelectedSound({
        ...selectedSound,
        file: null
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
      {/* Mute/Unmute Button */}
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={toggleMute}
        className="bg-white shadow-md"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>

      {/* Theme Selection */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="icon" className="bg-white shadow-md">
            <Music size={20} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" side="left">
          <div className="space-y-4">
            <h4 className="font-medium text-center">Game Audio Settings</h4>
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="theme">Sound Theme</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cookie">Cookie Monster Style</SelectItem>
                  <SelectItem value="mario">Mario Style</SelectItem>
                  <SelectItem value="custom">Custom Sounds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <Label>Upload Custom Sound</Label>
              <Select value={selectedSound.type} onValueChange={(val: any) => setSelectedSound({...selectedSound, type: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sound type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cookieCollect">Cookie Collect Sound</SelectItem>
                  <SelectItem value="ticketCollect">Ticket Collect Sound</SelectItem>
                  <SelectItem value="levelUp">Level Up Sound</SelectItem>
                  <SelectItem value="background">Background Music</SelectItem>
                  <SelectItem value="walking">Walking Sound</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  type="file" 
                  accept="audio/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" onClick={handleChooseFile} className="flex-grow">
                  <Upload className="mr-2" size={16} />
                  Choose Audio File
                </Button>
                <Button 
                  onClick={handleUploadSound} 
                  disabled={!selectedSound.file}
                >
                  Set Sound
                </Button>
              </div>
              
              {selectedSound.file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {selectedSound.file.name}
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default AudioControls;