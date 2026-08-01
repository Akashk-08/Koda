import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// 1. GET ALL PMs FOR ORG
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  try {
    const pms = await prisma.preventiveMaintenance.findMany({
      where: { organizationId: orgId as string },
      include: { assignee: true },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(pms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch PMs" });
  }
});

// 2. CREATE PM AND SPAWN FIRST WORK ORDER
router.post("/", async (req, res) => {
  const {
    title,
    description,
    scheduleType,
    firstDueDate,
    organizationId,
    assigneeId,
    creatorId,
  } = req.body;

  try {
    // Create the PM schedule
    const newPM = await prisma.preventiveMaintenance.create({
      data: {
        title,
        description,
        scheduleType,
        nextDueDate: new Date(firstDueDate),
        organizationId,
        assigneeId: assigneeId || null,
      },
    });

    // Immediately create the first Work Order linked to this PM
    await prisma.workOrder.create({
      data: {
        title: `[PM] ${title}`,
        description: description,
        priority: "MEDIUM",
        status: "OPEN",
        dueDate: new Date(firstDueDate),
        organizationId,
        assignedTo: assigneeId || null,
        createdBy: creatorId,
        pmId: newPM.id, // Link it to the PM
      },
    });

    res.status(201).json(newPM);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create PM" });
  }
});

export default router;
