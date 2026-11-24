#!/usr/bin/env bash
# Full pipeline for one story. Models: KOKORO_DIR (Kokoro-82M ONNX + voices),
# WHISPER_DIR (faster-whisper medium.en). See README.md.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-/home/user/.venvs/vox/bin/python}
STORY=story/kalmyk_1771.json
SCENE=story/kalmyk_scene.py

# 1. narration (TTS) -> master timeline, 2. word timestamps (faster-whisper)
$PY src/tts.py "$STORY" build/master
$PY src/align.py build/master/narration.wav build/master/narration_segments.json build/master/words.json
# 3. engraved map (4 mips)
(cd src && $PY mapgen.py ../story/kalmyk_scene_map.py ../build/map)
# 4. QC contact sheet BEFORE the full render
(cd src && $PY render.py ../$SCENE --contact ../build/contact.png)
# 5. full render (CPU workers -> FFmpeg segments -> concat), 6. sound + mix
mkdir -p out
(cd src && $PY render.py ../$SCENE --video ../out/video.mp4)
(cd src && $PY audio.py ../$SCENE ../out/mix.wav)
# 7. mux: H.264 CRF 16 + AAC 192k
ffmpeg -y -loglevel error -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/final.mp4
echo "done -> out/final.mp4"
