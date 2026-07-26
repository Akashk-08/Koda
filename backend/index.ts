import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const app = express();
const PORT = 8080;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// --- AUTH ROUTES ---
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { organizationName, firstName, lastName, email, password } = req.body;
    if (!email || !password || !organizationName)
      return res.status(400).json({ error: "Missing fields" });

    const normalizedOrgName = organizationName.trim().toLowerCase();
    let org = await prisma.organization.findFirst({
      where: { name: { equals: normalizedOrgName, mode: "insensitive" } },
    });

    if (!org)
      org = await prisma.organization.create({
        data: { name: normalizedOrgName },
      });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        organizationId: org.id,
      },
    });

    res.status(201).json({
      message: "User created",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        organizationId: newUser.organizationId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    res.status(200).json({
      message: "Success",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- ORG USERS ---
app.get("/api/users/:orgId", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.params.orgId },
      select: { id: true, firstName: true, lastName: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// --- WORK ORDER ROUTES ---
app.get("/api/workorders", async (req, res) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(workOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// GET SINGLE WORK ORDER
app.get("/api/workorders/:id", async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) }, // Note: Parsing Int for sequential IDs
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });
    if (!workOrder) return res.status(404).json({ error: "Not found" });
    res.json(workOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// CREATE A NEW WORK ORDER
app.post("/api/workorders", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      organizationId,
      createdBy,
    } = req.body;
    const newWO = await prisma.workOrder.create({
      data: {
        title,
        description,
        category: category || null,
        priority: priority || "MEDIUM",
        organizationId,
        createdBy,
        status: "OPEN",
      },
    });
    res.status(201).json(newWO);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// Edit an existing Work Order
app.get("/api/workorders/edit/:id", async (req, res) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    if (!workOrder) {
      return res
        .status(404)
        .json({ error: "Work order not found for editing" });
    }

    res.status(200).json(workOrder);
  } catch (error) {
    console.error("Failed to fetch work order for editing:", error);
    res.status(500).json({ error: "Server error fetching work order" });
  }
});

// update an Existing Work Order
app.put("/api/workorders/:id", async (req, res) => {
  try {
    const { title, description, category, priority, status } = req.body;

    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        category,
        priority,
        status,
      },
    });

    res.status(200).json(updatedWorkOrder);
  } catch (error) {
    console.error("Failed to update work order:", error);
    res.status(500).json({ error: "Failed to update work order" });
  }
});

// POST A NEW COMMENT
app.post("/api/workorders/:id/comments", async (req, res) => {
  try {
    const { text, authorId } = req.body;
    const woId = parseInt(req.params.id);

    // 1. Create the comment
    await prisma.comment.create({
      data: {
        text: text,
        authorId: authorId,
        workOrderId: woId,
      },
    });

    // 2. Log the activity
    await prisma.activityLog.create({
      data: {
        action: "added a comment",
        actorId: authorId,
        workOrderId: woId,
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save comment" });
  }
});

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
