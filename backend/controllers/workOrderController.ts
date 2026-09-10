// backend/controllers/workOrderController.ts
import { Request, Response } from "express";
import { notifyUser } from "../services/notificationService.js";

export const assignWorkOrder = async (req: Request, res: Response) => {
  const { workOrderId, assigneeId, assignerName } = req.body;

  // Trigger Notification
  await notifyUser(
    assigneeId,
    "New Work Order Assigned",
    `${assignerName} assigned a new work order to you.`,
    "WORK_ORDER",
    workOrderId,
  );

  res.status(200).json({ success: true });
};
