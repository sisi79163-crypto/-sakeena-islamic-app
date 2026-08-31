#!/usr/bin/env bash
# One ffmpeg pass that produces the plate Remotion draws on:
#   - 1512x2690 -> 1080x1920 (the aspect differs by 0.09%, so no crop)
#   - a single grade shared by every scene, so nothing looks disconnected
#   - per-character micro-motion, gated to the scenes where people are on screen
#   - vignette and film grain baked in
# Doing all of this here keeps Remotion down to one video layer per frame.
set -euo pipefail

IN="${1:-source.mp4}"
OUT="${2:-public/graded.mp4}"
M="${3:-public}"

# Bodies move through the two scenes with characters; hands only in their own scene.
BODY="(between(t,0,9.45)+between(t,19.30,24.95))"
HAND_A="between(t,0,4.70)"
HAND_B="between(t,4.60,9.35)"
HAND_D="between(t,19.30,24.95)"

ffmpeg -hide_banner -loglevel error -y \
  -i "$IN" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_left.png" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_center.png" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_right.png" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_hand_a.png" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_hand_b.png" \
  -loop 1 -t 30.1 -r 30 -i "$M/mask_hand_d.png" \
  -filter_complex "\
[0:v]scale=1080:1920:flags=lanczos,\
eq=contrast=1.07:saturation=1.05:brightness=0.004:gamma=0.99,\
unsharp=5:5:0.42:5:5:0.0,format=yuva420p,setpts=PTS-STARTPTS[base];\
[base]split=7[b][s1][s2][s3][s4][s5][s6];\
[s1][1:v]alphamerge[l1];\
[s2][2:v]alphamerge[l2];\
[s3][3:v]alphamerge[l3];\
[s4][4:v]alphamerge[l4];\
[s5][5:v]alphamerge[l5];\
[s6][6:v]alphamerge[l6];\
[b][l1]overlay=x='${BODY}*2.4*sin(t*2.17)':y='${BODY}*2.8*sin(t*2.99)':eval=frame[o1];\
[o1][l2]overlay=x='${BODY}*2.9*sin(t*1.90+1.1)':y='${BODY}*3.4*sin(t*3.31+0.5)':eval=frame[o2];\
[o2][l3]overlay=x='${BODY}*2.2*sin(t*2.03+2.2)':y='${BODY}*2.6*sin(t*2.62+1.7)':eval=frame[o3];\
[o3][l4]overlay=x='${HAND_A}*3.6*sin(t*4.83)':y='${HAND_A}*3.0*sin(t*5.98+0.8)':eval=frame[o4];\
[o4][l5]overlay=x='${HAND_B}*3.8*sin(t*4.51+0.4)':y='${HAND_B}*3.2*sin(t*5.61)':eval=frame[o5];\
[o5][l6]overlay=x='${HAND_D}*3.4*sin(t*4.20+1.5)':y='${HAND_D}*3.0*sin(t*5.30+2.1)':eval=frame[o6];\
[o6]vignette=PI/6.5,noise=alls=5:allf=t+u,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 14 -preset medium -r 30 "$OUT"

ffprobe -v error -show_entries format=duration:stream=width,height,nb_frames -of default=nw=1 "$OUT"
