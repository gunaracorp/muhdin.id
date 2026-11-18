"use client";

/**
 * R-090 (v14.1) — Portal Kemitraan Masjid & Komunitas → Portal #/masjid.
 * Masjid/komunitas/sekolah/yayasan daftar jadi mitra penjangkauan MUHDIN:
 * form pendaftaran publik (status PENDING → ACTIVE oleh sekretariat),
 * dashboard relasi via kode MHD-MP (profil + aktivitas kemitraan),
 * dan uraian program KAJIAN / TABARRUJ / UMRAH.
 */

import { useCallback, useState } from "react";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PartnerInfo {
  code: string;
  name: string;
  type: string;
  city: string;
  province: string;
  picName: string;
  phone: string;
  reach: number;
  status: string;
  program: string;
  notes: string;
}
interface ActivityItem {
  id: string;
  type: string;
  title: string;
  date: string;
  attendance: number;
}

const PROGRAMS = [
  { key: "KAJIAN", icon: "book-open", idId: "Kajian & Pendidikan Jamaah", idEn: "Study & Pilgrim Education" },
  { key: "TABARRUJ", icon: "heart-handshake", idId: "Tabarru & Kesehatan Jamaah", idEn: "Endowment & Pilgrim Health" },
  { key: "UMRAH", icon: "moon-star", idId: "Umrah Bersama Rombongan", idEn: "Group Umrah Together" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold-deep dark:text-gold",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

export function MasjidView() {
  const { t, locale } = useT();
  const k = (key: string) => t(`masjid.${key}`);

  // Form
  const [name, setName] = useState("");
  const [type, setType] = useState("MASJID");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [picName, setPicName] = useState("");
  const [phone, setPhone] = useState("");
  const [reach, setReach] = useState("");
  const [program, setProgram] = useState("KAJIAN");
  const [notes, setNotes] = useState("");
  const [pdp, setPdp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [okResult, setOkResult] = useState<{ code: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dashboard
  const [code, setCode] = useState("");
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dashError, setDashError] = useState<string | null>(null);
  const [dashLoading, setDashLoading] = useState(false);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mosque-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, type, city, province, address, picName, phone,
          reach: Number(reach || 0), program, notes, pdpConsent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOkResult({ code: data.partner.code, message: data.message });
        setPdp(false);
      } else {
        setError(data.error ?? k("gagal"));
      }
    } catch {
      setError(k("gagal"));
    } finally {
      setSubmitting(false);
    }
  }, [name, type, city, province, address, picName, phone, reach, program, notes, k]);

  const check = useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    setPartner(null);
    setActivities([]);
    try {
      const res = await fetch(`/api/mosque-partners?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPartner(data.partner);
        setActivities(data.activities ?? []);
      } else {
        setDashError(data.error ?? k("gagal"));
      }
    } catch {
      setDashError(k("gagal"));
    } finally {
      setDashLoading(false);
    }
  }, [code, k]);

  const eligible = name.trim().length >= 3 && city.trim().length >= 2 && picName.trim().length >= 2 && phone.trim().length >= 8 && pdp;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {k("eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight" data-testid="masjid-title">{k("title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{k("subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* 3 program */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3" data-testid="masjid-program">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.key} delay={i * 0.06}>
                <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
                  <Icon name={p.icon} className="h-8 w-8 text-primary" aria-hidden />
                  <h3 className="mt-3 text-lg font-extrabold">{locale === "en" ? p.idEn : p.idId}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{k(`program.${p.key}`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-8 lg:grid-cols-5">
          {/* Form pendaftaran */}
          <div className="lg:col-span-3 rounded-2xl border bg-card p-6 shadow-sm" data-testid="masjid-form">
            <h2 className="text-xl font-extrabold">{k("formTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{k("formSub")}</p>
            {okResult ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5" data-testid="masjid-sukses">
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{k("suksesTitle")}</p>
                <p className="mt-1 text-sm text-foreground/80">{okResult.message}</p>
                <p className="mt-3 text-sm"><span className="font-bold">{k("kode")}:</span> <code className="rounded bg-primary/10 px-2 py-0.5 font-extrabold text-primary">{okResult.code}</code></p>
                <Button variant="outline" className="mt-4" onClick={() => setOkResult(null)}>{k("daftarLagi")}</Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-nama">{k("namaLembaga")}</Label>
                    <Input id="ms-nama" value={name} onChange={(e) => setName(e.target.value)} placeholder={k("namaPh")} data-testid="masjid-nama" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-jenis">{k("jenis")}</Label>
                    <select id="ms-jenis" value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="masjid-jenis">
                      <option value="MASJID">Masjid</option>
                      <option value="KOMUNITAS">Komunitas</option>
                      <option value="SEKOLAH">Sekolah/Pesantren</option>
                      <option value="YAYASAN">Yayasan</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-kota">{k("kota")}</Label>
                    <Input id="ms-kota" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-prov">{k("provinsi")}</Label>
                    <Input id="ms-prov" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ms-alamat">{k("alamat")}</Label>
                  <Input id="ms-alamat" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-pic">{k("pic")}</Label>
                    <Input id="ms-pic" value={picName} onChange={(e) => setPicName(e.target.value)} placeholder={k("picPh")} data-testid="masjid-pic" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-wa">{k("telepon")}</Label>
                    <Input id="ms-wa" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 8xx-xxxx-xxxx" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-reach">{k("jangkauan")}</Label>
                    <Input id="ms-reach" type="number" value={reach} onChange={(e) => setReach(e.target.value)} placeholder="250" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ms-program">{k("pilihProgram")}</Label>
                    <select id="ms-program" value={program} onChange={(e) => setProgram(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {PROGRAMS.map((p) => (
                        <option key={p.key} value={p.key}>{locale === "en" ? p.idEn : p.idId}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ms-catatan">{k("catatan")}</Label>
                  <Input id="ms-catatan" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={k("catatanPh")} />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={pdp} onChange={(e) => setPdp(e.target.checked)} className="mt-1" data-testid="masjid-pdp" />
                  <span className="text-muted-foreground">{k("pdp")}</span>
                </label>
                {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid="masjid-gagal">{error}</p>}
                <Button className="w-full" onClick={submit} disabled={!eligible || submitting} data-testid="masjid-submit">
                  {submitting ? k("mengirim") : k("daftar")}
                </Button>
              </div>
            )}
          </div>

          {/* Dashboard relasi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm" data-testid="masjid-dashboard">
              <h2 className="text-lg font-extrabold">{k("dashTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{k("dashSub")}</p>
              <div className="mt-4 flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MHD-MP-XXXX" data-testid="masjid-kode" />
                <Button onClick={check} disabled={code.trim().length < 10 || dashLoading}>{k("buka")}</Button>
              </div>
              {dashError && <p className="mt-3 text-sm text-destructive">{dashError}</p>}
              {partner && (
                <div className="mt-4 space-y-3" data-testid="masjid-hasil">
                  <div className="rounded-xl bg-muted/60 p-4">
                    <p className="font-extrabold">{partner.name}</p>
                    <p className="text-xs text-muted-foreground">{partner.city}{partner.province ? `, ${partner.province}` : ""} · {partner.type}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className={cn("text-[10px]", STATUS_STYLE[partner.status])}>{partner.status}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{partner.program}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{k("pic")}: {partner.picName} · {k("jangkauan")}: {partner.reach}/bulan</p>
                  </div>
                  {activities.length > 0 && (
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{k("aktivitas")}</p>
                      <div className="mt-2 space-y-2">
                        {activities.map((a) => (
                          <div key={a.id} className="rounded-lg border px-3 py-2 text-sm">
                            <p className="font-bold">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.type} · {new Date(a.date).toLocaleDateString("id-ID")} · {a.attendance} {k("peserta")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm leading-relaxed">
              <p className="font-extrabold text-gold-deep dark:text-gold">{k("nilaiTitle")}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1.5 text-foreground/80">
                <li>{k("nilai1")}</li>
                <li>{k("nilai2")}</li>
                <li>{k("nilai3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
