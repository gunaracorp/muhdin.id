#!/bin/bash
# Task 13 GABUNG — sisipkan field switch v11 ke EmailSetting/WhatsAppSetting,
# back-relation v11 ke Member, lalu append 14 model baru v11.
set -e
S=prisma/schema.prisma
insert_before_close() { # $1=model, $2=file berisi baris yg disisipkan
  awk -v ins="$2" -v m="$1" '
    $0 ~ ("^model " m " \\{") {inb=1}
    inb && /^\}/ {
      while ((getline line < ins) > 0) print line
      close(ins); inb=0
    }
    {print}
  ' "$S" > "$S.tmp" && mv "$S.tmp" "$S"
}
printf '  notifyAcademy     Boolean   @default(true) // pendaftaran kursus & kelulusan/sertifikat\n  notifyBooking     Boolean   @default(true) // booking slot layanan (BKG)\n  notifyBenefit     Boolean   @default(true) // penebusan benefit mitra (BNF)\n' > /tmp/ins-email.txt
insert_before_close EmailSetting /tmp/ins-email.txt
printf '  notifyAcademy     Boolean   @default(true) // pendaftaran kursus & kelulusan/sertifikat\n  notifyBooking     Boolean   @default(true) // booking slot layanan (BKG)\n  notifyBenefit     Boolean   @default(true) // penebusan benefit mitra (BNF)\n  botEnabled        Boolean   @default(true) // saklar balasan otomatis AI (Task WA-AI)\n' > /tmp/ins-wa.txt
insert_before_close WhatsAppSetting /tmp/ins-wa.txt
printf '  passports   HajjPassport[]\n  devices     TrackingDevice[]\n  card        MemberCard?\n  benefits    Benefit[]\n' > /tmp/ins-member.txt
insert_before_close Member /tmp/ins-member.txt
cat /tmp/models-v11.prisma >> "$S"
echo "selesai. total model: $(grep -c '^model ' $S)"
