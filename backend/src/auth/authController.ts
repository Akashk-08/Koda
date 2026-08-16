import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  // 1. Extract organizationId from the request body
  const { firstName, lastName, email, password, organizationId } = req.body;

  // 2. Safety check: Reject the request if no organization is provided
  if (!organizationId) {
    return res
      .status(400)
      .json({ error: "organizationId is required to create a user." });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        organizationId, // 3. Pass the required organizationId to Prisma
      },
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("SIGNUP DB ERROR:", error);
    if (error.code === "P2002") {
      res.status(400).json({ error: "A user with this email already exists." });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Force Prisma to fetch specific columns, INCLUDING siteLocation
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        organizationId: true,
        siteLocation: true,
        password: true, // Required for bcrypt to compare
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2. Strip the password out before sending to frontend
    const { password: _, ...safeUser } = user;

    // ADD THIS LINE TO VERIFY:
    console.log("Backend is sending this user data to React:", safeUser);

    res.json({ message: "Login successful", user: safeUser });
  } catch (error) {
    console.error("LOGIN DB ERROR:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
