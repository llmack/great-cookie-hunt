import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/useUserStore';

// Define a function to generate a description based on ticket count
const getTicketDescription = (tickets: number) => {
  if (tickets === 0) return "You haven't found any golden tickets yet. Keep exploring!";
  if (tickets === 1) return "You found 1 golden ticket! Redeem for a special cookie.";
  if (tickets < 5) return `You found ${tickets} golden tickets! Each one can be redeemed for a special cookie.`;
  return `Wow! You found ${tickets} golden tickets! You're a serious cookie hunter!`;
};

// Define a function to generate cookie images
const renderCookies = (count: number) => {
  const cookies = [];
  // Show max 20 cookies to prevent overwhelming the UI
  const displayCount = Math.min(count, 20);
  
  for (let i = 0; i < displayCount; i++) {
    cookies.push(
      <div key={i} className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
        🍪
      </div>
    );
  }
  
  if (count > 20) {
    cookies.push(
      <div key="more" className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-xs font-bold">
        +{count - 20}
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {cookies}
    </div>
  );
};

// Define a function to generate ticket images
const renderTickets = (count: number) => {
  const tickets = [];
  // Show max 10 tickets to prevent overwhelming the UI
  const displayCount = Math.min(count, 10);
  
  for (let i = 0; i < displayCount; i++) {
    tickets.push(
      <div key={i} className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
        🎫
      </div>
    );
  }
  
  if (count > 10) {
    tickets.push(
      <div key="more" className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-xs font-bold">
        +{count - 10}
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {tickets}
    </div>
  );
};

const Inventory = () => {
  const { cookies, tickets } = useUserStore();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          {cookies === 0 ? (
            <div className="text-center p-6">
              <p className="text-lg text-muted-foreground">No cookies yet</p>
              <p className="text-sm">Start walking to collect cookies!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold mb-2">You have collected {cookies} {cookies === 1 ? 'cookie' : 'cookies'}!</p>
                <p className="text-sm text-muted-foreground">
                  {cookies < 5 ? 'Keep exploring to find more cookies!' : 'Wow! You\'re quite the cookie collector!'}
                </p>
              </div>
              
              <div className="mt-4">
                {renderCookies(cookies)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Golden Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-lg font-bold mb-2">{tickets} Golden {tickets === 1 ? 'Ticket' : 'Tickets'}</p>
              <p className="text-sm text-muted-foreground">
                {getTicketDescription(tickets)}
              </p>
            </div>
            
            {tickets > 0 && (
              <div className="mt-4">
                {renderTickets(tickets)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Redeem Your Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Visit any of our partner bakeries in Philadelphia to redeem your cookies and golden tickets for delicious treats!
          </p>
          <p className="text-sm font-medium">
            Coming soon: A list of participating bakeries and special events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;