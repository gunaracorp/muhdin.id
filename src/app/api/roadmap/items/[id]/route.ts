import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";

const PILLARS = ["JAMAAH", "AKADEMI", "BISNIS", "PLATFORM", "KEAMANAN", "EKOSISTEM"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const EFFORTS = ["S", "M", "L", "XL"];
const STATUSES = ["DONE", "IN_PROGRESS", "PLANNED"];

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.code !== undefined) data.code = String(body.code).trim().toUpperCase();
    if (body.pillar !== undefined) data.pillar = PILLARS.includes(body.pillar) ? body.pillar : "PLATFORM";
    if (body.title !== undefined) data.title = String(body.title);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.priority !== undefined) data.priority = PRIORITIES.includes(body.priority) ? body.priority : "P2";
    if (body.effort !== undefined) data.effort = EFFORTS.includes(body.effort) ? body.effort : "M";
    if (body.status !== undefined) data.status = STATUSES.includes(body.status) ? body.status : "PLANNED";
    if (body.target !== undefined) data.target = String(body.target);
    if (body.order !== undefined) data.order = parseInt(body.order, 10) || 0;
    const item = await db.roadmapItem.update({ where: { id }, data });
    return ok(item);
  } catch {
    return fail("Gagal memperbarui item roadmap.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.roadmapItem.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus item roadmap.", 500);
  }
}
