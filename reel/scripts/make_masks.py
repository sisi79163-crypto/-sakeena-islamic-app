"""Feathered alpha masks for the character micro-motion.

Each mask isolates one figure (or one gesturing hand) so that region of the
frame can be nudged a couple of pixels without the rest of the artwork moving.
The falloff is a gaussian, so the moved layer blends back into the still frame
with no seam.
"""
import os
import sys

import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "public"
W, H = 1080, 1920

# name, centre x/y, radius x/y - all as a fraction of the frame.
REGIONS = [
    ("mask_left.png", 0.20, 0.66, 0.25, 0.29),
    ("mask_center.png", 0.50, 0.64, 0.26, 0.31),
    ("mask_right.png", 0.80, 0.66, 0.25, 0.29),
    ("mask_hand_a.png", 0.42, 0.56, 0.13, 0.11),   # hand at the mouth, scene A
    ("mask_hand_b.png", 0.33, 0.58, 0.12, 0.10),   # extended hand, scene B
    ("mask_hand_d.png", 0.51, 0.52, 0.12, 0.11),   # raised palm, scene D
]

yy, xx = np.mgrid[0:H, 0:W]
for name, cx, cy, rx, ry in REGIONS:
    d = ((xx - cx * W) / (rx * W)) ** 2 + ((yy - cy * H) / (ry * H)) ** 2
    # 1 inside the core, falling smoothly to 0 by the edge of the ellipse.
    m = np.exp(-np.clip(d - 0.35, 0, None) ** 2 * 3.4)
    img = (np.clip(m, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(img, mode="L").save(os.path.join(OUT, name))
    print("wrote", name)
