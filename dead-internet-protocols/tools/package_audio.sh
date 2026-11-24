#!/usr/bin/env bash
# Copy the audio deliverables into output/audio as lossless 24-bit FLAC (the working WAVs are
# float32 and git-ignored; the pipeline regenerates them).
set -euo pipefail
cd "$(dirname "$0")/.."
O=output/audio
rm -rf "$O"; mkdir -p "$O/sfx" "$O/narration_lines"
f() { ffmpeg -hide_banner -loglevel error -y -i "$1" -c:a flac -sample_fmt s32 -bits_per_raw_sample 24 "$2"; }
f audio/mix/final_mix.wav           "$O/final_mix.flac"
f audio/mix/narration_processed.wav "$O/stem_narration.flac"
f audio/mix/music_ducked.wav        "$O/stem_music_ducked.flac"
f audio/mix/sfx_bus.wav             "$O/stem_sfx.flac"
f audio/music/score.wav             "$O/music_score_full.flac"
f audio/tts/narration_dry.wav       "$O/narration_dry.flac"
for w in audio/tts/L*.wav; do f "$w" "$O/narration_lines/$(basename "${w%.wav}").flac"; done
for w in audio/sfx/*.wav; do f "$w" "$O/sfx/$(basename "${w%.wav}").flac"; done
cp audio/tts/asr_report.txt "$O/narration_lines/asr_report.txt"
du -sh "$O" "$O"/*
