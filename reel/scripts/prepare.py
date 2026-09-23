"""Normalize the source clips for Remotion and write their metadata to src/clips.json.

Each clip is re-encoded to 30fps H.264 (rotation applied, max 1080px wide) with a
stereo AAC track, so every clip decodes the same way and has audio to fade.
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
FPS = 30
CLIP_COUNT = 4


def probe(path, *args):
    return subprocess.run(
        ["ffprobe", "-v", "error", *args, str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


clips = []
(ROOT / "public").mkdir(exist_ok=True)
for n in range(1, CLIP_COUNT + 1):
    src = ROOT / "source" / f"clip{n}.mp4"
    out = ROOT / "public" / f"clip{n}.mp4"
    has_audio = bool(probe(src, "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0"))

    cmd = ["ffmpeg", "-y", "-i", str(src)]
    if not has_audio:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += [
        "-map", "0:v:0", "-map", "0:a:0" if has_audio else "1:a:0",
        "-vf", "fps=30,scale='min(1080,iw)':-2,format=yuv420p",
        "-c:v", "libx264", "-crf", "16", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest", "-movflags", "+faststart", str(out),
    ]
    subprocess.run(cmd, check=True)

    width, height, duration = probe(
        out, "-select_streams", "v:0", "-show_entries", "stream=width,height,duration", "-of", "csv=p=0",
    ).split(",")[:3]
    # Drop the last frame so the sequence never asks for a frame past the end.
    frames = int(float(duration) * FPS) - 1
    clips.append({"file": out.name, "width": int(width), "height": int(height), "frames": frames})
    print(f"clip{n}: {width}x{height}, {frames} frames, audio={has_audio}")

(ROOT / "src" / "clips.json").write_text(json.dumps(clips, indent=2))
