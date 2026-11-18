"use client";

import { useEffect, useRef, useState } from "react";
import { useHashRoute, navigate } from "@/hooks/use-hash-route";
import { MuhdinBrand } from "@/components/site/logo";
import { Icon } from "@/components/site/icon";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { ThemeSwitcher } from "@/components/site/theme-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MENU_NODES, type MenuNode } from "@/lib/menu-data";

/**
 * Task 50 — MENU UTAMA BARU (instruksi manajemen):
 * BERANDA · 13 LAYANAN BISNIS · PENGURUS▾ · PERIZINAN▾ · SERTIFIKASI▾ ·
 * DIREKTORI ANGGOTA · BERITA · SYARIKAH · PASPOR▾ · TRANSPORTASI▾ · VAKSIN▾
 * Dropdown terbuka saat klik / hover; sub-item menuju #/layanan/<slug>.
 * Navbar dua baris agar 11 item muat lega; mobile memakai accordion di Sheet.
 */

const routeKey = (route: string[]) => route.join("/");

/** Apakah node menu sedang aktif untuk route saat ini. */
function isNodeActive(node: MenuNode, current: string, sub: string): boolean {
  if (node.route) {
    const [root, second] = node.route.split("/");
    return second ? current === root && sub === second : current === root;
  }
  if (node.key === "pengurus" && current === "pengurus") return true;
  return (node.children ?? []).some((c) => {
    // Task 52 (P0) — sub-item bisa punya route hash kustom (bukan layanan).
    const [root, second] = (c.route ?? `layanan/${c.slug}`).split("/");
    return current === root && (second ? sub === second : true);
  });
}

/** Path tujuan sub-item: route kustom atau #/layanan/<slug>. */
const childPath = (c: { slug: string; route?: string }) => c.route ?? `layanan/${c.slug}`;

