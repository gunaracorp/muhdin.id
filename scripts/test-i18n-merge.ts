/**
 * Uji hasil deepMerge dictionaries — memastikan tidak ada lagi root yang
 * tertimpa & kunci layanan/pesanan/benef semuanya terbaca (bukan raw key).
 * Jalankan: npx tsx scripts/test-i18n-merge.ts
 */
import { dictionaries } from "../src/lib/i18n/dictionaries";

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const val = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof val === "string" ? val : undefined;
}

const CASES: [string, string][] = [
  // layanan — judul item lama (korban timpa Object.assign dulu)
  ["layanan.items.bakornas.title", "BAKORNAS"],
  ["layanan.items.bakorwil.title", "BAKORWIL"],
  ["layanan.items.iata.desc", "Perizinan"],
  // layanan — 4 item v14.1 yang tadinya kunci bertitik
  ["layanan.items.doa-dzikir.title", "Panduan Doa & Dzikir Audio"],
  ["layanan.items.kelas-live.title", "Kelas Live & Webinar"],
  ["layanan.items.rombongan-b2b.title", "Pendaftaran Rombongan B2B"],
  ["layanan.items.masjid-mitra.title", "Kemitraan Masjid & Komunitas"],
  // pesanan — gabungan checkoutDict + v141Dict (dulu saling menimpa)
  ["pesanan.refundTitle", "Pembatalan & Refund"],
  // benef — gabungan keanggotaanDict + v141Dict
  ["benef.merchantTitle", "Merchant Partner KTA"],
  // keanggotaan — kunci bertitik lama ("cat.HOTEL") kini nested
  ["benef.cat.HOTEL", "Hotel"],
  ["acad.cat.MANASIK", "Manasik"],
  ["acad.level.LANJUT", "Lanjut"],
  ["book.svc.KELAS_MANASIK", "Kelas Manasik"],
  ["book.st.CHECKED_IN", "Sudah Check-in"],
];

let fail = 0;
for (const [key, mustContain] of CASES) {
  const val = lookup(dictionaries.id, key);
  const ok = !!val && val.includes(mustContain);
  if (!ok) fail += 1;
  console.log(`${ok ? "✓" : "✗"} ${key} → ${val ? `"${val.slice(0, 48)}"` : "UNDEFINED (raw key!)"}`);
}

// hitung jumlah item layanan yang lengkap (title+desc) di ketiga bahasa
const items = (dictionaries.id.layanan as { items?: Record<string, Record<string, string>> }).items ?? {};
const slugs = Object.keys(items);
const incomplete = slugs.filter((s) => !items[s]?.title);
console.log(`\nlayanan.items total: ${slugs.length} slug; tanpa title: ${incomplete.length ? incomplete.join(", ") : "—"}`);
for (const lang of ["en", "ar"] as const) {
  const it = (dictionaries[lang].layanan as { items?: Record<string, Record<string, string>> }).items ?? {};
  const missing = slugs.filter((s) => !it[s]?.title);
  console.log(`${lang}: ${Object.keys(it).length} slug; missing title: ${missing.length ? missing.join(", ") : "—"}`);
}

// Guard Task 36 — tidak boleh ada lagi kunci bertitik di merged dictionaries:
// lookup() menelusuri objek bersarang; kunci "x.y" tak terjangkau dan akhirnya
// tampil mentah di UI. Uji statis ini mencegah regresi pola bug v13–v15.
const dotted: string[] = [];
function walk(obj: unknown, path: string, depth: number) {
  if (!obj || typeof obj !== "object" || depth > 6) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k.includes(".")) dotted.push(`${path}${k}`);
    walk(v, `${path}${k}.`, depth + 1);
  }
}
for (const lang of ["id", "en", "ar"] as const) walk(dictionaries[lang], `${lang}.`, 0);
console.log(`\nkunci bertitik di merged dictionaries: ${dotted.length}${dotted.length ? " → " + dotted.slice(0, 8).join(", ") : ""}`);
process.exit(fail > 0 || incomplete.length > 0 || dotted.length > 0 ? 1 : 0);
