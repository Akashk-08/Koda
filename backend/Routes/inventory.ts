import prisma from "../utils/prisma.js";
import redis from "../utils/redis.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

// GET all parts for an organization (Cached)
router.get("/", async (req, res) => {
  const { orgId } = req.query;

  if (!orgId) return res.status(400).json({ error: "Organization ID is required" });

  const cacheKey = `org:${orgId}:inventory`;

  try {
    // 1. Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 2. Fallback to Prisma database
    const parts = await prisma.inventoryPart.findMany({
      where: { organizationId: String(orgId) },
      orderBy: { createdAt: "desc" },
    });

    // 3. Save to Redis cache for 10 minutes (600 seconds)
    await redis.setex(cacheKey, 600, JSON.stringify(parts));

    res.json(parts);
  } catch (error: any) {
    logger.error(`[Inventory] Fetch Error: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to fetch inventory parts" });
  }
});

// POST to create a new part (Invalidates cache)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      partNumber,
      description,
      category,
      cost,
      barcode,
      tags,
      imageUrls,
      isNonStock,
      isCritical,
      availableQty,
      minQty,
      maxQtyThreshold,
      siteLocation,
      area,
      organizationId,
      model,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is missing." });
    }

    const newPart = await prisma.inventoryPart.create({
      data: {
        name,
        partNumber,
        description,
        category,
        cost: parseFloat(cost) || 0,
        barcode,
        tags,
        imageUrls: imageUrls || [],
        isNonStock: Boolean(isNonStock),
        isCritical: Boolean(isCritical),
        availableQty: parseInt(availableQty) || 0,
        minQty: parseInt(minQty) || 0,
        maxQtyThreshold: parseInt(maxQtyThreshold) || 0,
        siteLocation,
        area,
        organizationId,
      },
    });

    // Invalidate inventory cache
    await redis.del(`org:${organizationId}:inventory`);

    res.status(201).json(newPart);
  } catch (error: any) {
    logger.error(`[Inventory] PRISMA CREATE ERROR: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Database error while creating part." });
  }
});

// PUT to update an existing part (Invalidates cache)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { model, ...updatedData } = req.body;

    const updatedPart = await prisma.inventoryPart.update({
      where: { id },
      data: updatedData,
    });

    if (updatedPart.organizationId) {
      await redis.del(`org:${updatedPart.organizationId}:inventory`);
    }

    res.json(updatedPart);
  } catch (error: any) {
    logger.error(`[Inventory] PRISMA UPDATE ERROR: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to update part" });
  }
});

// DELETE a part (Invalidates cache)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const part = await prisma.inventoryPart.findUnique({ where: { id } });
    await prisma.inventoryPart.delete({
      where: { id },
    });

    if (part?.organizationId) {
      await redis.del(`org:${part.organizationId}:inventory`);
    }

    res.json({ message: "Part deleted successfully" });
  } catch (error: any) {
    logger.error(`[Inventory] Delete Error: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to delete part" });
  }
});

export default router;