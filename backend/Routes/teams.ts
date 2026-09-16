import prisma from "../utils/prisma.js";
import redis from "../utils/redis.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// Helper to safely invalidate cache without crashing route
const safeRedisDel = async (key: string) => {
  try {
    await redis.del(key);
  } catch (e) {
    logger.warn(`Redis DEL error for ${key}: ${e}`);
  }
};

// GET ALL TEAMS FOR AN ORGANIZATION (Cached safely)
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  const cacheKey = `org:${orgId}:teams`;

  try {
    // 1. Safely check Redis
    if (orgId) {
      let cached = null;
      try {
        cached = await redis.get(cacheKey);
      } catch (e) {
        logger.warn(`Redis GET error: ${e}`);
      }
      
      if (cached) return res.status(200).json(JSON.parse(cached));
    }

    // 2. Fallback to Prisma
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

    // 3. Safely set Redis
    if (orgId) {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(teams));
      } catch (e) {
        logger.warn(`Redis SET error: ${e}`);
      }
    }

    res.status(200).json(teams);
  } catch (error) {
    logger.error(`[Teams] Fetch Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// CREATE A NEW TEAM (Invalidates cache safely)
router.post("/", async (req, res) => {
  const { name, description, locationId, organizationId, userIds, requesterId } = req.body;

  try {
    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
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
        users: { connect: userConnections },
      },
      include: { location: true, users: true },
    });

    await safeRedisDel(`org:${organizationId}:teams`);
    res.status(201).json(newTeam);
  } catch (error) {
    logger.error(`[Teams] Create Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// UPDATE TEAM (Invalidates cache safely)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, locationId, userIds, organizationId } = req.body;

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
        users: { set: userConnections },
      },
      include: { location: true, users: true },
    });

    if (updatedTeam.organizationId) {
      await safeRedisDel(`org:${updatedTeam.organizationId}:teams`);
    }

    res.status(200).json(updatedTeam);
  } catch (error) {
    logger.error(`[Teams] Update Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE TEAM (Invalidates cache safely)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { requesterId } = req.query;

  try {
    const team = await prisma.team.findUnique({ where: { id } });
    if (requesterId) {
      const requester = await prisma.user.findUnique({ where: { id: requesterId as string } });
      if (!requester || requester.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    }

    await prisma.team.delete({ where: { id } });

    if (team?.organizationId) {
      await safeRedisDel(`org:${team.organizationId}:teams`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`[Teams] Delete Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;