import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  // 1. Extract organizationId from the request body
  const { firstName, lastName, email, password, organizationId } = req.body;

  // 2. Safety check: Reject the request if no organization is provided
  if (!organizationId) {
    return res.status(400).json({ error: "organizationId is required to create a user." });
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
    // 1. Use findMany instead of findUnique to support multiple profiles under one email
    // NOTE: Make sure `email String @unique` is changed to `email String` in schema.prisma if you allow duplicates!
    const users = await prisma.user.findMany({
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
        pin: true,
      },
    });

    // 2. If no users are found with that email
    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Validate password against the first user found
    // (Assuming all users sharing an email share the same terminal password)
    const isPasswordValid = await bcrypt.compare(password, users[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 4. KIOSK MODE CHECK: If multiple users share this email, return the profile list
    if (users.length > 1) {
      const profiles = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
      }));

      return res.status(200).json({ profiles }); // Frontend will switch to "select_profile" mode
    }

    // 5. STANDARD LOGIN: Only one user found, strip password and log them in directly
    const { password: _, ...safeUser } = users[0];

    console.log("Backend is sending this user data to React:", safeUser);

    return res.json({ message: "Login successful", user: safeUser });
  } catch (error) {
    console.error("LOGIN DB ERROR:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Verify PIN after selecting a profile in shared Mode
export const verifyPin = async (req: Request, res: Response) => {
  const { email, profileId, pin } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        organizationId: true,
        siteLocation: true,
        pin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if ((user as any).pin === pin) {
      console.log(`PIN verified for ${user.firstName}. Sending data to React.`);
      return res.status(200).json({ message: "PIN verified", user });
    }

    return res.status(401).json({ error: "Incorrect PIN. Please try again." });
  } catch (error) {
    console.error("VERIFY PIN DB ERROR:", error);
    res.status(500).json({ error: "PIN verification failed" });
  }
};
