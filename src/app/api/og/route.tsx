/**
 * Task 19 (R-057) — OG image dinamis via ImageResponse (next/og).
 *
 * Dipakai sebagai kartu berbagi (WhatsApp/Facebook/X) default portal dan
 * dapat dipersonalisasi lewat query param: /api/og?title=…&sub=…&kind=paket.
 * Mode export shared-hosting: folder src/app/api dibuang oleh build script —
 * kartu share di sana memakai gambar statis bawaan tema.
 */
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const title = (sp.get("title") || "MUHDIN INDONESIA").slice(0, 80);
  const sub = (sp.get("sub") || "Trusted Pilgrim Ecosystem — Asosiasi Haji Umroh Digital Pertama di Indonesia").slice(0, 110);
  const kind = (sp.get("kind") || "").slice(0, 30);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b3d2e 0%, #14532d 55%, #1a5c3f 100%)",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* pita emas atas */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: "#d4af37", display: "flex" }} />
        {/* bulatan dekoratif */}
        <div style={{ position: "absolute", right: -120, top: -120, width: 420, height: 420, borderRadius: 9999, background: "rgba(212,175,55,0.14)", display: "flex" }} />
        <div style={{ position: "absolute", right: 40, bottom: -140, width: 300, height: 300, borderRadius: 9999, background: "rgba(255,255,255,0.06)", display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#0b3d2e", fontWeight: 800 }}>م</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#ffffff", letterSpacing: 4 }}>MUHDIN INDONESIA</div>
            <div style={{ fontSize: 19, color: "#d4af37", letterSpacing: 2 }}>TRUSTED PILGRIM ECOSYSTEM</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
          {kind ? (
            <div style={{ display: "flex" }}>
              <div style={{ background: "#d4af37", color: "#0b3d2e", fontSize: 22, fontWeight: 700, padding: "8px 22px", borderRadius: 9999, letterSpacing: 2 }}>{kind.toUpperCase()}</div>
            </div>
          ) : null}
          <div style={{ fontSize: 58, fontWeight: 800, color: "#ffffff", lineHeight: 1.15 }}>{title}</div>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{sub}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.75)", letterSpacing: 1 }}>muhdin.web.id · GRATIS SELAMANYA</div>
          <div style={{ fontSize: 22, color: "#d4af37", fontWeight: 700 }}>WA 0812 2234 5856</div>
        </div>
      </div>
    ),
    size
  );
}
