"use client";

/**
 * v11 — MANASIK ACADEMY (benchmark Nusuk manasik guidance).
 * Katalog kursus trilingual → daftar (nama+email) → quiz interaktif →
 * lulus = sertifikat digital ber-QR + poin KTA (bila email terhubung member).
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Course {
  id: string; slug: string; title: { id: string; en: string; ar: string };
  summary: { id: string; en: string; ar: string };
  category: string; level: string; durationMin: number; modules: number;
  passScore: number; rewardPoints: number; icon: string; color: string;
  _count?: { enrollments: number };
}
interface QuizItem { q: string; options: string[]; answer: number }
interface Cert { code: string; holderName: string; score: number }

const CATS = ["MANASIK", "KOMPETENSI", "SYARIAH", "DIGITAL"] as const;
const LEVEL_TONE: Record<string, string> = {
  DASAR: "bg-primary/10 text-primary border-primary/30",
  MENENGAH: "bg-gold/15 text-gold-deep border-gold/40",
  LANJUT: "bg-destructive/10 text-destructive border-destructive/30",
};

export function AcademyView() {
  const { t, locale } = useT();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("ALL");
  const [active, setActive] = useState<Course | null>(null);
  const [step, setStep] = useState<"enroll" | "quiz" | "result">("enroll");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrollId, setEnrollId] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean; certificate?: Cert } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ rows: Course[] }>("/api/academy/courses")
      .then((r) => setCourses(r.rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(
    () => (cat === "ALL" ? courses : courses.filter((c) => c.category === cat)),
    [courses, cat]
  );

  async function openCourse(c: Course) {
    setActive(c);
    setStep("enroll");
    setResult(null);
    setError("");
  }

  async function enroll() {
    if (!active) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ enrollment: { id: string }; resumed: boolean }>(
        "/api/academy/enroll", "POST", { courseSlug: active.slug, name, email }
      );
      setEnrollId(res.enrollment.id);
      // Soal quiz diambil lewat endpoint enroll (semi-privat: butuh email peserta).
      const q = await apiGet<{ quiz: QuizItem[]; status: string }>(
        `/api/academy/enroll?email=${encodeURIComponent(email)}&courseSlug=${encodeURIComponent(active.slug)}`
      );
      setQuiz(q.quiz || []);
      setAnswers(new Array((q.quiz || []).length).fill(undefined) as number[]);
      setStep("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center py-32">
        <Icon name="loader-circle" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_10%,rgba(212,175,55,0.16),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal>
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/40 border">
              <Icon name="graduation-cap" className="h-3.5 w-3.5 me-1.5" />{t("acad.heroBadge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t("acad.title")}</h1>
            <p className="mt-3 max-w-2xl text-white/85 md:text-lg">{t("acad.subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-2"><Icon name="book-open" className="h-4 w-4 text-gold" />{courses.length} {t("acad.statCourses")}</span>
              <span className="flex items-center gap-2"><Icon name="award" className="h-4 w-4 text-gold" />{t("acad.statCert")}</span>
              <span className="flex items-center gap-2"><Icon name="coins" className="h-4 w-4 text-gold" />{t("acad.statPoints")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FILTER + GRID */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {["ALL", ...CATS].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                cat === c ? "border-primary bg-primary text-white" : "bg-card hover:bg-muted")}
            >
              {c === "ALL" ? t("acad.all") : t(`acad.cat.${c}`)}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <button
                onClick={() => openCourse(c)}
                className="group h-full w-full rounded-2xl border bg-card p-6 text-start shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={c.icon} className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className={cn("text-[10px]", LEVEL_TONE[c.level])}>{t(`acad.level.${c.level}`)}</Badge>
                </div>
                <h3 className="mt-4 font-bold leading-snug group-hover:text-primary transition-colors">{c.title[locale] || c.title.id}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.summary[locale] || c.summary.id}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="clock" className="h-3.5 w-3.5" />{c.durationMin} {t("acad.min")}</span>
                  <span className="flex items-center gap-1"><Icon name="layers" className="h-3.5 w-3.5" />{c.modules} {t("acad.mod")}</span>
                  <span className="flex items-center gap-1 text-gold-deep font-semibold"><Icon name="coins" className="h-3.5 w-3.5" />+{c.rewardPoints}</span>
                </div>
              </button>
            </Reveal>
          ))}
          {!shown.length && <p className="col-span-full py-16 text-center text-muted-foreground">{t("acad.empty")}</p>}
        </div>
      </section>

      {/* DIALOG: enroll → quiz → hasil */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title[locale] || active?.title.id}</DialogTitle>
            <DialogDescription>{active?.summary[locale] || active?.summary.id}</DialogDescription>
          </DialogHeader>

          {step === "enroll" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="acad-name">{t("acad.name")}</Label>
                <Input id="acad-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("acad.namePh")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="acad-email">{t("acad.email")}</Label>
                <Input id="acad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" disabled={busy || !name.trim() || !email.trim()} onClick={enroll}>
                {busy ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="play" className="h-4 w-4 me-2" />}
                {t("acad.start")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("acad.enrollNote")}</p>
            </div>
          )}

          {step === "quiz" && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{t("acad.quizNote", { pass: String(active?.passScore ?? 70) })}</p>
              {(quiz.length ? quiz : []).map((item, qi) => (
                <div key={qi} className="rounded-xl border p-4">
                  <p className="font-semibold text-sm">{qi + 1}. {item.q}</p>
                  <div className="mt-2 grid gap-1.5">
                    {item.options.map((opt, oi) => (
                      <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted has-[[data-state=checked]]:border-primary">
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          className="accent-[var(--primary)]"
                          checked={answers[qi] === oi}
                          onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full"
                disabled={busy || !quiz.length || answers.filter((a) => a !== undefined).length < quiz.length}
                onClick={submitQuiz}
              >
                {busy ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="send" className="h-4 w-4 me-2" />}
                {t("acad.submit")}
              </Button>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4 text-center py-2">
              <span className={cn("mx-auto grid h-16 w-16 place-items-center rounded-full", result.passed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                <Icon name={result.passed ? "badge-check" : "x-circle"} className="h-8 w-8" />
              </span>
              <p className="text-3xl font-extrabold">{result.score}</p>
              <p className="text-sm text-muted-foreground">{result.passed ? t("acad.passed") : t("acad.failed")}</p>
              {result.certificate && (
                <div className="rounded-xl border bg-muted/40 p-4 text-start">
                  <p className="text-xs text-muted-foreground">{t("acad.certCode")}</p>
                  <p className="font-mono font-bold">{result.certificate.code}</p>
                </div>
              )}
              {result.passed ? (
                <Button className="w-full" onClick={() => { setActive(null); navigate("verifikasi-sertifikat"); }}>
                  <Icon name="badge-check" className="h-4 w-4 me-2" />{t("acad.certCta")}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => { setStep("quiz"); setAnswers([]); }}>
                  <Icon name="rotate-ccw" className="h-4 w-4 me-2" />{t("acad.retry")}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  async function submitQuiz() {
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ score: number; passed: boolean; certificate?: Cert }>("/api/academy/quiz", "POST", { enrollmentId: enrollId, answers });
      setResult(res);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }
}

export default AcademyView;
