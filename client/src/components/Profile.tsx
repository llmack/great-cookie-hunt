import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/useUserStore';
import { apiRequest } from '@/lib/queryClient';

const Profile = () => {
  const { username, totalSteps, totalDistance, totalCookies, totalTickets, saveUsername } = useUserStore();
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState(username || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // Save to API
      await apiRequest('POST', '/api/user/username', { username: newUsername });
      
      // Update local state
      saveUsername(newUsername);
      setEditMode(false);
      toast.success('Username saved successfully!');
    } catch (error) {
      console.error('Failed to save username:', error);
      toast.error('Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="text-xl font-bold">{username || 'Anonymous Cookie Hunter'}</p>
                </div>
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Steps</p>
              <p className="text-2xl font-bold">{totalSteps.toLocaleString()}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Distance Traveled</p>
              <p className="text-2xl font-bold">{(totalDistance / 1000).toFixed(2)} km</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Cookies</p>
              <p className="text-2xl font-bold">{totalCookies}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Golden Tickets</p>
              <p className="text-2xl font-bold">{totalTickets}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About GreatCookieHunt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Walk around Philadelphia to find virtual cookies and golden tickets. Redeem them for real treats at participating bakeries!
          </p>
          <p className="text-sm font-medium">
            Created by the Cookie Hunters Team
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;