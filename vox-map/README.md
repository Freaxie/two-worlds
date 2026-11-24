# vox-map: autonomous map-explainer generator

This is a Python pipeline that turns a researched script into a finished 1920×1080 Vox-style map explainer. It covers neural narration, word-level timing, an engraved paper map, collage pieces, felt-marker ink, a sound mix and the H.264 export. It needs no external assets beyond fonts, Natural Earth data and open-weight models.

## First production: *The Nation That Walked Out of Russia* (Kalmyk Exodus, 1771)

| | |
|---|---|
| Final video | `deliverables/kalmyk_1771.mp4`: 1920×1080, 30 fps, 999 frames (33.3 s), H.264 CRF 16, AAC 192 kbps |
| Narration | `deliverables/narration_af_heart.wav`, Kokoro-82M `af_heart`, 31.6 s, 24 kHz, −16 LUFS |
| Word timings | `deliverables/narration_words.json` (faster-whisper medium.en, 2.4% WER against the script) |
| Final mix | `deliverables/final_mix.flac`: −16.9 LUFS integrated, true peak −0.3 dBFS |
| Contact sheets | `deliverables/contact_sheet_prototype.jpg` (pre-render QC), `deliverables/contact_sheet_final_render.jpg` |
| Research, beats and camera plan | `story/kalmyk_1771_plan.md` (pre-production; its frame numbers are for the first `am_michael` take, and the final timings are below) |

### Final script (83 words; narration starts at 0.40 s, 1.3 s hold after the last word)

| # | Beat | Time | Frames | Line |
|---|---|---|---|---|
| s1 | 1 | 0.40–4.31 s | f12–f129 | In 1771, an entire nation tried to walk out of Russia. |
| s2 | 1 | 4.69–7.17 s | f141–f215 | The Kalmyks: Buddhist herders on the lower Volga. |
| s3 | 2 | 7.51–9.10 s | f225–f273 | They answered to Catherine the Great. |
| s4 | 3 | 9.38–13.43 s | f281–f403 | Her empire curbed their khan, seized their pastures, drafted their horsemen. |
| s5 | 4 | 13.79–18.34 s | f414–f550 | So in January, Ubashi Khan led some 170,000 people east. |
| s6 | 5 | 18.66–22.13 s | f560–f664 | But the Volga never froze, stranding the clans on its west bank. |
| s7 | 6 | 22.51–24.98 s | f675–f749 | The rest marched for months, raided and starving. |
| s8 | 7 | 25.28–27.19 s | f758–f816 | Tens of thousands never reached China. |
| s9 | 8 | 27.65–32.01 s | f830–f960 | The stranded clans are still there: Kalmykia, Europe's only Buddhist republic. |

Every visual cue is computed from the word timestamps, so it stays in sync if the narration is regenerated. For example, the yellow paint sweeps on "Volga", the empress lands on "Catherine", and the ink X's land on "Tens" and "thousands".

### Camera (lon, lat, zoom)

Easing is smoothstep, zoom is interpolated logarithmically, and moves are stepped on twos.

| Frames | Lon, lat, zoom | Shot |
|---|---|---|
| 0 | 46.8, 47.6, 0.72 | Lower Volga (home) |
| 216→240 | 50.0, 51.9, 0.34 | St Petersburg and the Volga |
| 408→432 | 46.6, 47.4, 1.35 | Both banks of the Volga |
| 686→710 | 63.5, 46.6, 0.50 | The route to the Ili (on "marched") |
| 823→847 | 55.0, 51.0, 0.30 | Whole story (payoff) |

## Pipeline (`run.sh`)

1. **`src/tts.py`** synthesises Kokoro-82M ONNX with misaki G2P. Each sentence is rendered, trimmed and joined with set pauses, then loudness-normalised. Sentence boundaries are exact, and the audio becomes the master timeline.
2. **`src/align.py`** gets faster-whisper word timestamps and maps them onto the script words. It also reports a WER as a pronunciation check.
3. **`src/mapgen.py`** builds one ink-coverage raster plus a paint mask, with 4 INTER_AREA mips:
   - Equirectangular projection, longitude scaled by cos(mid-latitude), 150 px per degree, 11,328 × 11,100 px.
   - Sea: coast-parallel lines at 8/19/32/48 px, plus wavy lines every 22 px.
   - Land: 22 px diagonal hatch; the featured region is cross-hatched every 13 px.
   - Strokes: 6 px coastline, 4 px dashed border (22 on / 18 off), dotted 10° graticule.
   - Extras: a compass rose in open sea and letter-spaced Libre Caslon labels.
   - Coastline vertices are three-pass Chaikin smoothed. Land is clipped well outside the map so smoothing never makes fake coast.
