import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { challenges, partners } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Middleware to check if user is admin or partner
const isAdminOrPartner = async (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this would check the authenticated user's role
  // For now, we'll stub this out for testing
  if (req.query.role === 'admin' || req.query.role === 'partner') {
    next();
  } else {
    res.status(403).json({ message: "Unauthorized. Only admins and partners can access this endpoint." });
  }
};

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

  // CHALLENGE ENDPOINTS - For cookie admins/partners

  // GET all challenges
  app.get("/api/challenges", async (req: Request, res: Response) => {
    try {
      // Get active challenges from the database
      const allChallenges = await db.select().from(challenges);
      
      // Filter to only show active challenges if requested
      const activeOnly = req.query.activeOnly === 'true';
      const filteredChallenges = activeOnly
        ? allChallenges.filter(c => c.isActive)
        : allChallenges;
        
      res.json({ challenges: filteredChallenges });
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });
  
  // POST create a new challenge (admin/partner only)
  app.post("/api/challenges", isAdminOrPartner, async (req: Request, res: Response) => {
    try {
      const { 
        title, description, rewardType, rewardValue, startDate, endDate,
        targetSteps, targetItems, partnerName, partnerLogo 
      } = req.body;
      
      // Basic validation
      if (!title || !description || !rewardType || !startDate || !endDate) {
        return res.status(400).json({ 
          message: "Missing required fields" 
        });
      }
      
      // Insert new challenge into the database
      const [newChallenge] = await db.insert(challenges).values({
        title,
        description,
        createdById: 1, // Demo user ID (would be the authenticated user in a real app)
        rewardType,
        rewardValue: rewardValue || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        targetSteps: targetSteps || null,
        targetItems: targetItems || null,
        partnerName: partnerName || null,
        partnerLogo: partnerLogo || null
      }).returning();
      
      res.status(201).json({ success: true, challenge: newChallenge });
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });
  
  // GET challenge by ID
  app.get("/api/challenges/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json({ challenge });
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });
  
  // PUT update a challenge (admin/partner only)
  app.put("/api/challenges/:id", isAdminOrPartner, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      const { 
        title, description, rewardType, rewardValue, startDate, endDate,
        targetSteps, targetItems, partnerName, partnerLogo, isActive 
      } = req.body;
      
      // Update the challenge
      const [updatedChallenge] = await db.update(challenges)
        .set({
          ...(title && { title }),
          ...(description && { description }),
          ...(rewardType && { rewardType }),
          ...(rewardValue && { rewardValue }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(isActive !== undefined && { isActive }),
          ...(targetSteps !== undefined && { targetSteps }),
          ...(targetItems !== undefined && { targetItems }),
          ...(partnerName !== undefined && { partnerName }),
          ...(partnerLogo !== undefined && { partnerLogo })
        })
        .where(eq(challenges.id, id))
        .returning();
      
      if (!updatedChallenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json({ success: true, challenge: updatedChallenge });
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ message: "Failed to update challenge" });
    }
  });
  
  // DELETE a challenge (admin only)
  app.delete("/api/challenges/:id", isAdminOrPartner, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      
      // Only true admins should be able to delete challenges
      if (req.query.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete challenges" });
      }
      
      await db.delete(challenges).where(eq(challenges.id, id));
      
      res.json({ success: true, message: "Challenge deleted" });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      res.status(500).json({ message: "Failed to delete challenge" });
    }
  });
  
  // PARTNER ENDPOINTS
  
  // GET all partner stores
  app.get("/api/partners", async (req: Request, res: Response) => {
    try {
      const allPartners = await db.select().from(partners);
      res.json({ partners: allPartners });
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });
  
  // POST create a new partner (admin only)
  app.post("/api/partners", isAdminOrPartner, async (req: Request, res: Response) => {
    try {
      // Only true admins should be able to create partners
      if (req.query.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create new partners" });
      }
      
      const { name, address, lat, lng, description, logo, website, userId } = req.body;
      
      // Basic validation
      if (!name || !address || !lat || !lng) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Insert new partner into the database
      const [newPartner] = await db.insert(partners).values({
        name,
        address,
        lat: lat.toString(),
        lng: lng.toString(),
        description: description || null,
        logo: logo || null,
        website: website || null,
        userId: userId || null
      }).returning();
      
      res.status(201).json({ success: true, partner: newPartner });
    } catch (error) {
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Failed to create partner" });
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
