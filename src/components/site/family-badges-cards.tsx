"use client";

/**
 * v15.0.0 «GOD MODE» — dua kartu portal jamaah:
 *  • FamilyGuardianCard (R-018) — Akun Pengampu Keluarga: satu nomor WA
 *    pengampu mengelola data & status anggota keluarga dalam satu layar.
 *  • BadgeShowcaseCard (R-032) — Lencana Capaian: sinkron statistik perangkat
 *    ke server, lalu tampil lencana terbuka + yang terkunci.
 *
 * Keduanya self-contained (state + fetch sendiri) sehingga mudah dipasang
 * di JamaahDashboard tanpa menyentuh widget lain. Data personal tetap
 * ramah privasi: yang dikirim ke server hanya nomor pengampu + hitungan.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BADGE_DEFS, evaluateBadges, lockedBadges, type BadgeStats } from "@/lib/badges";

/* ============ R-018 — Akun Pengampu Keluarga ============ */

interface FamilyMemberRow {
  id: string;
  name: string;
  relation: string;
  birthYear: number | null;
  passportNo: string | null;
  notes: string | null;
}

const RELATIONS = ["ANAK", "ORANG_TUA", "LANSIA", "PASANGAN", "LAINNYA"] as const;
const KEY_GUARDIAN = "muhdin-guardian-phone";

