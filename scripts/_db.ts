import { PrismaClient } from "@prisma/client";
import path from "node:path";

/**
 * PrismaClient untuk skrip seed/maintenance (dipakai seed-v5 dkk.).
 * DATABASE_URL eksplisit dihormati; default: db/custom.db di root proyek
 * (pola sama dengan src/lib/db.ts).
 */
export function makeDb(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), "db", "custom.db")}`;
  }
  return new PrismaClient();
}
