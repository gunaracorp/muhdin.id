/**
 * audit-a11y — R-069 v15.0.0 «GOD MODE» — Audit Aksesibilitas WCAG 2.1 AA.
 *
 * Pemeriksaan statis anti-pola pada seluruh sumber UI (src/components, src/app):
 *   A1. <img> tanpa alt atau alt kosong pada gambar informatif.
 *   A2. <button>/<a> tanpa teks & tanpa aria-label (tombol ikon).
 *   A3. <input>/<textarea>/<select> tanpa label, aria-label, atau aria-labelledby.
 *   A4. onClick pada elemen non-interaktif (div/span/li) tanpa role/tabIndex.
 *   A5. html lang dikendalikan layout (dipastikan ada).
 * Setiap temuan dicetak dengan lokasi; keluaran dipakai docs/A11Y-AUDIT.md.
 * Pakai: bun run audit:a11y
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/components", "src/app", "pwa-src"];
const findings = [];
let filesScanned = 0;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(tsx|ts|jsx|js|html)$/.test(name)) yield p;
  }
}

function scanFile(path, src) {
  const lines = src.split("\n");
  const lineAt = (idx) => src.slice(0, idx).split("\n").length;
  filesScanned += 1;
  const isPrimitive = path.startsWith("src/components/ui/");

  // htmlFor yang pernah dideklarasikan di berkas yang sama (Label JSX).
  const htmlForSet = new Set([...src.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]));

  // A1 — <img> tanpa alt
  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) {
      findings.push({ id: "A1", path, line: lineAt(m.index), msg: "<img> tanpa atribut alt" });
    } else if (/alt=""(?!.*\b(aria-hidden|role="presentation"))/.test(tag) && /(?:src=.*(?:qrcode|passport|certificate)|className=.*(?=.*qr))/.test(tag)) {
      findings.push({ id: "A1", path, line: lineAt(m.index), msg: "<img> informatif dengan alt kosong" });
    }
  }

  // A2 — tombol/tautan ikon tanpa teks & aria-label
  for (const m of src.matchAll(/<(button|a)\b[^>]*>([\s\S]{0,120}?)<\/\1>/g)) {
    const tag = m[0];
    const hasVisibleText = m[2].replace(/<[^>]*>/g, "").trim().length > 0 || /\{t\(/.test(m[2]);
    const hasLabel = /\b(aria-label|aria-labelledby|title)=/.test(tag);
    const onlyIcon = /<Icon\b/.test(m[2]) && !hasVisibleText;
    if (!hasVisibleText && !hasLabel && onlyIcon) {
      findings.push({ id: "A2", path, line: lineAt(m.index), msg: `<${m[1]}> ikon tanpa teks & tanpa aria-label` });
    }
  }

  // A3 — input/textarea/select tanpa label/aria. Label dianggap terasosiasi bila:
  //  • atribut aria-label/aria-labelledby pada tag itu sendiri, ATAU
  //  • ada htmlFor="<id>" di berkas yang sama (pola <Label htmlFor>), ATAU
  //  • tag dibungkus <label> 3 baris di atasnya (pola label pembungkus).
  if (!isPrimitive) {
    for (const m of src.matchAll(/<(input|textarea|select)\b[^>]*?\/?>/g)) {
      const tag = m[0];
      if (/type="(hidden|submit|button|reset)"/.test(tag)) continue;
      if (/aria-hidden="true"/.test(tag)) continue; // honeypot — memang disembunyikan dari SR
      const line = lineAt(m.index);
      // Tag JSX multi-baris: atribut jatuh di baris-baris berikutnya (dan regex
      // terpotong oleh `=>` pada arrow function). Jendela pemeriksaan = dari awal
      // tag sampai elemen interaktif berikutnya — asosiasi terikat pada elemen ini.
      const rest = src.slice(m.index + 6);
      const next = rest.search(/<(input|textarea|select|button|form)\b/);
      const window = src.slice(m.index, m.index + 6 + (next === -1 ? 600 : next));
      if (/aria-hidden="true"/.test(window)) continue; // honeypot multi-baris
      const idMatch = /\bid="([^"]+)"/.exec(window);
      const ctx = lines.slice(Math.max(0, line - 4), line + 1).join("\n");
      const wrappedInLabel = /<label[\s>]/i.test(ctx);
      const labeled =
        /\b(aria-label|aria-labelledby)=/.test(window) ||
        (idMatch && htmlForSet.has(idMatch[1])) ||
        wrappedInLabel;
      if (!labeled) {
        findings.push({ id: "A3", path, line, msg: `<${m[1]}> tanpa label/aria-label` });
      }
    }
  }

  // A4 — onClick pada elemen non-interaktif tanpa role & tabIndex
  for (const m of src.matchAll(/<(div|span|li|p)\b([^>]*?)>/g)) {
    const attrs = m[2];
    if (/onClick/.test(attrs) && !/role=/.test(attrs) && !/tabIndex/.test(attrs)) {
      findings.push({ id: "A4", path, line: lineAt(m.index), msg: `<${m[1]}> onClick tanpa role & tabIndex` });
    }
  }
}

for (const root of ROOTS) {
  try {
    for (const file of walk(root)) {
      if (/node_modules|\.next|dist|out\//.test(file)) continue;
      scanFile(file, readFileSync(file, "utf8"));
    }
  } catch {
    /* root tidak ada — lewati */
  }
}

// A5 — lang pada layout (tag <html> multi-baris: cari lang= dalam 5 baris)
const layout = readFileSync("src/app/layout.tsx", "utf8");
const htmlIdx = layout.indexOf("<html");
const window5 = htmlIdx >= 0 ? layout.slice(htmlIdx, htmlIdx + 300) : "";
if (!/\blang=/.test(window5)) {
  findings.push({ id: "A5", path: "src/app/layout.tsx", line: 1, msg: "html tanpa atribut lang" });
}

/* ---------- laporan ---------- */
console.log(`[a11y] berkas dipindai: ${filesScanned}`);
const byId = {};
for (const f of findings) (byId[f.id] ??= []).push(f);
for (const [id, list] of Object.entries(byId)) {
  console.log(`\n== ${id} (${list.length} temuan) ==`);
  for (const f of list.slice(0, 40)) console.log(`  ${f.path}:${f.line} — ${f.msg}`);
  if (list.length > 40) console.log(`  … dan ${list.length - 40} lagi`);
}
const severity = { A1: 4, A2: 6, A3: 8, A4: 2, A5: 2 };
const total = findings.reduce((s, f) => s + severity[f.id], 0);
console.log(`\n[a11y] skor risiko: ${total} (semakin kecil semakin baik) — temuan: ${findings.length}`);
process.exit(0);
