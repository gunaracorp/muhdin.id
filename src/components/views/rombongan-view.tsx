"use client";

/**
 * R-045 (v14.1) — Pendaftaran Rombongan B2B → Portal #/rombongan.
 * Koordinator rombongan besar: unggah anggota massal (satu nama per baris,
 * minimal 10), satu tagihan group order dengan harga server-side (musiman/
 * early bird berlaku), pantau status via kode MHD-B2B-XXXX.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PaketOption {
  id: string;
  title: string;
  price: number;
  departureDate: string | null;
  slots: number;
  slotsTaken: number;
}

interface GroupOrderResult {
  code: string;
  groupName: string;
  packageTitle: string;
  memberCount: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold-deep dark:text-gold",
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function RombonganView() {
  const { t } = useT();
  const k = (key: string) => t(`rombongan.${key}`);

  const [packages, setPackages] = useState<PaketOption[]>([]);
  const [packageName, setGroupName] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");
  const [packageId, setPackageId] = useState("");
  const [membersText, setMembersText] = useState("");
  const [notes, setNotes] = useState("");
  const [pdp, setPdp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GroupOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cek status
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<GroupOrderResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/packages")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const list = (Array.isArray(data) ? data : []).filter((p: PaketOption) => p.slots > p.slotsTaken);
        setPackages(list);
        if (list.length > 0) setPackageId((prev) => prev || list[0].id);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const members = useMemo(
    () =>
      Array.from(
        new Set(
          membersText
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2)
        )
      ),
    [membersText]
  );

  const selectedPkg = packages.find((p) => p.id === packageId) ?? null;
  const eligible = members.length >= 10 && members.length <= 200 && packageName.trim().length >= 3 && coordinatorName.trim().length >= 2 && coordinatorPhone.trim().length >= 8 && packageId && pdp;

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/group-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: packageName,
          coordinatorName,
          coordinatorPhone,
          packageId,
          membersText,
          notes,
          pdpConsent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(data.order);
        setMembersText("");
        setPdp(false);
      } else {
        setError(data.error ?? k("gagal"));
      }
    } catch {
      setError(k("gagal"));
    } finally {
      setSubmitting(false);
    }
  }, [packageName, coordinatorName, coordinatorPhone, packageId, membersText, notes, k]);

  const checkStatus = useCallback(async () => {
    setLookupError(null);
    setLookup(null);
    try {
      const res = await fetch(`/api/group-orders?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setLookup(data.order);
      else setLookupError(data.error ?? k("gagal"));
    } catch {
      setLookupError(k("gagal"));
    }
  }, [code, k]);

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
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight" data-testid="rombongan-title">{k("title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{k("subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {[k("fitur1"), k("fitur2"), k("fitur3"), k("fitur4")].map((f) => (
                <span key={f} className="inline-flex items-center gap-2 font-semibold">
                  <Icon name="check-circle-2" className="h-4 w-4 text-gold" aria-hidden />{f}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-8 lg:grid-cols-5">
          {/* Form pengajuan */}
          <div className="lg:col-span-3 rounded-2xl border bg-card p-6 shadow-sm" data-testid="rombongan-form">
            <h2 className="text-xl font-extrabold">{k("formTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{k("formSub")}</p>

            {result ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5" data-testid="rombongan-sukses">
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{k("suksesTitle")}</p>
                <p className="mt-1 text-sm text-foreground/80">{k("suksesBody")}</p>
                <div className="mt-4 space-y-1.5 text-sm">
                  <p><span className="font-bold">{k("kode")}:</span> <code className="rounded bg-primary/10 px-2 py-0.5 font-extrabold text-primary">{result.code}</code></p>
                  <p><span className="font-bold">{k("paket")}:</span> {result.packageTitle}</p>
                  <p><span className="font-bold">{k("anggota")}:</span> {result.memberCount}</p>
                  <p><span className="font-bold">{k("hargaSatuan")}:</span> {rupiah(result.unitPrice)}</p>
                  <p><span className="font-bold">{k("total")}:</span> {rupiah(result.totalAmount)}</p>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => setResult(null)}>{k("ajukanLagi")}</Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rg-nama">{k("namaGrup")}</Label>
                    <Input id="rg-nama" value={packageName} onChange={(e) => setGroupName(e.target.value)} placeholder={k("namaGrupPh")} data-testid="rombongan-nama-grup" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rg-koor">{k("koordinator")}</Label>
                    <Input id="rg-koor" value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} placeholder={k("koordinatorPh")} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rg-wa">{k("telepon")}</Label>
                    <Input id="rg-wa" value={coordinatorPhone} onChange={(e) => setCoordinatorPhone(e.target.value)} placeholder="+62 8xx-xxxx-xxxx" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rg-paket">{k("pilihPaket")}</Label>
                    <select
                      id="rg-paket"
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      data-testid="rombongan-paket"
                    >
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} — {rupiah(p.price)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rg-anggota">{k("daftarAnggota")}</Label>
                  <Textarea
                    id="rg-anggota"
                    value={membersText}
                    onChange={(e) => setMembersText(e.target.value)}
                    placeholder={k("daftarAnggotaPh")}
                    rows={8}
                    data-testid="rombongan-anggota"
                  />
                  <p className="text-xs font-bold" data-testid="rombongan-hitung">
                    {k("terbaca")}: <span className={cn(members.length >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{members.length}</span> {k("orang")} · min 10, maks 200
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rg-catatan">{k("catatan")}</Label>
                  <Input id="rg-catatan" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={k("catatanPh")} />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={pdp} onChange={(e) => setPdp(e.target.checked)} className="mt-1" data-testid="rombongan-pdp" />
                  <span className="text-muted-foreground">{k("pdp")}</span>
                </label>
                {selectedPkg && members.length >= 10 && (
                  <div className="rounded-xl bg-muted/60 p-4 text-sm">
                    <p className="font-bold">{k("estimasi")} (harga server-side final saat diproses)</p>
                    <p className="mt-1 text-muted-foreground">
                      {members.length} × {rupiah(selectedPkg.price)} = <span className="font-extrabold text-foreground">{rupiah(selectedPkg.price * members.length)}</span>
                      {" — "}{k("estimasiCatatan")}
                    </p>
                  </div>
                )}
                {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid="rombongan-gagal">{error}</p>}
                <Button className="w-full" onClick={submit} disabled={!eligible || submitting} data-testid="rombongan-submit">
                  {submitting ? k("mengirim") : k("kirim")}
                </Button>
              </div>
            )}
          </div>

          {/* Cek status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm" data-testid="rombongan-status">
              <h2 className="text-lg font-extrabold">{k("cekTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{k("cekSub")}</p>
              <div className="mt-4 flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MHD-B2B-XXXX" data-testid="rombongan-kode" />
                <Button onClick={checkStatus} disabled={code.trim().length < 10}>{k("cek")}</Button>
              </div>
              {lookupError && <p className="mt-3 text-sm text-destructive">{lookupError}</p>}
              {lookup && (
                <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm space-y-1.5" data-testid="rombongan-hasil">
                  <p className="font-extrabold">{lookup.groupName}</p>
                  <p><Badge className={cn("text-[10px]", STATUS_STYLE[lookup.status])}>{lookup.status}</Badge></p>
                  <p className="text-muted-foreground">{lookup.packageTitle} · {lookup.memberCount} {k("orang")}</p>
                  <p className="font-bold">{rupiah(lookup.totalAmount)}</p>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm leading-relaxed">
              <p className="font-extrabold text-gold-deep dark:text-gold">{k("syaratTitle")}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1.5 text-foreground/80">
                <li>{k("syarat1")}</li>
                <li>{k("syarat2")}</li>
                <li>{k("syarat3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
