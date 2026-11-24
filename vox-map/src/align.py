"""Word-level timestamps with faster-whisper, mapped onto the script words.

usage: python align.py NARRATION.wav SEGMENTS.json OUT.json
Writes every script word with start/end (seconds) + its sentence id, and
reports a word error rate as a pronunciation check.
"""
import json
import os
import re
import sys
from difflib import SequenceMatcher

WHISPER_DIR = os.environ.get("WHISPER_DIR", "/home/user/models/fw-medium.en")

def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def script_words(segments):
    out = []
    for s in segments:
        for raw in s["text"].split():
            out.append({"word": raw, "key": norm(raw.strip(".,:;!?")), "sentence": s["id"]})
    return out


def transcribe(wav_path, prompt=None):
    from faster_whisper import WhisperModel
    model = WhisperModel(WHISPER_DIR, device="cpu", compute_type="int8",
                         cpu_threads=os.cpu_count() or 4)
    import soundfile as sf
    from scipy.signal import resample_poly
    audio, sr = sf.read(wav_path, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    from math import gcd
    g = gcd(16000, sr)
    audio = resample_poly(audio, 16000 // g, sr // g).astype("float32")
    segs, _ = model.transcribe(audio, language="en", word_timestamps=True,
                               beam_size=5, initial_prompt=prompt,
                               vad_filter=False, condition_on_previous_text=False)
    words = []
    for seg in segs:
        for w in seg.words:
            words.append({"word": w.word.strip(), "key": norm(w.word), "start": w.start,
                          "end": w.end, "p": w.probability})
    return words


def align(script, heard):
    a = [w["key"] for w in script]
    b = [w["key"] for w in heard]
    sm = SequenceMatcher(a=a, b=b, autojunk=False)
    mapping = {}
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                mapping[i1 + k] = j1 + k
        elif op == "replace":
            # distribute heard words over script words proportionally
            for k in range(i2 - i1):
                j = j1 + int(k * (j2 - j1) / max(1, i2 - i1))
                mapping[i1 + k] = min(j, j2 - 1)
    errors = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal")
    return mapping, errors / max(1, len(a))


def main():
    wav, seg_path, out_path = sys.argv[1:4]
    meta = json.load(open(seg_path))
    segments = meta["sentences"]
    script = script_words(segments)
    prompt = " ".join(s["text"] for s in segments)
    heard = transcribe(wav, prompt=None)
    mapping, wer = align(script, heard)
    seg_by_id = {s["id"]: s for s in segments}
    for i, w in enumerate(script):
        s = seg_by_id[w["sentence"]]
        if i in mapping:
            h = heard[mapping[i]]
            w["start"], w["end"], w["heard"] = round(h["start"], 3), round(h["end"], 3), h["word"]
        else:
            w["start"] = w["end"] = None
    # fill gaps by interpolating inside the known sentence window
    for s in segments:
        idx = [i for i, w in enumerate(script) if w["sentence"] == s["id"]]
        for n, i in enumerate(idx):
            if script[i]["start"] is None:
                frac0, frac1 = n / len(idx), (n + 1) / len(idx)
                script[i]["start"] = round(s["start"] + frac0 * (s["end"] - s["start"]), 3)
                script[i]["end"] = round(s["start"] + frac1 * (s["end"] - s["start"]), 3)
                script[i]["interpolated"] = True
    json.dump({"wer_vs_script": wer, "heard": " ".join(h["word"] for h in heard),
               "words": script}, open(out_path, "w"), indent=2, ensure_ascii=False)
    print(f"WER vs script: {wer:.3f}")
    print("heard:", " ".join(h["word"] for h in heard))


if __name__ == "__main__":
    main()
