#!/usr/bin/env python3
"""Generate Studio Sites brand assets (icons + og-image) with PIL. Re-run anytime."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
INK = (4, 37, 75)
BRAND = (241, 91, 42)
PAPER = (255, 255, 255)
MUTED = (98, 100, 95)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(size, bold=True):
    return ImageFont.truetype(BOLD if bold else REG, size)


def draw_centered(draw, cx, y, text, fnt, fill):
    box = draw.textbbox((0, 0), text, font=fnt)
    w = box[2] - box[0]
    draw.text((cx - w / 2, y), text, font=fnt, fill=fill)


def draw_tracked(draw, cx, y, text, fnt, fill, tracking=0.18):
    widths = []
    total = 0
    for ch in text:
        w = draw.textlength(ch, font=fnt)
        widths.append(w)
        total += w
    total += tracking * fnt.size * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + tracking * fnt.size


def draw_waveform(draw, cx, cy, max_h, color, bars=9, bar_w=None, gap=None):
    if bar_w is None:
        bar_w = max_h // 7
    if gap is None:
        gap = bar_w
    heights = [0.35, 0.6, 0.9, 0.55, 1.0, 0.55, 0.9, 0.6, 0.35]
    total_w = bars * bar_w + (bars - 1) * gap
    x = cx - total_w / 2
    for h in heights:
        bh = max_h * h
        draw.rounded_rectangle([x, cy - bh / 2, x + bar_w, cy + bh / 2], radius=bar_w / 2, fill=color)
        x += bar_w + gap


def make_icon(size):
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)
    draw_waveform(d, size / 2, size / 2, size * 0.52, BRAND)
    return img


def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    m = 34
    d.rectangle([m, m, W - m, H - m], outline=INK, width=5)
    draw_centered(d, W / 2, 120, "STUDIO SITES", font(110), INK)
    d.rectangle([W / 2 - 90, 268, W / 2 + 90, 274], fill=BRAND)
    draw_tracked(d, W / 2, 300, "BOOKING WEBSITES FOR RECORDING STUDIOS", font(36), INK, 0.2)
    draw_waveform(d, W / 2, 430, 90, BRAND)
    draw_centered(d, W / 2, 500, "Pick a package. Pay securely. Go live in days.", font(32, bold=False), MUTED)
    return img


def main():
    icon512 = make_icon(512)
    icon512.save(os.path.join(HERE, "icon-512.png"))
    icon512.resize((192, 192), Image.LANCZOS).save(os.path.join(HERE, "icon-192.png"))
    icon512.resize((180, 180), Image.LANCZOS).save(os.path.join(HERE, "apple-touch-icon.png"))
    make_og().save(os.path.join(HERE, "og-image.jpg"), quality=88)
    print("assets written")


if __name__ == "__main__":
    main()
