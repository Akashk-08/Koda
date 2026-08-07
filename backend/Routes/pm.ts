import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all PM schedules with proper global HQ and site permissions
router.get("/", async (req, res) => {
  const { orgId, userId } = req.query;

  if (!orgId || typeof orgId !== "string") {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    let whereClause: any = {
      organizationId: orgId,
    };

    if (userId && typeof userId === "string") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (currentUser) {
        const globalHeadquarters = ["Pulseworks Shop", "Pulseworks Warehouse"];
        const userLocation = currentUser.siteLocation || "";
        
        // Check if user is an ADMIN or belongs to global headquarters
        const isGlobalUser = 
          currentUser.role === "ADMIN" || 
          globalHeadquarters.some(hq => userLocation.toLowerCase().includes(hq.toLowerCase()));

        // If NOT a global user, restrict PMs based on assignee or creator match
        if (!isGlobalUser) {
          if (userLocation !== "") {
            whereClause.OR = [
              { assigneeId: userId },
              { creatorId: userId }
            ];
          } else {
            whereClause.id = -99999; // Lock down if no location
          }
        }
      }
    }

    const pms = await prisma.preventiveMaintenance.findMany({
      where: whereClause,
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

// POST to create a new PM schedule
router.post("/", async (req, res) => {
  const { title, description, scheduleType, firstDueDate, assigneeId, organizationId, creatorId } = req.body;

  try {
    const newPm = await prisma.preventiveMaintenance.create({
      data: {
        title,
        description,
        scheduleType,
        nextDueDate: new Date(firstDueDate),
        assigneeId: assigneeId || null,
        organizationId,
        creatorId,
      },
    });

    res.status(201).json(newPm);
  } catch (error) {
    console.error("Error creating PM schedule:", error);
    res.status(500).json({ error: "Failed to create PM schedule" });
  }
});

export default router;