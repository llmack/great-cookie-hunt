import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import { useUserStore } from "./lib/stores/useUserStore";
import { useAudio } from "./lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import SimpleMap from "./components/SimpleMap"; // Using the simplified map without Google Maps
import Profile from "./components/Profile";
import Inventory from "./components/Inventory";
import Achievements from "./components/Achievements";
import { BottomNavigation } from "./components/ui/bottom-navigation";
import "@fontsource/inter";

function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [isLoading, setIsLoading] = useState(true);
  const { initializeUser } = useUserStore();
  const { isMuted, toggleMute, setBackgroundMusic } = useAudio();
  
  // Initialize user and audio
  useEffect(() => {
    try {
      // Initialize user data
      initializeUser();
      
      // Initialize background music - with error handling
      try {
        const bgMusic = new Audio('/sounds/background.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        setBackgroundMusic(bgMusic);
      } catch (error) {
        console.error("Failed to initialize background music:", error);
      }
      
      // Create hit sound - with error handling
      try {
        const hitSound = new Audio('/sounds/hit.mp3');
        useAudio.getState().setHitSound(hitSound);
      } catch (error) {
        console.error("Failed to initialize hit sound:", error);
      }
      
      // Create success sound - with error handling
      try {
        const successSound = new Audio('/sounds/success.mp3');
        useAudio.getState().setSuccessSound(successSound);
      } catch (error) {
        console.error("Failed to initialize success sound:", error);
      }
    } catch (error) {
      console.error("Error during initialization:", error);
    } finally {
      // Always set loading to false, even if there were errors
      setIsLoading(false);
    }
  }, []);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#003DA5]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">GreatCookieHunt</h1>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-[#003DA5] text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">GreatCookieHunt</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMute} 
          className="text-white hover:bg-[#002D7A]"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </Button>
      </header>
      
      {/* Main content area with tabs */}
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="map" value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          {/* Render each tab content only when active to prevent initialization issues */}
          {activeTab === "map" && (
            <TabsContent value="map" className="flex-1 overflow-hidden">
              <SimpleMap />
            </TabsContent>
          )}
          {activeTab === "inventory" && (
            <TabsContent value="inventory" className="flex-1 overflow-auto p-4">
              <Inventory />
            </TabsContent>
          )}
          {activeTab === "achievements" && (
            <TabsContent value="achievements" className="flex-1 overflow-auto p-4">
              <Achievements />
            </TabsContent>
          )}
          {activeTab === "profile" && (
            <TabsContent value="profile" className="flex-1 overflow-auto p-4">
              <Profile />
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Toast notifications */}
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
