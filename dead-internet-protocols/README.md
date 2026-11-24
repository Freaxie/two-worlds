# The Strange World of Dead Internet Protocols

A vertical (9:16, 1080×1920, **60 fps**, 87 s) documentary Short about obsolete, deprecated, niche
and abandoned internet protocols: Gopher, Archie, WAIS, Finger, IPX/SPX and X.25, plus the
survivors IRC and Usenet/NNTP. Everything is produced in code. Visuals come from Three.js and
Canvas, narration from a neural TTS model running locally, and the score and sound design are
synthesized in numpy. No stock footage, samples, or AI image generation.

## Deliverables

| File | What it is |
|---|---|
| `output/final_short.mp4` | The finished Short: H.264 High, 1080×1920, 60 fps, AAC 320 kb/s, −14 LUFS |
| `output/final_short.srt` | Subtitles (same cues as the burned-in captions) |
| `output/thumbnail.png`, `output/thumbnail_landscape.png` | 1080×1920 Shorts thumbnail and a 1280×720 variant |
| `output/youtube_description.txt` | Upload description with status summary and source links |
| `output/contact_sheet.png` | One frame every 2 s, for review |
| `narration/SCRIPT.md` | Final narration with per-line timings, pronunciation overrides and the Whisper check |
| `narration/script.json` | Narration source (text, voice, speed, gaps, phonemes) |
| `research/RESEARCH.md` | Research dossier: classification table, fact-check log, verbatim RFC quotes, sources |
| `output/audio/` | Audio assets as lossless 24-bit FLAC: `final_mix`, stems (narration / music ducked / SFX), full score, dry narration, every narration line, and one file per synthesized effect (40) |
| `audio/` | The audio pipeline: `tts.py`, `music.py`, `sfx.py`, `mix.py`, `dsp.py` (working WAVs are regenerated, not committed) |
| `film/` | The renderer: one deterministic web page where every frame is a pure function of time |

## How it is built

```
narration/script.json ──► audio/tts.py (Kokoro-82M ONNX + Whisper word timings) ──► film/data/timeline.json
                                                                                   │
film/js (Three.js world + Canvas UIs + post FX) ◄────────────────────────────────┘
   │  render/render.mjs: headless Chromium (WebGL via SwiftShader), 3 workers → build/frames/*.jpg
   │  render/render.mjs --meta → film/data/events.json (sound cues) + output/final_short.srt
   ▼
audio/music.py (score, sections start on the scene cuts) + audio/sfx.py (40 synthesized effects)
   ▼
audio/mix.py (voice chain, sidechain ducking, true-peak limiter, −14 LUFS) → audio/mix/final_mix.wav
   ▼
render/encode.sh (x264 two-pass) → output/final_short.mp4
```

* **Audio leads, picture follows.** Each narration line is synthesized separately, and Whisper
  provides word-level timestamps. Scene cuts, camera moves and UI beats are keyed to spoken
  words (for example, a Finger output row highlights on "login" / "status" / "personal message",
  and the camera pans to a modern webpage on "colorful websites").
* **One event list drives the sound design.** Scenes register their cues (key presses, glitches,
  packets, whooshes…) into `film/data/events.json`; the SFX bus is generated from that list, so
  sound and picture can't drift.
* **Visual system.** A procedural "strata" network (the internet as geological layers of eras)
  uses fat-line cables, packets and dying or reviving links. Procedural CRT monitors get a
  barrel-distortion, phosphor and scanline shader. There are holographic diagrams, a
  virtual FTP archive of instanced directory cards, and post-processing (bloom, depth of field,
  chromatic aberration, film grain, scanlines, vignette, glitch cuts, CRT power on/off).
  Typography is crisp and composited after depth of field; subtitles sit inside the Shorts safe
  area and highlight protocol names.
* **Fonts.** VT323, IBM Plex Mono and Inter, bundled via `@fontsource` (all SIL OFL).

## Reproducing the film

