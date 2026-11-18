import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { fuzzyScore } from "@/lib/fuzzy";

/**
 * Pencarian global lintas konten (publik) — R-064 typo-tolerant:
 *  1. Kandidat ditarik dari katalog kecil (artikel/tutorial/ekosistem —
 *     dibatasi 500 baris per kategori, tabel tumbuh lambat).
 *  2. Setiap kandidat diberi skor fuzzy (substring → prefix token →
 *     Levenshtein proporsional ≤3 → subsekuens) sehingga salah ketik
 *     tetap ditemukan tanpa pustaka eksternal / ekstensi SQLite.
 *  3. Skor minimal 20 (ada sinyal nyata) lalu ambil 5 teratas per kategori.
 */
const SCAN = 500;
const MIN_SCORE = 20;

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return ok({ query: q, articles: [], tutorials: [], ecosystems: [] });

    const [articles, tutorials, ecosystems] = await Promise.all([
      db.article
        .findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, title: true, slug: true, excerpt: true, category: true, cover: true },
          take: SCAN,
          orderBy: { createdAt: "desc" },
        })
        .then((rows) =>
          rows
            .map((r) => ({ ...r, _score: fuzzyScore(q, [r.title, r.excerpt, r.category]) }))
            .filter((r) => r._score >= MIN_SCORE)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)
        ),
      db.tutorial
        .findMany({
          where: { published: true },
          select: { id: true, title: true, slug: true, summary: true, category: true, level: true },
          take: SCAN,
          orderBy: { order: "asc" },
        })
        .then((rows) =>
          rows
            .map((r) => ({ ...r, _score: fuzzyScore(q, [r.title, r.summary, r.category]) }))
            .filter((r) => r._score >= MIN_SCORE)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)
        ),
      db.ecosystem
        .findMany({
          take: SCAN,
          orderBy: { number: "asc" },
        })
        .then((rows) =>
          rows
            .map((r) => ({ ...r, _score: fuzzyScore(q, [r.name, r.scope, r.description]) }))
            .filter((r) => r._score >= MIN_SCORE)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)
        ),
    ]);

    return ok({ query: q, articles, tutorials, ecosystems });
  } catch {
    return fail("Gagal melakukan pencarian.", 500);
  }
}
