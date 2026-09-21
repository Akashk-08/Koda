import prisma from "../utils/prisma.js";
import nodemailer from "nodemailer";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "path";

if (!getApps().length) {
  initializeApp({
    credential: cert(
      path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || "./google-service-account.json"),
    ),
  });
}

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

    let user = await prisma.user.findUnique({ where: { id: userIdOrEmailOrName } }).catch(() => null);

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: userIdOrEmailOrName.trim().toLowerCase(), mode: 'insensitive' } }
      });
    }

    if (!user) {
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

    await prisma.notification.create({
      data: { 
        userId: user.id, 
        title, 
        message, 
        type, 
        referenceId: referenceId ? String(referenceId) : null 
      },
    });

    if (user.email) {
      await transporter.sendMail({
        from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: title,
        html: `<p><b>${title}</b></p><p>${message}</p><a href="https://pulseworkscmms.vercel.app/#/workspace/workorder/${referenceId}">View Work Order</a>`,
      });
    }

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