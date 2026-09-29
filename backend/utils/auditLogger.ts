import prisma from "./prisma.js";

export async function logGlobalAudit(actorId: string, actionType: string, details: string) {
  try {
    if (!actorId) return;
    await prisma.globalAuditLog.create({
      data: {
        actorId,
        actionType,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to write global audit log:", error);
  }
}