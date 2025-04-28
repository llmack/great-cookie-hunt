import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserStore } from '@/lib/stores/useUserStore';

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
  
  // Define achievements based on user stats
  const achievements: Achievement[] = [
    {
      id: 'first-steps',
      name: 'First Steps',
      description: 'Take your first 100 steps in Philadelphia',
      targetValue: 100,
      currentValue: totalSteps,
      completed: totalSteps >= 100,
      icon: '👣',
      reward: '5 cookies'
    },
    {
      id: 'cookie-collector',
      name: 'Cookie Collector',
      description: 'Collect 10 cookies',
      targetValue: 10,
      currentValue: totalCookies,
      completed: totalCookies >= 10,
      icon: '🍪',
      reward: '1 golden ticket'
    },
    {
      id: 'marathon-walker',
      name: 'Marathon Walker',
      description: 'Walk 5 kilometers',
      targetValue: 5000,
      currentValue: totalDistance,
      completed: totalDistance >= 5000,
      icon: '🏃',
      reward: '10 cookies'
    },
    {
      id: 'golden-hunter',
      name: 'Golden Hunter',
      description: 'Collect 5 golden tickets',
      targetValue: 5,
      currentValue: totalTickets,
      completed: totalTickets >= 5,
      icon: '🎫',
      reward: 'Special cookie at any partner bakery'
    },
    {
      id: 'philly-explorer',
      name: 'Philly Explorer',
      description: 'Walk 10 kilometers across Philadelphia',
      targetValue: 10000,
      currentValue: totalDistance,
      completed: totalDistance >= 10000,
      icon: '🏙️',
      reward: 'Explorer badge on your profile'
    },
    {
      id: 'cookie-master',
      name: 'Cookie Master',
      description: 'Collect 50 cookies',
      targetValue: 50,
      currentValue: totalCookies,
      completed: totalCookies >= 50,
      icon: '👨‍🍳',
      reward: '3 golden tickets'
    }
  ];
  
  // Calculate completion stats
  const completedAchievements = achievements.filter(a => a.completed).length;
  const completionPercentage = Math.round((completedAchievements / achievements.length) * 100);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{completedAchievements}/{achievements.length} completed</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className={achievement.completed ? "border-green-500" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl ${achievement.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{achievement.name}</h3>
                    {achievement.completed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed!</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{Math.min(achievement.currentValue, achievement.targetValue)}/{achievement.targetValue}</span>
                    </div>
                    <Progress 
                      value={(achievement.currentValue / achievement.targetValue) * 100} 
                      className="h-1.5" 
                      indicatorClassName={achievement.completed ? "bg-green-500" : ""}
                    />
                  </div>
                  
                  <div className="mt-2 text-xs">
                    <span className="font-medium">Reward: </span>
                    <span className="text-muted-foreground">{achievement.reward}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Achievements;