import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import projectRoutes from './Routes/projectroutes.js';
import workorderRoutes from './Routes/workorders.js';
import pmRoutes from './Routes/pm.js';
import userRoutes from './Routes/users.js';
import locationRoutes from './Routes/locations.js';
import teamRoutes from './Routes/teams.js';

const prisma = new PrismaClient();
const app = express();
const PORT = 8080;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// --- AUTH ROUTES ---

// CREATE ACCOUNT (First Seat Rule Applied & Transaction Safe)
app.post("/api/auth/signup", async (req, res) => {
  const { organizationName, firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedOrgName = organizationName.trim();

    let org = await prisma.organization.findFirst({
      where: { 
        orgName: { // FIXED: changed 'name' to 'orgName'
          equals: normalizedOrgName,
          mode: 'insensitive' 
        }
      }
    });

    if (!org) {
      const result = await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: { orgName: normalizedOrgName } // FIXED: changed 'name' to 'orgName'
        });

        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            organizationId: newOrg.orgId, // FIXED: changed 'newOrg.id' to 'newOrg.orgId'
            role: 'ADMIN',
            approvalStatus: 'APPROVED'
          }
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
        organizationId: org.orgId, // FIXED: changed 'organization.id' to 'org.orgId'
        role: 'USER',
        approvalStatus: 'PENDING'
      }
    });

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- EXTERNAL ROUTERS ---
app.use('/api/projects', projectRoutes);
app.use('/api/workorders', workorderRoutes);
app.use('/api/pm', pmRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/teams', teamRoutes);

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));