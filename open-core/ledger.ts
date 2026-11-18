/**
 * open-core/ledger.ts — Prinsip pencatatan kas ganda sederhana (referensi).
 *
 * Dipakai oleh Kas Rombongan (R-049): seluruh anggota grup melihat laporan
 * yang sama; setiap catatan gagal-aman (nominal > 0, jenis jelas) dan
 * ringkasan dihitung ulang dari catatan, bukan disimpan ganda.
 */

export type LedgerKind = "INCOME" | "EXPENSE";

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  /** nominal IDR, harus > 0 */
  amount: number;
  note: string;
  byName: string;
  createdAt: string; // ISO
}

export interface LedgerSummary {
  income: number;
  expense: number;
  saldo: number;
  count: number;
}

/** Validasi satu catatan sebelum masuk buku — pola gagal-aman R-049. */
export function validateEntry(entry: LedgerEntry): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
    return { ok: false, error: "Nominal harus bilangan bulat lebih dari nol." };
  }
  if (!["INCOME", "EXPENSE"].includes(entry.kind)) {
    return { ok: false, error: "Jenis catatan harus INCOME atau EXPENSE." };
  }
  if (entry.note.trim().length < 3) {
    return { ok: false, error: "Keterangan minimal 3 karakter." };
  }
  if (entry.byName.trim().length < 2) {
    return { ok: false, error: "Nama pencatat minimal 2 karakter." };
  }
  if (Number.isNaN(Date.parse(entry.createdAt))) {
    return { ok: false, error: "Tanggal tidak valid." };
  }
  return { ok: true };
}

/** Ringkasan dari seluruh catatan — sumber kebenaran tunggal adalah daftar. */
export function summarize(entries: LedgerEntry[]): LedgerSummary {
  const income = entries.filter((e) => e.kind === "INCOME").reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.kind === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  return { income, expense, saldo: income - expense, count: entries.length };
}

/** Urutan tampilan laporan: terbaru di atas (stabil untuk polling grup). */
export function sortForDisplay(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
  );
}
