"use client";

/**
 * admin-security.tsx — v12.3 «AMANAH» — R-074 Keamanan Akun di CMS.
 *
 * Panel 2FA TOTP per akun yang sedang login:
 *   setup (QR + kode manual) → aktivasi dgn kode authenticator → matikan.
 * Plus ringkasan kebijakan sandi & penguncian brute-force (R-075).
 */
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
// v13.0 «GERBANG» — R-077 Sesi & Device Management
import { AdminSessions } from "@/components/admin/admin-sessions";

type Status = { enabled: boolean };
type Setup = { secret: string; uri: string; qr: string };

export function AdminSecurity() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    apiGet<Status>("/api/auth/2fa")
      .then(setStatus)
      .catch(() => setStatus({ enabled: false }));
  };
  useEffect(load, []);

  const act = async (action: "setup" | "enable" | "disable") => {
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<Status & Partial<Setup>>("/api/auth/2fa", "POST", {
        action,
        code,
      });
      if (action === "setup") {
        setSetup({ secret: res.secret!, uri: res.uri!, qr: res.qr! });
        setCode("");
        toast({ title: "Rahasia 2FA dibuat", description: "Pindai QR lalu masukkan kode untuk mengaktifkan." });
      } else if (action === "enable") {
        setStatus({ enabled: true });
        setSetup(null);
        setCode("");
        toast({ title: "2FA aktif 🛡️", description: "Login berikutnya akan meminta kode autentikasi." });
      } else {
        setStatus({ enabled: false });
        setCode("");
        toast({ title: "2FA dimatikan", description: "Akun Anda kini hanya dilindungi password." });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold">Keamanan Akun</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lindungi akun administrator Anda — berlaku pribadi, tidak mengubah akun lain.
        </p>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className={cn("rounded-xl p-2.5", status?.enabled ? "bg-emerald-500/12" : "bg-muted")}>
              <Icon name="fingerprint" className={cn("h-6 w-6", status?.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold">Autentikasi Dua Faktor (TOTP)</h2>
                {status === null ? null : (
                  <Badge className={cn(status.enabled ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400")}>
                    {status.enabled ? "AKTIF" : "NONAKTIF"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Lapisan kedua di atas password: kode 6 digit dari aplikasi authenticator
                (Google Authenticator, Authy, dll.) yang berganti tiap 30 detik.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {!status?.enabled && !setup && (
            <Button onClick={() => act("setup")} disabled={busy} className="bg-primary text-white">
              <Icon name="keyround" className="h-4 w-4 mr-2" />
              Mulai Setup 2FA
            </Button>
          )}

          {setup && !status?.enabled && (
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-4">
              <p className="text-sm font-bold">1. Pindai QR dengan aplikasi authenticator</p>
              <div className="flex flex-wrap items-center gap-5">
                <img src={setup.qr} alt="QR 2FA MUHDIN" className="rounded-lg border bg-white p-1.5 h-44 w-44" />
                <div className="space-y-2 min-w-56">
                  <p className="text-xs text-muted-foreground">Atau masukkan kode manual:</p>
                  <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-sm tracking-wider select-all">{setup.secret}</code>
                  <p className="text-[11px] text-muted-foreground">Issuer MUHDIN · SHA1 · 6 digit · 30 detik</p>
                </div>
              </div>
              <p className="text-sm font-bold">2. Masukkan kode terbaru untuk mengaktifkan</p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="6 digit"
                  className="w-40 font-mono tracking-[0.3em]"
                  inputMode="numeric"
                />
                <Button onClick={() => act("enable")} disabled={busy || code.length !== 6} className="bg-emerald-600 text-white">
                  <Icon name="shield-check" className="h-4 w-4 mr-2" />
                  Aktifkan 2FA
                </Button>
                <Button variant="outline" onClick={() => { setSetup(null); setCode(""); setError(""); }}>Batal</Button>
              </div>
            </div>
          )}

          {status?.enabled && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm">
                <Icon name="check-circle-2" className="h-4 w-4 text-emerald-600" />
                Login membutuhkan kode 2FA. Simpan kode pemulihan aplikasi authenticator Anda.
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="Kode untuk konfirmasi"
                  className="w-44 font-mono tracking-[0.3em]"
                  inputMode="numeric"
                />
                <Button variant="destructive" onClick={() => act("disable")} disabled={busy || code.length !== 6}>
                  <Icon name="lock" className="h-4 w-4 mr-2" />
                  Matikan 2FA
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2">
              <Icon name="alert-triangle" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Kebijakan password & lockout — informasi */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-2.5">
            <Icon name="shield-alert" className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-extrabold">Kebijakan Sandi & Penguncian</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc ps-5">
              <li>Password minimal <b className="text-foreground">8 karakter</b> dan harus mengandung <b className="text-foreground">huruf &amp; angka</b> — sandi terlalu umum ditolak otomatis.</li>
              <li>5× kegagalan login (password maupun kode 2FA) dalam 15 menit → akun <b className="text-foreground">terkunci 15 menit</b> anti brute-force.</li>
              <li>Percobaan masuk dibatasi <b className="text-foreground">10×/menit per jaringan</b>.</li>
              <li>Semua peristiwa penguncian tercatat di <b className="text-foreground">jejak audit</b>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* v13.0 «GERBANG» — R-077: perangkat aktif + logout paksa jarak jauh */}
      <AdminSessions />
    </div>
  );
}
