import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

// Initialize the pure-JS connection pool
const pool = new Pool({ connectionString });

// Pass the pool to the Prisma adapter
const adapter = new PrismaPg(pool);

// Export a single, globally shared Prisma instance
const prisma = new PrismaClient({ adapter });
export default prisma;
