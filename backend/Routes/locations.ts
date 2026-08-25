import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all locations for an organization
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  try {
    const locations = await prisma.location.findMany({
      where: orgId ? { organizationId: String(orgId) } : {},
      orderBy: { name: "asc" },
    });
    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// CREATE a new location
router.post("/", async (req, res) => {
  const { name, shortName, address, latitude, longitude, teamAssignedNames, organizationId } =
    req.body;

  try {
    const newLocation = await prisma.location.create({
      data: {
        name,
        shortName: shortName || null, // SAVING NEW FIELD
        address,
        latitude,
        longitude,
        teamAssignedNames,
        organizationId,
      },
    });
    res.status(201).json(newLocation);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Failed to create location" });
  }
});

// UPDATE an existing location
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, shortName, address, latitude, longitude, teamAssignedNames } = req.body;

  try {
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name,
        shortName: shortName || null, // SAVING NEW FIELD
        address,
        latitude,
        longitude,
        teamAssignedNames,
      },
    });
    res.status(200).json(updatedLocation);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// DELETE a location
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.location.delete({
      where: { id },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;
