"use client";

/**
 * Task 19 (R-059) — Tombol "Impor CSV" untuk toolbar modul CMS.
 * Dialog: pilih berkas CSV (atau tempel isi), pratinjau 3 baris pertama,
 * kirim ke POST /api/import, laporkan ringkasan (baru/diperbarui/gagal).
 */
import { useRef, useState } from "react";
import { apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  type: string;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors?: string[];
}

const TYPE_HINT: Record<string, string> = {
  subscribers: "Kolom wajib: email. Opsional: name. Email duplikat diperbarui.",
  articles: "Kolom wajib: title. Opsional: slug, excerpt, content, category, cover, status, author, metaTitle, metaDescription, keywords.",
  applications: "Kolom wajib: orgName, type, contactName, email, phone, city. Opsional: province, licenseNo, message.",
  messages: "Kolom wajib: name, message. Opsional: email, phone, subject.",
  members: "Kolom wajib: name (nama), type (PPIU/PIHK), city (kota), licenseNo (nomor izin). Opsional: province, phone, email, website, description, status, memberSince, rating. Alias sheet Master dikenali otomatis (nama_resmi, jenis_entitas, nomor_izin_Kemenag, telepon_email_web, status_izin, dst.). Baris dengan nomor izin sama DIPERBARUI, bukan diduplikasi.",
  registry: "Kolom wajib: NIB, nama/nama_resmi. Opsional: jenis_entitas, nomor_izin_Kemenag + masa_berlaku_izin, nomor_badan_hukum (akta), NPWP, akreditasi, kota, provinsi, telepon_email_web, catatan_risiko. Baris dengan NIB sama DIPERBARUI beserta dokumen izinnya.",
};

export function ImportCsvButton({ type }: { type: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (f: File | null | undefined) => {
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await apiSend<ImportResult>("/api/import", "POST", { type, csv });
      setResult(res);
      toast({
        title: `Impor selesai ✓ ${res.inserted} baru, ${res.updated} diperbarui`,
        description: res.skipped ? `${res.skipped} baris dilewati` : "Tanpa baris yang gagal",
      });
    } catch (e) {
      toast({ title: "Impor gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const preview = csv.split(/\r?\n/).filter(Boolean).slice(0, 3);

  return (
    <>
      <Button variant="outline" size="sm" className="h-9" onClick={() => { setOpen(true); setResult(null); }}>
        <Icon name="upload" className="h-4 w-4 mr-1.5" aria-hidden />
        Impor CSV
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="upload" className="h-4 w-4 text-primary" aria-hidden /> Impor CSV — {type}
            </DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <p className="text-2xl font-extrabold text-emerald-700">{result.inserted}</p>
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">Baru</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-2xl font-extrabold text-primary">{result.updated}</p>
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">Diperbarui</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3">
                  <p className="text-2xl font-extrabold text-destructive">{result.skipped}</p>
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">Dilewati</p>
                </div>
              </div>
              {result.errors?.length ? (
                <div className="max-h-40 overflow-auto rounded-xl border p-3 text-xs text-muted-foreground">
                  {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{TYPE_HINT[type]}</p>
              <div className="space-y-1.5">
                <Label>Berkas CSV</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="csv-area">…atau tempel isi CSV</Label>
                <Textarea id="csv-area" value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} className="font-mono text-xs" placeholder={"email,name\nandi@example.com,Andi Travel"} />
              </div>
              {preview.length ? (
                <div className="rounded-xl bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  <p className="font-bold uppercase tracking-wide">Pratinjau</p>
                  {preview.map((l, i) => <p key={i} className="truncate font-mono">{l}</p>)}
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter>
            {result ? (
              <Button onClick={() => { setOpen(false); setCsv(""); setResult(null); }}>Selesai</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={submit} disabled={busy || !csv.trim()}>
                  {busy ? <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> : <Icon name="upload" className="h-4 w-4" aria-hidden />}
                  <span className="ml-2">{busy ? "Mengimpor…" : "Impor Sekarang"}</span>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
