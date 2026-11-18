"use client";

/**
 * R-034 v15.0.0 «GOD MODE» — CMS "Evaluasi Instruktur": daftar umpan balik
 * tertutup murid per kelas + agregat rata-rata per kelas (baca saja —
 * keputusan mutu pengajar dibuat panitia dari data agregat).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/site/icon";
import { useT } from "@/lib/i18n";

interface ReviewRow {
  id: string;
  classId: string;
  classTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewData {
  total: number;
  rows: ReviewRow[];
  summary: { classId: string; count: number; avg: number }[];
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" className={i <= n ? "h-3.5 w-3.5 fill-gold text-gold" : "h-3.5 w-3.5 text-muted-foreground/35"} />
      ))}
    </span>
  );
}

export function AdminInstructorReviews() {
  const { t } = useT();
  const [data, setData] = useState<ReviewData | null>(null);

  const load = useCallback(() => {
    apiGet<ReviewData>("/api/instructor-reviews?all=1")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const avgOf = (classId: string) => data?.summary.find((s) => s.classId === classId);

  return (
    <div className="space-y-4" data-testid="admin-instructor-reviews">
      <div>
        <h2 className="text-lg font-extrabold">{t("adminRev.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminRev.desc")}</p>
      </div>

      {!data ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminRev.loading")}</p>
      ) : data.total === 0 ? (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">{t("adminRev.empty")}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.summary.map((s) => (
              <div key={s.classId} className="rounded-2xl border bg-card p-4">
                <p className="text-2xl font-extrabold tabular-nums text-gold-deep dark:text-gold" dir="ltr">{s.avg.toFixed(1)}</p>
                <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                  {s.count} {t("adminRev.evaluations")} · <Stars n={Math.round(s.avg)} />
                </p>
                <p className="mt-1 truncate text-xs font-bold">{data.rows.find((r) => r.classId === s.classId)?.classTitle}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 text-start font-extrabold">{t("adminRev.class")}</th>
                  <th className="px-4 py-2.5 text-start font-extrabold">{t("adminRev.rating")}</th>
                  <th className="px-4 py-2.5 text-start font-extrabold">{t("adminRev.comment")}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-semibold">{r.classTitle}</td>
                    <td className="px-4 py-2.5"><Stars n={r.rating} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Badge variant="outline" className="text-[10px]">{t("adminRev.privacy")}</Badge>
        </>
      )}
    </div>
  );
}
