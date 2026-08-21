import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Fetch Logs for the Developer Console
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: "Missing organization ID" });

  try {
    const logs = await prisma.systemAuditLog.findMany({
      where: { organizationId: String(orgId) },
      orderBy: { createdAt: "desc" },
      take: 100, // Keep the terminal fast by loading only recent events
    });
    res.status(200).json(logs);
  } catch (error) {
    console.error("Fetch Audit Logs Error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Create a New Audit Log Entry
router.post("/", async (req, res) => {
  const { orgId, userId, userName, role, action, details } = req.body;
  try {
    const log = await prisma.systemAuditLog.create({
      data: {
        organizationId: orgId,
        userId,
        userName,
        role,
        action,
        details,
      },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error("Create Audit Log Error:", error);
    res.status(500).json({ error: "Failed to create audit log" });
  }
});

export default router;
