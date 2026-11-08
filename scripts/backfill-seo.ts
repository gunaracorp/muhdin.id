/**
 * backfill-seo.ts — Task 19 (R-057 + R-091).
 *
 * Mengisi field SEO yang baru ditambahkan pada data lama:
 *   • TourPackage.slug  ← slugify(title), dedupe dengan sufiks -2, -3, …
 *   • TourPackage.image ← gambar kurasi per jenis paket (fallback hotel-makkah)
 *   • Article.metaDescription ← excerpt (bila kosong)
 *   • Article.metaTitle / keywords ← title + kategori (bila kosong)
 *
 * Idempoten: hanya mengisi yang kosong; tidak pernah menimpa isian manual.
 * Jalankan: npx tsx scripts/backfill-seo.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const IMAGE_BY_TYPE: Record<string, string> = {
  UMROH: "/images/masjid-nabawi.jpg",
  HAJI: "/images/hero-kaaba.jpg",
  ZIARAH: "/images/city-madinah.png",
  WISATA_ISLAMI: "/images/haramain-train.jpg",
};

async function uniqueSlug(base: string, excludeId: string) {
  let slug = base || `paket-${Date.now().toString(36)}`;
  let n = 2;
  for (;;) {
    const clash = await db.tourPackage.findFirst({ where: { slug, NOT: { id: excludeId } } });
    if (!clash) return slug;
    slug = `${base}-${n++}`;
  }
}

async function main() {
  /* ---------- Paket: slug + image + metaDescription ---------- */
  const packages = await db.tourPackage.findMany({
    where: { OR: [{ slug: null }, { image: null }] },
    select: { id: true, title: true, type: true, city: true, durationDays: true, slug: true, image: true },
  });
  for (const p of packages) {
    const base = slugify(p.title).slice(0, 80);
    const data: Record<string, string> = {};
    if (!p.slug) data.slug = await uniqueSlug(base, p.id);
    if (!p.image) data.image = IMAGE_BY_TYPE[p.type] || "/images/hotel-makkah.jpg";
    await db.tourPackage.update({ where: { id: p.id }, data });
    console.log(`  paket ✓ ${p.title.slice(0, 44)} → ${data.slug ?? "(slug ada)"}`);
  }

  /* ---------- Artikel: metaTitle + metaDescription + keywords ---------- */
  const articles = await db.article.findMany({
    where: { OR: [{ metaTitle: null }, { metaDescription: null }, { keywords: null }] },
    select: { id: true, title: true, excerpt: true, category: true, metaTitle: true, metaDescription: true, keywords: true },
  });
  for (const a of articles) {
    const kwSeed = [a.category, "umroh", "haji", "MUHDIN", "travel umroh terpercaya"]
      .filter(Boolean)
      .join(", ");
    const data: Record<string, string> = {};
    if (!a.metaTitle) data.metaTitle = a.title.slice(0, 60);
    if (!a.metaDescription) data.metaDescription = a.excerpt.slice(0, 155);
    if (!a.keywords) data.keywords = kwSeed;
    await db.article.update({ where: { id: a.id }, data });
    console.log(`  artikel ✓ ${a.title.slice(0, 44)}`);
  }

  const pk = await db.tourPackage.count({ where: { slug: { not: null } } });
  const ar = await db.article.count({ where: { metaDescription: { not: null } } });
  console.log(`Selesai: ${pk} paket berslug, ${ar} artikel ber-meta.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