4. **`src/render.py`** renders frames with NumPy/OpenCV on twos. Frames are split into segments across CPU workers, each piping raw RGB to FFmpeg (libx264, CRF 16), and the segments are concatenated. It also builds the QC contact sheet.
   - **`src/engine.py`** holds the camera and the timeline. Every element has explicit start and end frames.
   - **`src/paper.py`** handles halftone cut-outs, tags, cards, ransom letters and sheets. Halftone is a 5 px, 45° screen with 34% mix, ×1.25 contrast and grain. Pieces get a 7 px wobbly scissor edge and a (5, 7) px shadow with 6 px blur at 32%. They slap in at 1.1 → 0.98 → 1.0 and boil ±1.5 px / ±0.4° every 8 frames.
   - **`src/ink.py`** draws felt marker in screen space: stamps every 1.6 px, ±15% width wobble, tapered ends, a 0.32× dry-crayon pass with 35% dropouts, merged with max(). Boil uses 3 seeds cycling every 8 frames. It also draws 26 px / ±0.48 rad arrowheads, 27/19 dashes, X marks over 6 frames, splashes and a multiply highlighter.
   - **`src/figures.py`** holds original procedural figures: rider, horseman, empress, yurt, camel, wagon, khan, herder, caravan, weary rider and dharma wheel. None are photographs or likenesses of real people.
5. **`src/audio.py`** produces all sound with no external assets:
   - Synthesized sound effects: paper slaps, ransom-letter slaps, typewriter ticks, marker scratches, a paint brush, whooshes, paper flutter, ink splat and highlighter. Same-type hits within 3 frames are merged, and the effects bus peaks at 0.32× the voice peak.
   - An original D-dorian score with a drone, pads, a Karplus-Strong "dombra" motif and a march pulse that resolves to D major on the payoff. It is ducked under the voice.
   - Master peak is −0.3 dBFS, checked on a 4× oversampled copy.

`story/` holds the per-story inputs:
- `kalmyk_1771.json`: script, voice and pronunciation lexicon.
- `kalmyk_scene_map.py`: hand-written featured region, extra rivers, labels and cities.
- `kalmyk_scene.py`: the timeline.
- `kalmyk_1771_plan.md`: research and fact sheet.

`src/geodata.py` holds the coastline, lake, river and Kalmykia vertex lists. They are traced from Natural Earth 1:10m (public domain) by `tools/trace_geodata.py` and stored as literal lon/lat lists, so rendering has no GIS dependency. The Aral Sea uses its historic, pre-1960 shoreline.

## Dependencies

- **Python packages:** `requirements.txt`, installed in a venv with system site packages.
- **System:** FFmpeg.
- **Models** (from Hugging Face; paths can be overridden with `KOKORO_DIR` and `WHISPER_DIR`):
  - `onnx-community/Kokoro-82M-v1.0-ONNX` (`onnx/model.onnx`, `voices/af_heart.bin`), Apache-2.0
  - `Systran/faster-whisper-medium.en`, MIT
  - `spacy/en_core_web_sm` (wheel), for misaki
- **Fonts** (`assets/fonts`, licences included):
  - Libre Caslon Text and Anton (SIL OFL)
  - Permanent Marker and Special Elite (Apache 2.0)

## Departures from the original spec

- **Map width is about 11,300 px, not 7,200.** That's what keeps both the specified zoom range (0.30–1.35) and a ≥25° map margin around every shot, for a story spanning St Petersburg to the Qing frontier.
- **The beat template was adapted to the story:**
  - Beat 6 flies a caravan cut-out along the trail instead of a document.
  - The "defeated version" swap is the caravan replaced by a weary rider when it reaches China.
  - Beat 7's ink X's mark documented attacks on the route (Emba and north of Balkhash).
- **No 1771 political borders are drawn,** since they can't be drawn reliably. The dashed border marks the approximate Kalmyk pastures; modern Kalmykia is drawn in ink for the payoff.
- **Rivers were added** (Volga, Ural, Don, Emba and others) because the story depends on the Volga.
- **"White" scissor edges use beige #F1EDE4,** to stay inside the four-colour palette.
