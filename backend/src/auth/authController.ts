import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Basic User Creation (No organization or role link required by your current schema)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid email or password" });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ message: "Login successful", user: safeUser });
  } catch (error) {
    console.error("LOGIN DB ERROR:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
