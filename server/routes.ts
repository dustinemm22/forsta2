import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAudioSessionSchema } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

export async function registerRoutes(app: Express): Promise<Server> {
  // Audio session endpoints
  // Create a user (for demo purposes)
  app.post("/api/create-demo-user", async (req, res) => {
    try {
      const user = await storage.createUser({
        username: "demo_user",
        password: "demo_password"
      });
      res.json({ message: "Demo user created", userId: user.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to create demo user" });
    }
  });

  app.post("/api/audio-sessions", async (req, res) => {
    try {
      const sessionData = insertAudioSessionSchema.parse(req.body);
      const session = await storage.createAudioSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create audio session" });
      }
    }
  });

  app.get("/api/audio-sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }
      
      const sessions = await storage.getUserAudioSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio sessions" });
    }
  });

  app.get("/api/audio-sessions/session/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      
      const session = await storage.getAudioSession(sessionId);
      if (!session) {
        res.status(404).json({ message: "Audio session not found" });
        return;
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio session" });
    }
  });

  // PayPal endpoints
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Membership endpoints
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/user/:userId/membership", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const downloadCheck = await storage.canUserDownload(userId);
      const downloadsUsed = await storage.getUserDownloadsThisMonth(userId);
      const effectiveTier = await storage.getUserEffectiveTier(userId);

      res.json({
        membershipTier: user.membershipTier,
        downloadsUsed,
        canDownload: downloadCheck.canDownload,
        reason: downloadCheck.reason,
        isOnTrial: effectiveTier.isOnTrial,
        effectiveTier: effectiveTier.tier
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership info" });
    }
  });

  app.post("/api/user/:userId/upgrade", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { tier, paypalSubscriptionId } = req.body;

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      if (!["basic", "premium"].includes(tier)) {
        res.status(400).json({ message: "Invalid membership tier" });
        return;
      }

      const updatedUser = await storage.updateUserMembership(userId, tier, paypalSubscriptionId);
      res.json({
        message: "Membership upgraded successfully",
        user: {
          id: updatedUser.id,
          membershipTier: updatedUser.membershipTier,
          downloadsUsed: updatedUser.downloadsUsed
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  });

  app.post("/api/user/:userId/download", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { audioSessionId } = req.body;

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      // Check if user can download
      const downloadCheck = await storage.canUserDownload(userId);
      if (!downloadCheck.canDownload) {
        res.status(403).json({ 
          message: "Download not allowed", 
          reason: downloadCheck.reason 
        });
        return;
      }

      // Record the download
      const download = await storage.createDownload({
        userId,
        audioSessionId
      });

      res.json({
        message: "Download recorded successfully",
        download
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to record download" });
    }
  });

  // Trial system endpoints
  app.post("/api/user/:userId/start-trial", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { trialTier } = req.body;

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      if (!["basic", "premium"].includes(trialTier)) {
        res.status(400).json({ message: "Invalid trial tier. Must be 'basic' or 'premium'" });
        return;
      }

      const updatedUser = await storage.startTrial(userId, trialTier);
      res.json({
        message: "Trial started successfully",
        user: {
          id: updatedUser.id,
          trialTier: updatedUser.trialTier,
          trialStartDate: updatedUser.trialStartDate,
          trialEndDate: updatedUser.trialEndDate
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to start trial" });
    }
  });

  app.get("/api/user/:userId/effective-tier", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const tierInfo = await storage.getUserEffectiveTier(userId);
      res.json(tierInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch effective tier" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
