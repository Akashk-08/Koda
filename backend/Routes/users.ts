import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// 1. GET ALL PENDING REQUESTS (ADMIN ONLY)
router.get("/accessrequests", async (req, res) => {
  const { orgId, requesterId } = req.query;

  try {
    if (!requesterId) return res.status(401).json({ error: "Missing requester ID" });

    const requester = await prisma.user.findUnique({
      where: { id: requesterId as string },
    });

    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        organizationId: orgId as string,
        approvalStatus: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        siteLocation: true,
        designation: true,
        profilePicUrl: true,
        approvalStatus: true,
        createdAt: true,
      },
    });
    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// 2. GET SINGLE USER PROFILE WITH ORG & TEAMS (MOVED UP TO AVOID CONFLICTS)
router.get("/profile/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      include: {
        organization: true,
        teams: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to fetch profile details:", error);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
});

// 3. GET ALL USERS IN AN ORG
router.get("/:orgId", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.params.orgId },
    });

    const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 4. UPDATE USER PROFILE
router.put("/:id/profile", async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    phoneNumber,
    siteLocation,
    homeAddress,
    designation,
    profilePicUrl,
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phoneNumber,
        siteLocation,
        homeAddress,
        designation,
        profilePicUrl,
      },
      include: { organization: true, teams: true },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// 5. APPROVE OR REJECT A USER
router.put("/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { approvalStatus: status },
    });
    res.status(200).json({ success: true, status: updatedUser.approvalStatus });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// 6. Add permissions for users
router.put("/:id/permissions", async (req, res) => {
  const { id } = req.params;
  const { role, locationId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role,
        siteLocation: locationId || null,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to update user permissions:", error);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

export default router;
