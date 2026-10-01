#!/usr/bin/env python3
"""Generate icons/icon.svg, icon-maskable.svg and the PNG icons (180, 192, 512, maskable 512) with no dependencies.
Edit COLORS and shapes() to draw the tool's own glyph, then run:  python3 dev/make-icons.py"""
import os, struct, zlib

BG, ACCENT, SOFT = "#a8481f", "#f5efe4", "#f5efe4"

def shapes(s, ox, oy):
    """Rectangles in the unit square, scaled by s and offset by (ox, oy) (the maskable icon needs a safe zone)."""
    f = lambda v, o: o + v * s
    out = []
    lines = [(.20, .26, .52, .08), (.20, .42, .60, .055), (.20, .54, .60, .055), (.20, .66, .36, .055)]     # a headline and lines of text: show notes
    for x0, y0, w, h in lines:
        out.append((f(x0, ox), f(y0, oy), f(x0 + w, ox), f(y0 + h, oy), ACCENT))
    return out

def svg(maskable=False):
    s, o = (0.66, 0.17) if maskable else (1, 0)
    r = 0 if maskable else 0.18
    p = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">', '<rect width="512" height="512" rx="%d" fill="%s"/>' % (r * 512, BG)]
    for x0, y0, x1, y1, c in shapes(s, o, o):
        p.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s"/>' % (x0 * 512, y0 * 512, (x1 - x0) * 512, (y1 - y0) * 512, c))
    p.append("</svg>")
    return "\n".join(p) + "\n"

def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def png(size, maskable=False, ss=3):
    s, o = (0.66, 0.17) if maskable else (1, 0)
    sh = shapes(s, o, o); rr = 0 if maskable else 0.18
    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + .5) / ss) / size; y = (py + (sy + .5) / ss) / size
                    col = None
                    cx = min(max(x, rr), 1 - rr); cy = min(max(y, rr), 1 - rr)
                    if (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr + 1e-12: col = hexrgb(BG) + (255,)
                    for x0, y0, x1, y1, c in sh:
                        if x0 <= x <= x1 and y0 <= y <= y1: col = hexrgb(c) + (255,)
                    if col:
                        for i in range(4): acc[i] += col[i]
            n = ss * ss; a = acc[3] // n
            row += bytes([acc[0] // n if a else 0, acc[1] // n if a else 0, acc[2] // n if a else 0, a])
        rows.append(b"\x00" + bytes(row))
    raw = b"".join(rows)
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
os.makedirs(root, exist_ok=True)
open(os.path.join(root, "icon.svg"), "w").write(svg())
open(os.path.join(root, "icon-maskable.svg"), "w").write(svg(True))
for name, size, mk in [("icon-180.png", 180, False), ("icon-192.png", 192, False), ("icon-512.png", 512, False), ("icon-maskable-512.png", 512, True)]:
    open(os.path.join(root, name), "wb").write(png(size, mk))
print("icons written")
