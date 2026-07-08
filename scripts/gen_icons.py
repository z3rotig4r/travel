# -*- coding: utf-8 -*-
"""PWA 아이콘 생성: 코랄 배경 + 흰 '삿' 글리프. public/ 에 저장."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(OUT, exist_ok=True)
ACCENT = (217, 119, 87, 255)   # #d97757
WHITE = (255, 255, 255, 255)
FONT = "C:/Windows/Fonts/malgunbd.ttf"

def rounded(size, radius_ratio, glyph_ratio, name, full_bleed=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if full_bleed:
        d.rectangle([0, 0, size, size], fill=ACCENT)
    else:
        r = int(size * radius_ratio)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=ACCENT)
    fs = int(size * glyph_ratio)
    font = ImageFont.truetype(FONT, fs)
    text = "삿"
    bb = d.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((size - tw) / 2 - bb[0], (size - th) / 2 - bb[1]), text, font=font, fill=WHITE)
    img.save(os.path.join(OUT, name))
    print("wrote", name, size)

rounded(192, 0.22, 0.56, "pwa-192x192.png")
rounded(512, 0.22, 0.56, "pwa-512x512.png")
rounded(512, 0.0, 0.46, "maskable-512x512.png", full_bleed=True)
rounded(180, 0.22, 0.56, "apple-touch-icon.png")
print("done")
