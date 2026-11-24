"""Neural narration with Kokoro-82M (ONNX) + misaki G2P.

Each sentence is synthesised separately, trimmed, and joined with the pause
listed in the story file, so sentence (= visual beat) boundaries are known
exactly. Word-level timing comes from align.py (faster-whisper).

usage:
  python tts.py STORY.json OUT_DIR                 # master narration
  python tts.py STORY.json OUT_DIR --audition v1,v2  # short voice tests
"""
import argparse
import json
import os
import re

import numpy as np
import onnxruntime as ort
import soundfile as sf

MODEL_DIR = os.environ.get("KOKORO_DIR", "/home/user/models/kokoro")
SR = 24000


class Kokoro:
    def __init__(self, model_dir=MODEL_DIR):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = os.cpu_count() or 4
        self.sess = ort.InferenceSession(f"{model_dir}/model.onnx", opts,
                                         providers=["CPUExecutionProvider"])
        tok = json.load(open(f"{model_dir}/tokenizer.json"))
        self.vocab = tok["model"]["vocab"]
        self.model_dir = model_dir
        self._g2p = {}

    def voice(self, name):
        return np.fromfile(f"{self.model_dir}/voices/{name}.bin",
                           dtype=np.float32).reshape(-1, 1, 256)

    def g2p(self, text, british, lexicon):
        from misaki import en, espeak
        if not self._g2p:
            import espeakng_loader
            from phonemizer.backend.espeak.wrapper import EspeakWrapper
            EspeakWrapper.set_library(espeakng_loader.get_library_path())
            EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        if british not in self._g2p:
            self._g2p[british] = en.G2P(trf=False, british=british,
                                        fallback=espeak.EspeakFallback(british=british))
        for word, ph in lexicon.items():
            text = re.sub(rf"\b{re.escape(word)}\b", f"[{word}](/{ph}/)", text)
        phonemes, _ = self._g2p[british](text)
        return phonemes

    def synth(self, phonemes, voice, speed=1.0):
        ids = [self.vocab[c] for c in phonemes if c in self.vocab]
        if len(ids) > 510:
            raise ValueError("sentence too long for one Kokoro pass")
        style = voice[len(ids)].astype(np.float32)
        wav = self.sess.run(None, {
            "input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
            "style": style,
            "speed": np.array([speed], dtype=np.float32),
        })[0]
        return np.asarray(wav, dtype=np.float32).reshape(-1)


def trim(wav, thresh_db=-48.0, pad_s=0.025):
    """Trim leading/trailing near-silence, keeping a short natural pad."""
    win = int(0.01 * SR)
    frames = len(wav) // win
    rms = np.sqrt(np.mean(wav[: frames * win].reshape(frames, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
    on = np.where(db > thresh_db)[0]
    if len(on) == 0:
        return wav
    a = max(0, on[0] * win - int(pad_s * SR))
    b = min(len(wav), (on[-1] + 1) * win + int(pad_s * SR))
    return wav[a:b]


def loudness_normalise(wav, target_lufs=-16.0, peak_db=-1.0):
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    loud = meter.integrated_loudness(wav)
    out = pyln.normalize.loudness(wav, loud, target_lufs)
    peak = np.max(np.abs(out))
    lim = 10 ** (peak_db / 20)
    if peak > lim:
        out = out * (lim / peak)
    return out.astype(np.float32), loud


def build(story, voice_name, out_dir, kokoro, sentences=None, lead_in=0.0):
    british = voice_name.startswith("b")
    voice = kokoro.voice(voice_name)
    speed = float(story.get("speed", 1.0))
    lex = story.get("lexicon", {})
    parts, segs, t = [], [], lead_in
    if lead_in > 0:
        parts.append(np.zeros(int(lead_in * SR), np.float32))
    sents = sentences or story["sentences"]
    for s in sents:
        ph = kokoro.g2p(s["text"], british, lex)
        wav = trim(kokoro.synth(ph, voice, speed))
        dur = len(wav) / SR
        segs.append({"id": s["id"], "beat": s["beat"], "text": s["text"],
                     "phonemes": ph, "start": round(t, 4), "end": round(t + dur, 4)})
        parts.append(wav)
        t += dur
        gap = s.get("pause_after", 0.4)
        if gap > 0:
            parts.append(np.zeros(int(gap * SR), np.float32))
            t += int(gap * SR) / SR
    wav = np.concatenate(parts)
    wav, loud_in = loudness_normalise(wav)
    os.makedirs(out_dir, exist_ok=True)
    return wav, segs, loud_in


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("out_dir")
    ap.add_argument("--voice")
    ap.add_argument("--audition")
    args = ap.parse_args()
    story = json.load(open(args.story))
    k = Kokoro()
    if args.audition:
        test = [s for s in story["sentences"] if s["id"] in ("s1", "s2", "s5", "s6", "s9")]
        for v in args.audition.split(","):
            wav, segs, _ = build(story, v, args.out_dir, k, sentences=test)
            path = os.path.join(args.out_dir, f"audition_{v}.wav")
            sf.write(path, wav, SR, subtype="PCM_16")
            print(v, f"{len(wav)/SR:.2f}s", path)
        return
    voice = args.voice or story["voice"]
    wav, segs, loud_in = build(story, voice, args.out_dir, k)
    path = os.path.join(args.out_dir, "narration.wav")
    sf.write(path, wav, SR, subtype="PCM_16")
    json.dump({"voice": voice, "sr": SR, "duration": len(wav) / SR,
               "source_lufs": loud_in, "target_lufs": -16.0, "sentences": segs},
              open(os.path.join(args.out_dir, "narration_segments.json"), "w"), indent=2,
              ensure_ascii=False)
    print(f"{voice}: {len(wav)/SR:.2f}s -> {path}")
    for s in segs:
        print(f"  {s['id']} {s['start']:6.2f}-{s['end']:6.2f}  {s['phonemes']}")


if __name__ == "__main__":
    main()
