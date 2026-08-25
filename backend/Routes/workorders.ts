import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

// Helper Functions
const calculateNextDate = (currentDate: Date, scheduleType: string): Date => {
  const nextDate = new Date(currentDate);
  if (scheduleType === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
  if (scheduleType === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
  if (scheduleType === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
  if (scheduleType === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
  if (scheduleType === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
};

// Multer Storage Configuration
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// 1. Upload Document
router.post("/:id/documents", upload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const document = await prisma.document.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        workOrderId: parseInt(req.params.id),
        uploaderId: req.body.uploaderId,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// 2. Get All Work Orders (Server-Side Pagination & Filtering Support)
router.get("/", async (req, res) => {
  try {
    const {
      orgId,
      userId,
      page = "1",
      limit = "50",
      search = "",
      status,
      category,
      locationName,
      teamId,
    } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // Build the dynamic WHERE clause based on frontend filters
    const queryConditions: any = {
      organizationId: String(orgId),
    };

    // Location-based Access Control
    if (userId) {
      const requestingUser = await prisma.user.findUnique({
        where: { id: String(userId) },
      });

      if (requestingUser) {
        const userLoc = requestingUser.siteLocation || "";

        // Check if full access is granted (Admin, or includes Shop / Warehouse)
        const isFullAccessUser =
          requestingUser.role === "ADMIN" ||
          userLoc.toLowerCase().includes("pulseworks shop") ||
          userLoc.toLowerCase().includes("pulseworks warehouse");

        // If NOT a full-access user, restrict view to their specific site location
        if (!isFullAccessUser && userLoc) {
          queryConditions.locationName = {
            contains: userLoc,
            mode: "insensitive",
          };
        }
      }
    }

    // Apply Filters if they exist and aren't "ALL"
    if (status && status !== "ALL") queryConditions.status = status;
    if (category && category !== "ALL") queryConditions.category = category;

    if (locationName && locationName !== "ALL") {
      queryConditions.locationName = {
        contains: String(locationName),
        mode: "insensitive",
      };
    }

    if (teamId && teamId !== "ALL") queryConditions.teamId = teamId;

    // Apply Search (Search by Title or exact ID)
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchNum = parseInt(search.replace(/\D/g, ""));

      queryConditions.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        ...(isNaN(searchNum) ? [] : [{ id: searchNum }]),
      ];
    }

    // Calculate Pagination Offsets
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Execute count and data fetch simultaneously for maximum performance
    const [totalRecords, workOrders] = await Promise.all([
      prisma.workOrder.count({ where: queryConditions }),
      prisma.workOrder.findMany({
        where: queryConditions,
        skip: skip,
        take: limitNumber,
        orderBy: { id: "desc" },
        include: {
          assignee: true,
          team: true,
          asset: true,
        },
      }),
    ]);

    // Return the paginated payload
    res.json({
      data: workOrders,
      meta: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      },
    });
  } catch (error: any) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

// 3. Get Single Work Order
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: numericId },
      include: {
        assignee: true,
        creator: true,
        asset: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activityLogs: {
          include: { actor: true },
          orderBy: { createdAt: "asc" },
        },
        preventiveMaintenance: true,
        documents: { include: { uploader: true } },
      },
    });

    if (!workOrder) return res.status(404).json({ error: "Work order not found" });
    res.status(200).json(workOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch work order details" });
  }
});

// 4. Create Work Order
router.post("/", async (req, res) => {
  const {
    title,
    description,
    category,
    priority,
    organizationId,
    createdBy,
    assignedTo,
    assetId,
    dueDate,
    durationHours,
    estimatedHours,
    siteLocation,
    parentWorkOrderId,
  } = req.body;

  try {
    let parsedHours = null;
    if (durationHours && !isNaN(parseFloat(durationHours))) {
      parsedHours = parseFloat(durationHours);
    } else if (estimatedHours && !isNaN(parseFloat(estimatedHours))) {
      parsedHours = parseFloat(estimatedHours);
    }

    const newWorkOrder = await prisma.workOrder.create({
      data: {
        title,
        description,
        category: category && category !== "None" ? category : null,
        priority: priority || "MEDIUM",
        status: "OPEN",
        organizationId,
        createdBy: createdBy || null,
        assignedTo: assignedTo || null,
        assetId: assetId || null,
        locationName: siteLocation || null,
        parentWorkOrderId: parentWorkOrderId ? parseInt(parentWorkOrderId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: parsedHours,
      },
      include: { creator: true, assignee: true },
    });

    if (createdBy) {
      await prisma.activityLog.create({
        data: {
          action: "created the work order",
          workOrderId: newWorkOrder.id,
          actorId: createdBy,
        },
      });
    }

    res.status(201).json(newWorkOrder);
  } catch (error) {
    console.error("\n=== WORK ORDER CREATION ERROR ===");
    console.error(error);
    console.error("Payload received:", req.body);
    res.status(500).json({ error: "Failed to create work order" });
  }
});

// 5. Update Work Order
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { actorId, actionLog, ...updateData } = req.body;

  try {
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    // Update the WO first
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    //  THE AUTO-CLONE ENGINE
    if (
      (updateData.status === "COMPLETED" ||
        updateData.status === "CLOSED" ||
        updateData.status === "COMPLETE") &&
      updatedWorkOrder.pmId
    ) {
      const pm: any = await prisma.preventiveMaintenance.findUnique({
        where: { id: updatedWorkOrder.pmId },
      });

      if (pm) {
        const nextDate = new Date(pm.nextDueDate);
        if (pm.scheduleType === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
        if (pm.scheduleType === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
        if (pm.scheduleType === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
        if (pm.scheduleType === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
        if (pm.scheduleType === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1);

        await prisma.preventiveMaintenance.update({
          where: { id: pm.id },
          data: { nextDueDate: nextDate },
        });

        await prisma.workOrder.create({
          data: {
            title: `[PM] ${pm.title}`,
            description: pm.description,
            priority: "MEDIUM",
            status: "OPEN",
            dueDate: nextDate,
            organizationId: pm.organizationId,
            assignedTo: pm.assigneeId || null,
            teamId: pm.teamId || null,
            assetId: pm.assetId || null,
            createdBy: updatedWorkOrder.createdBy,
            pmId: pm.id,
            taskData: pm.taskData || [],
            partsNames:
              pm.partsData && pm.partsData.length > 0
                ? pm.partsData.map((p: any) => p.name).join(", ")
                : null,
          },
        });
      }
    }

    res.status(200).json(updatedWorkOrder);
  } catch (error) {
    console.error("Error updating WO:", error);
    res.status(500).json({ error: "Failed to update work order" });
  }
});

// 6. Delete Work Order
router.delete("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id);
    if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });

    await prisma.workOrder.delete({
      where: { id: numericId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting work order:", error);
    res.status(500).json({ error: "Failed to delete work order" });
  }
});

// 7. Post a Comment
router.post("/:id/comments", async (req, res) => {
  const { text, authorId } = req.body;
  try {
    const comment = await prisma.comment.create({
      data: { text, authorId, workOrderId: parseInt(req.params.id) },
      include: { author: true },
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// 8. Update a Comment
router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    const commentIdParam = isNaN(parseInt(req.params.commentId))
      ? req.params.commentId
      : parseInt(req.params.commentId);

    const comment = await prisma.comment.update({
      where: { id: commentIdParam as any },
      data: { text },
    });
    res.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// 9. Delete a Comment
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const commentIdParam = isNaN(parseInt(req.params.commentId))
      ? req.params.commentId
      : parseInt(req.params.commentId);

    await prisma.comment.delete({
      where: { id: commentIdParam as any },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
