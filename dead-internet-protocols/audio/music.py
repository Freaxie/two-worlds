#!/usr/bin/env python3
"""Original procedural score (analog-style synthesis in numpy). Each section begins on a scene
cut (cut times come from film/data/events.json), so downbeats land on the edits.
Output: audio/music/score.wav (48 kHz stereo float)."""
import json
import os
import numpy as np
import soundfile as sf
from dsp import (SR, saw, square, sine, noise, lp, hp, bp, exp_env, env_adsr, pan, reverb, reverb_ir,
                 delay_pingpong, midi, soft_clip, lp_sweep)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BPM = 84
BEAT = 60 / BPM
BAR = BEAT * 4

D = 50  # D3
# chord = list of midi notes (voicing)
CH = {
    'Dm': [50, 57, 62, 65], 'Dm9': [50, 57, 64, 65, 69], 'Bb': [46, 53, 58, 62], 'F': [53, 57, 60, 65], 'C': [48, 55, 60, 64],
    'Gm': [55, 58, 62, 67], 'Eb': [51, 58, 63, 67], 'Asus': [57, 62, 64, 69], 'Bbmaj7': [46, 53, 57, 62], 'Fadd9': [53, 60, 65, 67],
}
# per scene: chord loop (one chord per bar unless noted), layer levels, arp rate (notes per beat), filter cutoff
SECTIONS = [
    dict(chords=['Dm9'], bar=2, drone=1.0, pad=0.35, arp=0.0, bass=0.0, kick=0.0, hat=0.0, rim=0.0, blip=0.35, rate=2, cut=700),
    dict(chords=['Dm', 'Bb', 'F', 'C'], bar=1, drone=0.55, pad=0.55, arp=0.55, bass=0.3, kick=0.0, hat=0.0, rim=0.25, blip=0.25, rate=2, cut=1500),
    dict(chords=['Dm', 'Bb', 'F', 'C'], bar=1, drone=0.5, pad=0.55, arp=0.75, bass=0.6, kick=0.35, hat=0.3, rim=0.25, blip=0.2, rate=2, cut=2200),
    dict(chords=['Dm', 'Gm', 'Dm', 'Asus'], bar=1, drone=0.8, pad=0.5, arp=0.35, bass=0.25, kick=0.0, hat=0.0, rim=0.15, blip=0.15, rate=1, cut=1200),
    dict(chords=['Dm', 'Eb', 'Dm', 'C'], bar=1, drone=0.5, pad=0.45, arp=0.85, bass=0.9, kick=0.75, hat=0.55, rim=0.3, blip=0.2, rate=4, cut=2600),
    dict(chords=['Fadd9', 'C', 'Dm', 'Bbmaj7'], bar=1, drone=0.55, pad=0.8, arp=0.7, bass=0.5, kick=0.4, hat=0.3, rim=0.2, blip=0.3, rate=2, cut=3200),
    dict(chords=['Bbmaj7', 'F', 'Gm', 'Dm9'], bar=1, drone=0.8, pad=1.0, arp=0.3, bass=0.4, kick=0.0, hat=0.0, rim=0.0, blip=0.2, rate=2, cut=2000),
]


def pad_voice(freqs, n, cutoff, seed):
    rng = np.random.default_rng(seed)
    L = np.zeros(n); R = np.zeros(n)
    for f in freqs:
        for k, det in enumerate([-0.11, 0.0, 0.12]):
            ff = f * 2 ** (det / 12)
            v = saw(ff * (1 + 0.002 * sine(0.3 + rng.random() * 0.4, n)), n, phase=rng.random())
            p = (k - 1) * 0.6
            L += v * np.cos((p + 1) * np.pi / 4); R += v * np.sin((p + 1) * np.pi / 4)
    return np.stack([lp(L, cutoff), lp(R, cutoff)], axis=1) / (len(freqs) * 3)


