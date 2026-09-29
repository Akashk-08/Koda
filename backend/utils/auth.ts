import prisma from "./prisma.js";

export const requireRoot = async (req, res, next) => {
  const { userId } = req.body; // Or get from JWT if you are using tokens
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || user.role !== "ROOT") {
    return res.status(403).json({ error: "Access Denied. Root privileges required." });
  }
  next();
};