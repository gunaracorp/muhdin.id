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
  // v14.0 «KAMPANYE & KAWAL» — R-080 Pentest Berkala (temuan A1–A4):
  // header keamanan dasar untuk seluruh halaman & API. Tidak berlaku pada
  // build statis (output: export) — di sana header diset di server web
  // (Caddy/nginx, lihat PANDUAN-SHARED-HOSTING.md).
  ...(isStatic
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Frame-Options", value: "DENY" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
              ],
            },
          ];
        },
      }),
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