export function Navbar() {
  const route = useHashRoute();
  const { t } = useT();
  const current = route[0] || "beranda";
  const sub = route[1] ?? "";
  const rKey = routeKey(route);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // sheet mobile
  const [openMenu, setOpenMenu] = useState<string | null>(null); // dropdown desktop
  const [acc, setAcc] = useState<string | null>(null); // accordion mobile
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tutup dropdown & accordion setiap pindah halaman.
  // (pola resmi React: "adjusting state during render" — tanpa effect)
  const [lastRouteKey, setLastRouteKey] = useState(rKey);
  if (lastRouteKey !== rKey) {
    setLastRouteKey(rKey);
    setOpenMenu(null);
    setAcc(null);
  }

  // Klik di luar navbar / tombol Escape menutup dropdown desktop.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as globalThis.Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const go = (path: string) => {
    setOpen(false);
    setOpenMenu(null);
    setAcc(null);
    navigate(path);
  };

  /* ---------- item desktop ---------- */
  const renderDesktopItem = (node: MenuNode) => {
    const label = t(`navbar.items.${node.key}`);
    const active = isNodeActive(node, current, sub);

    if (node.route) {
      return (
        <button
          key={node.key}
          onClick={() => go(node.route!)}
          aria-current={active ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded-lg px-1.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-colors",
            active ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-primary hover:bg-primary/5"
          )}
        >
          {label}
        </button>
      );
    }

    const isOpen = openMenu === node.key;
    return (
      <div key={node.key} className="relative">
        <button
          onClick={() => setOpenMenu(node.key)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-colors",
            active || isOpen ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-primary hover:bg-primary/5"
          )}
        >
          {label}
          <Icon
            name="chevron-down"
            className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
        {isOpen && (
          <div className="animate-in fade-in-0 zoom-in-95 absolute top-full start-0 z-50 mt-2 w-64 rounded-2xl border border-border/70 bg-popover p-2 shadow-xl duration-150">
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
              {t(`layanan.groups.${node.group}.label`)}
            </p>
            {(node.children ?? []).map((c) => {
              const [cRoot, cSecond] = childPath(c).split("/");
              const childActive = current === cRoot && (cSecond ? sub === cSecond : true);
              return (
                <button
                  key={c.slug}
                  onClick={() => go(childPath(c))}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[13px] font-bold transition-colors",
                    childActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-deep">
                    <Icon name={c.icon} className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  {t(`layanan.items.${c.slug}.title`)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ---------- item mobile (accordion) ---------- */
  const renderMobileItem = (node: MenuNode) => {
    const label = t(`navbar.items.${node.key}`);
    const active = isNodeActive(node, current, sub);

    if (node.route) {
      return (
        <button
          key={node.key}
          onClick={() => go(node.route!)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors",
            active ? "bg-primary/10 text-primary" : "text-foreground/75 hover:bg-muted"
          )}
        >
          {label}
          <Icon name="chevron-right" className="h-4 w-4 opacity-50 icon-flip" />
        </button>
      );
    }

    const isOpen = acc === node.key;
    return (
      <div key={node.key}>
        <button
          onClick={() => setAcc(isOpen ? null : node.key)}
          aria-expanded={isOpen}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors",
            active || isOpen ? "bg-primary/10 text-primary" : "text-foreground/75 hover:bg-muted"
          )}
        >
          {label}
          <Icon
            name="chevron-down"
            className={cn("h-4 w-4 opacity-60 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
        {isOpen && (
          <div className="mt-1 space-y-1 ps-4">
            {(node.children ?? []).map((c) => {
              const [cRoot, cSecond] = childPath(c).split("/");
              const childActive = current === cRoot && (cSecond ? sub === cSecond : true);
              return (
                <button
                  key={c.slug}
                  onClick={() => go(childPath(c))}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-start text-[13px] font-semibold transition-colors",
                    childActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <Icon name={c.icon} className="h-4 w-4 text-gold-deep" strokeWidth={1.9} />
                  {t(`layanan.items.${c.slug}.title`)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled ? "glass border-border/60 shadow-sm" : "bg-background/70 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0 border-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Baris 1 — brand + aksi */}
        <div className="flex h-16 items-center justify-between gap-3">
          <button onClick={() => go("beranda")} className="focus:outline-none" aria-label={t("navbar.aria.brand")}>
            <MuhdinBrand />
          </button>

          <div className="hidden xl:flex items-center gap-2">
            <ThemeSwitcher />
            <LocaleSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go("admin")}
              className="text-foreground/60 hover:text-primary"
            >
              <Icon name="login" className="h-4 w-4 me-1.5" />
              {t("navbar.portalMitra")}
            </Button>
            <Button
              size="sm"
              onClick={() => go("daftar")}
              className="bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg hover:from-forest hover:to-primary"
            >
              {t("navbar.gabung")}
              <Icon name="arrow-right" className="h-4 w-4 ms-1.5 icon-flip" />
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="xl:hidden" aria-label={t("navbar.aria.menu")}>
                <Icon name="menu" className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="p-5 border-b">
                  <SheetTitle asChild>
                    <div>
                      <MuhdinBrand />
                    </div>
                  </SheetTitle>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin" aria-label={t("navbar.aria.navMobile")}>
                  {MENU_NODES.map(renderMobileItem)}
                </nav>
                <div className="p-4 border-t space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("common.theme")}</p>
                    <ThemeSwitcher variant="mobile" />
                  </div>
                  <LocaleSwitcher variant="mobile" />
                  <Button className="w-full" onClick={() => go("daftar")}>
                    {t("navbar.gabung")}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => go("admin")}>
                    <Icon name="login" className="h-4 w-4 me-2" />
                    {t("navbar.mobilePortal")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Baris 2 — menu utama 11 item (desktop).
            flex-wrap + w-full: menu yang tidak muat PINDAH BARIS di dalam navbar —
            halaman tidak pernah ikut tergeser horizontal, tidak ada item terpotong,
            dan dropdown tetap tampil normal (tanpa overflow clip pada nav). */}
        <div className="hidden xl:flex justify-center pb-2.5">
          <nav
            ref={navRef}
            onMouseLeave={() => setOpenMenu(null)}
            className={cn(
              "flex w-full max-w-full flex-wrap items-center justify-center gap-0.5 rounded-xl px-1 py-0.5",
              scrolled && "border-t border-border/40"
            )}
            aria-label={t("navbar.aria.nav")}
          >
            {MENU_NODES.map(renderDesktopItem)}
          </nav>
        </div>
      </div>
    </header>
  );
}
