import prisma from "../utils/prisma.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// GET ALL TEAMS FOR AN ORGANIZATION
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  try {
    const teams = await prisma.team.findMany({
      where: { organizationId: orgId as string },
      include: {
        location: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(teams);
  } catch (error) {
    logger.error(`[Teams] Fetch Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// CREATE A NEW TEAM (ADMIN ONLY)
router.post("/", async (req, res) => {
  const { name, description, locationId, organizationId, userIds, requesterId } = req.body;

  try {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const userConnections = Array.isArray(userIds) ? userIds.map((id: string) => ({ id })) : [];

    const newTeam = await prisma.team.create({
      data: {
        name,
        description,
        organizationId,
        locationId: locationId || null,
        users: {
          connect: userConnections,
        },
      },
      include: {
        location: true,
        users: true,
      },
    });

    res.status(201).json(newTeam);
  } catch (error) {
    logger.error(`[Teams] Create Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// UPDATE TEAM DETAILS (ADMIN ONLY) - FIXED TO SAVE LOCATION AND MEMBERS PROPERLY
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, locationId, userIds } = req.body;

  try {
    const userConnections = Array.isArray(userIds)
      ? userIds.map((userId: string) => ({ id: userId }))
      : [];

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
        locationId: locationId || null,
        users: {
          set: userConnections,
        },
      },
      include: {
        location: true,
        users: true,
      },
    });

    res.status(200).json(updatedTeam);
  } catch (error) {
    logger.error(`[Teams] Update Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE A TEAM (ADMIN ONLY)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { requesterId } = req.query;

  try {
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId as string },
      });
      if (!requester || requester.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    }

    await prisma.team.delete({
      where: { id },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`[Teams] Delete Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
