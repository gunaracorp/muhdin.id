"use client";

/**
 * v10 — GlobalSearch: command palette pencarian global (Ctrl/⌘+K).
 * cmdk via shadcn CommandDialog — server-side search ke /api/search
 * (6 entitas), navigasi hash langsung dari hasil. RTL-aman & i18n penuh.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

type SearchResults = {
  query: string;
  articles: { id: string; title: string; excerpt?: string | null; category?: string; href: string }[];
  tutorials: { id: string; title: string; summary?: string | null; category?: string; href: string }[];
  ecosystems: { id: string; number?: number | null; name: string; scope?: string | null; href: string }[];
  members: { id: string; name: string; type?: string; city?: string; province?: string; href: string }[];
  events: { id: string; title: string; startsAt?: string; location?: string; category?: string; href: string }[];
  faqs: { id: string; question: string; category?: string; href: string }[];
};

/** Tautan cepat saat palet dibuka tanpa kata kunci (key = footer.quick.*). */
const QUICK_LINKS: [label: string, href: string, icon: string][] = [
  ["beranda", "beranda", "globe"],
  ["anggota", "anggota", "users"],
  ["berita", "berita", "newspaper"],
  ["agenda", "agenda", "calendar"],
  ["paspor", "paspor", "qr-code"],
  ["track", "tracking", "map"],
  ["tur", "tur-virtual", "orbit"],
  ["statistik", "transparansi", "activity"],
];

export function GlobalSearch() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const seqRef = useRef(0);

  /* Hotkey global: Ctrl/⌘+K buka-tutup. Escape ditangani CommandDialog. */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  /* v10 — tombol Cari di navbar memicu event global ini. */
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("muhdin:search-open", openHandler);
    return () => window.removeEventListener("muhdin:search-open", openHandler);
  }, []);

  /* Debounce fetch 250ms — batalkan permintaan basi (stale). */
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const seq = ++seqRef.current;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (seq === seqRef.current) setResults(res.ok ? data : null);
      } catch {
        /* aborted atau jaringan — abaikan */
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, open]);

  const go = useCallback((href: string) => {
    setOpen(false);
    setQ("");
    setResults(null);
    navigate(href);
  }, []);

  const termLen = q.trim().length;
  const total = results
    ? results.articles.length + results.tutorials.length + results.ecosystems.length + results.members.length + results.events.length + results.faqs.length
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQ("");
          setResults(null);
        }
      }}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>{t("search.aria")}</DialogTitle>
        <DialogDescription>{t("search.hint")}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        {/* shouldFilter=false — pemfilteran dilakukan server; cmdk hanya menampilkan hasil. */}
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not(idden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder={t("search.placeholder")}
        aria-label={t("search.aria")}
      />
      <CommandList className="min-h-72">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden />
            {t("search.loading")}
          </div>
        )}

        {!loading && termLen < 2 && (
          <>
            <p className="px-4 pt-3 pb-1 text-[11px] text-muted-foreground">{t("search.hint")}</p>
            <CommandGroup heading={t("search.groups.halaman")}>
              {QUICK_LINKS.map(([key, href, icon]) => (
                <CommandItem key={href} value={href} onSelect={() => go(href)} className="gap-2">
                  <Icon name={icon} className="h-4 w-4 text-primary" aria-hidden />
                  <span>{t(`footer.quick.${key}`)}</span>
                  <Icon name="arrow-right" className="ms-auto h-3.5 w-3.5 text-muted-foreground icon-flip" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!loading && termLen >= 2 && total === 0 && <CommandEmpty>{t("search.empty")}</CommandEmpty>}

        {!loading && results && total > 0 && (
          <>
            {results.members.length > 0 && (
              <CommandGroup heading={t("search.groups.anggota")}>
                {results.members.map((m) => (
                  <CommandItem key={m.id} value={`m-${m.id}`} onSelect={() => go(m.href)} className="gap-2">
                    <Icon name="badge-check" className="h-4 w-4 text-emerald-600" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                        {[m.type, m.city, m.province].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.articles.length > 0 && (
              <CommandGroup heading={t("search.groups.berita")}>
                {results.articles.map((a) => (
                  <CommandItem key={a.id} value={`a-${a.id}`} onSelect={() => go(a.href)} className="gap-2">
                    <Icon name="newspaper" className="h-4 w-4 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      {a.category && <p className="truncate text-[11px] text-muted-foreground">{a.category}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.events.length > 0 && (
              <CommandGroup heading={t("search.groups.agenda")}>
                {results.events.map((e) => (
                  <CommandItem key={e.id} value={`e-${e.id}`} onSelect={() => go(e.href)} className="gap-2">
                    <Icon name="calendar" className="h-4 w-4 text-gold" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[e.location, e.startsAt ? new Date(e.startsAt).toLocaleDateString() : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.tutorials.length > 0 && (
              <CommandGroup heading={t("search.groups.tutorial")}>
                {results.tutorials.map((tu) => (
                  <CommandItem key={tu.id} value={`t-${tu.id}`} onSelect={() => go(tu.href)} className="gap-2">
                    <Icon name="graduation-cap" className="h-4 w-4 text-sky-600" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tu.title}</p>
                      {tu.category && <p className="truncate text-[11px] text-muted-foreground">{tu.category}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.ecosystems.length > 0 && (
              <CommandGroup heading={t("search.groups.ekosistem")}>
                {results.ecosystems.map((e) => (
                  <CommandItem key={e.id} value={`k-${e.id}`} onSelect={() => go(e.href)} className="gap-2">
                    <Icon name="boxes" className="h-4 w-4 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span dir="ltr">{e.number}.</span> {e.name}
                      </p>
                      {e.scope && <p className="truncate text-[11px] text-muted-foreground">{e.scope}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.faqs.length > 0 && (
              <CommandGroup heading={t("search.groups.faq")}>
                {results.faqs.map((f) => (
                  <CommandItem key={f.id} value={`f-${f.id}`} onSelect={() => go(f.href)} className="gap-2">
                    <Icon name="help-circle" className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.question}</p>
                      {f.category && <p className="truncate text-[11px] text-muted-foreground">{f.category}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
