"use client";

/**
 * SahabatMUHDIN (v4.0) — AI Concierge: asisten ibadah pribadi jamaah.
 *
 * Gelembung melayang di atas WaFab (bottom-24 end-5) yang membuka panel
 * chat "Sahabat MUHDIN". Mesin AI hidup di server (POST /api/ai/chat,
 * z-ai-web-dev-sdk) — klien hanya mengirim riwayat & locale.
 *
 * Fitur:
 * - Tiga bahasa (id/en/ar) mengikuti LocaleProvider; panel RTL-aware.
 * - Saran cepat (chips) per bahasa + sapaan pembuka.
 * - Riwayat chat tersimpan di localStorage (muhdin-ai-chat, 20 pesan).
 * - Indikator mengetik, tombol bersihkan riwayat, aksesibilitas penuh
 *   (aria, esc untuk menutup, fokus input otomatis).
 * - Hydration-aman: dirender dari MuhdinApp hanya setelah mount.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/site/icon";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "muhdin-ai-chat";
const MAX_STORED = 20;

const COPY = {
  id: {
    title: "Sahabat MUHDIN",
    subtitle: "Asisten AI Haji & Umrah — online 24 jam",
    welcome:
      "Assalamu'alaikum! 👋\n\nSaya **Sahabat MUHDIN**, pendamping digital perjalanan ibadah Anda. Silakan tanya apa saja seputar haji, umrah, manasik, atau layanan ekosistem MUHDIN.",
    placeholder: "Tanya apa saja tentang haji & umrah…",
    suggestions: [
      "Apa perbedaan haji dan umrah?",
      "Bagaimana MUHDIN memverifikasi penyelenggara?",
      "Checklist perlengkapan umrah",
      "Bimbingan doa saat melontar jumrah",
    ],
    clear: "Bersihkan percakapan",
    error: "Maaf, koneksi terganggu. Silakan coba lagi.",
    openAria: "Buka Sahabat MUHDIN — asisten AI",
    closeAria: "Tutup asisten AI",
    inputAria: "Tulis pertanyaan untuk Sahabat MUHDIN",
    sendAria: "Kirim pertanyaan",
    thinking: "Sahabat MUHDIN sedang mengetik…",
  },
  en: {
    title: "Sahabat MUHDIN",
    subtitle: "AI Hajj & Umrah Assistant — online 24/7",
    welcome:
      "Peace be upon you! 👋\n\nI am **Sahabat MUHDIN**, your digital companion for the sacred journey. Ask me anything about hajj, umrah, rituals, or MUHDIN's ecosystem of services.",
    placeholder: "Ask anything about hajj & umrah…",
    suggestions: [
      "What is the difference between hajj and umrah?",
      "How does MUHDIN verify organizers?",
      "Umrah packing checklist",
      "Guidance for the stoning (jamarat) prayers",
    ],
    clear: "Clear conversation",
    error: "Sorry, connection issue. Please try again.",
    openAria: "Open Sahabat MUHDIN — AI assistant",
    closeAria: "Close AI assistant",
    inputAria: "Write a question for Sahabat MUHDIN",
    sendAria: "Send question",
    thinking: "Sahabat MUHDIN is typing…",
  },
  ar: {
    title: "صاحب مُهدين",
    subtitle: "مساعد الحج والعمرة الذكي — متصل ٢٤ ساعة",
    welcome:
      "السلام عليكم! 👋\n\nأنا **صاحب مُهدين**، رفيقكم الرقمي في رحلة الإيمان. اسألوني عن الحج والعمرة والمناسك أو خدمات منظومة مُهدين.",
    placeholder: "اسأل أي شيء عن الحج والعمرة…",
    suggestions: [
      "ما الفرق بين الحج والعمرة؟",
      "كيف يوثّق مُهدين منظمي الرحلات؟",
      "قائمة تجهيزات العمرة",
      "أدعى رمي الجمرات",
    ],
    clear: "مسح المحادثة",
    error: "عذراً، حدث خلل في الاتصال. حاول مرة أخرى.",
    openAria: "افتح صاحب مُهدين — المساعد الذكي",
    closeAria: "إغلاق المساعد الذكي",
    inputAria: "اكتب سؤالاً لصاحب مُهدين",
    sendAria: "إرسال السؤال",
    thinking: "صاحب مُهدين يكتب الآن…",
  },
} as const;

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m: Msg) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

export function SahabatMuhdin() {
  const { locale, dir } = useT();
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);

  // Muat riwayat hanya setelah mount (bebas hydration mismatch).
  useEffect(() => {
    setMessages(loadHistory());
    mountedRef.current = true;
  }, []);

  // Simpan riwayat setiap berubah.
  useEffect(() => {
    if (!mountedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage penuh — abaikan */
    }
  }, [messages]);

  // Auto-scroll ke bawah saat pesan baru.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  // ESC menutup panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Fokus input saat panel dibuka.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const next: Msg[] = [...messages, { role: "user" as const, content: question }].slice(-MAX_STORED);
      setMessages(next);
      setInput("");
      setBusy(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next.slice(-12), locale }),
        });
        const data = await res.json().catch(() => ({}));
        const reply: string = res.ok && data?.reply ? String(data.reply) : "";
        setMessages((prev) =>
          [...prev, { role: "assistant" as const, content: reply || c.error }].slice(-MAX_STORED)
        );
      } catch {
        setMessages((prev) => [...prev, { role: "assistant" as const, content: c.error }].slice(-MAX_STORED));
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, locale, c.error]
  );

  const isEmpty = messages.length === 0;
  const chips = useMemo(() => c.suggestions, [c]);

  return (
    <>
      {/* ===== Tombol FAB (di atas WaFab) ===== */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? c.closeAria : c.openAria}
        aria-expanded={open}
        className={cn(
          "group fixed bottom-24 end-5 z-[60] flex items-center gap-0 rounded-full text-white shadow-[0_12px_32px_-8px_oklch(0.55_0.13_75/0.55)] transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
          open ? "bg-forest" : "bg-gradient-to-br from-gold-deep to-primary hover:shadow-[0_18px_40px_-10px_oklch(0.55_0.13_75/0.65)]"
        )}
      >
        <span className="grid h-14 w-14 place-items-center">
          <Icon name={open ? "x" : "sparkles"} className="h-6 w-6" aria-hidden />
        </span>
        {!open && (
          <span className="max-w-0 overflow-hidden whitespace-nowrap pe-0 text-sm font-bold tracking-wide transition-all duration-300 group-hover:max-w-44 group-hover:pe-5">
            {c.title}
          </span>
        )}
      </button>

      {/* ===== Panel Chat ===== */}
      {open && (
        <div
          dir={dir}
          role="dialog"
          aria-label={c.title}
          className="fixed inset-x-2 bottom-[10.5rem] z-[70] flex max-h-[min(34rem,65vh)] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-[0_32px_80px_-16px_oklch(0.2_0.05_160/0.5)] sm:inset-x-auto sm:end-5 sm:w-[24.5rem]"
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 bg-gradient-to-r from-forest via-primary to-forest px-4 py-3.5 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Icon name="sparkles" className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold tracking-wide">{c.title}</p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-white/85">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
                {c.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMessages([])}
              title={c.clear}
              aria-label={c.clear}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="trash" className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.closeAria}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Area pesan */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {(isEmpty ? [{ role: "assistant" as const, content: c.welcome }] : messages).map(
              (m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" ? (
                    <div className="prose-sm prose-invert max-w-[92%] rounded-2xl rounded-ss-md bg-muted/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground [&_ol]:ms-4 [&_ol]:list-decimal [&_p]:my-1 [&_strong]:text-primary [&_ul]:ms-4 [&_ul]:list-disc">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p>{children}</p>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-se-md bg-gradient-to-br from-primary to-forest px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                      {m.content}
                    </div>
                  )}
                </div>
              )
            )}

            {busy && (
              <div className="flex justify-start" aria-live="polite" aria-label={c.thinking}>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-ss-md bg-muted/70 px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-primary/70"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Saran cepat */}
          {isEmpty && !busy && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
              {chips.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            className="flex items-center gap-2 border-t border-border bg-background/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={c.placeholder}
              aria-label={c.inputAria}
              maxLength={2000}
              disabled={busy}
              className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !input.trim()}
              aria-label={c.sendAria}
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-gold-deep to-primary text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="send" className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} aria-hidden />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
