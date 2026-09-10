import prisma from "../utils/prisma.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// Get unread notifications for a user
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

export default router;
