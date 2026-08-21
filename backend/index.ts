import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
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
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = 8080;

const corsOptions = {
  origin: [
    "http://localhost:5173", // Your React Web App
    "capacitor://localhost", // Capacitor iOS App
    "http://localhost", // Capacitor Android App
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// Block specific accounts after 100 failed login attempts for 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many login attempts, please try again after 15 minutes",
  },
  keyGenerator: (req, res) => {
    // If there is an email, track that. Otherwise, safely track the IP using the default helper.
    return req.body.email
      ? req.body.email.toLowerCase()
      : defaultKeyGenerator(req, res);
  },
});

// INCREASED LIMITS MOVED TO THE TOP
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve your images!

// AUTH ROUTES
// CREATE ACCOUNT (First Seat Rule Applied & Transaction Safe)
app.post("/api/auth/signup", async (req, res) => {
  const { organizationName, firstName, lastName, email, password } = req.body;

  try {
    // Note: If you allow multiple users per email in your schema later,
    // you might need to adjust this check.
    // Currently checks if ANY user exists with this email for signup.
    const existingUsers = await prisma.user.findMany({ where: { email } });
    if (existingUsers.length > 0)
      return res.status(400).json({ error: "Email already in use" });

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

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// LOGIN (UPDATED FOR MULTI-PROFILE SUPPORT)
// RATE LIMITER TEMPORARILY REMOVED FOR TESTING
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch all users associated with this email
    const users = await prisma.user.findMany({ where: { email } });

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check the password against the first user record
    const isValid = await bcrypt.compare(password, users[0].password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    // Shared MODE: If multiple profiles exist, return a list to the frontend
    if (users.length > 1) {
      // Filter out pending/rejected accounts from the UI selection screen
      const approvedProfiles = users
        .filter((u) => u.approvalStatus === "APPROVED")
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        }));
      return res.status(200).json({ profiles: approvedProfiles });
    }

    // STANDARD MODE: Only 1 user found, log them in directly
    const user = users[0];

    if (user.approvalStatus === "PENDING") {
      return res
        .status(403)
        .json({ error: "Your account is pending admin approval." });
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
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// VERIFY PIN (NEW FOR Shared MODE)
app.post("/api/auth/verify-pin", async (req, res) => {
  const { email, profileId, pin } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: profileId } });

    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (user.pin === pin) {
      if (user.approvalStatus === "PENDING") {
        return res
          .status(403)
          .json({ error: "Your account is pending admin approval." });
      }
      if (user.approvalStatus === "REJECTED") {
        return res
          .status(403)
          .json({ error: "Your account access was denied." });
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
    console.error("PIN verification error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//  EMAIL TRANSPORTER CONFIGURATION
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. REQUEST PASSWORD RESET
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    // If multiple users share an email, findFirst ensures we update at least the primary account holder
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If an account exists, a code has been sent." });
    }

    // Generate a random 4-digit code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save to database (updates all users sharing this email)
    await prisma.user.updateMany({
      where: { email },
      data: { resetCode, resetCodeExpiry },
    });

    console.log(`\n==================================================`);
    console.log(`🔐 PASSWORD RESET CODE FOR ${email}: [ ${resetCode} ]`);
    console.log(`==================================================\n`);

    try {
      const mailOptions = {
        from: `"Pulseworks CMMS" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Pulseworks Password Reset Code",
        text: `Your password reset code is: ${resetCode}. It will expire in 15 minutes.`,
      };
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email successfully sent to ${email}`);
    } catch (emailErr) {
      console.warn(
        `⚠️ Warning: Could not send actual email via Gmail, code is in terminal!`,
      );
    }

    res.status(200).json({ message: "Code sent successfully." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

// 2. VERIFY THE 4-DIGIT CODE
app.post("/api/auth/verify-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const users = await prisma.user.findMany({ where: { email } });

    if (!users || users.length === 0 || users[0].resetCode !== code) {
      return res.status(400).json({ error: "Invalid or incorrect code." });
    }

    if (!users[0].resetCodeExpiry || users[0].resetCodeExpiry < new Date()) {
      return res
        .status(400)
        .json({ error: "Code has expired. Please request a new one." });
    }

    res.status(200).json({ message: "Code verified successfully." });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ error: "Failed to verify code." });
  }
});

// 3. SET THE NEW PASSWORD
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

    // Update password for all accounts sharing this email
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
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// 1. FETCH PROFILES FOR QUICK-SWITCHING
app.post("/api/auth/get-profiles", async (req, res) => {
  const { email } = req.body;
  try {
    // Only fetch users that are actually APPROVED
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
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// 2. ADMIN: ADD A SHARED PROFILE
app.post("/api/auth/add-shared-profile", async (req, res) => {
  const { baseEmail, firstName, lastName, pin } = req.body;

  try {
    const baseUser = await prisma.user.findFirst({
      where: { email: baseEmail },
    });
    if (!baseUser)
      return res.status(404).json({ error: "Base email not found in system." });

    const newSharedUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: baseEmail, // Share the same email
        password: baseUser.password, // Clone the hashed password
        organizationId: baseUser.organizationId,
        role: "USER",
        approvalStatus: "APPROVED",
        pin: pin,
      },
    });

    res
      .status(201)
      .json({ message: "Shared profile added!", user: newSharedUser });
  } catch (error) {
    console.error("Add Shared Profile Error:", error);
    res.status(500).json({ error: "Failed to add shared profile." });
  }
});

// PUT: Update User PIN
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
    console.error("PIN update error:", error);
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

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

function defaultKeyGenerator(
  req: express.Request<
    ParamsDictionary,
    any,
    any,
    ParsedQs,
    Record<string, any>
  >,
  res: express.Response<any, Record<string, any>>,
): string | Promise<string> {
  throw new Error("Function not implemented.");
}
