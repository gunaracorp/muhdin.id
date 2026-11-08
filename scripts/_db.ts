/**
 * Helper bersama untuk skrip seed lama (seed-v5, dst.) — satu koneksi Prisma.
 * Dipanggil lewat `makeDb()`; tsx tidak butuh tsconfig include.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function makeDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
