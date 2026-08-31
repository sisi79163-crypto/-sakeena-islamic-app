#!/usr/bin/env bash
# Builds the finished reel. Expects to run in the Higgsfield sandbox
# (ffmpeg, node, chromium at /opt/chrome-full/chrome).
set -euo pipefail

BRANCH="${BRANCH:-claude/alnameema-video-polish-g3jp7m}"
API="https://api.github.com/repos/sisi79163-crypto/-sakeena-islamic-app/contents"
fetch() { curl -fsSL -H "Accept: application/vnd.github.raw" -o "$2" "$API/$1?ref=$BRANCH"; }
ROOT="${ROOT:-$HOME/reel-build}"

mkdir -p "$ROOT"/{public,out}
cd "$ROOT"

echo "==> project files"
for f in package.json tsconfig.json src/index.ts src/Root.tsx src/Shared.tsx \
         src/NameemaVideo.tsx src/timeline.ts \
         src/scenes/HookScene.tsx src/scenes/TalkScene.tsx src/scenes/HadithScene.tsx \
         src/scenes/ReflectionScene.tsx src/scenes/TongueScene.tsx \
         src/scenes/FinalScene.tsx src/scenes/EndScene.tsx; do
  mkdir -p "$(dirname "$f")"
  fetch "reel/remotion/$f" "$f"
done
for f in make_sfx.py make_grain.py make_masks.py grade.sh; do
  fetch "reel/scripts/$f" "$f"
done
chmod +x grade.sh

echo "==> source clip"
[ -f source.mp4 ] || curl -fsSL -o source.mp4 \
  "https://raw.githubusercontent.com/sisi79163-crypto/-sakeena-islamic-app/${BRANCH}/reel/source/nameema_source.mp4"

echo "==> masks, grain, sound design"
python3 make_masks.py public
python3 make_grain.py public/grain.png
python3 make_sfx.py public

echo "==> grade + character motion (one pass)"
./grade.sh source.mp4 public/graded.mp4 public

echo "==> typeface"
curl -fsSL -o public/arabic-bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/almarai/Almarai-ExtraBold.ttf"
python3 -c "
import sys
head = open('public/arabic-bold.ttf','rb').read(4)
sys.exit(0 if head in (b'\\x00\\x01\\x00\\x00', b'true', b'OTTO') else 'typeface download is not a font')
"

echo "==> narration"
# Generated with Higgsfield text-to-speech, preset voice "Arthur" (male, MSA).
# These are permanent result URLs for those generations - no voice is cloned
# from any real person.
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3G3TMtoB7h4QQk9ems7Ku5DJPMe"
declare -A VOICES=(
  [voice01]="hf_20260830_235255_27261a4d-54ff-4d10-a8cb-cd7a319417fc"
  [voice02]="hf_20260830_235255_07618e42-7b5d-4ba3-ba3e-d4c60b6856bf"
  [voice03]="hf_20260830_235255_ee94b80e-9af4-4eb1-b091-0ec39646820c"
  [voice05]="hf_20260830_235255_98894cc6-ac99-43e3-9bc1-d335f315b3a3"
  [voice06]="hf_20260830_235255_199bfe11-f175-40a4-bbdf-361160046496"
  [voice09]="hf_20260830_235314_86ae366a-968b-4995-a9c7-784ad592eb61"
  [voice10]="hf_20260830_235525_e43b37a2-577d-4811-8aa8-9d2a731776d4"
  [voice12]="hf_20260830_235525_cea097fc-ace4-4f66-a752-e7490e67801c"
  [voice13]="hf_20260830_235525_7bfc4c99-a3bf-48d5-96cd-30db8d640f1e"
  [voice14]="hf_20260830_235525_248c8714-8c2e-4fcf-bd81-d59ac5925035"
  [voice15]="hf_20260830_235642_4fe0d536-d60b-431d-bbc0-c67b5f570ec9"
)
for v in "${!VOICES[@]}"; do
  [ -f "raw_$v.mp3" ] || curl -fsSL -o "raw_$v.mp3" "$CDN/${VOICES[$v]}.mp3"
done

# The three lines that carry the hadith are slowed a touch so the Prophet's
# words are delivered more calmly than the rest of the narration.
slow_for() { case "$1" in voice05|voice10|voice15) echo "atempo=0.94," ;; *) echo "" ;; esac; }
for v in "${!VOICES[@]}"; do
  ffmpeg -hide_banner -loglevel error -y -i "raw_$v.mp3" \
    -af "$(slow_for "$v")highpass=f=85,dynaudnorm=f=180:g=9:p=0.62:m=6,alimiter=limit=0.89" \
    -c:a libmp3lame -q:a 1 "public/$v.mp3"
done
for v in "${!VOICES[@]}"; do
  printf "%s %ss\n" "$v" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "public/$v.mp3")"
done

echo "==> install"
[ -d node_modules ] || npm install --no-audit --no-fund --loglevel=error

echo "==> render"
export REMOTION_BROWSER_EXECUTABLE=/opt/chrome-full/chrome
npx remotion render src/index.ts NameemaFinal out/render.mp4 \
  --codec=h264 --crf=15 --pixel-format=yuv420p \
  --audio-codec=aac --audio-bitrate=320k \
  --browser-executable=/opt/chrome-full/chrome \
  --concurrency=5 --log=error

echo "==> master audio (broadcast-style loudness, hard ceiling, no clipping)"
ffmpeg -hide_banner -loglevel error -y -i out/render.mp4 \
  -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.94:level=disabled" \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/nameema-final.mp4

ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate \
  -of default=nw=1 out/nameema-final.mp4
ls -la out/
