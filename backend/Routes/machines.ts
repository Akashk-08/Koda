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
  const { orgId, organizationId, name, role } = req.body;
  const resolvedOrgId = orgId || organizationId;

  if (!name || !resolvedOrgId) {
    return res.status(400).json({ error: "Name and orgId are required." });
  }

  try {
    const created = await (prisma as any).machineType.create({
      data: {
        organizationId: String(resolvedOrgId),
        name: name.trim().toUpperCase(),
        isActive: true,
      },
    });
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create machine unit" });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== "ADMIN") return res.status(403).json({ error: "Admin access required." });

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
    const machine = await (prisma as any).machineType.findUnique({
      where: { id: String(id) },
    });

    if (!machine) {
      return res.status(404).json({ error: "Machine type not found." });
    }

    await (prisma as any).machineType.delete({
      where: { id: String(id) },
    });

    return res.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2003" || err.message?.includes("foreign key")) {
      return res.status(400).json({
        error: "Cannot permanently delete: existing assets depend on this machine type. Click 'Discontinue' instead.",
      });
    }
    return res.status(500).json({ error: err.message || "Failed to delete machine unit" });
  }
});

export default router;