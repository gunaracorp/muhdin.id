"use client";

/**
 * R-012 (v13.3) — Grup Perjalanan Digital → Portal.
 * Route: #/grup
 *
 * Alur: jamaah memasukkan KODE GRUP dari panitia → ruang rombongan:
 *   1. Profil grup + kontak marshal (tombol WA langsung).
 *   2. Daftar anggota rombongan (marshal ditandai).
 *   3. Jadwal kumpul (mendatang & yang sudah lewat, tersusun rapi).
 *   4. Chat singkat — polling 15 detik, kirim maks 500 karakter.
 * Tidak ada akun/kata sandi: gerbangnya kode grup yang dibagikan panitia.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RuangGrup {
  group: {
    id: string;
    code: string;
    name: string;
    departureDate: string | null;
    marshalName: string;
    marshalPhone: string;
    notes: string | null;
    pkg?: { id: string; title: string; departureDate?: string | null; city?: string } | null;
  };
  members: { id: string; fullName: string; phone: string; role: string; cardNo: string | null }[];
  schedules: { id: string; title: string; location: string; startsAt: string; note: string | null; past: boolean }[];
  messages: { id: string; authorName: string; body: string; createdAt: string }[];
}

interface PesanGrup {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

function fmtTanggal(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function fmtJam(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* ============ R-049 v15.0.0 — Kas Rombongan & Laporan Grup ============ */

interface LedgerEntry {
  id: string;
  kind: "INCOME" | "EXPENSE";
  amount: number;
  note: string;
  byName: string;
  createdAt: string;
}

