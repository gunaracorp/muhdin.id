/**
 * Fase 1 — Runner pengayaan data demo MUHDIN v5.
 * Idempoten: setiap item diperiksa dulu (licenseNo/slug/kode/judul) — skip bila sudah ada.
 * Jalankan: bun scripts/seed-v5/run.ts
 */
import { makeDb } from "./_db";
import { NEW_MEMBERS } from "./members";
import { NEW_ARTICLES } from "./articles";
import { NEW_EVENTS, NEW_GALLERY, NEW_TESTIMONIALS, NEW_BRANCHES } from "./misc";

const db = makeDb()

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const daysAgoDate = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const inDaysDate = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

async function main() {
  console.log("=== MUHDIN v5 — PENGAYAAN DATA DEMO ===\n");

  // ---------- MEMBERS ----------
  let mAdd = 0;
  for (const m of NEW_MEMBERS) {
    const exists = await db.member.findFirst({ where: { licenseNo: m.licenseNo } });
    if (exists) continue;
    await db.member.create({ data: { ...m } });
    mAdd++;
  }
  console.log(`Member   : +${mAdd} baru (total ${await db.member.count()})`);

  // ---------- ARTICLES ----------
  let aAdd = 0;
  for (const a of NEW_ARTICLES) {
    const exists = await db.article.findUnique({ where: { slug: a.slug } });
    if (exists) continue;
    const created = await db.article.create({
      data: {
        title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content,
        category: a.category, cover: a.cover, featured: a.featured,
        views: a.views, author: a.author,
        status: "PUBLISHED",
        createdAt: daysAgoDate(a.daysAgo),
        updatedAt: daysAgoDate(a.daysAgo),
      },
    });
    void created;
    aAdd++;
  }
  console.log(`Article  : +${aAdd} baru (total ${await db.article.count()})`);

  // ---------- EVENTS ----------
  let eAdd = 0;
  for (const e of NEW_EVENTS) {
    const exists = await db.event.findFirst({ where: { title: e.title } });
    if (exists) continue;
    await db.event.create({
      data: {
        title: e.title, description: e.description, location: e.location,
        startsAt: inDaysDate(e.startIn),
        endsAt: e.endIn === e.startIn ? null : inDaysDate(e.endIn),
        category: e.category, published: true,
      },
    });
    eAdd++;
  }
  console.log(`Event    : +${eAdd} baru (total ${await db.event.count()})`);

  // ---------- GALLERY ----------
  let gAdd = 0;
  for (const g of NEW_GALLERY) {
    const exists = await db.gallery.findFirst({ where: { title: g.title } });
    if (exists) continue;
    await db.gallery.create({
      data: { title: g.title, caption: g.caption, category: g.category, imageUrl: g.imageUrl, order: g.order, published: true },
    });
    gAdd++;
  }
  console.log(`Gallery  : +${gAdd} baru (total ${await db.gallery.count()})`);

  // ---------- TESTIMONIALS ----------
  let tAdd = 0;
  for (const t of NEW_TESTIMONIALS) {
    const exists = await db.testimonial.findFirst({ where: { name: t.name, role: t.role } });
    if (exists) continue;
    await db.testimonial.create({ data: { ...t, published: true } });
    tAdd++;
  }
  console.log(`Testimony: +${tAdd} baru (total ${await db.testimonial.count()})`);

  // ---------- BRANCHES ----------
  let bAdd = 0;
  for (const b of NEW_BRANCHES) {
    const exists = await db.regionalBranch.findFirst({ where: { code: b.code } });
    if (exists) continue;
    await db.regionalBranch.create({ data: { ...b, published: true } });
    bAdd++;
  }
  console.log(`Branch   : +${bAdd} baru (total ${await db.regionalBranch.count()})`);

  console.log("\n=== SELESAI — data demo kaya & realistis ===");
}

main()
  .catch((e) => { console.error("SEED GAGAL:", e); process.exit(1); })
  .finally(() => db.$disconnect());
void slugify;
