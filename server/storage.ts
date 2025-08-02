import { 
  users, 
  audioSessions, 
  downloads,
  subscriptionPlans,
  type User, 
  type InsertUser, 
  type AudioSession, 
  type InsertAudioSession,
  type Download,
  type InsertDownload,
  type SubscriptionPlan,
  type InsertSubscriptionPlan
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMembership(userId: number, tier: string, paypalSubscriptionId?: string): Promise<User>;
  resetUserDownloads(userId: number): Promise<User>;
  createAudioSession(session: InsertAudioSession): Promise<AudioSession>;
  getUserAudioSessions(userId: number): Promise<AudioSession[]>;
  getAudioSession(id: number): Promise<AudioSession | undefined>;
  createDownload(download: InsertDownload): Promise<Download>;
  getUserDownloadsThisMonth(userId: number): Promise<number>;
  canUserDownload(userId: number): Promise<{ canDownload: boolean; reason?: string }>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  // Trial system methods
  startTrial(userId: number, trialTier: string): Promise<User>;
  getUserEffectiveTier(userId: number): Promise<{ tier: string; isOnTrial: boolean; canDownload: boolean }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private audioSessions: Map<number, AudioSession>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.audioSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    
    // Create a default test user for demo purposes
    this.createTestUser();
  }

  private createTestUser(): void {
    const testUser: User = {
      id: 1,
      username: "demo_user",
      password: "demo_password",
      membershipTier: "free",
      downloadsUsed: 0,
      downloadsResetDate: new Date(),
      paypalSubscriptionId: null,
      createdAt: new Date(),
      trialTier: null,
      trialStartDate: null,
      trialEndDate: null,
      hasUsedTrial: false
    };
    this.users.set(1, testUser);
    this.currentUserId = 2; // Next user will get ID 2
    console.log("Test user created with ID:", testUser.id, "Tier:", testUser.membershipTier);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      membershipTier: "free",
      downloadsUsed: 0,
      downloadsResetDate: new Date(),
      paypalSubscriptionId: null,
      createdAt: new Date(),
      trialTier: null,
      trialStartDate: null,
      trialEndDate: null,
      hasUsedTrial: false
    };
    this.users.set(id, user);
    return user;
  }

  async createAudioSession(insertSession: InsertAudioSession): Promise<AudioSession> {
    const id = this.currentSessionId++;
    const session: AudioSession = {
      id,
      userId: insertSession.userId ?? null,
      affirmations: insertSession.affirmations,
      frequency: insertSession.frequency,
      preset: insertSession.preset ?? null,
      volume: insertSession.volume ?? null,
      duration: insertSession.duration ?? null,
      voice: insertSession.voice ?? null,
      createdAt: new Date(),
    };
    this.audioSessions.set(id, session);
    return session;
  }

  async getUserAudioSessions(userId: number): Promise<AudioSession[]> {
    return Array.from(this.audioSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async getAudioSession(id: number): Promise<AudioSession | undefined> {
    return this.audioSessions.get(id);
  }

  async updateUserMembership(userId: number, tier: string, paypalSubscriptionId?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      membershipTier: tier,
      paypalSubscriptionId: paypalSubscriptionId || null,
      downloadsUsed: 0,
      downloadsResetDate: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async resetUserDownloads(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      downloadsUsed: 0,
      downloadsResetDate: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentSessionId++;
    const download: Download = {
      ...insertDownload,
      id,
      downloadedAt: new Date()
    };
    
    // Update user's download count
    const user = this.users.get(insertDownload.userId);
    if (user) {
      user.downloadsUsed = (user.downloadsUsed || 0) + 1;
      this.users.set(insertDownload.userId, user);
    }
    
    return download;
  }

  async getUserDownloadsThisMonth(userId: number): Promise<number> {
    const user = this.users.get(userId);
    return user?.downloadsUsed || 0;
  }

  async canUserDownload(userId: number): Promise<{ canDownload: boolean; reason?: string }> {
    const user = this.users.get(userId);
    if (!user) return { canDownload: false, reason: "User not found" };

    if (user.membershipTier === "free") {
      return { canDownload: false, reason: "Free users cannot download audio files. Please upgrade to Basic or Premium." };
    }

    if (user.membershipTier === "premium") {
      return { canDownload: true };
    }

    if (user.membershipTier === "basic") {
      const downloadsThisMonth = user.downloadsUsed || 0;
      if (downloadsThisMonth >= 15) {
        return { canDownload: false, reason: "You've reached your monthly download limit of 15. Upgrade to Premium for unlimited downloads." };
      }
      return { canDownload: true };
    }

    return { canDownload: false, reason: "Unknown membership tier" };
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [
      { id: 1, name: "free", price: 0, downloadsLimit: 0, features: ["Generate unlimited audio", "Preview tracks", "Save sessions"] },
      { id: 2, name: "basic", price: 9.99, downloadsLimit: 10, features: ["Everything in Free", "10 downloads per month", "Priority support"] },
      { id: 3, name: "premium", price: 19.99, downloadsLimit: null, features: ["Everything in Basic", "Unlimited downloads", "Advanced customization", "Premium support"] }
    ];
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = Date.now(); // Simple ID generation
    const plan: SubscriptionPlan = { ...insertPlan, id };
    return plan;
  }

  async startTrial(userId: number, trialTier: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.hasUsedTrial) {
      throw new Error("User has already used their free trial");
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const updatedUser: User = {
      ...user,
      trialTier,
      trialStartDate: startDate,
      trialEndDate: endDate,
      hasUsedTrial: true
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserEffectiveTier(userId: number): Promise<{ tier: string; isOnTrial: boolean; canDownload: boolean }> {
    const user = this.users.get(userId);
    if (!user) {
      return { tier: "free", isOnTrial: false, canDownload: false };
    }

    const now = new Date();
    const isTrialActive = user.trialTier && 
                         user.trialStartDate && 
                         user.trialEndDate && 
                         now >= user.trialStartDate && 
                         now <= user.trialEndDate;

    if (isTrialActive) {
      return { 
        tier: user.trialTier!, 
        isOnTrial: true, 
        canDownload: false // Trials don't allow downloads
      };
    }

    return { 
      tier: user.membershipTier || "free", 
      isOnTrial: false, 
      canDownload: user.membershipTier !== "free" 
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAudioSession(insertSession: InsertAudioSession): Promise<AudioSession> {
    const [session] = await db
      .insert(audioSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getUserAudioSessions(userId: number): Promise<AudioSession[]> {
    return await db
      .select()
      .from(audioSessions)
      .where(eq(audioSessions.userId, userId));
  }

  async getAudioSession(id: number): Promise<AudioSession | undefined> {
    const [session] = await db
      .select()
      .from(audioSessions)
      .where(eq(audioSessions.id, id));
    return session || undefined;
  }

  async updateUserMembership(userId: number, tier: string, paypalSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        membershipTier: tier,
        paypalSubscriptionId,
        downloadsUsed: 0,
        downloadsResetDate: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetUserDownloads(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        downloadsUsed: 0,
        downloadsResetDate: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const [download] = await db
      .insert(downloads)
      .values(insertDownload)
      .returning();
    
    // Increment user's download count
    const user = await this.getUser(insertDownload.userId!);
    if (user) {
      await db
        .update(users)
        .set({ downloadsUsed: (user.downloadsUsed || 0) + 1 })
        .where(eq(users.id, insertDownload.userId!));
    }
    
    return download;
  }

  async getUserDownloadsThisMonth(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user?.downloadsResetDate) return 0;

    const startOfMonth = new Date(user.downloadsResetDate);
    startOfMonth.setDate(1);
    
    const result = await db
      .select({ count: count() })
      .from(downloads)
      .where(
        and(
          eq(downloads.userId, userId),
          gte(downloads.downloadedAt, startOfMonth)
        )
      );
    
    return result[0]?.count || 0;
  }

  async canUserDownload(userId: number): Promise<{ canDownload: boolean; reason?: string }> {
    const user = await this.getUser(userId);
    if (!user) return { canDownload: false, reason: "User not found" };

    if (user.membershipTier === "free") {
      return { canDownload: false, reason: "Free users cannot download audio files. Please upgrade to Basic or Premium." };
    }

    if (user.membershipTier === "premium") {
      return { canDownload: true };
    }

    if (user.membershipTier === "basic") {
      const downloadsThisMonth = await this.getUserDownloadsThisMonth(userId);
      if (downloadsThisMonth >= 15) {
        return { canDownload: false, reason: "You've reached your monthly download limit of 15. Upgrade to Premium for unlimited downloads." };
      }
      return { canDownload: true };
    }

    return { canDownload: false, reason: "Unknown membership tier" };
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async startTrial(userId: number, trialTier: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.hasUsedTrial) {
      throw new Error("User has already used their free trial");
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const [updatedUser] = await db
      .update(users)
      .set({
        trialTier,
        trialStartDate: startDate,
        trialEndDate: endDate,
        hasUsedTrial: true
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getUserEffectiveTier(userId: number): Promise<{ tier: string; isOnTrial: boolean; canDownload: boolean }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { tier: "free", isOnTrial: false, canDownload: false };
    }

    const now = new Date();
    const isTrialActive = user.trialTier && 
                         user.trialStartDate && 
                         user.trialEndDate && 
                         now >= user.trialStartDate && 
                         now <= user.trialEndDate;

    if (isTrialActive) {
      return { 
        tier: user.trialTier!, 
        isOnTrial: true, 
        canDownload: false // Trials don't allow downloads
      };
    }

    return { 
      tier: user.membershipTier || "free", 
      isOnTrial: false, 
      canDownload: user.membershipTier !== "free" 
    };
  }
}

export const storage = new MemStorage();