interface KasData {
  group: { code: string; name: string; marshalName: string };
  summary: { income: number; expense: number; saldo: number; count: number };
  entries: LedgerEntry[];
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

/** Kartu kas rombongan — laporan transparan yang dilihat seluruh anggota. */
function KasGrupCard({ code, defaultName }: { code: string; defaultName: string }) {
  const { t } = useT();
  const [kas, setKas] = useState<KasData | null>(null);
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [byName, setByName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const muat = useCallback(async () => {
    try {
      setKas(await apiGet<KasData>(`/api/travel-groups/ledger?code=${encodeURIComponent(code)}`));
    } catch {
      setKas(null);
    }
  }, [code]);

  useEffect(() => {
    void muat();
  }, [muat]);

  useEffect(() => {
    if (defaultName && !byName) setByName(defaultName);
  }, [defaultName]);

  const simpan = async () => {
    setErr("");
    const nominal = parseInt(amount, 10);
    if (!Number.isFinite(nominal) || nominal < 1) return setErr(t("kas.errAmount"));
    if (note.trim().length < 3) return setErr(t("kas.errNote"));
    if (byName.trim().length < 2) return setErr(t("kas.errName"));
    setBusy(true);
    try {
      const res = await apiSend<{ entry: LedgerEntry; summary: KasData["summary"] }>(
        "/api/travel-groups/ledger",
        "POST",
        { code, kind, amount: nominal, note: note.trim(), byName: byName.trim() },
      );
      setKas((prev) =>
        prev
          ? { ...prev, entries: [res.entry, ...prev.entries], summary: res.summary }
          : prev,
      );
      setAmount("");
      setNote("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("kas.errSave"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Reveal>
      <div className="rounded-3xl border bg-card p-6 shadow-sm" data-testid="kas-grup">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="coins" className="h-5 w-5 text-gold-deep" aria-hidden />
            {t("kas.title")}
          </h3>
          {kas && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums">
              {kas.summary.count} {t("kas.entries")}
            </span>
          )}
        </div>
        {kas && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t("kas.income")}</p>
              <p className="mt-1 text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-base">{rupiah(kas.summary.income)}</p>
            </div>
            <div className="rounded-2xl bg-rose-500/10 p-3 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t("kas.expense")}</p>
              <p className="mt-1 text-sm font-extrabold tabular-nums text-rose-700 dark:text-rose-300 sm:text-base">{rupiah(kas.summary.expense)}</p>
            </div>
            <div className="rounded-2xl bg-gold/15 p-3 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gold-deep dark:text-gold">{t("kas.saldo")}</p>
              <p className="mt-1 text-sm font-extrabold tabular-nums text-gold-deep dark:text-gold sm:text-base">{rupiah(kas.summary.saldo)}</p>
            </div>
          </div>
        )}

        {/* Form catat */}
        <div className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
          <select
            aria-label={t("kas.kind")}
            value={kind}
            onChange={(e) => setKind(e.target.value as "INCOME" | "EXPENSE")}
            className="h-10 rounded-lg border bg-background px-2 text-xs font-bold"
          >
            <option value="INCOME">{t("kas.income")}</option>
            <option value="EXPENSE">{t("kas.expense")}</option>
          </select>
          <input
            aria-label={t("kas.amount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={t("kas.amountPh")}
            className="h-10 rounded-lg border bg-background px-3 text-sm tabular-nums"
          />
          <input
            aria-label={t("kas.note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("kas.notePh")}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          />
          <Button onClick={simpan} disabled={busy} size="sm" className="h-10 bg-gradient-to-r from-primary to-forest text-white">
            {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="plus" className="h-4 w-4" aria-hidden />}
            <span className="ms-1.5">{t("kas.save")}</span>
          </Button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            aria-label={t("kas.byName")}
            value={byName}
            onChange={(e) => setByName(e.target.value)}
            placeholder={t("kas.byNamePh")}
            className="h-9 rounded-lg border bg-background px-3 text-xs"
          />
          <p className="self-center text-[11px] text-muted-foreground">{t("kas.hint")}</p>
        </div>
        {err && <p className="mt-2 text-xs font-bold text-destructive">{err}</p>}

        {/* Riwayat */}
        {kas && kas.entries.length > 0 && (
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pe-1">
            {kas.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{e.note}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.byName} · {fmtTanggal(e.createdAt)} {fmtJam(e.createdAt)}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-extrabold tabular-nums", e.kind === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {e.kind === "INCOME" ? "+" : "−"}{rupiah(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {(!kas || kas.entries.length === 0) && (
          <p className="mt-4 rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">{t("kas.empty")}</p>
        )}
      </div>
    </Reveal>
  );
}

export function GrupView() {
  const { t } = useT();
  const [kode, setKode] = useState("");
  const [ruang, setRuang] = useState<RuangGrup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // chat
  const [pesanBaru, setPesanBaru] = useState("");
  const [namaPengirim, setNamaPengirim] = useState(() => localStorage.getItem("grup-nama") || "");
  const [kirimLoading, setKirimLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bukaRuang = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setError(t("grup.errCode"));
        return;
      }
      setLoading(true);
      setError("");
      try {
        const d = await apiGet<RuangGrup>(`/api/travel-groups/room?code=${encodeURIComponent(code.trim().toUpperCase())}`);
        setRuang(d);
        localStorage.setItem("grup-kode", d.group.code);
      } catch (err) {
        setRuang(null);
        setError(err instanceof Error ? err.message : t("grup.errLoad"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Coba buka kode tersimpan (satu perangkat, satu grup terakhir).
  useEffect(() => {
    const saved = localStorage.getItem("grup-kode");
    if (saved && !ruang) void bukaRuang(saved);
  }, []);

  // Polling chat tiap 15 detik saat ruang terbuka.
  useEffect(() => {
    if (!ruang) return;
    pollingRef.current = setInterval(async () => {
      try {
        const last = ruang.messages.at(-1);
        const newer = await apiGet<PesanGrup[]>(
          `/api/travel-groups/messages?code=${ruang.group.code}${last ? `&after=${encodeURIComponent(last.createdAt)}` : ""}`,
        );
        if (newer.length > 0) {
          setRuang((prev) => (prev ? { ...prev, messages: [...prev.messages, ...newer] } : prev));
        }
      } catch {
        /* diamkan — polling gagal bukan fatal */
      }
    }, 15_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ruang]);

  // Gulir ke bawah saat pesan bertambah.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [ruang?.messages.length]);

  const kirim = async () => {
    if (!ruang || !pesanBaru.trim()) return;
    if (namaPengirim.trim().length < 2) {
      setError(t("grup.errName"));
      return;
    }
    setKirimLoading(true);
    setError("");
    try {
      const msg = await apiSend<PesanGrup>("/api/travel-groups/messages", "POST", {
        code: ruang.group.code,
        authorName: namaPengirim.trim(),
        body: pesanBaru.trim(),
      });
      localStorage.setItem("grup-nama", namaPengirim.trim());
      setRuang((prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : prev));
      setPesanBaru("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("grup.errSend"));
    } finally {
      setKirimLoading(false);
    }
  };

  const gabung = async () => {
    // Bergabung sebagai anggota (daftar) dari ruang yang sudah terbuka.
    if (!ruang) return;
    if (namaPengirim.trim().length < 3) {
      setError(t("grup.errNameLong"));
      return;
    }
    setKirimLoading(true);
    setError("");
    try {
      await apiSend("/api/travel-groups/join", "POST", {
        code: ruang.group.code,
        fullName: namaPengirim.trim(),
        phone: "",
      });
      localStorage.setItem("grup-nama", namaPengirim.trim());
      await bukaRuang(ruang.group.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("grup.errJoin"));
    } finally {
      setKirimLoading(false);
    }
  };

  const upcoming = ruang?.schedules.filter((s) => !s.past) ?? [];
  const past = ruang?.schedules.filter((s) => s.past) ?? [];

  return (
    <div className="min-h-[70vh] bg-background pb-20">
      {/* ===== HERO ===== */}
      <section className="border-b bg-gradient-to-br from-forest via-forest-deep to-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-soft">
              <Icon name="users" className="h-3.5 w-3.5" aria-hidden /> R-012 · v13.3
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{t("grup.heroTitle")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75 sm:text-base">{t("grup.heroDesc")}</p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {error && <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

        {!ruang ? (
          <section className="pt-12">
            <SectionHeading eyebrow={t("grup.joinEyebrow")} title={t("grup.joinTitle")} subtitle={t("grup.joinDesc")} />
            <div className="mx-auto mt-8 max-w-md">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground" htmlFor="kode-grup">
                  {t("grup.codeLabel")}
                </label>
                <input
                  id="kode-grup"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && bukaRuang(kode)}
                  placeholder="MHD-GR-XXXX"
                  dir="ltr"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-muted/40 px-4 text-center text-lg font-extrabold tracking-[0.2em] text-foreground placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                />
                <Button onClick={() => bukaRuang(kode)} disabled={loading} className="mt-4 w-full bg-gradient-to-r from-primary to-forest text-white">
                  {loading ? <><Icon name="loader-2" className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />…</> : <><Icon name="log-in" className="h-4 w-4 mr-1.5" aria-hidden />{t("grup.enter")}</>}
                </Button>
                <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">{t("grup.codeHint")}</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* ===== PROFIL GRUP ===== */}
            <section className="pt-10">
              <Reveal>
                <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold tracking-wider text-gold-deep" dir="ltr">{ruang.group.code}</p>
                      <h2 className="mt-1 text-2xl font-extrabold">{ruang.group.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("grup.departure")}: {fmtTanggal(ruang.group.departureDate)}
                        {ruang.group.pkg ? ` · ${ruang.group.pkg.title}` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setRuang(null); localStorage.removeItem("grup-kode"); }}>
                      <Icon name="log-out" className="h-3.5 w-3.5 mr-1" aria-hidden /> {t("grup.leave")}
                    </Button>
                  </div>

                  {/* Kontak marshal */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gold/35 bg-gold/[0.06] p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-gold-deep">{t("grup.marshal")}</p>
                      <p className="mt-1 font-bold">{ruang.group.marshalName || "—"}</p>
                      {ruang.group.marshalPhone && (
                        <a
                          href={`https://wa.me/${ruang.group.marshalPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                          dir="ltr"
                        >
                          <Icon name="message-circle" className="h-4 w-4" aria-hidden /> {ruang.group.marshalPhone}
                        </a>
                      )}
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t("grup.membersCount")}</p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums">{ruang.members.length}</p>
                    </div>
                  </div>
                  {ruang.group.notes && <p className="mt-4 rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">{ruang.group.notes}</p>}
                </div>
              </Reveal>
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* ===== KAS ROMBONGAN (R-049) ===== */}
            <section className="pt-8">
              <KasGrupCard code={ruang.group.code} defaultName={namaPengirim} />
            </section>

            {/* ===== ANGGOTA ===== */}
              <Reveal>
                <section className="rounded-3xl border bg-card p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 font-extrabold">
                    <Icon name="users" className="h-4 w-4 text-primary" aria-hidden /> {t("grup.memberList")}
                  </h3>
                  <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                    {ruang.members.map((m) => (
                      <li key={m.id} className={cn("flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm", m.role === "MARSHAL" ? "border-gold/40 bg-gold/[0.07] font-bold" : "bg-muted/25")}>
                        <span className="truncate">{m.fullName}</span>
                        {m.role === "MARSHAL" && (
                          <span className="shrink-0 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold text-gold-deep">{t("grup.marshalTag")}</span>
                        )}
                      </li>
                    ))}
                    {ruang.members.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("grup.noMembers")}</li>}
                  </ul>
                  {/* Daftar diri */}
                  <div className="mt-4 flex gap-2">
                    <input
                      aria-label={t("grup.senderName")}
                      value={namaPengirim}
                      onChange={(e) => setNamaPengirim(e.target.value)}
                      placeholder={t("grup.yourName")}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    />
                    <Button size="sm" onClick={gabung} disabled={kirimLoading} variant="outline" className="shrink-0">
                      <Icon name="user-plus" className="h-3.5 w-3.5 mr-1" aria-hidden /> {t("grup.register")}
                    </Button>
                  </div>
                </section>
              </Reveal>

              {/* ===== JADWAL KUMPUL ===== */}
              <Reveal delay={0.05}>
                <section className="rounded-3xl border bg-card p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 font-extrabold">
                    <Icon name="calendar-clock" className="h-4 w-4 text-primary" aria-hidden /> {t("grup.schedules")}
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {upcoming.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-primary/25 bg-primary/[0.05] p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold">{s.title}</p>
                          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary">{fmtJam(s.startsAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {fmtTanggal(s.startsAt)}{s.location ? ` · ${s.location}` : ""}
                        </p>
                        {s.note && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/85">{s.note}</p>}
                      </div>
                    ))}
                    {upcoming.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">{t("grup.noSchedules")}</p>}
                  </div>
                  {past.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-bold text-muted-foreground hover:text-primary">{t("grup.pastSchedules")} ({past.length})</summary>
                      <ul className="mt-2 space-y-1.5">
                        {past.map((s) => (
                          <li key={s.id} className="rounded-xl bg-muted/25 px-3 py-2 text-xs text-muted-foreground line-through decoration-muted-foreground/40">
                            {s.title} — {fmtTanggal(s.startsAt)} {fmtJam(s.startsAt)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </section>
              </Reveal>
            </div>

            {/* ===== CHAT SINGKAT ===== */}
            <Reveal delay={0.08}>
              <section className="mt-6 rounded-3xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h3 className="flex items-center gap-2 font-extrabold">
                    <Icon name="messages-square" className="h-4 w-4 text-primary" aria-hidden /> {t("grup.chat")}
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground">{t("grup.chatHint")}</span>
                </div>
                <div className="max-h-96 space-y-3 overflow-y-auto px-6 py-4 scrollbar-thin">
                  {ruang.messages.map((m) => {
                    const mine = namaPengirim.trim() && m.authorName === namaPengirim.trim();
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]", mine ? "bg-primary text-white" : "bg-muted/40 text-foreground")}>
                          {!mine && <p className="text-[11px] font-extrabold text-gold-deep">{m.authorName}</p>}
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={cn("mt-1 text-[10px] tabular-nums", mine ? "text-white/70" : "text-muted-foreground/70")} dir="ltr">{fmtJam(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {ruang.messages.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t("grup.chatEmpty")}</p>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex items-end gap-2 border-t px-4 py-3">
                  <input
                    value={namaPengirim}
                    onChange={(e) => setNamaPengirim(e.target.value)}
                    placeholder={t("grup.yourName")}
                    aria-label={t("grup.yourName")}
                    className="h-10 w-32 shrink-0 rounded-xl border border-border bg-muted/30 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                  <textarea
                    value={pesanBaru}
                    onChange={(e) => setPesanBaru(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void kirim();
                      }
                    }}
                    rows={1}
                    maxLength={500}
                    placeholder={t("grup.chatPlaceholder")}
                    aria-label={t("grup.chat")}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  />
                  <Button size="sm" onClick={kirim} disabled={kirimLoading || !pesanBaru.trim()} className="shrink-0 bg-gradient-to-r from-primary to-forest text-white">
                    {kirimLoading ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="send" className="h-4 w-4" aria-hidden />}
                  </Button>
                </div>
              </section>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
