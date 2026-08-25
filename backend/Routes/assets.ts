import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get all assets
router.get("/", async (req, res) => {
  const { orgId, barcode } = req.query;
  try {
    const assets = await prisma.asset.findMany({
      where: {
        organizationId: String(orgId),
        ...(barcode ? { barcode: String(barcode) } : {}),
      },
      include: {
        workOrders: {
          orderBy: { createdAt: "desc" },
        },
        parts: true, // Pulls in the newly created Parts relation
        children: {
          // Pulls in the AssetDependency relation
          include: {
            childAsset: true,
          },
        },
      },
    });

    // Format the response so the frontend receives a flat 'subassets' array
    const formattedAssets = assets.map((asset) => {
      const { children, ...rest } = asset;
      return {
        ...rest,
        subassets: children.map((c: any) => c.childAsset),
      };
    });

    res.json(formattedAssets);
  } catch (err) {
    console.error("GET Assets Error:", err);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// Create an asset
router.post("/", async (req, res) => {
  try {
    const newAsset = await prisma.asset.create({
      data: req.body,
    });
    res.status(201).json(newAsset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ error: "Failed to create asset" });
  }
});

// Update an asset
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Extract relations gracefully (handles plain arrays OR {set: []} objects)
    const subassetsList = Array.isArray(req.body.subassets)
      ? req.body.subassets
      : req.body.subassets?.set || [];

    const partsList = Array.isArray(req.body.parts) ? req.body.parts : req.body.parts?.set || [];

    // 1. Create a copy of the incoming data
    const cleanData = { ...req.body };

    // 2. Aggressively strip fields so they don't break Prisma
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    delete cleanData.workOrders;
    delete cleanData.organization;
    delete cleanData.organizationId;
    delete cleanData._count;
    delete cleanData.parents;
    delete cleanData.children;
    delete cleanData.subassets;
    delete cleanData.parts;

    // 3. Attempt to update the database
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...cleanData,

        // Map subassets safely into the explicit AssetDependency table
        children: {
          deleteMany: {}, // Clear existing linked subassets
          create: subassetsList.map((sub: any) => ({
            childAssetId: sub.id,
            dependencyType: "SUBASSET",
          })),
        },

        // Map parts safely into the new implicit many-to-many table
        parts: {
          set: partsList.map((p: any) => ({ id: p.id })),
        },
      },
    });
    res.json(updatedAsset);
  } catch (error: any) {
    console.error("\n=========================================");
    console.error(" PRISMA UPDATE ERROR:");
    console.error(error.message || error);
    console.error("=========================================\n");

    res.status(500).json({
      error: "Failed to update asset",
      details: error.message || "Unknown Prisma Error",
    });
  }
});

// Delete an asset
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.asset.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

export default router;
