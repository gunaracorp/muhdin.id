#!/usr/bin/env python3
"""
cleanup-test-import.py — menghapus SEMUA data uji impor dari database MUHDIN
(anggota template + hasil Master, registri, pendaftaran) dan menampilkan
jumlah baris sebelum/sesudah. Aman dijalankan berulang.
"""
import sqlite3

DB = "/home/z/my-project/db/custom.db"

MEMBER_LICENSES = [
    "PPIU 772/2026", "PPIU 815/2025", "PIHK 045/2024", "PIHK 052/2025",  # template
    "U-537/2024", "PIHK-088/2024", "U-999/2023",                        # dari Master
    "U-555/2026",                                                       # tes baris bermasalah
]
NIBS = [
    "8120345678910", "8120987654321", "8120555544443",                  # template
] + [f"812345678901{i:04d}" for i in range(1, 14)] + ["-"]              # dari Master + perusahaan hantu placeholder
ORGS = ["PT Anugrah Tanah Suci", "CV Salsabila Wisata Umrah"]

con = sqlite3.connect(DB)
cur = con.cursor()

def count(sql, args=()):
    return cur.execute(sql, args).fetchone()[0]

print("== SEBELUM ==")
print("Member              :", count("SELECT COUNT(*) FROM Member"))
print("RegistryCompany     :", count("SELECT COUNT(*) FROM RegistryCompany"))
print("RegistryDoc         :", count("SELECT COUNT(*) FROM RegistryDoc"))
print("MembershipApplication:", count("SELECT COUNT(*) FROM MembershipApplication"))

# Hapus dokumen izin milik perusahaan uji (RegistryDoc tidak cascade otomatis via SQL langsung)
cur.execute(
    f"DELETE FROM RegistryDoc WHERE companyId IN (SELECT id FROM RegistryCompany WHERE nib IN ({','.join('?' * len(NIBS))}))",
    NIBS,
)
d_docs = cur.rowcount
cur.execute(
    f"DELETE FROM RegistryCompany WHERE nib IN ({','.join('?' * len(NIBS))})", NIBS
)
d_comp = cur.rowcount
cur.execute(
    f"DELETE FROM Member WHERE licenseNo IN ({','.join('?' * len(MEMBER_LICENSES))})",
    MEMBER_LICENSES,
)
d_members = cur.rowcount
cur.execute(
    f"DELETE FROM MembershipApplication WHERE orgName IN ({','.join('?' * len(ORGS))})", ORGS
)
d_apps = cur.rowcount
con.commit()

print()
print(f"Dihapus: {d_members} anggota, {d_comp} perusahaan registri, {d_docs} dokumen izin, {d_apps} pendaftaran")
print()
print("== SESUDAH ==")
print("Member              :", count("SELECT COUNT(*) FROM Member"))
print("RegistryCompany     :", count("SELECT COUNT(*) FROM RegistryCompany"))
print("RegistryDoc         :", count("SELECT COUNT(*) FROM RegistryDoc"))
print("MembershipApplication:", count("SELECT COUNT(*) FROM MembershipApplication"))
con.close()
