import prisma from "./utils/prisma.js";
import logger from "./utils/logger.js";


async function cleanDuplicates() {
  logger.info("[CleanDuplicates] Scanning for duplicates...");

  try {
    // 1. Remove duplicate Assets (keeping the oldest one by createdAt)
    const duplicates = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name, COALESCE(serial_number, '') ORDER BY created_at ASC) as rnum
        FROM assets
      ) t
      WHERE t.rnum > 1;
    `;

    if (duplicates.length > 0) {
      const idsToDelete = duplicates.map((d) => d.id);
      await prisma.asset.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      logger.info(`[CleanDuplicates] Successfully removed ${duplicates.length} duplicate assets.`);
    } else {
      logger.info("[CleanDuplicates] No duplicate assets found.");
    }

    logger.info("[CleanDuplicates] Database cleanup complete!");
  } catch (error) {
    logger.error(`[CleanDuplicates] Error cleaning duplicates: ${(error as Error).message || error}`);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();