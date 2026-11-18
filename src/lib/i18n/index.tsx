/**
 * i18n core — LocaleProvider + useT (Indonesia / English / العربية RTL).
 * Orkestrator-owned. Views memakai: const { t, locale, setLocale, dir, isRtl } = useT();
 *
 * Sumber kebenaran locale = COOKIE "muhdin-locale" (dibaca server saat SSR:
 * html lang/dir + seluruh teks dirender dalam bahasa yang sama → bebas
 * hydration mismatch). localStorage hanya cache tambahan.
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries } from "@/lib/i18n/dictionaries";

export type Locale = "id" | "en" | "ar";

export const LOCALES: { code: Locale; native: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "id", native: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  { code: "en", native: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", native: "العربية", flag: "🇸🇦", dir: "rtl" },
];

const COOKIE_KEY = "muhdin-locale";
const STORAGE_KEY = "muhdin-locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 tahun

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: "ltr" | "rtl";
  isRtl: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const val = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof val === "string" ? val : undefined;
}

export function LocaleProvider({
  children,
  initialLocale = "id",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sinkronkan <html lang/dir> (menegaskan nilai SSR + font Arab).
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === "ar" ? "rtl" : "ltr";
    html.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      document.cookie = `${COOKIE_KEY}=${l}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = lookup(dictionaries[locale], key) ?? lookup(dictionaries.id, key) ?? key;
      if (process.env.NODE_ENV !== "production" && text === key && key.includes(".")) {
        // Guard Task 36 — kunci mentah bocor ke UI (bug v13–v15: layanan.items.*,
        // benef.cat.*, acad.*, book.*). Di dev, beri tahu segera supaya locale
        // diperbaiki alih-alih membiarkan teks kunci tampil ke pengguna.
        console.warn(`[i18n] kunci tidak ditemukan: "${key}" (locale: ${locale})`);
      }
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, dir: locale === "ar" ? "rtl" : "ltr", isRtl: locale === "ar", t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n harus dipakai di dalam <LocaleProvider>");
  return ctx;
}

export function useT() {
  return useI18n();
}

/* ---------- Helper format tanggal/angka per-locale ---------- */

export function formatDateL10n(iso: string | null | undefined, locale: Locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatNumberL10n(n: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-GB").format(n);
  } catch {
    return String(n);
  }
}
