import prisma from "../utils/prisma.js";
import express from "express";

const router = express.Router();

// 1. CREATE A NEW PROJECT
router.post("/", async (req, res) => {
  const { title, description, organizationId, ownerId, contributorIds } = req.body;

  try {
    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        organizationId,
        ownerId,
        // Connect the array of user IDs to the contributors relation
        contributors: {
          connect: (contributorIds || []).map((id: string) => ({ id })),
        },
      },
      // Return the owner and contributors data so the frontend can display them immediately
      include: {
        owner: true,
        contributors: true,
      },
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// 2. GET ALL PROJECTS FOR AN ORGANIZATION
router.get("/", async (req, res) => {
  const { orgId } = req.query;

  if (!orgId || typeof orgId !== "string") {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        owner: true,
        contributors: true,
        comments: {
          include: {
            author: true, // Include the user details who wrote the comment
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// 3. ADD A COMMENT TO A PROJECT
router.post("/:id/comments", async (req, res) => {
  const { id } = req.params; // Project ID
  const { text, authorId } = req.body;

  try {
    const newComment = await prisma.projectComment.create({
      data: {
        text,
        projectId: id,
        authorId,
      },
      include: {
        author: true, // Return author details so the frontend can show the avatar/name
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// 4. UPDATE A PROJECT (Status, Dates, Risks, Decisions)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, startDate, endDate, risks, decisions } = req.body;

  try {
    // Explicitly build the update object to satisfy TypeScript and Prisma
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Prisma requires { set: array } syntax to completely update scalar lists
    if (risks !== undefined) updateData.risks = { set: risks };
    if (decisions !== undefined) updateData.decisions = { set: decisions };

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        contributors: true,
        comments: { include: { author: true } },
      },
    });
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

export default router;
