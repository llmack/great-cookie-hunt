import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET user profile
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // POST update user username
  app.post("/api/user/username", async (req: Request, res: Response) => {
    try {
      const { username, userId } = req.body;
      
      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Invalid username" });
      }
      
      // For demo purposes, just return success
      // In a real app, we would create/update the user in the database
      res.json({ success: true, username });
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  // POST log user steps
  app.post("/api/steps", async (req: Request, res: Response) => {
    try {
      const { steps, distance, userId } = req.body;
      
      // Validate input
      if (typeof steps !== "number" || steps < 0) {
        return res.status(400).json({ message: "Invalid step count" });
      }
      
      // For demo purposes, just log and return success
      console.log(`User ${userId || 'anonymous'} walked ${steps} steps (${distance} meters)`);
      
      res.json({ success: true, steps, distance });
    } catch (error) {
      console.error("Error logging steps:", error);
      res.status(500).json({ message: "Failed to log steps" });
    }
  });

  // GET nearby collectible items
  app.get("/api/items/nearby", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      // Get nearby items (in a real app, we'd query from the database)
      // For demo purposes, we'll generate random items
      const cookies = generateRandomItems(lat, lng, 'cookie', 5);
      const tickets = generateRandomItems(lat, lng, 'ticket', 2);
      
      res.json({ items: [...cookies, ...tickets] });
    } catch (error) {
      console.error("Error fetching nearby items:", error);
      res.status(500).json({ message: "Failed to fetch nearby items" });
    }
  });

  // POST collect an item
  app.post("/api/items/collect", async (req: Request, res: Response) => {
    try {
      const { itemId, userId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // For demo purposes, just return success
      // In a real app, we would mark the item as collected in the database
      res.json({ success: true, itemId });
    } catch (error) {
      console.error("Error collecting item:", error);
      res.status(500).json({ message: "Failed to collect item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate random items
function generateRandomItems(lat: number, lng: number, type: 'cookie' | 'ticket', count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    // Generate a random offset (max 500 meters ~ 0.005 degrees)
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    
    items.push({
      id: `${type}-${Date.now()}-${i}`,
      type,
      position: {
        lat: lat + latOffset,
        lng: lng + lngOffset
      },
      value: type === 'cookie' ? Math.floor(Math.random() * 3) + 1 : 1,
      collected: false
    });
  }
  return items;
}
