// backend/Routes/assets.ts
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
          orderBy: { createdAt: "desc" }, // Shows newest check-ins/check-outs at the top
        },
      },
    });
    res.json(assets);
  } catch (err) {
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
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: req.body,
    });
    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ error: "Failed to update asset" });
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
