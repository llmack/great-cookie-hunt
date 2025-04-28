import { cn } from "@/lib/utils";
import { Map, PackageOpen, Award, UserCircle } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: "map",
      label: "Map",
      icon: <Map size={20} />,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <PackageOpen size={20} />,
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: <Award size={20} />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserCircle size={20} />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around shadow-lg z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "flex flex-col items-center justify-center h-full w-full transition-colors",
            activeTab === tab.id 
              ? "text-[#003DA5]" 
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span className="text-xs mt-1">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
