"""
Neon Rain — the score.

A 24-second lo-fi loop for the rain reel, synthesised from scratch: an FM
electric piano comping syncopated minor-ninth chords, a warm bass, soft
half-time drums with swung hats, a dark pad that ducks under the kick,
and a bed of rain and vinyl crackle. One chord per shot, 60 bpm, six bars.

Usage: python3 scripts/compose_neon.py out.wav
Needs numpy. Encode for the web with
  ffmpeg -i out.wav -c:a libmp3lame -b:a 192k public/dream-assets/neon-score.mp3
"""

import sys

import numpy as np

from synth import SR, Loop, env_adsr, hall_ir, master, midi, onepole_lp, saw, write_wav

BAR = 4.0
BARS = 6
LOOP = BAR * BARS
BEAT = BAR / 4

# F minor: Fm9 – Dbmaj9 – Bbm9 – Eb9sus – Abmaj9 – C7(b9), back to Fm
CHORDS = [
    (41, [56, 60, 63, 67]),  # Fm9: Ab C Eb G
    (37, [53, 56, 60, 63]),  # Dbmaj9: F Ab C Eb
    (46, [56, 61, 65, 72]),  # Bbm9: Ab Db F C
    (39, [61, 65, 68, 70]),  # Eb9sus: Db F Ab Bb
    (44, [55, 60, 63, 70]),  # Abmaj9: G C Eb Bb
    (36, [52, 58, 61, 67]),  # C7b9: E Bb Db G
]

band = Loop(LOOP)  # keys, bass, drums
duck = Loop(LOOP)  # pad and rain: pumped by the kick


def rhodes(f, dur, vel, rng):
    """two-operator FM tine: a bright bell attack that mellows into a warm sine"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    index = (0.4 + 1.6 * vel) * np.exp(-t / 0.35) + 0.25
    tone = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 14.0 * t) * np.exp(-t / 0.03) * 0.25 * vel
    amp = np.exp(-t / (1.6 + rng.random() * 0.4)) * np.minimum(1, t / 0.003)
    sig = (tone + tine) * amp
    return onepole_lp(sig, 1800 + 3000 * vel)


def kick():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t / 0.28)) * np.minimum(1, t / 0.002)


def snare(rng):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    body = onepole_lp(noise, 5200) - onepole_lp(noise, 900)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.06)
    return (body * np.exp(-t / 0.16) * 0.9 + tone * 0.5) * np.minimum(1, t / 0.002)


def hat(rng, open_=False):
    n = int((0.3 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    hp = noise - onepole_lp(noise, 7000)
    return hp * np.exp(-t / (0.09 if open_ else 0.022))


kick_times = []
for loop in range(3):
    base = loop * LOOP
    rng = np.random.default_rng(23)  # identical loops, so the kept one wraps cleanly
    for b, (root, notes) in enumerate(CHORDS):
        start = base + b * BAR
        # ---- electric piano: syncopated comping, strummed a few ms apart
        for hit, vel in ((0.0, 0.85), (1.5, 0.6), (2.75, 0.7)):
            for k, note in enumerate(notes):
                v = vel * (0.85 + 0.15 * rng.random())
                sig = rhodes(midi(note), 2.8, v, rng)
                band.add(sig * 0.13, start + hit * BEAT + k * 0.012 + rng.normal(0, 0.004), pan=(k / 3) * 0.8 - 0.4)
        # a sparse top-line answer on the last beat of every other bar
        if b % 2 == 1:
            for j, idx in enumerate((3, 2)):
                band.add(rhodes(midi(notes[idx] + 12), 1.6, 0.55, rng) * 0.08, start + (3.25 + j * 0.25) * BEAT, pan=0.35)
        # ---- bass: root held, a pickup a fifth up before the next bar
        n = int(3.2 * SR)
        t = np.arange(n) / SR
        f = midi(root)
        e = env_adsr(n, 0.01, 0.4, 2.6)
        bass = np.tanh(1.4 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t))) * e
        band.add(onepole_lp(bass, 900) * 0.16, start)
        n = int(0.7 * SR)
        t = np.arange(n) / SR
        pick = np.sin(2 * np.pi * f * 1.5 * t) * env_adsr(n, 0.01, 0.3, 0.3)
        band.add(pick * 0.12, start + 3.5 * BEAT)
        # ---- drums, half-time: kick on 1 and the "a" of 2, snare on 3, swung sixteenth hats
        for kt in (0.0, 1.75):
            band.add(kick() * 0.34, start + kt * BEAT)
            kick_times.append(start + kt * BEAT)
        band.add(snare(rng) * 0.26, start + 2.0 * BEAT)
        if b % 3 == 2:
            band.add(snare(rng) * 0.08, start + 3.75 * BEAT)  # ghost
        for s16 in range(16):
            swing = 0.07 if s16 % 2 else 0.0
            vel = (0.5 if s16 % 4 == 0 else 0.32 if s16 % 2 == 0 else 0.22) * (0.8 + 0.4 * rng.random())
            band.add(hat(rng, open_=(s16 == 14)) * vel * 0.25, start + (s16 * 0.25 + swing) * BEAT, pan=0.25)
        # ---- dark pad
        n = int((BAR + 1.2) * SR)
        t = np.arange(n) / SR
        e = env_adsr(n, 0.9, 1.1, BAR - 0.6)
        for k, note in enumerate(notes):
            v = sum(saw(midi(note - 12) * d, t, rng.random()) for d in (0.995, 1.005)) / 2
            duck.add(onepole_lp(onepole_lp(v, 700), 900) * e * 0.05, start - 0.2, pan=(k / 3) * 1.0 - 0.5)
        # ---- a soft riser of rain into each cut
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        noise = rng.standard_normal(n)
        sweep = 600 + 4000 * (t / t[-1]) ** 2
        sw = (onepole_lp(noise, sweep) - onepole_lp(noise, sweep * 0.3)) * (t / t[-1]) ** 3
        band.add(sw * 0.045, start + BAR - 1.2)
    # ---- rain and vinyl: one continuous bed per loop, faded at its edges so loops butt cleanly
    n = int((LOOP + 0.1) * SR)
    noise = rng.standard_normal(n)
    rain = onepole_lp(noise, 3200) - onepole_lp(noise, 300)
    drops = (rng.random(n) < 0.0006) * rng.standard_normal(n) * 6
    crackle = (rng.random(n) < 0.00012) * rng.standard_normal(n) * 10
    bed = rain * 0.06 + onepole_lp(drops, 4000) * 0.05 + onepole_lp(crackle, 2500) * 0.04
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.05 * SR))
    duck.add(bed * fade, base - 0.05, pan=0.0)

# sidechain: the pad and the rain breathe out of the way of every kick
pump = np.ones(duck.total)
for kt in kick_times:
    i = int(kt * SR) % duck.total
    n = int(0.45 * SR)
    curve = 1 - 0.55 * np.exp(-np.arange(n) / (0.12 * SR))
    j = min(n, duck.total - i)
    pump[i : i + j] = np.minimum(pump[i : i + j], curve[:j])
band.L += duck.L * pump
band.R += duck.R * pump

pcm = master(band, hall_ir(29, length=2.8, decay=2.2, bright=5000), dry=0.85, wet=0.55, drive=1.8)
path = sys.argv[1] if len(sys.argv) > 1 else "neon-score.wav"
write_wav(path, pcm)
print(f"wrote {path}: {LOOP:.1f}s")
