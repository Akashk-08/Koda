import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { orgId, activeOnly } = req.query;
  if (!orgId) return res.status(400).json({ error: "orgId is required" });
  try {
    const whereClause: any = { organizationId: String(orgId) };
    if (activeOnly === "true") whereClause.isActive = true;
    const list = await (prisma as any).machineType.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { orgId, name } = req.body;
  if (!name || !orgId) return res.status(400).json({ error: "Name and orgId are required." });
  try {
    const created = await (prisma as any).machineType.create({
      data: {
        organizationId: String(orgId),
        name: name.trim().toUpperCase(),
        isActive: true,
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await (prisma as any).machineType.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Machine type not found." });
    const updated = await (prisma as any).machineType.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const role = req.query.role || req.body?.role || "ADMIN";

  if (role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }

  try {
    // Find category first to ensure it exists
    const category = await (prisma as any).equipmentCategory.findUnique({
      where: { id: String(id) },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    // Direct delete by primary key
    await (prisma as any).equipmentCategory.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true });
  } catch (err: any) {
    // If foreign key constraint blocks deletion, provide a clear explanation
    if (err.code === "P2003" || err.message?.includes("foreign key")) {
      return res.status(400).json({
        error: "Cannot permanently delete: existing assets or records depend on this category. Click 'Discontinue' instead to hide it from new assets.",
      });
    }
    return res.status(500).json({ error: err.message || "Failed to delete category" });
  }
});

export default router;