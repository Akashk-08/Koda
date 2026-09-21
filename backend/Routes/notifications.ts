import prisma from "../utils/prisma.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// Get unread notifications for a user by ID
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    logger.error(`[Notifications] Fetch unread error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notifications for a user by Email (Robust case-insensitive fallback)
router.get("/email/:email", async (req, res) => {
  try {
    const rawEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
    
    // Use findFirst with mode insensitive to prevent 500 crashes on case mismatch
    const user = await prisma.user.findFirst({
      where: { 
        email: { 
          equals: rawEmail, 
          mode: 'insensitive' 
        } 
      }
    });

    if (!user) {
      return res.json([]);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    logger.error(`[Notifications] Fetch by email error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch notifications by email" });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.status(200).send();
  } catch (error) {
    logger.error(`[Notifications] Mark read error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Mark all notifications as read for a user
router.put("/user/:userId/read-all", async (req, res) => {
  try {
    const userId = req.params.userId;
    await prisma.notification.updateMany({
      where: { userId: userId, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    logger.error(`[Notifications] Mark all read error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default router;