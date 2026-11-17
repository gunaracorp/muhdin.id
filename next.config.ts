import type { NextConfig } from "next";

/**
 * TRI-MODE BUILD (satu codebase, tiga target):
 *
 * 1. Lokal / VPS (default)      → output "standalone" + API routes Node.
 * 2. Vercel (VERCEL=1)          → tanpa "standalone": Vercel menangani
 *    packaging serverless-nya sendiri. Prisma client + file SQLite
 *    tetap ter-bundle via outputFileTracingIncludes.
 * 3. Shared hosting tanpa Node  → BUILD_STATIC=1 → output "export" murni
 *    (HTML/JS/CSS statis). API digantikan backend PHP (lihat shared-hosting/),
 *    dipaketkan oleh scripts/build-shared-hosting.mjs.
 */
const isStatic = process.env.BUILD_STATIC === "1";
const isVercel = process.env.VERCEL === "1";

const buildOutput = isStatic
  ? { output: "export" as const, images: { unoptimized: true } }
  : isVercel
    ? {}
    : { output: "standalone" as const };

const nextConfig: NextConfig = {
  ...buildOutput,
  typescript: {
    // Typecheck ketat: error TS harus diperbaiki sebelum build (sebelumnya true,
    // 56 error tersembunyi ikut ter-ship — semua sudah dibersihkan).
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // v12.4 «LUNAS» — pdfkit memuat font AFM via fs: jangan di-bundle.
  serverExternalPackages: ["pdfkit"],
  // Ramah shared hosting: tanpa header "X-Powered-By", respons di-gzip.
  poweredByHeader: false,
  compress: true,
  // Wajib untuk shared hosting & Vercel: pastikan seluruh Query Engine Prisma
  // (multi-platform: debian + rhel/CloudLinux/Vercel) dan file database SQLite
  // ikut ter-bundle, sehingga folder node_modules maupun .env tidak dibutuhkan
  // pada saat runtime.
  outputFileTracingIncludes: isStatic
    ? undefined
    : {
        "/**": ["./node_modules/.prisma/**", "./node_modules/pdfkit/**", "./db/custom.db"],
      },
};

export default nextConfig;
