import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate the next PM date
const calculateNextDate = (currentDate: Date, scheduleType: string): Date => {
  const nextDate = new Date(currentDate);
  if (scheduleType === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
  if (scheduleType === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
  if (scheduleType === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
  if (scheduleType === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
  if (scheduleType === "YEARLY")
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
};

// 1. Ensure the uploads directory exists on your computer
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. Configure Multer to save files with unique names
const storage = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: (arg0: null, arg1: string) => void) {
    cb(null, 'uploads/');
  },
  filename: function (req: any, file: { originalname: string; }, cb: (arg0: null, arg1: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// 3. Create the endpoint to receive the file
router.post('/:id/documents', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const document = await prisma.document.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        workOrderId: parseInt(req.params.id),
        uploaderId: req.body.uploaderId
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// 1. GET ALL work orders for an organization
router.get("/", async (req, res) => {
  const { orgId, userId } = req.query;

  if (!orgId || typeof orgId !== "string") {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    let whereClause: any = { organizationId: orgId };

    if (userId && typeof userId === "string") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (currentUser) {
        const globalHeadquarters = ["Pulseworks Shop", "Pulseworks Warehouse"];
        const userLocation = currentUser.siteLocation || "";
        
        // Check if user belongs to Pulseworks Shop or Warehouse, or is ADMIN
        const isGlobalUser = 
          currentUser.role === "ADMIN" || 
          globalHeadquarters.some(hq => userLocation.toLowerCase().includes(hq.toLowerCase()));

        // If NOT a global user, restrict strictly to their site location name matching creators, assignees, or location strings
        if (!isGlobalUser) {
          if (userLocation !== "") {
            const allowedLocations = userLocation.split(',').map(s => s.trim().toLowerCase());
            whereClause.OR = [
              { creator: { siteLocation: { in: allowedLocations, mode: 'insensitive' } } },
              { assignee: { siteLocation: { in: allowedLocations, mode: 'insensitive' } } }
            ];
          } else {
            whereClause.id = -99999; // No location assigned = block view
          }
        }
      }
    }

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        assignee: true,
        creator: true,
        asset: true,
        comments: true,
        activityLogs: true,
        preventiveMaintenance: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

// 3. POST to create a new work order
router.post("/", async (req, res) => {
  const { title, description, category, priority, organizationId, createdBy } =
    req.body;

  try {
    const newWorkOrder = await prisma.workOrder.create({
      data: {
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        organizationId,
        createdBy,
      },
      include: {
        creator: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "created the work order",
        workOrderId: newWorkOrder.id,
        actorId: createdBy,
      },
    });

    res.status(201).json(newWorkOrder);
  } catch (error) {
    console.error("Error creating work order:", error);
    res.status(500).json({ error: "Failed to create work order" });
  }
});

// 4. PUT to update a work order (AND TRIGGER PM AUTO-SPAWN)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { actorId, actionLog, ...updateData } = req.body;

  try {
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    if (actorId && actionLog) {
      await prisma.activityLog.create({
        data: {
          action: actionLog,
          workOrderId: parseInt(id),
          actorId,
        },
      });
    }

    if (
      (updateData.status === "COMPLETED" || updateData.status === "CLOSED") &&
      updatedWorkOrder.pmId
    ) {
      const pm = await prisma.preventiveMaintenance.findUnique({
        where: { id: updatedWorkOrder.pmId },
      });

      if (pm) {
        const nextDate = calculateNextDate(pm.nextDueDate, pm.scheduleType);

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
            assignedTo: pm.assigneeId,
            createdBy: updatedWorkOrder.createdBy,
            pmId: pm.id,
          },
        });
      }
    }

    res.status(200).json(updatedWorkOrder);
  } catch (error) {
    console.error("Error updating work order:", error);
    res.status(500).json({ error: "Failed to update work order" });
  }
});

// 5. POST to add a comment to a work order
router.post("/:id/comments", async (req, res) => {
  const { text, authorId } = req.body;
  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        authorId,
        workOrderId: parseInt(req.params.id),
      },
      include: { author: true },
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// 6. PUT to update the comment to a work order
router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { text }
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// 7. Delete the comments on the work order
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    await prisma.comment.delete({
      where: { id: req.params.commentId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;