Requirements: Node 22, Python 3.11+, ffmpeg (with libx264), Chromium + Playwright
(`require('playwright')`), about 6 GB of free disk.

```bash
cd dead-internet-protocols
npm install                                   # three.js + fonts
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
tools/fetch_models.sh models                  # Kokoro-82M + voices + Whisper small, checksum-verified (from npm)

# 1. narration + word timings  -> audio/tts/*.wav, film/data/timeline.json
HF_HUB_OFFLINE=1 .venv/bin/python audio/tts.py --models models

# 2. sound cue list + subtitles -> film/data/events.json, output/final_short.srt
node render/render.mjs --meta

# 3. music, sound effects, mix  -> audio/music/score.wav, audio/mix/final_mix.wav
(cd audio && ../.venv/bin/python music.py && ../.venv/bin/python mix.py)

# 4. picture: 5,236 frames      -> build/frames/ (≈35 min on 4 CPU cores, no GPU needed)
node render/render.mjs --all --workers 3

# 5. encode                     -> output/final_short.mp4 (+ FLAC audio deliverables)
render/encode.sh && tools/package_audio.sh

# extras
node render/render.mjs --preview 600,1500,3000          # inspect single frames (PNG)
node render/render.mjs --range 2400:2700 --force         # re-render a slice
node render/render.mjs --preview 168,4230 --clean --out build/thumb && node tools/thumbnail.mjs
python3 tools/make_docs.py                               # narration/SCRIPT.md + description
```

Why the models come from npm: the production sandbox could reach package registries but not
Hugging Face. The script downloads the same Apache-2.0 Kokoro-82M ONNX weights (fp32, re-hosted
as `kokoro-fp32{a,b,c}-shards`), the official voice tensors (via `kokoro-local-runtime`) and a
CTranslate2 conversion of Whisper small (`@skillninja/shortmovie-telop-model-p0…p3`). It then
verifies the reassembled files by SHA-256. With Hugging Face access you can use the upstream
`onnx-community/Kokoro-82M-v1.0-ONNX` and `Systran/faster-whisper-small` instead.

## Quality checks performed

* **Facts.** Every date, port number and count on screen is quoted from RFC text (read locally
  from the `doc-rfc` package) or cross-checked by web search. See `research/RESEARCH.md`, which
  also lists the corrections made to the draft narration.
* **Narration.** Each line is transcribed back with Whisper. All 19 lines match the script, with
  phoneme overrides for IPX, Novell, NetWare, WAIS and Usenet. Whisper on the *final mix* matches
  the script at 98% word level; the remaining differences are spellings of proper nouns.
* **Mix.** In speech the voice sits about 12 dB above the music and 7 dB above the SFX; the music has a
  presence dip at 3 kHz. Loudness is −14.1 LUFS integrated, −2.1 dBTP (4× oversampled
  true-peak limiter), LRA ≈ 2 LU.
* **Picture.** Frames were reviewed as contact sheets per scene during development, plus a
  full contact sheet of the final render. Fixes made along the way: typography blurred by depth
  of field, blown-out holograms, oversized point sprites at close range, title overflow,
  overlap between headers and screens, and screens visible before power-on.

## Honesty notes

* All interfaces are **illustrative reconstructions** and are labeled so on screen. Hostnames
  use reserved `.example` domains or well-known historical archive hosts. Users, chats and
  newsgroup threads are invented. The LAN game is an original design.
* "The internet never forgets" is the brief's closing slogan, not a literal claim. The research
  notes record how close Archie came to being lost.
* Sound effects are original syntheses of *kinds* of sounds (CRT whine, key clicks, DTMF digits
  and a 2100 Hz answer tone, FSK chatter). No copyrighted startup sounds or recordings are used.

## Licenses

Project code: MIT. Kokoro-82M weights and voices: Apache-2.0. Whisper: MIT. Three.js: MIT.
Fonts: SIL Open Font License 1.1. RFC excerpts © IETF Trust, quoted for commentary.
