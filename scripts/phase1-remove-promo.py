#!/usr/bin/env python3
"""
Fase 1 — Hapus blok promo GRATIS dari beranda (permintaan owner, 2026-10-27).
Menghapus dari home-view.tsx:
  1. Import PromoSlot* (tak terpakai setelah pembersihan)
  2. Pill freeNote hero ("100% GRATIS untuk semua anggota ...")
  3. PromoSlotPill hero ("N PENDAFTAR TELAH BERGABUNG — GRATIS")
  4. Komponen FreeSection (seksi perbandingan "GRATIS. UNTUK SEMUA ANGGOTA."
     + "PLATFORM ASOSIASI BIASA") beserta mount-nya
  5. Strip membership (DUA KEUNGGULAN + PromoSlotLine)
Blok di daftar-view / join-view TIDAK disentuh (user: "dari beranda").
"""
from pathlib import Path

P = Path("/home/z/my-project/src/components/views/home-view.tsx")
s = P.read_text(encoding="utf-8")
orig = s

# --- 1) Cut komponen FreeSection utuh: dari komentar S01-b sampai sebelum S02 ---
start_marker = "/* ================= S01-b — DAFTAR & IURAN GRATIS (Task 36) ================= */"
end_marker = "/* ================= S02 — THE IDEA ================= */"
i, j = s.index(start_marker), s.index(end_marker)
s = s[:i] + s[j:]

# --- 2) String-level removals (urutan bebas, semua anchor unik) ---
removals = [
    # import slot-counter
    'import { PromoSlotCard, PromoSlotLine, PromoSlotPill } from "@/components/site/slot-counter"; // Task 44 — counter kuota live\n',
    # hero: pill freeNote + counter pill
    '''        {/* Task 36 — freeNote hero · Task 40 — highlighter lime ala sgl.web.id */}
        <Reveal delay={0.3}>
          <p className="mt-5 inline-flex -rotate-1 items-center gap-1.5 rounded-lg bg-lime-300 px-3 py-1.5 text-xs font-extrabold text-forest-deep shadow-[0_6px_18px_-6px_oklch(0.9_0.19_130/0.6)]">
            <Icon name="check-circle-2" className="h-4 w-4" aria-hidden />
            {t("nusHome.hero.freeNote")}
          </p>
        </Reveal>

        {/* Task 44→52 — penghitung pendaftar GRATIS live (naik tiap pendaftar) */}
        <Reveal delay={0.34}>
          <div className="mt-3 flex justify-center">
            <PromoSlotPill />
          </div>
        </Reveal>

''',
    # strip membership (DUA KEUNGGULAN + PromoSlotLine)
    '''        {/* Task 43→52 — strip DUA KEUNGGULAN di bawah grid tier */}
        <Reveal className="mt-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/25 to-gold/15 p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground sm:text-sm">
              {t("nusHome.membership.freeStrip")}
            </p>
            <PromoSlotLine className="mt-2" />
          </div>
        </Reveal>

''',
    # mount FreeSection
    "      <FreeSection />\n",
]
for block in removals:
    if block not in s:
        raise SystemExit(f"GAGAL: anchor tidak ditemukan:\n{block[:120]}...")
    s = s.replace(block, "", 1)

P.write_text(s, encoding="utf-8")
removed = orig.count("\n") - s.count("\n")
print(f"OK — {removed} baris dihapus dari home-view.tsx (sekarang {s.count(chr(10))} baris)")
