/**
 * R-061 — Seed khusus E2E (idempoten, aman dijalankan berulang).
 *
 * Menyiapkan data minimum jalur kritis:
 *   • 1 Member penyelenggara + 1 TourPackage PUBLISHED (untuk katalog & checkout)
 *   • 1 Certificate (untuk verifikasi publik sertifikat R-022)
 *   • 1 akun admin E2E — HANYA bila env E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD
 *     diisi (di CI dari GitHub Secrets; kredensial tak pernah di-commit).
 *
 * Dipakai oleh: CI (.github/workflows/ci.yml) & `npx playwright test` lokal.
 * Note: hash password ditulis inline (scrypt, sama formatnya dengan lib/auth)
 * agar skrip tetap mandiri tanpa mengimpor modul next/headers.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const MEMBER_ID = "e2e-member-gerbang";
const PKG_SLUG = "e2e-paket-gerbang";

async function main() {
  // 1) Member penyelenggara
  await db.member.upsert({
    where: { id: MEMBER_ID },
    update: { status: "TERVERIFIKASI" },
    create: {
      id: MEMBER_ID,
      name: "Travel E2E GERBANG",
      type: "PPIU",
      city: "Jakarta",
      province: "DKI Jakarta",
      licenseNo: "E2E-UJK-0001",
      email: "e2e@muhdin.test",
      status: "TERVERIFIKASI",
      memberSince: 2026,
    },
  });

  // 2) Paket publik untuk katalog + checkout
  const pkg = await db.tourPackage.upsert({
    where: { slug: PKG_SLUG },
    update: { status: "PUBLISHED", price: 28_500_000, slots: 40 },
    create: {
      memberId: MEMBER_ID,
      title: "Paket E2E Umroh GERBANG 9 Hari",
      slug: PKG_SLUG,
      type: "UMROH",
      city: "Jakarta",
      description:
        "Paket khusus pengujian otomatis E2E (Playwright) — jalur kritis katalog hingga checkout. Data ini aman dihapus.",
      price: 28_500_000,
      durationDays: 9,
      slots: 40,
      slotsTaken: 2,
      hotelMakkah: "Hotel E2E Makkah",
      hotelMadinah: "Hotel E2E Madinah",
      airline: "Garuda E2E",
      status: "PUBLISHED",
      metaDescription: "Paket uji E2E MUHDIN — checkout jalur kritis.",
    },
  });

  // 3) Sertifikat untuk verifikasi publik
  await db.certificate.upsert({
    where: { code: "SERT-2026-99990001" },
    update: {},
    create: {
      code: "SERT-2026-99990001",
      holderName: "Ahmad E2E Tester",
      courseSlug: "manasik-e2e",
      courseTitle: "Kelas Manasik E2E",
      score: 92,
    },
  });

  // 3b) Kampanye musiman untuk landing SSR (R-089)
  await db.campaign.upsert({
    where: { slug: "kampanye-e2e-gerbang" },
    update: { active: true },
    create: {
      slug: "kampanye-e2e-gerbang",
      title: "Kampanye E2E GERBANG — Umroh Ramadan",
      season: "RAMADAN",
      subtitle: "Seed uji otomatis landing kampanye musiman.",
      description:
        "Kampanye khusus pengujian otomatis (Playwright) untuk jalur landing kampanye & lead. Data ini aman dihapus.",
      ctaText: "Daftar Sekarang",
      active: true,
    },
  });

  // 4) Admin E2E (opsional, env-gated)
  const email = process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.E2E_ADMIN_PASSWORD || "";
  if (email && password.length >= 8) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      await db.user.update({
        where: { email },
        data: { password: hashPassword(password), isActive: true, role: "SUPER_ADMIN" },
      });
      console.log(`admin e2e diperbarui: ${email}`);
    } else {
      await db.user.create({
        data: {
          email,
          password: hashPassword(password),
          name: "E2E Admin",
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
      console.log(`admin e2e dibuat: ${email}`);
    }
  } else {
    console.log("env E2E_ADMIN_EMAIL/PASSWORD kosong — pembuatan admin dilewati (spec login akan skip).");
  }

  console.log(`seed e2e OK — paket: ${pkg.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
