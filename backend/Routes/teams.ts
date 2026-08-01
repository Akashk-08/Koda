import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET ALL TEAMS FOR AN ORGANIZATION
router.get("/", async (req, res) => {
  const { orgId } = req.query;
  try {
    const teams = await prisma.team.findMany({
      where: { organizationId: orgId as string },
      include: {
        location: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// CREATE A NEW TEAM (ADMIN ONLY)
router.post("/", async (req, res) => {
  const {
    name,
    description,
    locationId,
    organizationId,
    userIds,
    requesterId,
  } = req.body;

  try {
    // Security Check
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Create the team and connect the selected users
    const newTeam = await prisma.team.create({
      data: {
        name,
        description,
        organizationId,
        locationId,
        users: {
          connect: userIds.map((id: string) => ({ id })),
        },
      },
      include: {
        location: true,
        users: true,
      },
    });

    res.status(201).json(newTeam);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// ADD USERS TO AN EXISTING TEAM (ADMIN ONLY)
router.put("/:id/users", async (req, res) => {
  const { id } = req.params;
  const { userIds, requesterId } = req.body;

  try {
    // Security Check
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Update the team by connecting the new users
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        users: {
          connect: userIds.map((userId: string) => ({ id: userId })),
        },
      },
      include: {
        location: true,
        users: true,
      },
    });

    res.status(200).json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Failed to add team members" });
  }
});

// UPDATE TEAM DETAILS (ADMIN ONLY)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, requesterId } = req.body;

  try {
    // Security Check
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { name, description },
    });

    res.status(200).json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE A TEAM (ADMIN ONLY)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { requesterId } = req.query; // Using query parameters for DELETE requests is best practice

  try {
    // Security Check
    const requester = await prisma.user.findUnique({
      where: { id: requesterId as string },
    });
    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Prisma automatically handles detaching the users when the team is deleted
    await prisma.team.delete({
      where: { id },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
