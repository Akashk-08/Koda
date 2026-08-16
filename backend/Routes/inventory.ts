import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all parts for an organization
router.get("/", async (req, res) => {
  const { orgId } = req.query;

  if (!orgId)
    return res.status(400).json({ error: "Organization ID is required" });

  try {
    const parts = await prisma.inventoryPart.findMany({
      where: { organizationId: String(orgId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(parts);
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch inventory parts" });
  }
});

// POST to create a new part
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
      imageUrls, // Use imageUrls (array)
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
        imageUrls: imageUrls || [], // Save the array to the DB
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

    res.status(201).json(newPart);
  } catch (error: any) {
    console.error("PRISMA CREATE ERROR:", error);
    res
      .status(500)
      .json({ error: error.message || "Database error while creating part." });
  }
});

// PUT to update an existing part
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { model, ...updatedData } = req.body;

    const updatedPart = await prisma.inventoryPart.update({
      where: { id },
      data: updatedData,
    });

    res.json(updatedPart);
  } catch (error: any) {
    console.error("PRISMA UPDATE ERROR:", error);
    res.status(500).json({ error: error.message || "Failed to update part" });
  }
});

// DELETE a part
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inventoryPart.delete({
      where: { id },
    });

    res.json({ message: "Part deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to delete part" });
  }
});

export default router;
