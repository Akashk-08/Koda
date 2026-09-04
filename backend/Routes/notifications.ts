import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get unread notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id }, // Removed parseInt()
      data: { isRead: true }
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;