export function FamilyGuardianCard() {
  const { t } = useT();
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState<FamilyMemberRow[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<(typeof RELATIONS)[number]>("ANAK");
  const [passportNo, setPassportNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [opened, setOpened] = useState(false);

  const muat = useCallback(async (p: string) => {
    if (p.trim().length < 8) return;
    try {
      const d = await apiGet<{ members: FamilyMemberRow[] }>(`/api/family?phone=${encodeURIComponent(p.trim())}`);
      setMembers(d.members ?? []);
      setOpened(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("family.errLoad"));
    }
  }, [t]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY_GUARDIAN);
      if (saved) {
        setPhone(saved);
        void muat(saved);
      }
    } catch {
      /* storage non-kritis */
    }
  }, [muat]);

  const tambah = async () => {
    setErr("");
    if (phone.trim().length < 8) return setErr(t("family.errPhone"));
    if (name.trim().length < 2) return setErr(t("family.errName"));
    setBusy(true);
    try {
      await apiSend("/api/family", "POST", {
        guardianPhone: phone.trim(),
        name: name.trim(),
        relation,
        passportNo: passportNo.trim() || undefined,
        pdpConsent: true,
      });
      window.localStorage.setItem(KEY_GUARDIAN, phone.trim());
      setName("");
      setPassportNo("");
      await muat(phone.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("family.errSave"));
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (id: string) => {
    setErr("");
    try {
      await apiSend(`/api/family?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone.trim())}`, "DELETE");
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("family.errDelete"));
    }
  };

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm" data-testid="family-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-extrabold">
          <Icon name="users" className="h-4.5 w-4.5 text-primary" aria-hidden />
          {t("family.title")}
        </h3>
        {opened && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold text-primary">{t("family.active")}</span>}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("family.desc")}</p>

      <div className="mt-3 flex gap-2">
        <Input
          aria-label={t("family.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0812…"
          inputMode="tel"
          className="h-9"
        />
        <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={() => void muat(phone)}>
          {t("family.load")}
        </Button>
      </div>

      {members.length > 0 && (
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {m.name} <span className="text-[10px] font-extrabold uppercase text-muted-foreground">· {t(`family.rel.${m.relation.toLowerCase()}`)}</span>
                </p>
                <p className="text-[11px] text-muted-foreground" dir="ltr">{m.passportNo || t("family.noPassport")}</p>
              </div>
              <button
                type="button"
                onClick={() => void hapus(m.id)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                aria-label={`${t("family.delete")} ${m.name}`}
              >
                <Icon name="trash" className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {opened && members.length === 0 && (
        <p className="mt-3 rounded-xl bg-muted/40 p-2.5 text-center text-xs text-muted-foreground">{t("family.empty")}</p>
      )}

      <div className="mt-3 grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label={t("family.name")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("family.name")} className="h-9" />
          <select
            aria-label={t("family.relation")}
            value={relation}
            onChange={(e) => setRelation(e.target.value as (typeof RELATIONS)[number])}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          >
            {RELATIONS.map((r) => (
              <option key={r} value={r}>{t(`family.rel.${r.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Input aria-label={t("family.passport")} value={passportNo} onChange={(e) => setPassportNo(e.target.value.toUpperCase())} placeholder={t("family.passport")} dir="ltr" className="h-9" />
          <Button size="sm" onClick={tambah} disabled={busy} className="h-9 shrink-0 bg-gradient-to-r from-primary to-forest text-white">
            {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="plus" className="h-4 w-4" aria-hidden />}
            <span className="ms-1.5">{t("family.add")}</span>
          </Button>
        </div>
      </div>
      {err && <p className="mt-2 text-xs font-bold text-destructive">{err}</p>}
    </div>
  );
}

/* ============ R-032 — Lencana Capaian ============ */

interface BadgeRow {
  code: string;
  source: string;
  awardedAt: string;
}

export function BadgeShowcaseCard() {
  const { t } = useT();
  const [ownerKey, setOwnerKey] = useState("");
  const [earnedCodes, setEarnedCodes] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const muat = useCallback(async (key: string) => {
    if (key.trim().length < 6) return;
    try {
      const d = await apiGet<{ badges: BadgeRow[] }>(`/api/badges?ownerKey=${encodeURIComponent(key.trim())}`);
      setEarnedCodes(d.badges.map((b) => b.code));
      setSynced(true);
    } catch {
      /* diamkan — tampilan lokal tetap jalan */
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("muhdin-order-phone") || window.localStorage.getItem("grup-nama") || "";
      if (saved) {
        setOwnerKey(saved);
        void muat(saved);
      }
    } catch {
      /* storage non-kritis */
    }
  }, [muat]);

  // Statistik perangkat (device-local, tidak mengirim data personal).
  const localStats: BadgeStats = {
    kelas: 0,
    kuis: 0,
    forum: 0,
    dokumen: 0,
    transaksi: 0,
  };
  try {
    localStats.transaksi = window.localStorage.getItem("muhdin-orders") ? JSON.parse(window.localStorage.getItem("muhdin-orders") as string).length : 0;
  } catch {
    /* ignore */
  }

  const sync = async () => {
    setErr("");
    if (ownerKey.trim().length < 6) return setErr(t("badges.errKey"));
    setBusy(true);
    try {
      const res = await apiSend<{ earned: { code: string }[]; newCount: number }>("/api/badges", "POST", {
        ownerKey: ownerKey.trim(),
        stats: localStats,
      });
      setEarnedCodes(res.earned.map((b) => b.code));
      setSynced(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("badges.errSync"));
    } finally {
      setBusy(false);
    }
  };

  const earned = evaluateBadges(localStats);
  const shown = new Set<string>([...earned.map((e) => e.code), ...earnedCodes]);
  const locked = lockedBadges([...shown]);

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm" data-testid="badges-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-extrabold">
          <Icon name="award" className="h-4.5 w-4.5 text-gold-deep" aria-hidden />
          {t("badges.title")}
        </h3>
        {synced && (
          <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-deep dark:text-gold" data-testid="badges-synced">
            {shown.size} {t("badges.earnedCount")}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("badges.desc")}</p>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BADGE_DEFS.map((def) => {
          const open = shown.has(def.code);
          return (
            <li
              key={def.code}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition",
                open ? "border-gold/45 bg-gold/10 shadow-sm" : "border-border bg-muted/30 opacity-55",
              )}
              data-testid={`badge-${def.code}`}
            >
              <Icon
                name={open ? "award" : "lock"}
                className={cn("h-6 w-6", open ? "text-gold-deep dark:text-gold" : "text-muted-foreground")}
                aria-hidden
              />
              <span className="text-[10px] font-extrabold leading-tight">{t(`badges.items.${def.i18n}`)}</span>
            </li>
          );
        })}
        {locked.length === BADGE_DEFS.length && (
          <li className="col-span-full rounded-xl bg-muted/40 p-2 text-center text-[11px] text-muted-foreground">{t("badges.startHint")}</li>
        )}
      </ul>

      <div className="mt-3 flex gap-2">
        <Input
          aria-label={t("badges.keyLabel")}
          value={ownerKey}
          onChange={(e) => setOwnerKey(e.target.value)}
          placeholder={t("badges.keyPh")}
          className="h-9"
        />
        <Button size="sm" onClick={sync} disabled={busy} className="h-9 shrink-0 bg-gradient-to-r from-primary to-forest text-white">
          {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="refresh" className="h-4 w-4" aria-hidden />}
          <span className="ms-1.5">{t("badges.sync")}</span>
        </Button>
      </div>
      {err && <p className="mt-2 text-xs font-bold text-destructive">{err}</p>}
      <p className="mt-2 text-[11px] text-muted-foreground"><Label className="sr-only">{t("badges.privacy")}</Label>{t("badges.privacy")}</p>
    </div>
  );
}
