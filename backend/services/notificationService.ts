import prisma from "../utils/prisma.js";
// backend/services/notificationService.ts
import nodemailer from "nodemailer";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "path";

// Initialize Firebase Admin using the JSON file referenced in your .env
if (!getApps().length) {
  initializeApp({
    credential: cert(
      path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || "./google-service-account.json"),
    ),
  });
}

// Update to use EMAIL_USER and EMAIL_PASS from your .env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const notifyUser = async (
  userIdOrEmailOrName: string,
  title: string,
  message: string,
  type: string,
  referenceId?: string,
) => {
  try {
    if (!userIdOrEmailOrName) return;

    // Robust user lookup supporting ID, Email, or Name fallback
    let user = await prisma.user.findUnique({ where: { id: userIdOrEmailOrName } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: userIdOrEmailOrName } });
    }

    if (!user) {
      // Try finding by name if ID/email didn't match
      const users = await prisma.user.findMany();
      user = users.find(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase() === userIdOrEmailOrName.toLowerCase() ||
        u.firstName?.toLowerCase() === userIdOrEmailOrName.toLowerCase()
      ) || null;
    }

    if (!user) {
      console.warn(`[NotificationService] Could not resolve user for target: ${userIdOrEmailOrName}`);
      return;
    }

    // 1. Save to In-App Database using the resolved user's actual ID
    await prisma.notification.create({
      data: { 
        userId: user.id, 
        title, 
        message, 
        type, 
        referenceId: referenceId ? String(referenceId) : null 
      },
    });

    // 2. Send Email
    if (user.email) {
      await transporter.sendMail({
        from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: title,
        html: `<p><b>${title}</b></p><p>${message}</p><a href="https://pulseworkscmms.vercel.app/#/workspace/workorder/${referenceId}">View Work Order</a>`,
      });
    }

    // 3. Send Mobile Push (if device token exists)
    if (user.deviceToken) {
      await getMessaging().send({
        token: user.deviceToken,
        notification: { title, body: message },
        data: { type, referenceId: referenceId ? String(referenceId) : "" },
      });
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};