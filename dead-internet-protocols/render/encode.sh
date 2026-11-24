#!/usr/bin/env bash
# Encode rendered frames + final mix into the deliverable MP4 (H.264 High, 1080x1920, 60 fps,
# AAC 320 kb/s 48 kHz). Two-pass VBR keeps the file under GitHub's 100 MB limit.
set -euo pipefail
cd "$(dirname "$0")/.."
FR=build/frames
OUT=output/final_short.mp4
BR="${BITRATE:-8200k}"
ffmpeg -hide_banner -y -framerate 60 -i "$FR/%06d.jpg" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
  -b:v "$BR" -maxrate 14M -bufsize 20M -pass 1 -passlogfile build/x264 -an -f mp4 /dev/null
ffmpeg -hide_banner -y -framerate 60 -i "$FR/%06d.jpg" -i audio/mix/final_mix.wav \
  -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v "$BR" -maxrate 14M -bufsize 20M -pass 2 -passlogfile build/x264 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart \
  -metadata title="The Strange World of Dead Internet Protocols" "$OUT"
ls -lh "$OUT"
