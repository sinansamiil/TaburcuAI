"""Generate a minimal test discharge PDF without third-party dependencies."""

lines = [
    "TABURCU EPIKRIZ FORMU",
    "",
    "Tani: Konjestif Kalp Yetersizligi",
    "Tedavi Plani:",
    "- Lasix 40 mg 1x1 (sabah)",
    "- Beloc ZOK 50 mg 1x1 (sabah)",
    "",
    "Oneriler:",
    "- Her sabah kilo takibi yapilacak.",
    "- Gunluk tuz tuketimi 2 gramin altinda tutulacak.",
    "- Nefes darligi veya ayaklarda sislik olursa hekime basvurunuz.",
    "- Kardiyoloji poliklinigi kontrolu 1 hafta sonra.",
]

text_ops = ["BT", "/F1 13 Tf", "50 780 Td", "18 TL"]
for line in lines:
    safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    text_ops.append(f"({safe}) Tj T*")
text_ops.append("ET")
stream = "\n".join(text_ops).encode("latin-1")

objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
    b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
]

out = bytearray(b"%PDF-1.4\n")
offsets = []
for i, obj in enumerate(objects, start=1):
    offsets.append(len(out))
    out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"

xref_pos = len(out)
out += f"xref\n0 {len(objects) + 1}\n".encode()
out += b"0000000000 65535 f \n"
for off in offsets:
    out += f"{off:010d} 00000 n \n".encode()
out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()

with open("test_epikriz.pdf", "wb") as f:
    f.write(out)
print("Saved test_epikriz.pdf")
