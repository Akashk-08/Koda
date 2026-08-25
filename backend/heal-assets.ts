import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

// Your exact Prisma Enum Categories to prevent database crashes!
const VALID_CATEGORIES = [
  "ANNUAL_PREVENTIVE_MAINTENANCE",
  "ASSETS",
  "LARGE_DAMAGE",
  "PARTS_REQUEST",
  "PROJECT_UPGRADE",
  "SIX_MONTH_PREVENTIVE_MAINTENANCE",
  "SUPPORT_REQUEST",
  "WEEKLY_MONTHLY_CHECKLISTS",
];

async function healDatabase() {
  console.log("Reading upkeep-assets.csv and checking database...");
  const results: any[] = [];

  fs.createReadStream("upkeep-assets.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      let updateCount = 0;

      for (const row of results) {
        if (!row["Name"]) continue;

        try {
          // Find the existing asset in your database by its Name
          const existingAssets = await prisma.asset.findMany({
            where: { name: row["Name"] },
          });

          // If we found it, update the missing fields!
          if (existingAssets.length > 0) {
            // Some CSV categories (like "PC" or "VR Sim") aren't in your official ENUM list.
            // This safely maps them so Prisma doesn't throw a 500 Crash error.
            let rawCategory = row["Category"]
              ? row["Category"].trim().replace(/ /g, "_").toUpperCase()
              : null;
            let safeCategory = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : null;

            await prisma.asset.update({
              where: { id: existingAssets[0].id },
              data: {
                locationName: row["Location Name"] ? row["Location Name"].trim() : null,
                category: safeCategory,
                serialNumber: row["Serial Number"] ? row["Serial Number"].trim() : null,
                barcode: row["Barcode"] ? row["Barcode"].trim() : null,
                model: row["Model"] ? row["Model"].trim() : null,
              },
            });

            updateCount++;
            if (updateCount % 50 === 0) console.log(`Healed ${updateCount} records...`);
          }
        } catch (error) {
          console.error(`Skipped ${row["Name"]} due to an error.`);
        }
      }

      console.log(`\n SUCCESS! Healed ${updateCount} assets. Go refresh your browser!`);
      await prisma.$disconnect();
    });
}

healDatabase();
