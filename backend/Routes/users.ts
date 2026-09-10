import prisma from "../utils/prisma.js";
import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

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
    logger.error(`[Users] Fetch Requests Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// 2. GET SINGLE USER PROFILE WITH ORG & TEAMS
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
    logger.error(`[Users] Fetch Profile Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
});

// 3. GET ALL USERS IN AN ORG (BULLETPROOF QUERY PARAM ROUTE)
router.get("/", async (req, res) => {
  try {
    const orgId = req.query.orgId as string;

    if (!orgId || orgId === "undefined") {
      return res.status(400).json({ error: "Valid orgId query parameter is required" });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      include: { teams: true },
    });

    const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
    res.status(200).json(usersWithoutPasswords);
  } catch (error: any) {
    logger.error(`[Users] Fetch All Error: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
});

// 3.5 FALLBACK ROUTE (Just in case old endpoints still call this)
router.get("/:orgId", async (req, res) => {
  const { orgId } = req.params;
  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        approvalStatus: { not: "REJECTED" },
      },
    });
    res.status(200).json(users);
  } catch (error) {
    logger.error(`[Users] Fetch Fallback Error: ${(error as Error).message || error}`);
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
    logger.error(`[Users] Update Profile Error: ${(error as Error).message || error}`);
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
    logger.error(`[Users] Approve User Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// 6. ADD PERMISSIONS & ROUTING RULES FOR USERS
router.put("/:id/permissions", async (req, res) => {
  const { id } = req.params;
  const { role, locationId, autoAssignCategories } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role,
        siteLocation: locationId || null,
        autoAssignCategories: autoAssignCategories || [],
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    logger.error(`[Users] Update Permissions Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

router.post("/:id/device-token", async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    await prisma.user.update({
      where: { id },
      data: { deviceToken: token },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`[Users] Save Device Token Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to save device token" });
  }
});

export default router;
