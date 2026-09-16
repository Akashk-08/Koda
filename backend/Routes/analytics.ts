import express from "express";
import prisma from "../utils/prisma.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { orgId } = req.query;
    if (!orgId) return res.status(400).json({ error: "Organization ID is required" });

    const cacheKey = `analytics:metrics:${orgId}`;

    let cachedMetrics = null;
    try {
      const data = await redis.get(cacheKey);
      if (data) cachedMetrics = JSON.parse(data);
    } catch (e) {}

    if (cachedMetrics) {
      return res.json(cachedMetrics);
    }

    const [
      totalWorkOrders,
      openWorkOrders,
      completedWorkOrders,
      criticalWorkOrders,
      highWorkOrders,
      totalAssets,
      operationalAssets,
      damagedAssets,
      totalParts,
      lowStockParts,
      locations,
      recentActivity,
    ] = await Promise.all([
      prisma.workOrder.count({ where: { organizationId: String(orgId) } }),
      prisma.workOrder.count({ where: { organizationId: String(orgId), status: "OPEN" } }),
      prisma.workOrder.count({ where: { organizationId: String(orgId), status: { in: ["COMPLETE", "OPEN", "CLOSED"] } } }),
      prisma.workOrder.count({ where: { organizationId: String(orgId), priority: "CRITICAL" } }),
      prisma.workOrder.count({ where: { organizationId: String(orgId), priority: "HIGH" } }),
      prisma.asset.count({ where: { organizationId: String(orgId) } }),
      prisma.asset.count({ where: { organizationId: String(orgId), status: "OPERATIONAL" } }),
      prisma.asset.count({ where: { organizationId: String(orgId), status: { not: "OPERATIONAL" } } }),
      (prisma as any).inventoryPart?.count({ where: { organizationId: String(orgId) } }) || 0,
      (prisma as any).inventoryPart?.count({ where: { organizationId: String(orgId), availableQty: { lte: 5 } } }) || 0,
      prisma.location.findMany({ where: { organizationId: String(orgId) } }),
      
      // UPDATED: Universal Activity Log scoped to the Organization
      prisma.activityLog.findMany({
        where: { organizationId: String(orgId) },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { 
          actor: { 
            select: { firstName: true, email: true } 
          } 
        },
      }),
    ]);

    // Calculate work orders per location
    const locationBreakdown = await Promise.all(
      locations.map(async (loc) => {
        const count = await prisma.workOrder.count({
          where: { organizationId: String(orgId), locationName: loc.name },
        });
        return { name: loc.name, count };
      })
    );

    const metricsPayload = {
      workOrders: {
        total: totalWorkOrders,
        open: openWorkOrders,
        completed: completedWorkOrders,
        critical: criticalWorkOrders,
        high: highWorkOrders,
      },
      assets: {
        total: totalAssets,
        operational: operationalAssets,
        damaged: damagedAssets,
        uptimePercentage: totalAssets > 0 ? ((operationalAssets / totalAssets) * 100).toFixed(1) : "100",
      },
      inventory: {
        totalParts,
        lowStockParts,
      },
      locationBreakdown,
      recentActivity,
    };

    await redis.setex(cacheKey, 30, JSON.stringify(metricsPayload)).catch(() => {});

    res.json(metricsPayload);
  } catch (error: any) {
    logger.error(`[Analytics] Error fetching metrics: ${error.message || error}`);
    res.status(500).json({ error: "Failed to fetch operational metrics" });
  }
});

export default router;