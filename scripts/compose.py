"""
Blue Hour — the score.

Synthesises the reel's 24-second ambient loop from scratch (no samples):
warm detuned pads, a felt-piano arpeggio, a sub bass, a high shimmer and a
hall reverb, with a soft swell into every cut. One chord per shot, 60 bpm,
six bars; the loop wraps seamlessly because the middle of three rendered
loops is kept, so reverb tails carry across the seam.

Usage: python3 scripts/compose.py out.wav
Needs numpy. Encode with ffmpeg for the web, e.g.
  ffmpeg -i out.wav -c:a libmp3lame -b:a 192k public/dream-assets/score.mp3
"""

import sys

import numpy as np

from synth import SR, Loop, env_adsr, hall_ir, master, midi, onepole_lp, saw, write_wav

BAR = 4.0  # seconds per bar = one shot
BARS = 6
LOOP = BAR * BARS
rng = np.random.default_rng(7)


# D major dream-pop: Dmaj9 – Bm11 – Gmaj9#11 – Em9 – Bm9 – Asus2
CHORDS = [
    (50, [62, 66, 69, 73, 76]),  # D: D F# A C# E
    (47, [59, 62, 66, 69, 76]),  # Bm11: B D F# A E
    (43, [59, 62, 66, 69, 73]),  # Gmaj9#11 voiced B D F# A C#
    (52, [59, 62, 66, 67, 71]),  # Em9: B D F# G B
    (47, [62, 66, 69, 73, 74]),  # Bm9: D F# A C# D
    (45, [61, 64, 69, 71, 76]),  # Asus2/6: C# E A B E
]

mix = Loop(LOOP)
add = mix.add

for loop in range(3):
    base = loop * LOOP
    rng = np.random.default_rng(7)  # identical loops, so the kept one wraps cleanly
    for b, (root, notes) in enumerate(CHORDS):
        start = base + b * BAR
        # ---- pad: detuned saws, slow filter bloom, legato overlap
        dur = BAR + 1.6
        n = int(dur * SR)
        t = np.arange(n) / SR
        e = env_adsr(n, 1.1, 1.4, BAR - 0.9)
        for k, note in enumerate(notes):
            f = midi(note - 12 if k < 2 else note)
            v = sum(saw(f * d, t, rng.random()) for d in (0.996, 1.0, 1.0045)) / 3
            cutoff = 600 + 1400 * (0.5 - 0.5 * np.cos(np.minimum(t / BAR, 1) * np.pi)) + 200 * np.sin(t * 0.7 + k)
            v = onepole_lp(onepole_lp(v, cutoff), cutoff * 1.4)
            add(v * e * 0.055, start - 0.3, pan=(k / (len(notes) - 1)) * 1.2 - 0.6)
        # ---- sub bass
        n = int((BAR + 0.8) * SR)
        t = np.arange(n) / SR
        e = env_adsr(n, 0.25, 0.8, BAR - 0.25)
        f = midi(root - 12)
        sub = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t))) * e
        add(sub * 0.16, start)
        # ---- felt piano arpeggio: eighth notes with a few rests for air
        pattern = [0, 2, 4, 1, 3, 4, 2, None] if b % 2 == 0 else [4, 2, 3, 1, None, 2, 4, 3]
        for s, idx in enumerate(pattern):
            if idx is None:
                continue
            note = notes[idx] + 12
            f = midi(note)
            n = int(2.6 * SR)
            t = np.arange(n) / SR
            vel = 0.7 + 0.3 * rng.random()
            tone = np.zeros(n)
            for h, (amp, dec) in enumerate([(1, 1.3), (0.45, 0.8), (0.22, 0.5), (0.1, 0.35)], start=1):
                inh = 1 + 0.0004 * h * h
                tone += amp * np.sin(2 * np.pi * f * h * inh * t) * np.exp(-t / dec)
            tone *= np.minimum(1, t / 0.006)  # soft felt attack
            tone = onepole_lp(tone, 2600 + 1800 * vel)
            add(tone * 0.07 * vel, start + s * 0.5 + rng.normal(0, 0.006), pan=0.45 if s % 2 else -0.45)
        # ---- shimmer: two octaves up, slow tremolo
        n = int((BAR + 1.0) * SR)
        t = np.arange(n) / SR
        e = env_adsr(n, 1.6, 1.2, BAR - 1.4)
        sh = sum(np.sin(2 * np.pi * midi(notes[i] + 24) * t + i) for i in (1, 3)) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.5 * t))
        add(sh * e * 0.012, start + 0.2, pan=0.3 * (1 if b % 2 else -1))
        # ---- swell into the cut: filtered noise rising over the last beat
        n = int(1.1 * SR)
        t = np.arange(n) / SR
        noise = rng.standard_normal(n)
        sweep = 400 + 5000 * (t / t[-1]) ** 2
        sw = onepole_lp(noise, sweep) - onepole_lp(noise, sweep * 0.25)
        sw *= (t / t[-1]) ** 3
        add(sw * 0.05, start + BAR - 1.1, pan=0.0)
        # ---- soft low bloom on the downbeat
        n = int(1.4 * SR)
        t = np.arange(n) / SR
        boom = np.sin(2 * np.pi * (58 - 18 * t) * t) * np.exp(-t / 0.35) * np.minimum(1, t / 0.01)
        add(boom * 0.12, start)

# hall reverb, then keep the middle loop so its start carries the previous loop's tails
pcm = master(mix, hall_ir(11))
path = sys.argv[1] if len(sys.argv) > 1 else "score.wav"
write_wav(path, pcm)
print(f"wrote {path}: {LOOP:.1f}s")
