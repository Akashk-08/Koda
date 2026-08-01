import express from "express";
import { PrismaClient } from "@prisma/client";

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

// 1. GET ALL work orders for an organization
router.get("/", async (req, res) => {
  const { orgId } = req.query;

  if (!orgId || typeof orgId !== "string") {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const workOrders = await prisma.workOrder.findMany({
      where: { organizationId: orgId },
      include: {
        assignee: true,
        creator: true,
      },
      orderBy: { createdAt: "desc" }, // Newest tickets first
    });
    res.status(200).json(workOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

// 2. GET SINGLE work order details (for the Jira-style view)
router.get("/:id", async (req, res) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assignee: true,
        creator: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activityLogs: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!wo) return res.status(404).json({ error: "Work Order not found" });
    res.status(200).json(wo);
  } catch (err) {
    console.error("Error fetching work order:", err);
    res.status(500).json({ error: "Failed to fetch work order" });
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

    // Automatically create an activity log for the creation
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
  const { actorId, actionLog, ...updateData } = req.body; // Extract meta info separate from actual update data

  try {
    // A. Update the Work Order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // B. Log the Activity
    if (actorId && actionLog) {
      await prisma.activityLog.create({
        data: {
          action: actionLog,
          workOrderId: parseInt(id),
          actorId,
        },
      });
    }

    // C. --- PM AUTO-SPAWN LOGIC ---
    if (
      (updateData.status === "COMPLETED" || updateData.status === "CLOSED") &&
      updatedWorkOrder.pmId
    ) {
      const pm = await prisma.preventiveMaintenance.findUnique({
        where: { id: updatedWorkOrder.pmId },
      });

      if (pm) {
        // Calculate the next date
        const nextDate = calculateNextDate(pm.nextDueDate, pm.scheduleType);

        // Update the PM's tracking date
        await prisma.preventiveMaintenance.update({
          where: { id: pm.id },
          data: { nextDueDate: nextDate },
        });

        // Spawn the next Work Order for the future date
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

export default router;
