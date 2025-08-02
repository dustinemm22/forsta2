import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  membershipTier: text("membership_tier").default("free"), // 'free', 'basic', 'premium'
  downloadsUsed: integer("downloads_used").default(0),
  downloadsResetDate: timestamp("downloads_reset_date").defaultNow(),
  paypalSubscriptionId: text("paypal_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  // Trial system
  trialTier: text("trial_tier"), // "basic" or "premium"
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  hasUsedTrial: boolean("has_used_trial").default(false),
});

export const audioSessions = pgTable("audio_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  affirmations: text("affirmations").notNull(),
  frequency: real("frequency").notNull(),
  preset: text("preset"),
  volume: integer("volume").default(70),
  duration: integer("duration").default(30),
  voice: text("voice").default("female"),
  // File uploads and recording
  uploadedAudioUrl: text("uploaded_audio_url"), // For basic/premium audio uploads
  uploadedVideoUrl: text("uploaded_video_url"), // For premium video uploads
  recordedAudioUrl: text("recorded_audio_url"), // For premium audio recording
  useUploadedAudio: boolean("use_uploaded_audio").default(false),
  useUploadedVideo: boolean("use_uploaded_video").default(false),
  useRecordedAudio: boolean("use_recorded_audio").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  audioSessionId: integer("audio_session_id").references(() => audioSessions.id),
  downloadedAt: timestamp("downloaded_at").defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'free', 'basic', 'premium'
  price: real("price").notNull(), // 0, 9.99, 19.99
  downloadsLimit: integer("downloads_limit"), // null for unlimited
  features: text("features").array(), // array of feature descriptions
});

export const usersRelations = relations(users, ({ many }) => ({
  audioSessions: many(audioSessions),
  downloads: many(downloads),
}));

export const audioSessionsRelations = relations(audioSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [audioSessions.userId],
    references: [users.id],
  }),
  downloads: many(downloads),
}));

export const downloadsRelations = relations(downloads, ({ one }) => ({
  user: one(users, {
    fields: [downloads.userId],
    references: [users.id],
  }),
  audioSession: one(audioSessions, {
    fields: [downloads.audioSessionId],
    references: [audioSessions.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAudioSessionSchema = createInsertSchema(audioSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudioSession = z.infer<typeof insertAudioSessionSchema>;
export type AudioSession = typeof audioSessions.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