def pluck(f, dur, cutoff, seed):
    n = int(dur * SR)
    x = saw(f, n) * 0.6 + square(f * 0.5, n, 0.3) * 0.25
    x = lp(x, cutoff) * exp_env(n, 0.09) * env_adsr(n, 0.002, 0.02, 1, 0.02)
    return x


def kick(n):
    t = np.arange(n) / SR
    return sine(50 * (1 + 2.2 * np.exp(-t * 35)), n) * exp_env(n, 0.16)


def hat(n, seed):
    return hp(noise(n, seed), 7000) * exp_env(n, 0.025)


def rim(n, seed):
    return bp(noise(n, seed), 1500, 3500) * exp_env(n, 0.012) + sine(1700, n) * exp_env(n, 0.01) * 0.3


def main():
    meta = json.load(open(os.path.join(ROOT, 'film', 'data', 'events.json')))
    cuts = meta['cuts']
    total = meta['duration']
    N = int(total * SR)
    bus_pad = np.zeros((N, 2)); bus_arp = np.zeros((N, 2)); bus_low = np.zeros((N, 2)); bus_perc = np.zeros((N, 2)); bus_fx = np.zeros((N, 2))
    t_all = np.arange(N) / SR

    # drone (continuous, level automated per section)
    drone_lvl = np.zeros(N)
    for si, S in enumerate(SECTIONS):
        a, b = int(cuts[si] * SR), int(cuts[si + 1] * SR)
        drone_lvl[a:b] = S['drone']
    drone_lvl = lp(drone_lvl, 1.5)
    drone = (sine(midi(26), N) * 0.6 + sine(midi(38), N) * 0.25 + lp(saw(midi(38) * 1.003, N), 220) * 0.2) * drone_lvl
    wind = bp(noise(N, 5), 150, 900) * 0.05 * (0.6 + 0.4 * sine(0.07, N)) * drone_lvl
    bus_low += pan(drone, 0) + np.stack([wind, np.roll(wind, 2400)], axis=1)

    rng = np.random.default_rng(42)
    for si, S in enumerate(SECTIONS):
        s0, s1 = cuts[si], cuts[si + 1]
        # final section: resolve and fade before the CRT power-off
        if si == 6:
            s1 = min(s1, 86.3)
        barlen = BAR * S['bar']
        # ---- pads (one chord per bar)
        t = s0; k = 0
        while t < s1 - 0.05:
            ch = S['chords'][k % len(S['chords'])]
            dur = min(barlen, s1 - t) + 1.2  # overlap for smooth changes
            n = int(dur * SR)
            freqs = [midi(m) for m in CH[ch]]
            v = pad_voice(freqs, n, S['cut'] * (0.8 + 0.3 * np.sin(k)), si * 100 + k)
            v *= env_adsr(n, 0.9 if si else 2.0, 0.3, 0.85, 1.2)[:, None] * S['pad']
            i0 = int(t * SR); i1 = min(N, i0 + n)
            bus_pad[i0:i1] += v[: i1 - i0]
            # ---- bass on beats
            if S['bass'] > 0:
                root = midi(CH[ch][0] - 12)
                steps = int(min(barlen, s1 - t) / (BEAT / 2))
                for st in range(steps):
                    if si in (1, 3) and st % 4:
                        continue
                    bt = t + st * BEAT / 2
                    L = int(BEAT / 2 * SR * 0.95)
                    x = (saw(root, L) * 0.5 + sine(root, L)) * exp_env(L, 0.22 if si != 4 else 0.12)
                    x = lp(x, 380 if si != 4 else 520) * S['bass'] * (1.0 if st % 2 == 0 else 0.7)
                    place_mono(bus_low, x, bt)
            # ---- arpeggio
            if S['arp'] > 0:
                notes = sorted(CH[ch]) + [m + 12 for m in sorted(CH[ch])]
                step = BEAT / S['rate']
                steps = int(min(barlen, s1 - t) / step)
                pattern = [0, 2, 1, 3, 2, 4, 3, 5] if si != 5 else [0, 2, 4, 6, 5, 3, 4, 7]
                for st in range(steps):
                    bt = t + st * step
                    m = notes[pattern[st % len(pattern)] % len(notes)] + (12 if si == 5 else 0)
                    cutoff = S['cut'] * 1.4 * (0.7 + 0.3 * np.sin(bt * 0.9))
                    if si == 2:  # archive flythrough: filter opens
                        cutoff *= 0.6 + 0.9 * np.clip((bt - 20.5) / 5.5, 0, 1)
                    x = pluck(midi(m), step * 1.6, cutoff, st) * S['arp'] * (0.9 if st % 2 == 0 else 0.65)
                    place_stereo(bus_arp, pan(x, 0.35 * np.sin(st * 1.3)), bt)
            # ---- percussion
            steps = int(min(barlen, s1 - t) / (BEAT / 2))
            for st in range(steps):
                bt = t + st * BEAT / 2
                if S['kick'] > 0 and st % 4 == 0 and not (si == 5 and st % 8):
                    place_mono(bus_perc, kick(int(0.4 * SR)) * S['kick'], bt)
                if S['hat'] > 0:
                    place_stereo(bus_perc, pan(hat(int(0.08 * SR), st) * S['hat'] * (0.5 if st % 2 == 0 else 1.0) * 0.5, 0.3), bt)
                if S['rim'] > 0 and st % 4 == 2:
                    place_stereo(bus_perc, pan(rim(int(0.06 * SR), st + si) * S['rim'] * 0.5, -0.3), bt)
            t += barlen; k += 1
        # ---- retro computer blips (random, quantised to 16ths)
        t = s0
        while t < s1 - 0.3:
            if rng.random() < S['blip'] * 0.35:
                f = midi(int(rng.choice([74, 77, 81, 86, 89, 93])))
                L = int(0.07 * SR)
                x = square(f, L, 0.25) * exp_env(L, 0.02) * 0.08
                place_stereo(bus_fx, pan(lp(x, 6000), rng.random() * 1.4 - 0.7), t)
            t += BEAT / 4

    # break before "not everything disappeared": duck everything at the end of scene 5
    gate = np.ones(N)
    b0, b1 = int(56.5 * SR), int(cuts[5] * SR)
    gate[b0:b1] = np.linspace(1, 0.08, b1 - b0)
    gate = lp(gate, 8)
    big = reverb_ir(3.8, 3.2, 21, 6000)
    pads = reverb(bus_pad, big, 0.45)
    arps = reverb(delay_pingpong(bus_arp, BEAT * 0.75, 0.45, 0.45), big, 0.3)
    fx = reverb(delay_pingpong(bus_fx, BEAT * 0.5, 0.5, 0.6), big, 0.4)
    mix = pads * 0.55 + arps * 0.42 + bus_low * 0.5 + bus_perc * 0.5 + fx * 0.6
    mix *= gate[:, None]
    # final fade (music resolves under the last card, silent at CRT power-off)
    fade = np.ones(N)
    f0, f1 = int(84.2 * SR), int(86.25 * SR)
    fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 1.5
    fade[f1:] = 0
    fade[: int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
    mix *= fade[:, None]
    mix = hp(mix.T, 25).T
    mix = soft_clip(mix * 0.9, 1.1)
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.7
    os.makedirs(os.path.join(ROOT, 'audio', 'music'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'audio', 'music', 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
    print('score written', mix.shape[0] / SR, 's')


def place_mono(bus, x, t):
    i = int(t * SR)
    if i >= len(bus):
        return
    j = min(len(bus), i + len(x))
    bus[i:j] += x[: j - i, None]


def place_stereo(bus, x, t):
    i = int(t * SR)
    if i >= len(bus):
        return
    j = min(len(bus), i + len(x))
    bus[i:j] += x[: j - i]


if __name__ == '__main__':
    main()
