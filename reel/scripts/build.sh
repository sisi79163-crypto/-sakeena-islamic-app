#!/usr/bin/env bash
# Builds the finished reel. Expects to run in the Higgsfield sandbox
# (ffmpeg, node, chromium at /opt/chrome-full/chrome).
set -euo pipefail

BRANCH="${BRANCH:-claude/alnameema-video-polish-g3jp7m}"
RAW="https://raw.githubusercontent.com/sisi79163-crypto/-sakeena-islamic-app/${BRANCH}"
ROOT="${ROOT:-$HOME/reel-build}"
VOICE_SRC="${VOICE_SRC:-$HOME/namima-remotion/public}"

mkdir -p "$ROOT"/{public,out}
cd "$ROOT"

echo "==> project files"
for f in package.json tsconfig.json src/index.ts src/Root.tsx src/Shared.tsx \
         src/NameemaVideo.tsx src/timeline.ts \
         src/scenes/HookScene.tsx src/scenes/TalkScene.tsx src/scenes/HadithScene.tsx \
         src/scenes/ReflectionScene.tsx src/scenes/TongueScene.tsx \
         src/scenes/FinalScene.tsx src/scenes/EndScene.tsx; do
  mkdir -p "$(dirname "$f")"
  curl -fsSL -o "$f" "$RAW/reel/remotion/$f"
done
for f in make_sfx.py make_grain.py; do
  curl -fsSL -o "$f" "$RAW/reel/scripts/$f"
done

echo "==> source clip"
[ -f source.mp4 ] || curl -fsSL -o source.mp4 "$RAW/reel/source/nameema_source.mp4"

echo "==> grade  (one pass, so every scene shares the same look)"
# 1512x2690 -> 1080x1920: the aspect differs by 0.09%, so no crop is needed.
ffmpeg -hide_banner -loglevel error -y -i source.mp4 \
  -vf "scale=1080:1920:flags=lanczos,\
eq=contrast=1.07:saturation=1.05:brightness=0.004:gamma=0.99,\
unsharp=5:5:0.42:5:5:0.0" \
  -an -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p public/graded.mp4

echo "==> typeface"
if ! curl -fsSL -o public/arabic-bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/almarai/Almarai-ExtraBold.ttf"; then
  cp "$VOICE_SRC/arabic-bold.ttf" public/arabic-bold.ttf
fi

echo "==> grain + sound design"
python3 make_grain.py public/grain.png
python3 make_sfx.py public

echo "==> narration"
for v in 01 02 03 05 06 09 10 12 13 14 15; do
  cp "$VOICE_SRC/voice$v.mp3" "public/voice$v.mp3"
done
# Level the narration: high-pass off the rumble, even out the takes, leave headroom.
for f in public/voice*.mp3; do
  ffmpeg -hide_banner -loglevel error -y -i "$f" \
    -af "highpass=f=85,dynaudnorm=f=180:g=9:p=0.62:m=6,alimiter=limit=0.89" \
    -c:a libmp3lame -q:a 1 "${f%.mp3}.lvl.mp3"
  mv "${f%.mp3}.lvl.mp3" "$f"
done

echo "==> install"
[ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error

echo "==> render"
export REMOTION_BROWSER_EXECUTABLE=/opt/chrome-full/chrome
npx remotion render src/index.ts NameemaFinal out/render.mp4 \
  --codec=h264 --crf=15 --pixel-format=yuv420p \
  --audio-codec=aac --audio-bitrate=320k \
  --browser-executable=/opt/chrome-full/chrome \
  --concurrency=2 --log=error

echo "==> master audio (broadcast-style loudness, hard ceiling, no clipping)"
ffmpeg -hide_banner -loglevel error -y -i out/render.mp4 \
  -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.94:level=disabled" \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/nameema-final.mp4

ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate \
  -of default=nw=1 out/nameema-final.mp4
ls -la out/
