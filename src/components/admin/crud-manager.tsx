"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "switch" | "markdown" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  full?: boolean;
  placeholder?: string;
  hint?: string;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

export interface CrudConfig<T extends { id: string }> {
  title: string;
  description: string;
  endpoint: string;
  itemName: string;
  fields: FieldDef[];
  columns: ColumnDef<T>[];
  defaultItem: () => Record<string, unknown>;
  searchKeys: string[];
  extraQuery?: string;
  transformLoad?: (items: T[]) => T[];
  /** v14.0 — dipanggil setelah simpan/hapus sukses (mis. refresh kartu ringkasan). */
  onSaved?: () => void;
}

export function CrudManager<T extends { id: string }>({ config }: { config: CrudConfig<T> }) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[] | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<T[]>(`${config.endpoint}${config.extraQuery || ""}`);
      setItems(config.transformLoad ? config.transformLoad(data) : data);
    } catch (e) {
      toast({ title: "Gagal memuat", description: (e as Error).message, variant: "destructive" });
      setItems([]);
    }
     
  }, [config.endpoint, config.extraQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!q) return items;
    const lq = q.toLowerCase();
    return items.filter((it) =>
      config.searchKeys.some((k) => String((it as Record<string, unknown>)[k] ?? "").toLowerCase().includes(lq))
    );
  }, [items, q, config.searchKeys]);

  const openNew = () => {
    setEditing(config.defaultItem());
    setIsNew(true);
  };

  const openEdit = (item: T) => {
    const draft: Record<string, unknown> = {};
    config.fields.forEach((f) => (draft[f.key] = (item as Record<string, unknown>)[f.key] ?? ""));
    draft.id = item.id;
    setEditing(draft);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing) return;
    const missing = config.fields.find((f) => f.required && !String(editing[f.key] ?? "").trim());
    if (missing) {
      toast({ title: "Data belum lengkap", description: `Kolom "${missing.label}" wajib diisi.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      config.fields.forEach((f) => {
        let v = editing[f.key];
        if (f.type === "number") v = parseInt(String(v), 10) || 0;
        payload[f.key] = v;
      });
      if (isNew) {
        await apiSend(config.endpoint, "POST", payload);
      } else {
        await apiSend(`${config.endpoint}/${editing.id}`, "PUT", payload);
      }
      toast({ title: isNew ? "Berhasil ditambahkan ✓" : "Perubahan tersimpan ✓", description: config.itemName });
      setEditing(null);
      load();
      config.onSaved?.();
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiSend(`${config.endpoint}/${deleting.id}`, "DELETE");
      toast({ title: "Berhasil dihapus ✓", description: config.itemName });
      load();
      config.onSaved?.();
    } catch (e) {
      toast({ title: "Gagal menghapus", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-extrabold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" className="pl-9 h-9" />
          </div>
          <Button onClick={openNew} size="sm" className="h-9 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="plus" className="h-4 w-4 mr-1.5" /> Tambah
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {!items ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="inbox" className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              {q ? "Tidak ada hasil yang cocok." : "Belum ada data. Klik \u201CTambah\u201D untuk membuat baru."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin max-h-[62vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                <TableRow>
                  {config.columns.map((c) => (
                    <TableHead key={c.key} className={cn(c.hideOnMobile && "hidden md:table-cell")}>
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-primary/[0.03]">
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className={cn("text-sm", c.hideOnMobile && "hidden md:table-cell")}>
                        {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)} aria-label="Ubah">
                          <Icon name="pencil" className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(item)} aria-label="Hapus">
                          <Icon name="trash" className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{isNew ? `Tambah ${config.itemName}` : `Ubah ${config.itemName}`}</DialogTitle>
            <DialogDescription>
              Lengkapi data di bawah. Kolom bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              {config.fields.map((f) => (
                <div key={f.key} className={cn("space-y-1.5", (f.full || f.type === "textarea" || f.type === "markdown") && "sm:col-span-2")}>
                  <Label>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.type === "textarea" || f.type === "markdown" ? (
                    <Textarea
                      value={String(editing[f.key] ?? "")}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      rows={f.type === "markdown" ? 10 : 3}
                      placeholder={f.placeholder}
                      className="font-mono text-xs leading-relaxed"
                    />
                  ) : f.type === "select" ? (
                    <Select value={String(editing[f.key] ?? "")} onValueChange={(v) => setEditing({ ...editing, [f.key]: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Pilih ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options || []).map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "switch" ? (
                    <div className="flex items-center gap-2 py-1.5">
                      <Switch checked={Boolean(editing[f.key])} onCheckedChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                      <span className="text-xs text-muted-foreground">{Boolean(editing[f.key]) ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  ) : f.type === "checkbox" ? (
                    <div className="flex items-center gap-2 py-1.5">
                      <Checkbox checked={Boolean(editing[f.key])} onCheckedChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                      <span className="text-xs text-muted-foreground">{f.hint}</span>
                    </div>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={String(editing[f.key] ?? "")}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                    />
                  )}
                  {f.hint && f.type !== "checkbox" && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-forest text-white">
              {saving ? <Icon name="loader-2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="save" className="h-4 w-4 mr-2" />}
              {isNew ? "Simpan Baru" : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {config.itemName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="danger-solid" onClick={doDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AdminBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TERVERIFIKASI: "bg-primary/10 text-primary border-primary/30",
    PENDING: "bg-gold/15 text-gold-deep border-gold/40",
    SUSPENDED: "bg-destructive/10 text-destructive border-destructive/30",
    PUBLISHED: "bg-primary/10 text-primary border-primary/30",
    DRAFT: "bg-muted text-muted-foreground border-border",
    APPROVED: "bg-primary/10 text-primary border-primary/30",
    REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
    UNREAD: "bg-gold/15 text-gold-deep border-gold/40",
    READ: "bg-muted text-muted-foreground border-border",
    REPLIED: "bg-primary/10 text-primary border-primary/30",
  };
  const labels: Record<string, string> = {
    TERVERIFIKASI: "Terverifikasi",
    PENDING: "Menunggu",
    SUSPENDED: "Ditangguhkan",
    PUBLISHED: "Terbit",
    DRAFT: "Draft",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    UNREAD: "Belum dibaca",
    READ: "Dibaca",
    REPLIED: "Dibalas",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold", map[status] || "bg-muted")}>
      {labels[status] || status}
    </Badge>
  );
}
