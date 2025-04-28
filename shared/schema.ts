import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  role: text("role").default("user").notNull(), // 'user', 'admin', 'partner'
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
  challengeId: integer("challenge_id"), // null for regular collectibles
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

// Special challenges created by partners/admins
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdById: integer("created_by_id").notNull(), // admin/partner who created it
  rewardType: text("reward_type").notNull(), // 'cookie', 'ticket', 'special'
  rewardValue: integer("reward_value").default(1).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  targetSteps: integer("target_steps"), // null if not a step-based challenge
  targetItems: integer("target_items"), // null if not an item collection challenge
  partnerName: text("partner_name"), // store/partner associated with this challenge
  partnerLogo: text("partner_logo"), // URL to logo
});

// User challenge participation
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  progress: integer("progress").default(0).notNull(), // tracks steps or items collected
  completed: boolean("completed").default(false).notNull(),
  rewardClaimed: boolean("reward_claimed").default(false).notNull(),
  joinedAt: timestamp("joined_at").notNull(),
  completedAt: timestamp("completed_at"),
});

// Partner stores or redemption locations
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  userId: integer("user_id"), // associated partner account
});

// Schemas for data validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const collectibleSchema = createInsertSchema(collectibles);
export const activityLogSchema = createInsertSchema(activityLogs);
export const challengeSchema = createInsertSchema(challenges);
export const userChallengeSchema = createInsertSchema(userChallenges);
export const partnerSchema = createInsertSchema(partners);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Collectible = typeof collectibles.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type Partner = typeof partners.$inferSelect;
