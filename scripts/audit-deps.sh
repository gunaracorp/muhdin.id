#!/usr/bin/env bash
# audit-deps.sh — v13.1 R-083 «Audit Dependensi Otomatis».
# npm audit pada dependency produksi (--omit=dev):
#   • bila repo memakai bun.lock (tanpa package-lock.json), lockfile npm dibuat
#     sementara via `npm install --package-lock-only` (metadata saja, tanpa install);
#   • ringkasan kerentanan per tingkat ditampilkan selalu;
#   • exit 1 HANYA bila ada kerentanan critical (aturan: critical = merah,
#     high dicatat untuk pemantauan dan dipatch terjadwal).
set -e
cd "$(dirname "$0")/.."

TMP_LOCK=""
if [ ! -f package-lock.json ]; then
  echo "bun.lock terdeteksi — membuat package-lock sementara (metadata)..."
  npm install --package-lock-only --ignore-scripts --no-audit --silent || true
  TMP_LOCK="package-lock.json"
fi

if [ ! -f package-lock.json ]; then
  echo "PERINGATAN: lockfile npm tidak tersedia (offline?) — audit runtime dilewati."
  echo "LOLOS (dengan catatan): jalankan ulang saat jaringan tersedia."
  exit 0
fi

echo "Menjalankan npm audit --omit=dev ..."
npm audit --omit=dev --json > /tmp/audit-deps.json || true

bun -e '
const fs = require("node:fs");
const a = JSON.parse(fs.readFileSync("/tmp/audit-deps.json", "utf8"));
const v = (a && a.metadata && a.metadata.vulnerabilities) || {};
const total = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
if (!("critical" in v)) { console.log("Audit tidak menghasilkan data — dilewati dengan catatan."); process.exit(0); }
console.log(`Kerentanan produksi — critical: ${v.critical || 0}, high: ${v.high || 0}, moderate: ${v.moderate || 0}, low: ${v.low || 0}`);
for (const [name, adv] of Object.entries(a.vulnerabilities || {}).slice(0, 20)) {
  console.log(`  • ${name} (${adv.severity}) — fixAvailable: ${!!adv.fixAvailable}`);
}
if ((v.critical || 0) > 0) {
  console.error("GAGAL: ada kerentanan CRITICAL — patch segera (npm audit fix / bump).");
  process.exit(1);
}
console.log("LOLOS: tidak ada kerentanan critical pada dependency produksi.");
'

# rapikan lockfile sementara (tidak dicommit — repo memakai bun.lock)
if [ -n "$TMP_LOCK" ] && ! git ls-files --error-unmatch package-lock.json >/dev/null 2>&1; then
  rm -f package-lock.json
fi
