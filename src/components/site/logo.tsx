/**
 * Task 37 — Logo Resmi MUHDIN (disahkan): bintang geometri Islami 8 sudut,
 * monogram M emas, Kaaba & bulan sabit, buku terbuka. Aset turunan digenerate
 * dari karya resmi oleh scripts/make-brand-assets.py — jangan menggambar ulang.
 */
export function MuhdinLogo({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <img
      src="/brand/logo-emblem.png"
      alt="Logo Resmi MUHDIN"
      role="img"
      className={`${className} object-contain rounded-lg`}
      draggable={false}
    />
  );
}

export function MuhdinBrand({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <MuhdinLogo className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className={`font-extrabold tracking-wide text-lg ${light ? "text-white" : "text-foreground"}`}>
          MUH
          <span className={light ? "text-gold-gradient" : "text-gold-deep dark:text-gold"}>DIN</span>
        </div>
        {!compact && (
          <div className={`text-[10px] font-medium mt-0.5 ${light ? "text-emerald-100/80" : "text-muted-foreground"}`}>
            Masyarakat Umroh Haji Digital Indonesia
          </div>
        )}
      </div>
    </div>
  );
}
