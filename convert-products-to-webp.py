"""Convert the Agri Sukses product JPG images to WebP and update index.html.

Run this script from the root of the repository, after replacing index.html
with the supplied optimized HTML file:
    py -m pip install Pillow
    py convert-products-to-webp.py

Original JPGs are kept as backups; only HTML references are changed.
"""
from pathlib import Path
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow belum terpasang. Jalankan: py -m pip install Pillow")

ROOT = Path(__file__).resolve().parent
HTML_FILE = ROOT / "index.html"
IMAGE_NAMES = [
    "arabika.jpg",
    "robusta.jpg",
    "cinnamon.jpg",
    "pepper.jpg",
    "vanilla.jpg",
    "cocoa-beans.jpg",
    "cocoa-powder.jpg",
    "charcoal.jpg",
]

if not HTML_FILE.exists():
    sys.exit("index.html tidak ditemukan. Pastikan script dijalankan dari root repository.")

html = HTML_FILE.read_text(encoding="utf-8")
converted = []
missing = []

for filename in IMAGE_NAMES:
    source = ROOT / filename
    if not source.exists():
        missing.append(filename)
        continue

    output = source.with_suffix(".webp")
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.save(output, "WEBP", quality=80, method=6)

    old_size = source.stat().st_size
    new_size = output.stat().st_size
    html = html.replace(f'src="{filename}"', f'src="{output.name}"')
    saved = old_size - new_size
    ratio = (saved / old_size * 100) if old_size else 0
    converted.append((filename, output.name, old_size, new_size, ratio))

if converted:
    HTML_FILE.write_text(html, encoding="utf-8")

print("Konversi gambar selesai. File JPG asli tetap disimpan.")
for old, new, old_size, new_size, ratio in converted:
    print(f"{old} -> {new}: {old_size/1024:.1f} KB -> {new_size/1024:.1f} KB ({ratio:.1f}% lebih kecil)")
if missing:
    print("Gambar yang tidak ditemukan:", ", ".join(missing))
if not converted:
    sys.exit("Tidak ada gambar yang berhasil dikonversi.")
print("index.html telah diarahkan ke gambar WebP yang berhasil dibuat.")
