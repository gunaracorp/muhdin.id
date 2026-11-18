/**
 * R-089 «Landing Kampanye Musiman» (v13.0 «GERBANG») — form lead kampanye.
 *
 * Client component: nama + telepon (+ email opsional) → POST
 * /api/campaigns/[slug]/leads. Anti-spam: honeypot tersembunyi + rate-limit
 * server-side. Sumber kampanye (?ref=ig / utm_source) dibaca sekali saat mount.
 */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/site/icon";

export function LeadForm({ slug, cta }: { slug: string; cta: string }) {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [honey, setHoney] = useState(""); // honeypot — wajib kosong
  const [source, setSource] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setSource(params.get("ref") || params.get("utm_source") || "direct");
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honey) return; // bot — diam-diam buang
    setState("busy");
    setMsg("");
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(slug)}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined, source, honey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim pendaftaran.");
      setState("done");
    } catch (err) {
      setState("error");
      setMsg((err as Error).message);
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
          <Icon name="check-circle-2" className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-3 font-extrabold text-emerald-900">Terima kasih, {name.split(" ")[0]}! 🌙</p>
        <p className="mt-1 text-sm text-emerald-800/80">
          Data Anda kami terima. Tim MUHDIN akan menghubungi Anda via WhatsApp untuk langkah berikutnya.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <p className="font-extrabold text-forest-deep">{cta}</p>
      <p className="mt-1 text-xs text-stone-500">Isi singkat — tim kami yang menghubungi Anda.</p>

      <div className="mt-4 space-y-3">
        <input
          aria-label="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          required
          minLength={3}
          className="h-11 w-full rounded-xl border border-stone-200 px-3.5 text-sm outline-none focus:border-emerald-500"
        />
        <input
          aria-label="Nomor WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nomor WhatsApp (0812…)"
          required
          inputMode="tel"
          pattern="[+\-\s()0-9]{8,20}"
          className="h-11 w-full rounded-xl border border-stone-200 px-3.5 text-sm outline-none focus:border-emerald-500"
        />
        <input
          aria-label="Email (opsional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (opsional)"
          type="email"
          className="h-11 w-full rounded-xl border border-stone-200 px-3.5 text-sm outline-none focus:border-emerald-500"
        />
        {/* Honeypot — tersembunyi dari manusia, terisi bot */}
        <input
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>

      <button
        type="submit"
        disabled={state === "busy"}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest px-6 font-bold text-white shadow-lg transition hover:bg-forest-deep disabled:opacity-60"
      >
        {state === "busy" ? "Mengirim…" : cta}
      </button>
      {state === "error" && <p className="mt-2 text-xs text-red-600">{msg}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
        Dengan mengirim, Anda setuju data diolah sesuai Kebijakan Privasi MUHDIN (UU PDP 27/2022).
      </p>
    </form>
  );
}
