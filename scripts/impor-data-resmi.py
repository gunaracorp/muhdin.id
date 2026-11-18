#!/usr/bin/env python3
"""
impor-data-resmi.py — impor hasil panen data resmi ke DB MUHDIN via /api/import.
Idempoten (upsert by licenseNo) — aman dijalankan berulang.
"""
import http.cookiejar
import json
import pathlib
import urllib.error
import urllib.request

BASE = "http://localhost:3000"
CSV = pathlib.Path("/home/z/my-project/download/data-resmi/anggota-resmi.csv")

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def post(path, data, n=1):
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json", "X-Forwarded-For": f"10.7.0.{n}"}, method="POST")
    try:
        with opener.open(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")

s, r = post("/api/auth/login", {"email": "admin@muhdin.web.id", "password": "muhdin2026"}, 1)
print(f"[{s}] login:", r.get("user", {}).get("email", r))
assert s == 200

csv_text = CSV.read_text(encoding="utf-8-sig")
s, r = post("/api/import", {"type": "members", "csv": csv_text}, 2)
print(f"[{s}] impor members:", json.dumps(r, ensure_ascii=False)[:400])
