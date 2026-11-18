"use client";

/**
 * R-027 (v14.1) — CMS "Kurikulum Builder Drag-and-Drop".
 * Susun silabus kursus Akademi (MODUL/KUIS/SERTIFIKASI) dengan geser-taruh
 * (dnd-kit sortable) + tombol naik/turun untuk aksesibilitas. Simpan
 * atomik replace-all ke PUT /api/academy/syllabus.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiGet, apiSend } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/site/icon";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CourseRow {
  id: string;
  title: string;
  level: string;
  active: boolean;
}
interface SyllabusItem {
  title: string;
  type: "MODUL" | "KUIS" | "SERTIFIKASI";
  desc: string;
}

const TYPE_TONE: Record<string, string> = {
  MODUL: "bg-primary/10 text-primary",
  KUIS: "bg-gold/15 text-gold-deep dark:text-gold",
  SERTIFIKASI: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

function SortableRow({
  item, index, onMove, onEdit, onRemove,
}: {
  item: SyllabusItem;
  index: number;
  onMove: (from: number, to: number) => void;
  onEdit: (index: number, patch: Partial<SyllabusItem>) => void;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${index}-${item.title}`,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center",
        isDragging && "shadow-lg ring-2 ring-primary/40"
      )}
    >
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-lg bg-muted text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Geser urutan ${item.title}`}
        data-testid="syllabus-drag"
      >
        <Icon name="chevron-down" className="h-4 w-4 rotate-90" aria-hidden />
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <Input
            value={item.title}
            onChange={(e) => onEdit(index, { title: e.target.value })}
            className="h-8 text-sm"
            placeholder="Judul modul…"
          />
          <select
            value={item.type}
            onChange={(e) => onEdit(index, { type: e.target.value as SyllabusItem["type"] })}
            className="h-8 shrink-0 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="MODUL">MODUL</option>
            <option value="KUIS">KUIS</option>
            <option value="SERTIFIKASI">SERTIFIKASI</option>
          </select>
        </div>
        <Input
          value={item.desc}
          onChange={(e) => onEdit(index, { desc: e.target.value })}
          className="h-8 text-xs"
          placeholder="Deskripsi singkat (opsional)"
        />
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label="Naik">
          <Icon name="chevron-down" className="h-4 w-4 rotate-180" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onMove(index, index + 1)} aria-label="Turun">
          <Icon name="chevron-down" className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onRemove(index)} aria-label="Hapus entri">
          <Icon name="trash" className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function AdminSyllabus() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [items, setItems] = useState<SyllabusItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    apiGet<{ rows: CourseRow[] }>("/api/academy/courses?admin=1")
      .then((d) => {
        setCourses(d.rows);
        if (d.rows.length > 0) setCourseId((prev) => prev || d.rows[0].id);
      })
      .catch(() => toast({ title: "Gagal memuat kursus.", variant: "destructive" }));
  }, [toast]);

  const loadSyllabus = useCallback(async (id: string) => {
    setDirty(false);
    try {
      const data = await apiGet<{ course: { id: string; title: string }; syllabus: SyllabusItem[] }>(
        `/api/academy/syllabus?courseId=${id}`
      );
      setCourseTitle(data.course.title);
      setItems(data.syllabus.map((s) => ({ title: s.title ?? "", type: s.type ?? "MODUL", desc: s.desc ?? "" })));
    } catch {
      toast({ title: "Gagal memuat silabus.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (courseId) void loadSyllabus(courseId);
  }, [courseId, loadSyllabus]);

  function add(type: SyllabusItem["type"]) {
    setItems((prev) => [...prev, { title: "", type, desc: "" }]);
    setDirty(true);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = Number(String(active.id).split("-")[0]);
    const to = Number(String(over.id).split("-")[0]);
    setItems((prev) => arrayMove(prev, from, to));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      await apiSend("/api/academy/syllabus", "PUT", { courseId, syllabus: items });
      toast({ title: `Silabus "${courseTitle}" tersimpan (${items.length} entri, urutan atomik).` });
      setDirty(false);
    } catch (e) {
      toast({ title: (e as Error).message || "Gagal menyimpan silabus.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const modul = items.filter((i) => i.type === "MODUL").length;
  const kuis = items.filter((i) => i.type === "KUIS").length;
  const sert = items.filter((i) => i.type === "SERTIFIKASI").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="book-marked" className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-extrabold">Kurikulum Builder — Geser &amp; Taruh</h2>
              {dirty && <Badge className="bg-gold/15 text-[10px] text-gold-deep dark:text-gold">BELUM TERSIMPAN</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Susun silabus modul, kuis, dan sertifikasi per kursus Akademi. Urutan tersimpan atomik (replace-all).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm"
              data-testid="syllabus-course"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.level})</option>
              ))}
            </select>
            <Button onClick={() => void save()} disabled={busy || !courseId} data-testid="syllabus-save">
              <Icon name="save" className="mr-1.5 h-4 w-4" aria-hidden />Simpan
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => add("MODUL")} data-testid="syllabus-add-modul">
            <Icon name="plus" className="mr-1 h-3.5 w-3.5" aria-hidden />Modul
          </Button>
          <Button size="sm" variant="outline" onClick={() => add("KUIS")}>
            <Icon name="plus" className="mr-1 h-3.5 w-3.5" aria-hidden />Kuis
          </Button>
          <Button size="sm" variant="outline" onClick={() => add("SERTIFIKASI")}>
            <Icon name="plus" className="mr-1 h-3.5 w-3.5" aria-hidden />Sertifikasi
          </Button>
          <span className="ms-auto inline-flex items-center gap-3 text-xs font-bold text-muted-foreground" data-testid="syllabus-count">
            <Badge className={cn("text-[10px]", TYPE_TONE.MODUL)}>{modul} modul</Badge>
            <Badge className={cn("text-[10px]", TYPE_TONE.KUIS)}>{kuis} kuis</Badge>
            <Badge className={cn("text-[10px]", TYPE_TONE.SERTIFIKASI)}>{sert} sertifikasi</Badge>
          </span>
        </div>

        <div className="mt-4 space-y-2" data-testid="syllabus-list">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i, idx) => `${idx}-${i.title}`)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableRow
                  key={`${idx}-${item.title}`}
                  item={item}
                  index={idx}
                  onMove={(from, to) => {
                    if (to < 0 || to >= items.length) return;
                    setItems((prev) => arrayMove(prev, from, to));
                    setDirty(true);
                  }}
                  onEdit={(i, patch) => {
                    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
                    setDirty(true);
                  }}
                  onRemove={(i) => {
                    setItems((prev) => prev.filter((_, j) => j !== i));
                    setDirty(true);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          {items.length === 0 && (
            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              Silabus kosong — tambahkan modul pertama untuk kursus <b>{courseTitle || "…"}</b>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
