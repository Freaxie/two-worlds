#!/usr/bin/env python3
"""Narration generator.

Synthesises every line of narration/script.json with the Kokoro-82M neural TTS model
(ONNX, fp32), trims each clip, lays the lines out on the film timeline, then runs
Whisper (faster-whisper, small) over every clip to
  1. verify the words that were actually spoken (a pronunciation / intelligibility check), and
  2. obtain word-level timestamps used for the burned-in subtitles and the .srt file.

Outputs
  audio/tts/Lxx.wav                 one trimmed clip per line (24 kHz mono)
  audio/tts/narration_dry.wav       the full narration track on the film timeline (48 kHz)
  film/data/timeline.json           line + word timings (consumed by the renderer and SRT builder)
  audio/tts/asr_report.txt          Whisper transcript vs. script, per line

Usage: python audio/tts.py --models <dir with kokoro-fp32.onnx, voices.npz, whisper-small-ct2/>
"""
import argparse
import difflib
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm_tok(t):
    t = t.lower().replace("’", "'")
    t = re.sub(r"[^a-z0-9'.\-]", "", t)
    return t.strip(".-'")


def build_phonemes(kokoro, text, overrides, lang="en-us"):
    """espeak phonemes for plain text, with hand-written phonemes for listed words."""
    if not overrides:
        return kokoro.tokenizer.phonemize(text, lang)
    keys = sorted(overrides, key=len, reverse=True)
    pat = re.compile(r"(?<![\w'])(" + "|".join(re.escape(k) for k in keys) + r")(?![\w'])([,.;:?!]?)")
    out, pos = [], 0
    for m in pat.finditer(text):
        seg = text[pos:m.start()]
        if seg.strip():
            out.append(kokoro.tokenizer.phonemize(seg.strip(), lang))
        out.append(overrides[m.group(1)] + m.group(2))
        pos = m.end()
    tail = text[pos:]
    if tail.strip():
        ph = kokoro.tokenizer.phonemize(tail.strip(), lang)
        # keep a leading punctuation mark that espeak might drop
        lead = tail.strip()[0]
        if lead in ",.;:?!" and not ph.startswith(lead):
            ph = lead + " " + ph
        out.append(ph)
    return " ".join(p.strip() for p in out if p.strip())


def trim(audio, sr, thresh_db=-48.0, pre=0.02, post=0.07):
    env = np.abs(audio)
    # smooth envelope (5 ms)
    w = max(1, int(sr * 0.005))
    env = np.convolve(env, np.ones(w) / w, mode="same")
    th = 10 ** (thresh_db / 20)
    idx = np.where(env > th)[0]
    if len(idx) == 0:
        return audio
    a = max(0, idx[0] - int(pre * sr))
    b = min(len(audio), idx[-1] + int(post * sr))
    out = audio[a:b].copy()
    # 4 ms fades to avoid clicks
    f = int(sr * 0.004)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out


