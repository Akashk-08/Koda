import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET LOCATIONS FOR A SPECIFIC ORGANIZATION
router.get("/", async (req, res) => {
  const { orgId } = req.query;

  try {
    const locations = await prisma.location.findMany({
      where: {
        organizationId: orgId as string,
      },
      orderBy: { name: "asc" },
    });
    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

export default router;
