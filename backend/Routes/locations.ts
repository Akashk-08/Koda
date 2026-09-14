import prisma from "../utils/prisma.js";
import redis from "../utils/redis.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// GET all locations for an organization (Cached)
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  const cacheKey = `org:${orgId}:locations`;

  try {
    // 1. Check Redis cache first
    if (orgId) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    }

    // 2. Fallback to Prisma database
    const locations = await prisma.location.findMany({
      where: orgId ? { organizationId: String(orgId) } : {},
      orderBy: { name: "asc" },
    });

    // 3. Save to Redis cache for 10 minutes (600 seconds)
    if (orgId) {
      await redis.setex(cacheKey, 600, JSON.stringify(locations));
    }

    res.status(200).json(locations);
  } catch (error) {
    logger.error(`[Locations] Fetch Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// CREATE a new location (Invalidates cache)
router.post("/", async (req, res) => {
  const { name, shortName, address, latitude, longitude, teamAssignedNames, organizationId } =
    req.body;

  try {
    const newLocation = await prisma.location.create({
      data: {
        name,
        shortName: shortName || null,
        address,
        latitude,
        longitude,
        teamAssignedNames,
        organizationId,
      },
    });

    // Invalidate cache
    if (organizationId) {
      await redis.del(`org:${organizationId}:locations`);
    }

    res.status(201).json(newLocation);
  } catch (error) {
    logger.error(`[Locations] Create Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to create location" });
  }
});

// UPDATE an existing location (Invalidates cache)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, shortName, address, latitude, longitude, teamAssignedNames, organizationId } = req.body;

  try {
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name,
        shortName: shortName || null,
        address,
        latitude,
        longitude,
        teamAssignedNames,
      },
    });

    if (organizationId) {
      await redis.del(`org:${organizationId}:locations`);
    }

    res.status(200).json(updatedLocation);
  } catch (error) {
    logger.error(`[Locations] Update Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// DELETE a location (Invalidates cache)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const loc = await prisma.location.findUnique({ where: { id } });
    await prisma.location.delete({
      where: { id },
    });

    if (loc?.organizationId) {
      await redis.del(`org:${loc.organizationId}:locations`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`[Locations] Delete Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;