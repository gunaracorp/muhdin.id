"use client";

/**
 * Task 19 (R-058) — SmartImage: gambar malas + konversi WebP otomatis.
 *
 * • Lazy: hanya memuat saat mendekati viewport (IntersectionObserver) — hemat
 *   kuota jamaah di lapangan; skeleton shimmer sampai siap, fade-in halus.
 * • WebP: mencoba sumber .webp lebih dulu (hasil scripts/optimize-images.mjs);
 *   bila file belum tersedia, onError jatuh kembali ke sumber asli — nol rusak.
 * • SSR-safe & aksesibel: alt wajib, decoding async, eager bila priority.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function webpCandidate(src: string) {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith("data:")) return null; // eksternal/data → biarkan
  return src.replace(/\.(jpe?g|png)$/i, ".webp");
}

export function SmartImage({
  src: srcProp,
  alt,
  className,
  priority = false,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  const source = (srcProp as string | undefined) || "";
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);
  const [loaded, setLoaded] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Sumber aktif DITURUNKAN (derive), bukan disinkronkan lewat effect:
  // priority → langsung; biasa → kosong sampai IntersectionObserver memicu visible.
  // WebP gagal utk sumber ini → jatuh kembali ke sumber asli otomatis.
  const webp = webpCandidate(source);
  const useWebp = !!webp && failedSrc !== source;
  const current = priority || visible ? (useWebp ? webp! : source) : "";

  useEffect(() => {
    if (visible || !holder.current) return;
    const el = holder.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" } // mulai unduh 600px sebelum terlihat — tak terasa
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, source]);

  return (
    <div ref={holder} className={cn("relative overflow-hidden", className)} aria-busy={!loaded}>
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" aria-hidden />
      ) : null}
      {current ? (
        <img
          src={current}
          alt={alt || ""}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            // WebP belum tersedia → kembali ke sumber asli; asli pun gagal → hentikan skeleton.
            if (useWebp) setFailedSrc(source);
            else setLoaded(true);
          }}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700",
            loaded ? "opacity-100" : "opacity-0"
          )}
          {...rest}
        />
      ) : null}
    </div>
  );
}
