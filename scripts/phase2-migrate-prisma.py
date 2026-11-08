#!/usr/bin/env python3
"""Fase 2 — migrasi import @prisma/client → client v8 ter-generate.

Untuk 10 skrip lepas:
  1. import { PrismaClient } from "@prisma/client"  → import { makeDb } from <rel>/_db
  2. new PrismaClient(...) (baris tunggal)          → makeDb()
Untuk src/app/api/subscribers/route.ts:
  import { Prisma } from "@prisma/client"           → "@/generated/prisma/client"
"""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project")

SCRIPTS = [
    "prisma/seed-nusuk.ts",
    "prisma/seed.ts",
    "scripts/seed-task18.mjs",
    "scripts/seed-v5/run.ts",
    "scripts/task34-whitepaper-sync.ts",
    "scripts/update-management.mjs",
    "scripts/seed-kontak-resmi.ts",
    "scripts/backfill-queue.mjs",
    "scripts/seed-task19.mjs",
    "scripts/seed-task23.mjs",
]

for rel in SCRIPTS:
    p = ROOT / rel
    src = p.read_text(encoding="utf-8")
    helper = '"../scripts/_db"' if rel.startswith("prisma/") else '"./_db"'
    orig = src

    # 1. import line → helper import (pertahankan komentar baris sebelumnya)
    src = re.sub(
        r'import \{ PrismaClient \} from ["\']@prisma/client["\'];?',
        f"import {{ makeDb }} from {helper};",
        src,
    )

    # 2. constructor satu baris → makeDb()
    src = re.sub(r"new PrismaClient\(\)\s*;?", "makeDb()", src)
    src = re.sub(
        r"new PrismaClient\(\{[^{}]*\}\)\s*;?", "makeDb()", src, flags=re.S
    )

    if src != orig:
        p.write_text(src, encoding="utf-8")
        print(f"OK   {rel}")
    else:
        print(f"SKIP {rel} (tidak berubah)")

# 3. subscribers route — namespace Prisma
p = ROOT / "src/app/api/subscribers/route.ts"
src = p.read_text(encoding="utf-8")
src = src.replace(
    'import { Prisma } from "@prisma/client";',
    'import { Prisma } from "@/generated/prisma/client";',
)
p.write_text(src, encoding="utf-8")
print("OK   src/app/api/subscribers/route.ts")