def align_words(script_tokens, asr_words):
    """Map script tokens to ASR word timings (difflib alignment + interpolation)."""
    a = [norm_tok(t) for t in script_tokens]
    b = [norm_tok(w["word"]) for w in asr_words]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    times = [None] * len(a)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                w = asr_words[j1 + k]
                times[i1 + k] = (w["start"], w["end"])
        elif tag == "replace" and j2 > j1:
            s, e = asr_words[j1]["start"], asr_words[j2 - 1]["end"]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
    # interpolate gaps
    known = [i for i, t in enumerate(times) if t]
    if not known:
        return None
    for i in range(len(times)):
        if times[i] is None:
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            if prev is None:
                times[i] = (times[nxt][0], times[nxt][0])
            elif nxt is None:
                times[i] = (times[prev][1], times[prev][1])
            else:
                s, e = times[prev][1], times[nxt][0]
                cnt = nxt - prev - 1
                k = i - prev - 1
                times[i] = (s + (e - s) * k / cnt, s + (e - s) * (k + 1) / cnt)
    return times


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True)
    ap.add_argument("--only", default=None, help="comma separated line ids to regenerate")
    args = ap.parse_args()

    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel

    script = json.load(open(os.path.join(ROOT, "narration", "script.json")))
    kokoro = Kokoro(os.path.join(args.models, "kokoro-fp32.onnx"), os.path.join(args.models, "voices.npz"))
    whisper = WhisperModel(os.path.join(args.models, "whisper-small-ct2"), device="cpu", compute_type="int8", cpu_threads=4)

    tts_dir = os.path.join(ROOT, "audio", "tts")
    os.makedirs(tts_dir, exist_ok=True)
    only = set(args.only.split(",")) if args.only else None

    voice, speed = script["voice"], script["speed"]
    overrides = script.get("phonemes", {})
    t = script["lead_in"]
    lines_out, report = [], []
    full_sr = 48000

    for line in script["lines"]:
        lid = line["id"]
        wav_path = os.path.join(tts_dir, f"{lid}.wav")
        if only is None or lid in only or not os.path.exists(wav_path):
            ph = build_phonemes(kokoro, line["text"], overrides)
            audio, sr = kokoro.create(ph, voice=voice, speed=line.get("speed", speed), is_phonemes=True)
            audio = trim(np.asarray(audio, dtype=np.float32), sr)
            sf.write(wav_path, audio, sr, subtype="FLOAT")
            print(f"{lid}: {len(audio)/sr:.2f}s  {ph}")
        audio, sr = sf.read(wav_path, dtype="float32")
        dur = len(audio) / sr

        # Whisper check + word timestamps
        a16 = resample_poly(audio, 2, 3).astype(np.float32) if sr == 24000 else audio
        segs, _ = whisper.transcribe(a16, language="en", word_timestamps=True, beam_size=5,
                                     condition_on_previous_text=False)
        words = [{"word": w.word.strip(), "start": float(w.start), "end": float(w.end), "p": float(w.probability)}
                 for s in segs for w in s.words]
        asr_text = " ".join(w["word"] for w in words)

        display = line.get("display", line["text"])
        spoken_tokens = line["text"].split()
        disp_tokens = display.split()
        sp_times = align_words(spoken_tokens, words) or [(0, dur)] * len(spoken_tokens)
        # map display tokens onto spoken tokens (they differ only where a symbol is spelled out)
        dm = difflib.SequenceMatcher(a=[norm_tok(x) for x in disp_tokens], b=[norm_tok(x) for x in spoken_tokens], autojunk=False)
        disp_times = [None] * len(disp_tokens)
        for tag, i1, i2, j1, j2 in dm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    disp_times[i1 + k] = sp_times[j1 + k]
            elif j2 > j1:
                s, e = sp_times[j1][0], sp_times[j2 - 1][1]
                n = i2 - i1
                for k in range(n):
                    disp_times[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
        for i in range(len(disp_times)):
            if disp_times[i] is None:
                disp_times[i] = disp_times[i - 1] if i else (0.0, 0.0)

        t += line["gap"]
        start = round(t, 3)
        t += dur
        lines_out.append({
            "id": lid, "scene": line["scene"], "start": start, "end": round(t, 3), "duration": round(dur, 3),
            "text": display,
            "words": [{"w": tok, "start": round(start + s, 3), "end": round(start + e, 3)} for tok, (s, e) in zip(disp_tokens, disp_times)],
        })
        ratio = difflib.SequenceMatcher(a=[norm_tok(x) for x in spoken_tokens], b=[norm_tok(w["word"]) for w in words]).ratio()
        minp = min([w["p"] for w in words], default=0)
        report.append(f"{lid} [{dur:5.2f}s] match={ratio:.2f} minP={minp:.2f}\n   script: {line['text']}\n   heard : {asr_text}")

    total = t + script["tail"]
    # assemble narration track at 48 kHz
    track = np.zeros(int(total * full_sr) + full_sr, dtype=np.float32)
    for lo in lines_out:
        a, sr = sf.read(os.path.join(tts_dir, f"{lo['id']}.wav"), dtype="float32")
        a48 = resample_poly(a, 2, 1).astype(np.float32) if sr == 24000 else a
        i0 = int(round(lo["start"] * full_sr))
        track[i0:i0 + len(a48)] += a48
    track = track[: int(total * full_sr)]
    sf.write(os.path.join(tts_dir, "narration_dry.wav"), track, full_sr, subtype="FLOAT")

    timeline = {"duration": round(total, 3), "fps": 60, "lines": lines_out}
    os.makedirs(os.path.join(ROOT, "film", "data"), exist_ok=True)
    with open(os.path.join(ROOT, "film", "data", "timeline.json"), "w") as f:
        json.dump(timeline, f, indent=1, ensure_ascii=False)
    with open(os.path.join(tts_dir, "asr_report.txt"), "w") as f:
        f.write("\n".join(report) + "\n")
    print("\n".join(report))
    print(f"\nTotal duration: {total:.2f}s")


if __name__ == "__main__":
    sys.exit(main())
