import prisma from "./utils/prisma.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import projectRoutes from "./Routes/projectroutes.js";
import workorderRoutes from "./Routes/workorders.js";
import pmRoutes from "./Routes/pm.js";
import userRoutes from "./Routes/users.js";
import locationRoutes from "./Routes/locations.js";
import teamRoutes from "./Routes/teams.js";
import Calendar from "./Routes/calendar.js";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./Routes/inventory.js";
import assetRoutes from "./Routes/assets.js";
import notificationRoutes from "./Routes/notifications.js"; 
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger.js";
import logRoutes from "./Routes/logs.js";
import analyticsRouter from "./Routes/analytics.js";
import exportRoutes from "./Routes/export.js";
import categoryRoutes from "./Routes/categories.js";
import machineRoutes from "./Routes/machines.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://pulseworkscmms.vercel.app",
    "https://cmms.pulseworks.com", 
    "http://cmms.pulseworks.com",  
    /\.vercel\.app$/, 
    "capacitor://localhost",
    "http://localhost",
    "http://192.168.1.49:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, 
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// HEALTH CHECK ROUTE (Keeps UptimeRobot Green & Prevents Render Cold Starts)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Pulseworks CMMS backend is active and running!" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many login attempts, please try again after 15 minutes", 
  keyGenerator: (req, res) => {
    return req.body.email ? req.body.email.toLowerCase() : req.ip || "unknown-ip";
  },
});
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// AUTH ROUTES
app.post("/api/auth/signup", async (req, res) => {
  const { organizationName, firstName, lastName, email, password } = req.body;

  try {
    const existingUsers = await prisma.user.findMany({ where: { email } });
    if (existingUsers.length > 0) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedOrgName = organizationName.trim();

    let org = await prisma.organization.findFirst({
      where: {
        orgName: {
          equals: normalizedOrgName,
          mode: "insensitive",
        },
      },
    });

    if (!org) {
      const result = await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: { orgName: normalizedOrgName },
        });

        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            organizationId: newOrg.orgId,
            role: "ADMIN",
            approvalStatus: "APPROVED",
          },
        });
        return { user: newUser, org: newOrg };
      });

      return res.status(201).json({ user: result.user });
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        organizationId: org.orgId,
        role: "USER",
        approvalStatus: "PENDING",
      },
    });

    try {
      const admins = await prisma.user.findMany({
        where: {
          organizationId: org.orgId,
          role: "ADMIN",
        },
      });

      const adminEmails = admins.map((admin) => admin.email);

      // Only attempt email delivery if credentials are provided on the server
      if (adminEmails.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
          to: adminEmails, 
          subject: "New Workspace Access Request - Pulseworks CMMS",
          html: `
            <h3>New Access Request</h3>
            <p><strong>${firstName} ${lastName}</strong> (${email}) has requested access to join your workspace.</p>
            <p>Please log in to the <a href="https://pulseworkscmms.vercel.app/#/resources/accessrequests">Pulseworks CMMS dashboard</a> to approve or reject this request.</p>
          `,
        };
        
        await transporter.sendMail(mailOptions);
        logger.info(`Admin notification email sent for new user: ${email}`);
      } else {
        logger.warn(`Skipped admin email notification: EMAIL_USER or EMAIL_PASS environment variables are not configured.`);
      }
    } catch (emailErr) {
      logger.error(`Failed to send admin notification email: ${(emailErr as Error).message}`);
    }

    res.status(201).json({ user: newUser });
  } catch (error) {
    logger.error(`Signup error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await prisma.user.findMany({ where: { email } });

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, users[0].password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    if (users.length > 1) {
      const approvedProfiles = users
        .filter((u) => u.approvalStatus === "APPROVED")
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        }));
      return res.status(200).json({ profiles: approvedProfiles });
    }

    const user = users[0];

    if (user.approvalStatus === "PENDING") {
      return res.status(403).json({ error: "Your account is pending admin approval." });
    }
    if (user.approvalStatus === "REJECTED") {
      return res.status(403).json({ error: "Your account access was denied." });
    }

    res.status(200).json({
      message: "Success",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
        siteLocation: user.siteLocation,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${(error as Error).message}`);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/verify-pin", loginLimiter, async (req, res) => {
  const { email, profileId, pin } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: profileId } });

    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (user.pin === pin) {
      if (user.approvalStatus === "PENDING") {
        return res.status(403).json({ error: "Your account is pending admin approval." });
      }
      if (user.approvalStatus === "REJECTED") {
        return res.status(403).json({ error: "Your account access was denied." });
      }

      return res.status(200).json({
        message: "Success",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
          siteLocation: user.siteLocation,
        },
      });
    }

    return res.status(401).json({ error: "Incorrect PIN. Please try again." });
  } catch (error) {
    logger.error(`PIN verification error: ${(error as Error).message}`);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: "If an account exists, a code has been sent." });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.updateMany({
      where: { email },
      data: { resetCode, resetCodeExpiry },
    });

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your Pulseworks Password Reset Code",
          text: `Your password reset code is: ${resetCode}. It will expire in 15 minutes.`,
        };
        await transporter.sendMail(mailOptions);
      }
    } catch (emailErr) {
      logger.warn(`Warning: Could not send actual email via Gmail, check terminal configuration.`);
    }

    res.status(200).json({ message: "Code sent successfully." });
  } catch (error) {
    logger.error(`Forgot password error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.post("/api/auth/verify-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const users = await prisma.user.findMany({ where: { email } });

    if (!users || users.length === 0 || users[0].resetCode !== code) {
      return res.status(400).json({ error: "Invalid or incorrect code." });
    }

    if (!users[0].resetCodeExpiry || users[0].resetCodeExpiry < new Date()) {
      return res.status(400).json({ error: "Code has expired. Please request a new one." });
    }

    res.status(200).json({ message: "Code verified successfully." });
  } catch (error) {
    logger.error(`Verify code error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to verify code." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const users = await prisma.user.findMany({ where: { email } });

    if (
      !users ||
      users.length === 0 ||
      users[0].resetCode !== code ||
      (users[0].resetCodeExpiry && users[0].resetCodeExpiry < new Date())
    ) {
      return res.status(400).json({ error: "Invalid or expired session." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.updateMany({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    logger.error(`Reset password error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

app.post("/api/auth/get-profiles", async (req, res) => {
  const { email } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        email: email,
        approvalStatus: "APPROVED",
      },
    });

    const profiles = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
    res.status(200).json({ profiles });
  } catch (error) {
    logger.error(`Get profiles error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// ADMIN: ADD A SHARED PROFILE
app.post("/api/auth/add-shared-profile", async (req, res) => {
  const { baseEmail, userId, pin } = req.body;

  try {
    const sourceUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!sourceUser) return res.status(404).json({ error: "Selected user not found in system." });

    const newSharedUser = await prisma.user.create({
      data: {
        firstName: sourceUser.firstName,
        lastName: sourceUser.lastName,
        email: baseEmail,
        password: sourceUser.password,
        organizationId: sourceUser.organizationId,
        siteLocation: sourceUser.siteLocation,
        role: sourceUser.role,
        autoAssignCategories: sourceUser.autoAssignCategories,
        approvalStatus: "APPROVED",
        pin: pin,
      },
    });

    res.status(201).json({ message: "Shared profile added!", user: newSharedUser });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "This user is already linked to this terminal email." });
    }
    logger.error(`Add Shared Profile Error: ${error.message}`);
    res.status(500).json({ error: "Failed to add shared profile." });
  }
});

app.put("/api/users/:id/pin", async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { pin: pin },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(`PIN update error: ${(error as Error).message}`);
    res.status(500).json({ error: "Failed to update PIN" });
  }
});

// EXTERNAL ROUTERS
app.use("/api/projects", projectRoutes);
app.use("/api/workorders", workorderRoutes);
app.use("/api/pm", pmRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/calendar", Calendar);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/notifications", notificationRoutes); 
app.use("/api/analytics", analyticsRouter);
app.use("/api/export", exportRoutes);
app.use("/api/equipment-categories", categoryRoutes);
app.use("/api/machine-types", machineRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(
    `[Unhandled Exception] ${req.method} ${req.url} - ${err.message}\nStack Trace: ${err.stack}`,
  );
  res.status(500).json({ error: "An unexpected internal server error occurred." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(` Backend server is actively running on port ${PORT}`);
});

export default app;