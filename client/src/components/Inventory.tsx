import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Inventory = () => {
  const { cookies, tickets, totalCookies, totalTickets } = useUserStore();

  // Show redemption info when user clicks on redemption button
  const handleRedemption = () => {
    if (tickets < 1) {
      toast.error("You need at least 1 golden ticket to redeem cookies");
      return;
    }
    
    toast.success(
      <div className="space-y-2">
        <p className="font-bold">Ready to redeem your cookies!</p>
        <p>Visit any participating bakery and show this screen to claim your reward.</p>
        <p className="font-medium">Available rewards:</p>
        <ul className="list-disc list-inside">
          <li>1 ticket = 1 free cookie</li>
          <li>3 tickets = 1 cookie gift box</li>
          <li>5 tickets = Special bakery tour</li>
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-5xl mb-2">🍪</span>
              <p className="text-sm text-muted-foreground">Cookies</p>
              <p className="text-2xl font-bold">{cookies}</p>
              <p className="text-xs text-muted-foreground">Total collected: {totalCookies}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-5xl mb-2">🎫</span>
              <p className="text-sm text-muted-foreground">Golden Tickets</p>
              <p className="text-2xl font-bold">{tickets}</p>
              <p className="text-xs text-muted-foreground">Total collected: {totalTickets}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-3">
            <p className="text-sm">
              Golden tickets can be redeemed for real cookies at participating bakeries in Philadelphia!
            </p>
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={handleRedemption}
              disabled={tickets < 1}
            >
              Redeem Rewards
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Participating Bakeries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-white border rounded-md">
              <h3 className="font-bold">Liberty Bell Bakery</h3>
              <p className="text-sm text-muted-foreground">123 Market St, Philadelphia</p>
              <p className="text-xs mt-1">Famous for their Liberty Bell shaped cookies</p>
            </div>
            
            <div className="p-3 bg-white border rounded-md">
              <h3 className="font-bold">Independence Sweets</h3>
              <p className="text-sm text-muted-foreground">456 Chestnut St, Philadelphia</p>
              <p className="text-xs mt-1">Specializing in traditional Philadelphia butter cookies</p>
            </div>
            
            <div className="p-3 bg-white border rounded-md">
              <h3 className="font-bold">Franklin's Treats</h3>
              <p className="text-sm text-muted-foreground">789 Arch St, Philadelphia</p>
              <p className="text-xs mt-1">Home of the famous Philly cheesecake cookie</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
