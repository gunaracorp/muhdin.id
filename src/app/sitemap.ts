/**
 * Task 19 (R-057) — sitemap.xml dinamis.
 *
 * Konten portal memakai hash routing (#/…) sehingga SPA hanya punya satu URL
 * kanonik; namun kini setiap paket & artikel punya landing page SSR nyata
 * (/paket/[slug], /artikel/[slug]) yang ikut diindeks — plus anchor utama
 * portal sebagai referensi navigasi.
 *
 * Query DB dilakukan saat build (force-static, kompatibel output "export")
 * dengan fallback aman bila DB tak tersedia — sitemap tetap valid.
 */
import type { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-static";

const db = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://muhdin.web.id").replace(/\/+$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/#/paket`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/#/verifikasi`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#/akademi`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#/berita`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/#/bantuan`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const packages = await db.tourPackage.findMany({
      where: { status: "PUBLISHED", slug: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    for (const p of packages) {
      entries.push({ url: `${base}/paket/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.9 });
    }
    const articles = await db.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
    for (const a of articles) {
      entries.push({ url: `${base}/artikel/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
    // R-089 — landing kampanye musiman aktif ikut terindeks.
    const campaigns = await db.campaign.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      take: 50,
    });
    for (const c of campaigns) {
      entries.push({ url: `${base}/kampanye/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    // DB tidak tersedia saat build (mis. CI) — sitemap tetap terbit dengan URL inti.
  } finally {
    await db.$disconnect().catch(() => undefined);
  }

  return entries;
}
