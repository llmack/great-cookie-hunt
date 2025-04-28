import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/lib/stores/useUserStore';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';

const Profile = () => {
  const { username, totalSteps, totalDistance, saveUsername } = useUserStore();
  const [nameInput, setNameInput] = useState(username || '');
  const [isEditing, setIsEditing] = useState(!username);

  // Calculate achievements
  const achievementProgress = Math.min(
    (totalSteps / 10000) * 100, 
    100
  );
  
  const distanceKm = totalDistance / 1000;

  // Handle save username
  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Please enter a username");
      return;
    }
    
    try {
      await apiRequest('POST', '/api/user/username', { username: nameInput });
      saveUsername(nameInput);
      setIsEditing(false);
      toast.success("Username saved!");
    } catch (error) {
      console.error('Failed to save username:', error);
      toast.error("Failed to save username. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your username"
                    maxLength={20}
                  />
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="text-xl font-bold">{username}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Steps</p>
              <p className="text-xl font-bold">{totalSteps.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Distance</p>
              <p className="text-xl font-bold">{distanceKm.toFixed(2)} km</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-1">10,000 Steps Challenge</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${achievementProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-right mt-1">{achievementProgress.toFixed(0)}% complete</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Walk around Philadelphia collecting cookies and golden tickets to earn 
            free real cookies at participating bakeries! The more you explore, the more you earn.
          </p>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm font-medium text-amber-800">
              <span className="font-bold">How to redeem:</span> Visit any participating 
              bakery and show your golden tickets to receive free cookies!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
