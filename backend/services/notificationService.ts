// backend/services/notificationService.ts
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';

const prisma = new PrismaClient();

// Initialize Firebase Admin using the JSON file referenced in your .env
if (!getApps().length) {
  initializeApp({
    credential: cert(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './google-service-account.json'))
  });
}

// Update to use EMAIL_USER and EMAIL_PASS from your .env
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

export const notifyUser = async (userId: string, title: string, message: string, type: string, referenceId?: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // 1. Save to In-App Database
    await prisma.notification.create({
      data: { userId, title, message, type, referenceId }
    });

    // 2. Send Email
    await transporter.sendMail({
      from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: title,
      html: `<p><b>${title}</b></p><p>${message}</p><a href="https://yourdomain.com/workspace/workorder/${referenceId}">View Work Order</a>`
    });

    // 3. Send Mobile Push (if device token exists)
    if (user.deviceToken) {
      await getMessaging().send({
        token: user.deviceToken,
        notification: { title, body: message },
        data: { type, referenceId: referenceId || '' }
      });
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};