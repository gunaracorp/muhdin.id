/**
 * buat-tutorial-docx.js — generator TUTORIAL-LENGKAP-Impor-CSV-MUHDIN.docx
 * Bahasa Indonesia, ramah pemula. Cover resep R4 (GO-1), TOC 3-seksi, tabel bergaya MUHDIN.
 * Jalankan: node scripts/buat-tutorial-docx.js
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, TableLayoutType, TableOfContents,
} = require("docx");
const fs = require("fs");

// ── Palet GO-1 (Graphite Orange) — proposal/panduan ──
const P = {
  bg: "1A2330", accent: "D4875A", primary: "1A2330", body: "000000",
  secondary: "5A6472",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
};
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
};
const allNoBorders = { ...noBorders, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } };
const emptyPara = () => new Paragraph({ children: [] });

// ── calcTitleLayout + splitTitleLines (dari design-system) ──
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."，。、；：！？", ..."-_—–·/", ..." \t"]);
  const lines = []; let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / (pt * 20));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, charsPerLine(minPt)); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}

// ── Cover R4 (Top Color Block) ──
function buildCoverR4(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 26);
  const titleSize = titlePt * 2;
  const titleBlockHeight = titleLines.length * (titlePt * 23 + 200);
  const englishLabelH = config.englishLabel ? (9 * 23 + 500) : 0;
  const subtitleH = config.subtitle ? (12 * 23 + 200) : 0;
  const upperContentH = englishLabelH + titleBlockHeight + subtitleH;
  const UPPER_H = Math.max(7500, upperContentH + 1500 + 800);
  const DIVIDER_H = 60;
  const spacerIntrinsic = 280;
  const topSpacing = Math.max(UPPER_H - upperContentH - spacerIntrinsic - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { fill: P.bg }, borders: noBorders, verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          config.englishLabel ? new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({ text: config.englishLabel.split("").join(" "), size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 60 })],
          }) : null,
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
            children: [new TextRun({ text: line, size: titleSize, bold: true, color: P.cover.titleColor, font: { ascii: "Arial", eastAsia: "SimHei" } })],
          })),
          config.subtitle ? new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
          }) : null,
        ].filter(Boolean),
      })],
    })],
  });
  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({ borders: noBorders, shading: { fill: P.accent }, children: [emptyPara()] })],
    })],
  });
  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...(config.metaLines || []).map((line) => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: line, size: 28, color: P.cover.metaColor, font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft || "", size: 22, color: "909090" }),
        new TextRun({ text: "          " }),
        new TextRun({ text: config.footerRight || "", size: 22, color: "909090" }),
      ],
    }),
  ];
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { fill: "FFFFFF" }, borders: noBorders, verticalAlign: "top",
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ── Komponen isi ──
const FONT_H = { ascii: "Arial", eastAsia: "SimHei" };
const FONT_B = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: FONT_H })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 26, color: P.primary, font: FONT_H })],
  });
}
function body(runs, opts = {}) {
  const children = (typeof runs === "string")
    ? [new TextRun({ text: runs, size: 22, color: P.body, font: FONT_B })]
    : runs;
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 120 }, ...opts, children,
  });
}
const B = (text, o = {}) => new TextRun({ text, size: 22, color: P.body, font: FONT_B, ...o });
const BB = (text) => B(text, { bold: true });
const CODE = (text) => new TextRun({ text, size: 20, color: P.primary, font: { ascii: "Courier New", eastAsia: "Microsoft YaHei" }, shading: { fill: P.table.surface, type: ShadingType.CLEAR } });

function bullet(runs, level = 0) {
  const children = (typeof runs === "string") ? [B(runs)] : runs;
  return new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { line: 312, after: 60 },
    indent: { left: 360 + level * 360, hanging: 220 }, children,
  });
}
function bulletDash(runs) {
  const children = (typeof runs === "string") ? [B(runs)] : runs;
  return bullet([B("•  ", { bold: true, color: P.accent }), ...children]);
}
function note(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: allNoBorders,
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { fill: P.table.surface, type: ShadingType.CLEAR },
        borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 24, color: P.accent } },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        children: [new Paragraph({
          spacing: { line: 312 },
          children: [B("💡 ", { size: 20 }), ...text.map((t) => (typeof t === "string" ? B(t, { size: 20, color: "3A3F47" }) : t))],
        })],
      })],
    })],
  });
}
function tbl(caption, headers, rows, widths) {
  const total = 9500;
  const w = widths || headers.map(() => Math.floor(total / headers.length));
  const mkCell = (content, isHeader, i, zebra = false) => new TableCell({
    width: { size: w[i], type: WidthType.DXA },
    shading: isHeader
      ? { fill: P.table.headerBg, type: ShadingType.CLEAR }
      : (zebra ? { fill: P.table.surface, type: ShadingType.CLEAR } : undefined),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: "center",
    children: [new Paragraph({
      spacing: { line: 276 },
      children: [new TextRun({
        text: String(content), size: isHeader ? 20 : 19,
        bold: isHeader, color: isHeader ? P.table.headerText : P.body, font: FONT_B,
      })],
    })],
  });
  return [
    new Paragraph({
      keepNext: true, spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: caption, bold: true, size: 20, color: P.secondary, font: FONT_B })],
    }),
    new Table({
      width: { size: total, type: WidthType.DXA }, layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: P.table.innerLine },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: P.table.innerLine },
      },
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => mkCell(h, true, i)) }),
        ...rows.map((r, ri) => new TableRow({
          cantSplit: true,
          children: r.map((c, i) => mkCell(c, false, i, ri % 2 === 1)),
        })),
      ],
    }),
  ];
}

module.exports = { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, NumberFormat, AlignmentType, TableOfContents, PageBreak: null, buildCoverR4, h1, h2, body, bullet, bulletDash, note, tbl, B, BB, CODE, P, FONT_B, FONT_H, fs };
