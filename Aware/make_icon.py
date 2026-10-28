"""Génère aware/aware.ico (bouclier + point, sur fond dégradé arrondi)."""
from PIL import Image, ImageDraw

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / S
    gd.line([(0, y), (S, y)], fill=(int(91 - 40 * t), int(140 - 50 * t), int(255 - 25 * t), 255))
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([40, 40, S - 40, S - 40], radius=220, fill=255)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
k = S / 32
shield = [(16, 5), (6.5, 9), (6.5, 15), (8, 21), (12, 25.5), (16, 27.5), (20, 25.5), (24, 21), (25.5, 15), (25.5, 9)]
d.line([(x * k, y * k) for x, y in shield + shield[:1]], fill="white", width=int(2.3 * k), joint="curve")
r = 4.2 * k
d.ellipse([16 * k - r, 15.5 * k - r, 16 * k + r, 15.5 * k + r], fill="white")

img.save("aware/aware.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
