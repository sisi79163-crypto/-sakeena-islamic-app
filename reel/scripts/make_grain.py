"""Tileable film grain plate used as a soft-light layer over every scene."""
import sys

import numpy as np
from PIL import Image

out = sys.argv[1] if len(sys.argv) > 1 else "public/grain.png"
rng = np.random.default_rng(7)
size = 340

g = rng.standard_normal((size, size))
# Blur once so the grain has a little size to it instead of being pure hiss.
g = (g + np.roll(g, 1, 0) + np.roll(g, 1, 1) + np.roll(g, -1, 0) + np.roll(g, -1, 1)) / 5
g = (g - g.min()) / (g.max() - g.min())
img = (128 + (g - 0.5) * 190).clip(0, 255).astype(np.uint8)
Image.fromarray(img, mode="L").convert("RGB").save(out)
print("wrote", out)
