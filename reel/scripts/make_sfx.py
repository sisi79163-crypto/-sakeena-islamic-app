"""Cinematic sound design for the reel - noise and impulse based only.

Nothing here is musical: there is no pitched melody, no chord, no tempo grid and
no loop. The only tonal element is the sub sine in the impact, which decays in
under a second and reads as a hit, not a note.

Writes 24-bit / 48 kHz WAVs into the Remotion public/ folder.
"""
import math
import os
import struct
import sys
import wave

import numpy as np

FS = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else "public"
RNG = np.random.default_rng(20260831)


def write(name, x, peak_dbfs):
    x = np.asarray(x, dtype=np.float64)
    x -= x.mean()
    if np.abs(x).max() > 0:
        x *= (10 ** (peak_dbfs / 20)) / np.abs(x).max()
    data = (np.clip(x, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
    raw = b"".join(struct.pack("<i", int(v))[:3] for v in data)
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(3)
        w.setframerate(FS)
        w.writeframes(raw)
    rms = 20 * math.log10(math.sqrt((x ** 2).mean()) + 1e-12)
    print(f"{name:16} {len(x)/FS:5.2f}s  peak={peak_dbfs:.0f}dBFS  rms={rms:6.1f}dBFS")


def noise(n):
    return RNG.standard_normal(n)


def pink(n):
    """1/f noise via spectral shaping."""
    spec = np.fft.rfft(noise(n))
    f = np.arange(len(spec))
    f[0] = 1
    spec /= np.sqrt(f)
    return np.fft.irfft(spec, n)


def onepole_lp(x, cutoff):
    a = math.exp(-2 * math.pi * cutoff / FS)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y


def onepole_hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def bandpass(x, lo, hi):
    return onepole_hp(onepole_lp(x, hi), lo)


def sweep_bandpass(x, lo_start, lo_end, width):
    """Band-pass whose centre glides - done in blocks so it stays cheap."""
    n = len(x)
    blocks = 64
    out = np.zeros(n)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for b in range(blocks):
        a, z = edges[b], edges[b + 1]
        if z <= a:
            continue
        t = b / (blocks - 1)
        lo = lo_start * (lo_end / lo_start) ** t
        seg = bandpass(x[max(0, a - 512):z], lo, lo * width)
        out[a:z] = seg[-(z - a):]
    return out


def fade(n, attack, release):
    e = np.ones(n)
    a = int(attack * FS)
    r = int(release * FS)
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.6
    if r:
        e[-r:] = np.linspace(1, 0, r) ** 1.6
    return e


# --- Room tone: a soft, slowly breathing air bed. -------------------------
n = int(44.5 * FS)
bed = onepole_lp(pink(n), 420) * 6.0
bed += onepole_lp(pink(n), 90) * 3.0
t = np.arange(n) / FS
breath = 1 + 0.20 * np.sin(2 * math.pi * t / 11.3) + 0.12 * np.sin(2 * math.pi * t / 6.7 + 1.1)
write("ambience.wav", bed * breath * fade(n, 1.2, 1.5), -22.0)

# --- Low cinematic impact: sub drop plus a short body transient. ----------
n = int(1.1 * FS)
t = np.arange(n) / FS
sub_f = 58 * np.exp(-t * 2.6) + 26
sub = np.sin(2 * math.pi * np.cumsum(sub_f) / FS) * np.exp(-t * 3.4)
body = onepole_lp(noise(n), 700) * np.exp(-t * 16) * 0.55
write("impact.wav", sub + body, -6.0)

# --- Transition whoosh: filtered air moving past. -------------------------
n = int(0.62 * FS)
t = np.arange(n) / FS
env = np.exp(-((t - 0.26) ** 2) / (2 * 0.11 ** 2))
write("whoosh.wav", sweep_bandpass(noise(n), 380, 2600, 3.2) * env, -10.0)

# --- Riser: air rising into a reveal, cut short at the top. ---------------
n = int(1.15 * FS)
t = np.arange(n) / FS
env = (t / t[-1]) ** 2.1
env[-int(0.05 * FS):] *= np.linspace(1, 0, int(0.05 * FS))
write("riser.wav", sweep_bandpass(noise(n), 260, 3400, 2.4) * env, -12.0)

# --- Clothing / posture shift. -------------------------------------------
n = int(0.42 * FS)
t = np.arange(n) / FS
rustle = bandpass(noise(n), 900, 6500) * (np.exp(-t * 9) + 0.4 * np.exp(-((t - 0.16) ** 2) / 0.0009))
write("cloth.wav", rustle, -14.0)

# --- Very light tick under a key Arabic word appearing. -------------------
n = int(0.22 * FS)
t = np.arange(n) / FS
write("tick.wav", bandpass(noise(n), 1800, 9000) * np.exp(-t * 42), -12.0)
