// prisma.config.ts — konfigurasi Prisma v8 (wajib sejak v7).
// Menggantikan konfigurasi lama di package.json#prisma & auto-load .env.
// v11.1 — dotenv dipanggil dengan override:true agar .env SELALU menang
// atas env var warisan sandbox/server (kasus nyata: DATABASE_URL=file:...
// terbawa dari boot container sehingga CLI salah sasaran).
// Sumber kebenaran kini Prisma Postgres cloud (.env → DATABASE_URL).
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ override: true });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Clone bersih tanpa .env → gunakan URL placeholder lokal agar pesan
    // error jelas ("connection refused"), bukan P1013 protokol salah.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/postgres",
  },
});
