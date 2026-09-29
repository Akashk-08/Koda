import prisma from "../utils/prisma.js";
import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { notifyUser } from "../services/notificationService.js";
import logger from "../utils/logger.js";
import nodemailer from "nodemailer";
import redis from "../utils/redis.js";

const router = express.Router();

// Helper for Global Audit Surveillance
async function logGlobalAudit(actorId: string, actionType: string, details: string) {
  try {
    if (!actorId) return;
    await prisma.globalAuditLog.create({
      data: { actorId, actionType, details },
    });
  } catch (error) {
    console.error("Failed to write global audit log:", error);
  }
}

// AWS S3 CONFIGURATION
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `workorders/${uniqueSuffix}-${file.originalname}`); 
    },
  }),
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Upload Document to AWS S3
router.post("/:id/documents", upload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const numericId = parseInt(req.params.id);
    const fileUrl = req.file.location;

    const document = await prisma.document.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: fileUrl, 
        workOrderId: numericId,
        uploaderId: req.body.uploaderId,
      },
    });

    // Touch updatedAt so Last Updated timestamp refreshes
    await prisma.workOrder.update({
      where: { id: numericId },
      data: { updatedAt: new Date() }
    });

    const wo = await prisma.workOrder.findUnique({ where: { id: numericId }, select: { organizationId: true, title: true }});

    if (wo) {
      await redis.del(`workorders:${wo.organizationId}`).catch(() => {});
      await redis.del(`workorder:single:${numericId}`).catch(() => {});
      
      await prisma.activityLog.create({
        data: {
          action: `uploaded a file: ${req.file.originalname}`,
          entityType: "WORK_ORDER",
          entityTitle: `WO-${numericId}`,
          workOrderId: numericId,
          actorId: req.body.uploaderId,
          organizationId: wo.organizationId,
        }
      });

      await logGlobalAudit(
        req.body.uploaderId,
        "DOCUMENT_UPLOADED",
        `Uploaded file "${req.file.originalname}" to WO-${numericId}`
      );
    }

    res.status(201).json(document);
  } catch (error) {
    logger.error(`[WorkOrders] Upload Document Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// 2. Get All Work Orders
router.get("/", async (req, res) => {
  try {
    const {
      orgId,
      page = "1",
      limit = "50",
      search = "",
      status,
      category,
      locationName,
      teamId,
      sortBy,
    } = req.query;

    if (!orgId) return res.status(400).json({ error: "Organization ID is required" });

    const cacheKey = `workorders:${orgId}:${page}:${limit}:${search}:${status || "ALL"}:${category || "ALL"}:${locationName || "ALL"}:${teamId || "ALL"}:${sortBy || "newest"}`;

    let cachedData = null;
    try {
      const data = await redis.get(cacheKey);
      if (data) cachedData = JSON.parse(data);
    } catch (redisErr) {}

    if (cachedData) return res.json(cachedData);

    const queryConditions: any = { organizationId: String(orgId) };

    if (status && status !== "ALL") queryConditions.status = status;
    if (category && category !== "ALL") queryConditions.category = category;
    if (locationName && locationName !== "ALL") {
      queryConditions.locationName = { contains: String(locationName), mode: "insensitive" };
    }
    if (teamId && teamId !== "ALL") queryConditions.teamId = teamId;

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchNum = parseInt(search.replace(/\D/g, ""));
      queryConditions.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        ...(isNaN(searchNum) ? [] : [{ id: searchNum }]),
      ];
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let orderByClause: any = { id: "desc" };
    if (sortBy === "lastUpdated") {
      orderByClause = { updatedAt: "desc" };
    }

    const [totalRecords, workOrders] = await Promise.all([
      prisma.workOrder.count({ where: queryConditions }),
      prisma.workOrder.findMany({
        where: queryConditions,
        skip: skip,
        take: limitNumber,
        orderBy: orderByClause,
        include: { assignee: true, team: true, asset: true },
      }),
    ]);

    const responsePayload = {
      data: workOrders,
      meta: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      },
    };

    await redis.setex(cacheKey, 60, JSON.stringify(responsePayload)).catch(() => {});
    res.json(responsePayload);
  } catch (error: any) {
    logger.error(`[WorkOrders] Fetch All Error: ${error.message || error}`);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

// 3. Get Single Work Order
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });

    const cacheKey = `workorder:single:${numericId}`;
    let cachedWorkOrder = null;
    try {
      const data = await redis.get(cacheKey);
      if (data) cachedWorkOrder = JSON.parse(data);
    } catch (e) {}

    if (cachedWorkOrder) return res.status(200).json(cachedWorkOrder);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: numericId },
      include: {
        assignee: true,
        creator: true,
        asset: true,
        team: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activityLogs: { include: { actor: true }, orderBy: { createdAt: "asc" } },
        preventiveMaintenance: true,
        documents: { include: { uploader: true } },
      },
    });

    if (!workOrder) return res.status(404).json({ error: "Work order not found" });

    await redis.setex(cacheKey, 60, JSON.stringify(workOrder)).catch(() => {});
    res.status(200).json(workOrder);
  } catch (error) {
    logger.error(`[WorkOrders] Fetch Single Error: ${(error as Error).message || error}`);
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
    additionalAssigneeEmails,
    teamId,
    assetId,
    dueDate,
    durationHours,
    estimatedHours,
    locationName,
    parentWorkOrderId,
  } = req.body;

  try {
    let parsedHours = null;
    if (durationHours && !isNaN(parseFloat(durationHours))) parsedHours = parseFloat(durationHours);
    else if (estimatedHours && !isNaN(parseFloat(estimatedHours)))
      parsedHours = parseFloat(estimatedHours);

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
        additionalAssigneeEmails: additionalAssigneeEmails || null,
        teamId: teamId || null,
        assetId: assetId || null,
        locationName: locationName || null,
        parentWorkOrderId: parentWorkOrderId ? parseInt(parentWorkOrderId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: parsedHours,
      },
      include: { creator: true, assignee: true },
    });

    await redis.del(`workorders:${organizationId}`).catch(() => {});

    if (createdBy) {
      await prisma.activityLog.create({
        data: {
          action: "created the work order",
          entityType: "WORK_ORDER",
          entityTitle: `WO-${newWorkOrder.id}`,
          workOrderId: newWorkOrder.id,
          actorId: createdBy,
          organizationId: newWorkOrder.organizationId,
        },
      });

      await logGlobalAudit(
        createdBy,
        "WORK_ORDER_CREATED",
        `Created Work Order #${newWorkOrder.id}: "${title}"`
      );
    }

    res.status(201).json(newWorkOrder);
  } catch (error) {
    logger.error(`[WorkOrders] CREATION ERROR: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to create work order" });
  }
});

// 5. Update Work Order
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const numericId = parseInt(id);
  const { actorId, actionLog, ...updateData } = req.body;

  try {
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const existingWO = await prisma.workOrder.findUnique({ where: { id: numericId }});
    if (!existingWO) return res.status(404).json({error: "Not Found"});

    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: numericId },
      data: {
        ...updateData,
        updatedAt: new Date() // Force refresh timestamp
      },
    });

    await redis.del(`workorder:single:${id}`).catch(() => {});
    await redis.del(`workorders:${updatedWorkOrder.organizationId}`).catch(() => {});

    if (actorId && actionLog) {
      await prisma.activityLog.create({
        data: {
          action: actionLog,
          entityType: "WORK_ORDER",
          entityTitle: `WO-${numericId}`,
          workOrderId: numericId,
          actorId: actorId,
          organizationId: updatedWorkOrder.organizationId,
        },
      });

      await logGlobalAudit(
        actorId,
        "WORK_ORDER_UPDATED",
        `Updated Work Order #${numericId}: ${actionLog}`
      );
    }

    res.status(200).json(updatedWorkOrder);
  } catch (error) {
    logger.error(`[WorkOrders] Update WO Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update work order" });
  }
});

// 6. Delete Work Order
router.delete("/:id", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id);
    if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });
    const actorId = req.query.actorId as string || req.body.actorId;

    const existingWO = await prisma.workOrder.findUnique({ where: { id: numericId } });

    await prisma.workOrder.delete({
      where: { id: numericId },
    });

    if (existingWO) {
      await redis.del(`workorder:single:${numericId}`).catch(() => {});
      await redis.del(`workorders:${existingWO.organizationId}`).catch(() => {});

      await logGlobalAudit(
        actorId || existingWO.createdBy || "UNKNOWN",
        "WORK_ORDER_DELETED",
        `Deleted Work Order #${numericId}: "${existingWO.title}"`
      );
    }

    res.status(204).send();
  } catch (error) {
    logger.error(`[WorkOrders] Delete Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to delete work order" });
  }
});

// 7. Post a Comment
router.post("/:id/comments", async (req, res) => {
  const { text, authorId } = req.body;
  const numericId = parseInt(req.params.id);
  
  try {
    const wo = await prisma.workOrder.findUnique({ 
      where: { id: numericId }, 
      select: { organizationId: true, title: true }
    });
    if (!wo) return res.status(404).json({error: "Work order not found"});

    const comment = await prisma.comment.create({
      data: { text, authorId, workOrderId: numericId },
      include: { author: true },
    });
    
    // REMOVED redundant prisma.activityLog.create here so it doesn't double-log comments!

    // Intercept comment creation in Global Audit Log
    await logGlobalAudit(
      authorId,
      "COMMENT_ADDED",
      `Added comment on WO-${numericId}: "${text}"`
    );

    await prisma.workOrder.update({
      where: { id: numericId },
      data: { updatedAt: new Date() }
    });

    await redis.del(`workorder:single:${numericId}`).catch(() => {});
    res.status(201).json(comment);
  } catch (error) {
    logger.error(`[WorkOrders] Add Comment Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// 8. Update a Comment
router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { text, actorId } = req.body;
    const numericId = parseInt(req.params.id);

    const comment = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { text },
    });

    // Touch updatedAt
    await prisma.workOrder.update({
      where: { id: numericId },
      data: { updatedAt: new Date() }
    });

    await logGlobalAudit(
      actorId || comment.authorId,
      "COMMENT_UPDATED",
      `Edited comment on WO-${numericId}: "${text}"`
    );

    await redis.del(`workorder:single:${numericId}`).catch(() => {});
    res.json(comment);
  } catch (error) {
    logger.error(`[WorkOrders] Update Comment Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// 9. Delete a Comment
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const numericId = parseInt(req.params.id);
    const actorId = req.query.actorId as string || req.body.actorId;
    const commentToDelete = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
    });

    await prisma.comment.delete({
      where: { id: req.params.commentId },
    });

    // Touch updatedAt
    await prisma.workOrder.update({
      where: { id: numericId },
      data: { updatedAt: new Date() }
    });

    if (commentToDelete) {
      await logGlobalAudit(
        actorId || commentToDelete.authorId,
        "COMMENT_DELETED_GHOST",
        `Permanently deleted comment on WO-${numericId} that read: "${commentToDelete.text}"`
      );
    }

    await redis.del(`workorder:single:${numericId}`).catch(() => {});
    res.status(204).send();
  } catch (error) {
    logger.error(`[WorkOrders] Delete Comment Error: ${(error as Error).message || error}`);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;