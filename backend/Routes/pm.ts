import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all PM schedules with proper global HQ and fallback handling
router.get("/", async (req, res) => {
  const { orgId, userId } = req.query;

  if (!orgId || typeof orgId !== "string") {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    // Simply fetch all PM schedules matching the organization ID
    // This ensures imported CSV templates (which start unassigned) appear in both frontend and scheduler
    const pms = await prisma.preventiveMaintenance.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        assignee: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(pms);
  } catch (error) {
    console.error("Error fetching PM schedules:", error);
    res.status(500).json({ error: "Failed to fetch PM schedules" });
  }
});

router.post("/", async (req, res) => {
  const {
    title,
    description,
    scheduleType,
    firstDueDate,
    assigneeId,
    teamId,
    assetId,
    taskData,
    partsData,
    organizationId,
    creatorId,
  } = req.body;

  try {
    // 1. Save the Master Template
    const newPm = await prisma.preventiveMaintenance.create({
      data: {
        title,
        description,
        scheduleType,
        nextDueDate: new Date(firstDueDate),
        assigneeId: assigneeId || null,
        teamId: teamId || null,
        assetId: assetId || null,
        taskData: taskData || [],
        partsData: partsData || [],
        organizationId,
      },
    });

    // 2. INSTANTLY generate the first Work Order based on this template!
    await prisma.workOrder.create({
      data: {
        title: `[PM] ${title}`,
        description,
        priority: "MEDIUM",
        status: "OPEN",
        dueDate: new Date(firstDueDate),
        organizationId,
        assignedTo: assigneeId || null,
        teamId: teamId || null,
        assetId: assetId || null,
        createdBy: creatorId || null,
        pmId: newPm.id, // Link it to the PM template!
        taskData: taskData || [], // Clone the master checklist!
        // We inject the required parts straight into the WO description for easy visibility
        partsNames:
          partsData && partsData.length > 0 ? partsData.map((p: any) => p.name).join(", ") : null,
      },
    });

    res.status(201).json(newPm);
  } catch (error) {
    console.error("Error creating PM:", error);
    res.status(500).json({ error: "Failed to create PM" });
  }
});

export default router;
