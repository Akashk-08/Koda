import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all locations
router.get("/", async (req, res) => {
  try {
    const { orgId } = req.query;
    if (!orgId)
      return res.status(400).json({ error: "Organization ID is required" });

    const locations = await prisma.location.findMany({
      where: { organizationId: String(orgId) },
      orderBy: { name: "asc" },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// POST a new location
router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      teamAssignedNames,
      organizationId,
    } = req.body;
    if (!name || !organizationId)
      return res
        .status(400)
        .json({ error: "Name and Organization ID are required" });

    const newLocation = await prisma.location.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        teamAssignedNames,
        organizationId,
      },
    });
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ error: "Failed to create location" });
  }
});

// PUT (Update) an existing location
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, teamAssignedNames } = req.body;

    const updatedLocation = await prisma.location.update({
      where: { id: String(id) },
      data: { name, address, latitude, longitude, teamAssignedNames },
    });
    res.status(200).json(updatedLocation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update location" });
  }
});

// DELETE a location
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id: String(id) } });
    res.status(200).json({ message: "Location deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;
