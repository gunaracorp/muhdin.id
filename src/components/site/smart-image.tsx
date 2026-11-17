"use client";

/**
 * Task 19 (R-058) — SmartImage: gambar malas + konversi WebP otomatis.
 *
 * • Lazy: hanya memuat saat mendekati viewport (IntersectionObserver) — hemat
 *   kuota jamaah di lapangan; skeleton shimmer sampai siap, fade-in halus.
 * • WebP: mencoba sumber .webp lebih dulu (hasil scripts/optimize-images.mjs);
 *   bila file belum tersedia, onError jatuh kembali ke sumber asli — nol rusak.
 * • SSR-safe & aksesibel: alt wajib, decoding async, eager bila priority.
 * • Task 27: sumber aktif kini DIHITUNG SAAT RENDER (derived state), bukan
 *   setState sinkron di dalam effect — menghilangkan cascading render
 *   (react-hooks/set-state-in-effect) dan bug gambar lenyap saat `src`
 *   berganti setelah visible (observer kini dipasang ulang otomatis).
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
  const [loaded, setLoaded] = useState(false);
  // Sumber yang dipilih IntersectionObserver (lazy): pasangan [basis, terpilih].
  const [ioBase, setIoBase] = useState("");
  const [ioSrc, setIoSrc] = useState("");
  // WebP gagal untuk `source` ini → jatuh ke sumber asli; disimpan per-sumber
  // sehingga ganti src otomatis pulih tanpa perlu reset di effect.
  const [failedSrc, setFailedSrc] = useState("");

  // Sumber aktif DIHITUNG SAAT RENDER (bukan effect):
  // • priority → langsung pakai kandidat WebP (bila ada) sejak render pertama;
  // • lazy     → kosong sampai observer memicu (ioBase === source).
  const failed = failedSrc === source;
  let current = "";
  if (!failed) {
    if (priority) current = webpCandidate(source) || source;
    else if (ioBase === source) current = ioSrc;
  }

  // Lazy: pasang observer selama sumber ini belum di-resolve; bila `src`
  // berganti, ioBase ≠ source → observer dipasang ulang (bug lama: setelah
  // visible, ganti src membuat gambar lenyap selamanya).
  const resolved = !priority && ioBase === source && ioSrc !== "";
  useEffect(() => {
    if (priority || resolved || !holder.current) return;
    const el = holder.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const w = webpCandidate(source);
          setIoBase(source);
          setIoSrc(w || source);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" } // mulai unduh 600px sebelum terlihat — tak terasa
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority, resolved, source]);

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
            // WebP belum tersedia → kembali ke sumber asli.
            if (current !== source) setFailedSrc(source);
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
