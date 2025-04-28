import { users, collectibles, activityLogs } from "@shared/schema";
import type { User, InsertUser, Collectible, ActivityLog } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSteps(userId: number, steps: number, distance: number): Promise<User | undefined>;
  updateUserInventory(userId: number, cookieCount: number, ticketCount: number): Promise<User | undefined>;
  
  // Collectible operations
  getNearbyCollectibles(lat: number, lng: number, radius: number): Promise<Collectible[]>;
  markCollectibleAsCollected(id: number, userId: number): Promise<Collectible | undefined>;
  createCollectible(collectible: Omit<Collectible, 'id'>): Promise<Collectible>;
  
  // Activity log operations
  logActivity(userId: number, actionType: string, value: number, details?: string): Promise<ActivityLog>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collectibles: Map<number, Collectible>;
  private activityLogs: Map<number, ActivityLog>;
  private userIdCounter: number;
  private collectibleIdCounter: number;
  private activityLogIdCounter: number;

  constructor() {
    this.users = new Map();
    this.collectibles = new Map();
    this.activityLogs = new Map();
    this.userIdCounter = 1;
    this.collectibleIdCounter = 1;
    this.activityLogIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      totalSteps: 0,
      totalDistance: 0,
      cookies: 0,
      tickets: 0,
      totalCookies: 0,
      totalTickets: 0,
      role: 'user'
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSteps(userId: number, steps: number, distance: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      totalSteps: user.totalSteps + steps,
      totalDistance: user.totalDistance + distance
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserInventory(userId: number, cookieCount: number, ticketCount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      cookies: user.cookies + cookieCount,
      tickets: user.tickets + ticketCount,
      totalCookies: user.totalCookies + cookieCount,
      totalTickets: user.totalTickets + ticketCount
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Collectible operations
  async getNearbyCollectibles(lat: number, lng: number, radius: number): Promise<Collectible[]> {
    // Simple implementation that returns all uncollected items
    // In a real app, we would filter by distance
    return Array.from(this.collectibles.values()).filter(
      (collectible) => !collectible.collected
    );
  }

  async markCollectibleAsCollected(id: number, userId: number): Promise<Collectible | undefined> {
    const collectible = this.collectibles.get(id);
    if (!collectible) return undefined;
    
    const updatedCollectible = {
      ...collectible,
      collected: true,
      userId
    };
    
    this.collectibles.set(id, updatedCollectible);
    return updatedCollectible;
  }

  async createCollectible(collectible: Omit<Collectible, 'id'>): Promise<Collectible> {
    const id = this.collectibleIdCounter++;
    const newCollectible = { ...collectible, id };
    this.collectibles.set(id, newCollectible);
    return newCollectible;
  }

  // Activity log operations
  async logActivity(userId: number, actionType: string, value: number, details?: string): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const timestamp = new Date().toISOString();
    
    const activityLog: ActivityLog = {
      id,
      userId,
      actionType,
      value,
      details: details || '',
      timestamp
    };
    
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
}

// Database storage implementation
import { db } from "./db";
import { eq, and, lt, gt } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        totalSteps: 0,
        totalDistance: 0,
        cookies: 0,
        tickets: 0,
        totalCookies: 0,
        totalTickets: 0,
        role: 'user'
      })
      .returning();
    return user;
  }

  async updateUserSteps(userId: number, steps: number, distance: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        totalSteps: user.totalSteps + steps,
        totalDistance: user.totalDistance + distance
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async updateUserInventory(userId: number, cookieCount: number, ticketCount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        cookies: user.cookies + cookieCount,
        tickets: user.tickets + ticketCount,
        totalCookies: user.totalCookies + cookieCount,
        totalTickets: user.totalTickets + ticketCount
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Collectible operations
  async getNearbyCollectibles(lat: number, lng: number, radius: number): Promise<Collectible[]> {
    // This is a simplified implementation
    // For a real app, you would use PostGIS or similar to do proper geo queries
    const latNum = parseFloat(lat.toString());
    const lngNum = parseFloat(lng.toString());
    
    const latRange = 0.01 * radius / 1000; // crude approximation: 0.01 degrees ~= 1.1km at equator
    const lngRange = 0.01 * radius / 1000;
    
    // Get all collectibles that haven't been collected yet
    const allCollectibles = await db
      .select()
      .from(collectibles)
      .where(eq(collectibles.collected, false));
    
    // Filter them by distance (doing the numeric comparison in JS)
    const nearbyCollectibles = allCollectibles.filter(item => {
      const itemLat = parseFloat(item.position_lat);
      const itemLng = parseFloat(item.position_lng);
      
      return (
        itemLat > latNum - latRange &&
        itemLat < latNum + latRange &&
        itemLng > lngNum - latRange &&
        itemLng < lngNum + latRange
      );
    });
    
    return nearbyCollectibles;
  }

  async markCollectibleAsCollected(id: number, userId: number): Promise<Collectible | undefined> {
    const [updatedCollectible] = await db
      .update(collectibles)
      .set({
        collected: true,
        userId: userId
      })
      .where(eq(collectibles.id, id))
      .returning();
      
    return updatedCollectible;
  }

  async createCollectible(collectible: Omit<Collectible, 'id'>): Promise<Collectible> {
    const [newCollectible] = await db
      .insert(collectibles)
      .values(collectible)
      .returning();
      
    return newCollectible;
  }

  // Activity log operations
  async logActivity(userId: number, actionType: string, value: number, details?: string): Promise<ActivityLog> {
    const timestamp = new Date().toISOString();
    
    const [activityLog] = await db
      .insert(activityLogs)
      .values({
        userId,
        actionType,
        value,
        details: details || '',
        timestamp
      })
      .returning();
      
    return activityLog;
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
