#!/usr/bin/env python3
"""Final mix: processed narration + event-driven SFX + ducked score, loudness-normalised
(EBU R128 via ffmpeg loudnorm, two-pass) to -14 LUFS / -1.5 dBTP for YouTube.
Outputs audio/mix/{narration_processed,sfx_bus,music_ducked,final_mix}.wav and audio/sfx/*.wav"""
import json
import os
import re
import subprocess
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from dsp import SR, hp, lp, peaking, reverb, reverb_ir, db, place, pan
import sfx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, 'audio', *p)


def envelope(x, attack=0.01, release=0.15):
    """peak envelope follower (vectorised one-pole smoothing on |x| decimated to 1 kHz)"""
    dec = 48
    a = np.abs(x[: len(x) // dec * dec]).reshape(-1, dec).max(axis=1)
    ka, kr = np.exp(-1 / (attack * 1000)), np.exp(-1 / (release * 1000))
    e = np.zeros_like(a); v = 0.0
    for i, s in enumerate(a):
        k = ka if s > v else kr
        v = k * v + (1 - k) * s
        e[i] = v
    e = np.repeat(e, dec)
    return np.concatenate([e, np.full(len(x) - len(e), e[-1] if len(e) else 0)])


def compress(x, thresh_db=-24, ratio=3.0, makeup_db=4.0):
    env = envelope(x, 0.005, 0.12)
    lvl = 20 * np.log10(env + 1e-9)
    over = np.maximum(0, lvl - thresh_db)
    gain = -over * (1 - 1 / ratio) + makeup_db
    return x * db(gain)


def limiter(x, ceil_db=-2.0, lookahead=0.003, release=0.09):
    """look-ahead brickwall limiter (stereo-linked). Guarantees |y| <= ceiling."""
    from scipy.ndimage import maximum_filter1d
    L = int(lookahead * SR)
    # true-peak detection: 4x oversampled magnitude, folded back to the base rate
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up[: len(x) * 4].reshape(-1, 4).max(axis=1)
    pk = np.maximum(pk[: len(x)], np.abs(x).max(axis=1)[: len(pk)])
    pk = maximum_filter1d(pk, size=2 * L + 1, origin=0)
    g = np.minimum(1.0, db(ceil_db) / (pk + 1e-12))
    # release smoothing on a decimated grid, then never exceed the instantaneous requirement
    dec = 16
    gd = g[: len(g) // dec * dec].reshape(-1, dec).min(axis=1)
    k = np.exp(-1 / (release * SR / dec))
    out = np.empty_like(gd); v = 1.0
    for i, s_ in enumerate(gd):
        v = s_ if s_ < v else k * v + (1 - k) * s_
        out[i] = v
    gs = np.repeat(out, dec)
    gs = np.concatenate([gs, np.full(len(g) - len(gs), gs[-1])])
    gs = np.minimum(gs, g)
    return x * gs[:, None]


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    return json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S).group(0))


def process_voice(v):
    v = hp(v, 75, 4)
    v = peaking(v, 280, -2.0, 1.0)
    v = peaking(v, 3200, 3.0, 1.1)
    v = peaking(v, 9500, 1.5, 0.7)
    v = compress(v, -26, 3.0, 5.0)
    st = np.stack([v, v], axis=1)
    st = reverb(st, reverb_ir(0.8, 0.55, 31, 6500, 0.008), 0.07)
    return st


def main():
    meta = json.load(open(os.path.join(ROOT, 'film', 'data', 'events.json')))
    total = meta['duration']
    N = int(total * SR)

    voice, sr = sf.read(A('tts', 'narration_dry.wav'), dtype='float64')
    assert sr == SR
    voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
    voice = voice / (np.abs(voice).max() + 1e-9) * 0.5
    vproc = process_voice(voice)

    # ---- SFX bus
    os.makedirs(A('sfx'), exist_ok=True)
    bus = np.zeros((N + 6 * SR, 2))
    rendered = set()
    for ev in meta['events']:
        clip = sfx.make(ev)
        g = db(sfx.GAIN.get(ev['type'], -10))
        place(bus, clip, ev['t'], g)
        if ev['type'] not in rendered:  # keep one example of each effect as an asset
            sf.write(A('sfx', f"{ev['type']}.wav"), (clip / (np.abs(clip).max() + 1e-9) * 0.8).astype(np.float32), SR, subtype='FLOAT')
            rendered.add(ev['type'])
    bus = bus[:N]
    # room / CRT hum bed, following the scenes
    bed = sfx.hum_bed(total)
    lvl = np.full(N, -60.0)
    def seg(a, b, d):
        lvl[int(a * SR):int(b * SR)] = d
    cuts = meta['cuts']
    seg(0.3, cuts[1], -33); seg(cuts[1], cuts[5], -37); seg(cuts[5], 86.0, -43)
    lvl = lp(lvl, 2.0)
    bed *= db(lvl)[:, None]
    bus += bed

    # ---- music, ducked under the voice
    music, sr = sf.read(A('music', 'score.wav'), dtype='float64')
    music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]
    venv = envelope(voice, 0.03, 0.45)
    duck = 1 - 0.68 * np.clip(venv / (np.percentile(venv[venv > 1e-4], 60) + 1e-9), 0, 1)
    duck = lp(duck, 6)
    music_d = music * duck[:, None]
    # leave room for consonants: gentle presence dip on music and effects
    music_d = np.stack([peaking(music_d[:, c], 3000, -3.5, 0.8) for c in range(2)], axis=1)
    bus = np.stack([peaking(bus[:, c], 3200, -2.5, 0.9) for c in range(2)], axis=1)

    MUSIC_DB, SFX_DB = -15.5, -8.5
    mix = vproc * db(0) + music_d * db(MUSIC_DB) + bus * db(SFX_DB)
    os.makedirs(A('mix'), exist_ok=True)
    sf.write(A('mix', 'narration_processed.wav'), vproc.astype(np.float32), SR, subtype='FLOAT')
    sf.write(A('mix', 'sfx_bus.wav'), (bus * db(SFX_DB)).astype(np.float32), SR, subtype='FLOAT')
    sf.write(A('mix', 'music_ducked.wav'), (music_d * db(MUSIC_DB)).astype(np.float32), SR, subtype='FLOAT')
    pre = A('mix', 'premaster.wav')
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.7
    sf.write(pre, mix.astype(np.float32), SR, subtype='FLOAT')

    # ---- loudness: gain to -14 LUFS, brickwall limit, verify, then a final linear trim
    m1 = measure(pre)
    for it in range(3):
        g = -14.0 - float(m1['input_i'])
        y = limiter(mix * db(g), -2.2)
        tmp = A('mix', 'limited.wav')
        sf.write(tmp, y.astype(np.float32), SR, subtype='FLOAT')
        m2 = measure(tmp)
        if abs(float(m2['input_i']) + 14.0) < 0.3:
            break
        mix = mix * db(-14.0 - float(m2['input_i']))
    out = A('mix', 'final_mix.wav')
    sf.write(out, y.astype(np.float32), SR, subtype='PCM_24')
    os.remove(tmp)
    m3 = measure(out)
    print('premaster :', {k: m1[k] for k in ('input_i', 'input_tp', 'input_lra')})
    print('final mix :', {k: m3[k] for k in ('input_i', 'input_tp', 'input_lra')})


if __name__ == '__main__':
    main()
