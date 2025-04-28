import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  totalSteps: integer("total_steps").default(0).notNull(),
  totalDistance: integer("total_distance").default(0).notNull(), // in meters
  cookies: integer("cookies").default(0).notNull(),
  tickets: integer("tickets").default(0).notNull(),
  totalCookies: integer("total_cookies").default(0).notNull(),
  totalTickets: integer("total_tickets").default(0).notNull(),
});

// Collectible items
export const collectibles = pgTable("collectibles", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull(),
  type: text("type").notNull(), // 'cookie' or 'ticket'
  position_lat: text("position_lat").notNull(),
  position_lng: text("position_lng").notNull(),
  value: integer("value").default(1).notNull(),
  collected: boolean("collected").default(false).notNull(),
  userId: integer("user_id"), // null means not yet collected by anyone
});

// User activity log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  actionType: text("action_type").notNull(), // 'steps', 'collect', 'redeem'
  value: integer("value").default(0),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
});

// Schemas for data validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const collectibleSchema = createInsertSchema(collectibles);
export const activityLogSchema = createInsertSchema(activityLogs);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Collectible = typeof collectibles.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
