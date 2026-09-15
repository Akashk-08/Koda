import express from "express";
import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Helper to escape CSV cell contents
const escapeCSV = (field: any): string => {
  if (field === null || field === undefined) return '""';
  const stringified = String(field).replace(/"/g, '""');
  return `"${stringified}"`;
};

router.get("/csv", async (req, res) => {
  try {
    const { orgId, type } = req.query;

    if (!orgId) return res.status(400).json({ error: "Organization ID is required" });

    let csvContent = "";
    let fileName = `export_${type}_${Date.now()}.csv`;

    switch (type) {
      case "workorders": {
        const records = await prisma.workOrder.findMany({
          where: { organizationId: String(orgId) },
          include: { assignee: true },
          orderBy: { id: "desc" },
        });

        const headers = ["Ticket ID", "Title", "Category", "Priority", "Status", "Site Location", "Assignee", "Created At"];
        const rows = records.map((r) => [
          r.id,
          r.title,
          r.category || "N/A",
          r.priority,
          r.status,
          r.locationName || "N/A",
          r.assignee ? `${r.assignee.firstName} ${r.assignee.lastName}` : "Unassigned",
          new Date(r.createdAt).toISOString(),
        ]);

        csvContent = [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n");
        break;
      }

      case "assets": {
        const records = await prisma.asset.findMany({
          where: { organizationId: String(orgId) },
          orderBy: { name: "asc" },
        });

        const headers = ["Asset ID", "Name", "Model", "Serial Number", "Status", "Location", "Created At"];
        const rows = records.map((r: any) => [
          r.id,
          r.name,
          r.model || "N/A",
          r.serialNumber || "N/A",
          r.status,
          r.location || "N/A",
          new Date(r.createdAt).toISOString(),
        ]);

        csvContent = [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n");
        break;
      }

      case "inventory": {
        const records = await (prisma as any).inventory.findMany({
          where: { organizationId: String(orgId) },
          orderBy: { name: "asc" },
        });

        const headers = ["Part ID", "Name", "SKU", "Available Quantity", "Minimum Stock", "Unit Cost"];
        const rows = records.map((r: any) => [
          r.id,
          r.name,
          r.sku || "N/A",
          r.availableQty || 0,
          r.minStock || 0,
          r.unitCost || 0,
        ]);

        csvContent = [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n");
        break;
      }

      default:
        return res.status(400).json({ error: "Invalid export type requested" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    logger.error(`[Export] Error generating CSV: ${error.message}`);
    return res.status(500).json({ error: "Failed to generate CSV export" });
  }
});

export default router;