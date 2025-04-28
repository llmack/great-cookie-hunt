import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  icon: string;
  reward: string;
}

const Achievements = () => {
  const { totalSteps, totalDistance, totalCookies, totalTickets } = useUserStore();
  
  // Convert to kilometers for display
  const distanceKm = totalDistance / 1000;
  
  // Define achievements
  const achievements: Achievement[] = [
    {
      id: 'steps-1000',
      name: 'First Steps',
      description: 'Walk 1,000 steps',
      targetValue: 1000,
      currentValue: totalSteps,
      completed: totalSteps >= 1000,
      icon: '👣',
      reward: '1 Golden Ticket'
    },
    {
      id: 'steps-5000',
      name: 'Step Master',
      description: 'Walk 5,000 steps',
      targetValue: 5000,
      currentValue: totalSteps,
      completed: totalSteps >= 5000,
      icon: '👣',
      reward: '2 Golden Tickets'
    },
    {
      id: 'steps-10000',
      name: 'Step Champion',
      description: 'Walk 10,000 steps',
      targetValue: 10000,
      currentValue: totalSteps,
      completed: totalSteps >= 10000,
      icon: '👟',
      reward: '3 Golden Tickets'
    },
    {
      id: 'distance-1',
      name: 'City Explorer',
      description: 'Walk 1 kilometer',
      targetValue: 1,
      currentValue: distanceKm,
      completed: distanceKm >= 1,
      icon: '🏙️',
      reward: '2 Cookies'
    },
    {
      id: 'distance-5',
      name: 'Philly Wanderer',
      description: 'Walk 5 kilometers',
      targetValue: 5,
      currentValue: distanceKm,
      completed: distanceKm >= 5,
      icon: '🏙️',
      reward: '5 Cookies'
    },
    {
      id: 'cookies-10',
      name: 'Cookie Collector',
      description: 'Collect 10 cookies',
      targetValue: 10,
      currentValue: totalCookies,
      completed: totalCookies >= 10,
      icon: '🍪',
      reward: '1 Golden Ticket'
    },
    {
      id: 'cookies-50',
      name: 'Cookie Connoisseur',
      description: 'Collect 50 cookies',
      targetValue: 50,
      currentValue: totalCookies,
      completed: totalCookies >= 50,
      icon: '🍪',
      reward: '2 Golden Tickets'
    },
    {
      id: 'tickets-5',
      name: 'Golden Hunter',
      description: 'Collect 5 golden tickets',
      targetValue: 5,
      currentValue: totalTickets,
      completed: totalTickets >= 5,
      icon: '🎫',
      reward: 'Special Bakery Tour'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete achievements to earn special rewards!
          </p>
          
          <div className="space-y-3">
            {achievements.map((achievement) => {
              const progress = Math.min(
                (achievement.currentValue / achievement.targetValue) * 100,
                100
              );
              
              return (
                <div key={achievement.id} className="p-3 bg-white border rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-1">
                          {achievement.name}
                          {achievement.completed ? 
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                            <Circle className="h-4 w-4 text-gray-300" />
                          }
                        </h3>
                        <span className="text-xs font-medium text-blue-600">
                          {achievement.reward}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <Progress 
                        value={progress} 
                        className="h-1.5 mt-2"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">
                          {achievement.currentValue} / {achievement.targetValue}
                        </span>
                        <span className="text-xs">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Landmark Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Visit these Philadelphia landmarks to earn special rewards!
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-white border rounded-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🗽</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Liberty Bell</h3>
                    <span className="text-xs font-medium text-blue-600">2 Golden Tickets</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Visit the Liberty Bell Center</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border rounded-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏛️</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Independence Hall</h3>
                    <span className="text-xs font-medium text-blue-600">3 Golden Tickets</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Visit Independence Hall</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border rounded-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏃</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Rocky Steps</h3>
                    <span className="text-xs font-medium text-blue-600">5 Cookies</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Climb the steps of the Philadelphia Museum of Art</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Achievements;
