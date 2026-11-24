"""Soundscape: synthesized SFX + an original ambient score, mixed under the
narration. No external audio assets.

usage: python audio.py SCENE.py OUT.wav
"""
import importlib.util
import math
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402

SR = 48000
RNG = np.random.default_rng(1771)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype="low", fs=SR, output="sos"), x)


def hp(x, lo, order=2):
    return sosfilt(butter(order, lo, btype="high", fs=SR, output="sos"), x)


def noise(n):
    return RNG.standard_normal(n)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-12
    return x / m * peak


# ------------------------------------------------------------------ SFX
def sfx_slap(light=False):
    n = int(0.22 * SR)
    crack = bp(noise(n), 700, 5200) * env_exp(n, 0.012)
    body = lp(noise(n), 260) * env_exp(n, 0.035) * 3.0
    rustle = bp(noise(n), 2500, 9000) * env_exp(n, 0.05) * 0.25
    att = np.minimum(1, np.arange(n) / (0.0008 * SR))
    x = (crack + (0.4 if light else 1.0) * body + rustle) * att
    return norm(x, 0.8 if light else 1.0)


def sfx_type():
    n = int(0.09 * SR)
    click = hp(noise(n), 2500) * env_exp(n, 0.0025)
    t = np.arange(n) / SR
    ring = np.sin(2 * math.pi * RNG.uniform(2300, 2900) * t) * env_exp(n, 0.018) * 0.25
    knock = lp(noise(n), 500) * env_exp(n, 0.01) * 1.2
    return norm(click + ring + knock, 0.7)


def sfx_scratch(dur):
    n = max(int(dur * SR), int(0.12 * SR))
    x = bp(noise(n), 1400, 6500)
    t = np.arange(n) / SR
    am = 0.65 + 0.35 * np.sin(2 * math.pi * RNG.uniform(18, 30) * t + RNG.uniform(0, 6))
    squeak = np.sin(2 * math.pi * (RNG.uniform(1100, 1700) + 60 * np.sin(2 * math.pi * 7 * t)) * t) * 0.08
    e = np.minimum(1, t / 0.02) * np.minimum(1, (t[-1] - t) / 0.05 + 0.02)
    return norm((x * am + squeak) * e, 0.55)


def sfx_whoosh(dur):
    n = int(max(dur, 0.6) * SR)
    t = np.arange(n) / SR
    x = noise(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg // 2):
        u = i / n
        fc = 300 + 2200 * math.sin(math.pi * min(1, u)) ** 1.5
        chunk = bp(x[i:i + seg], max(80, fc * 0.6), min(SR / 2 - 100, fc * 1.6), 1)
        w = np.hanning(len(chunk))
        out[i:i + len(chunk)] += chunk * w
    e = np.sin(math.pi * np.clip(t / t[-1], 0, 1)) ** 1.6
    rumble = lp(noise(n), 120) * e * 1.5
    return norm(out * e + rumble, 0.9)


def sfx_paint(dur=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = lp(noise(n), 1800) + bp(noise(n), 3000, 7000) * 0.3
    e = np.sin(math.pi * t / t[-1]) ** 0.8
    return norm(x * e, 0.7)


def sfx_flutter(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(noise(n), 900, 5000)
    am = 0.5 + 0.5 * np.abs(np.sin(2 * math.pi * (11 + 5 * np.sin(2 * math.pi * 0.7 * t)) * t))
    e = np.minimum(1, t / 0.08) * np.minimum(1, (t[-1] - t) / 0.25)
    return norm(x * am * e, 0.5)


def sfx_splat():
    n = int(0.25 * SR)
    x = lp(noise(n), 1200) * env_exp(n, 0.03) * 2 + bp(noise(n), 2000, 6000) * env_exp(n, 0.012)
    for _ in range(4):
        o = int(RNG.uniform(0.03, 0.15) * SR)
        m = int(0.02 * SR)
        x[o:o + m] += bp(noise(m), 2500, 7000) * env_exp(m, 0.004) * 0.6
    return norm(x, 0.85)


SFX_GAIN = {"slap": 1.0, "letter": 0.8, "type": 0.45, "scratch": 0.55, "circle": 0.55, "cross": 0.6,
            "trail": 0.4, "write": 0.5, "whoosh": 0.6, "paint": 0.7, "flutter": 0.45, "splat": 0.9,
            "highlight": 0.45}


def render_sfx(events, length, voice_peak):
    out = np.zeros((length, 2))
    last = {}
    for frame, kind, p in events:
        # merge same-type hits within 3 frames
        if kind in last and frame - last[kind] <= 3:
            continue
        last[kind] = frame
        dur = p.get("dur", 8) / geo.FPS
        if kind in ("slap", "letter"):
            x = sfx_slap(kind == "letter")
        elif kind == "type":
            x = sfx_type()
        elif kind in ("scratch", "circle", "trail", "write", "highlight"):
            x = sfx_scratch(dur)
        elif kind == "cross":
            x = np.concatenate([sfx_scratch(0.1), np.zeros(int(0.03 * SR)), sfx_scratch(0.1)])
        elif kind == "whoosh":
            x = sfx_whoosh(dur)
        elif kind == "paint":
            x = sfx_paint(dur)
        elif kind == "flutter":
            x = sfx_flutter(dur)
        elif kind == "splat":
            x = sfx_splat()
        else:
            continue
        x = x * SFX_GAIN.get(kind, 0.6) * 0.32 * voice_peak
        pan = RNG.uniform(-0.25, 0.25)
        i = int(frame / geo.FPS * SR)
        j = min(length, i + len(x))
        if j <= i:
            continue
        out[i:j, 0] += x[:j - i] * math.sqrt(0.5 - pan / 2) * math.sqrt(2)
        out[i:j, 1] += x[:j - i] * math.sqrt(0.5 + pan / 2) * math.sqrt(2)
    return out


# ------------------------------------------------------------------ score
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad_voice(f, n, bright=0.35):
    t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.12, 0.0, 0.13):
        ff = f * 2 ** (det / 12)
        ph = RNG.uniform(0, 2 * math.pi)
        for h in range(1, 9):
            x += np.sin(2 * math.pi * ff * h * t + ph * h) / h ** (1.6 - bright)
    return x


def pluck(f, dur, damp=0.996):
    """Karplus-Strong plucked string (a dombra-like timbre)."""
    n = int(dur * SR)
    N = int(SR / f)
    buf = RNG.uniform(-1, 1, N)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % N]
        buf[i % N] = damp * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return lp(out, 3500) * env_exp(n, dur * 0.45)


def reverb(x, secs=2.6, mix=0.35):
    n = int(secs * SR)
    ir = noise(n) * env_exp(n, secs / 5.5)
    ir = lp(ir, 5000)
    ir[0] = 0
    wet = np.stack([fftconvolve(x[:, c], ir * (1 + 0.1 * c))[:len(x)] for c in range(2)], 1)
    wet = norm(wet, np.max(np.abs(x)) + 1e-9)
    return x * (1 - mix) + wet * mix


def score(length, cuts):
    """D-dorian underscore: drone + pad chords, sparse plucked motif, march pulse
    from the exodus, resolving to D major on the payoff."""
    T = length / SR
    out = np.zeros((length, 2))
    t = np.arange(length) / SR
    # drone D2 + A2 with slow breathing
    drone = (pad_voice(midi(38), length, 0.1) * 0.6 + pad_voice(midi(45), length, 0.1) * 0.35)
    drone = lp(drone, 420) * (0.75 + 0.25 * np.sin(2 * math.pi * t / 9.0))
    out += np.stack([drone, drone], 1) * 0.5
    # chord pads, one per section
    chords = [(0.0, [50, 53, 57]), (cuts["b2"], [46, 50, 53]), (cuts["b4"], [50, 53, 57, 60]),
              (cuts["b5"], [45, 49, 52]), (cuts["b6"], [50, 53, 55, 57]), (cuts["b7"], [46, 50, 53]),
              (cuts["b8"], [50, 54, 57, 62])]
    for k, (s, notes) in enumerate(chords):
        e = chords[k + 1][0] if k + 1 < len(chords) else T
        i0, i1 = int(s * SR), min(length, int((e + 1.2) * SR))
        n = i1 - i0
        seg = sum(pad_voice(midi(m), n, 0.3) for m in notes) / len(notes)
        seg = lp(seg, 1600 if k < 6 else 2600)
        tt = np.arange(n) / SR
        env = np.minimum(1, tt / 0.9) * np.minimum(1, (tt[-1] - tt) / 1.2)
        L = seg * env * 0.42
        out[i0:i1, 0] += L
        out[i0:i1, 1] += np.roll(L, 220)
    # sparse plucked motif
    motif = [62, 65, 67, 69, 67, 65, 62, 60]
    beat = 60 / 84.0
    tt = 0.6
    k = 0
    while tt < T - 1.5:
        if RNG.random() < 0.72:
            m = motif[k % len(motif)]
            if tt > cuts["b8"]:
                m = [62, 66, 69, 74][k % 4]
            p = pluck(midi(m), 1.6) * 0.3
            i = int(tt * SR)
            j = min(length, i + len(p))
            pan = 0.3 * math.sin(k * 1.7)
            out[i:j, 0] += p[:j - i] * (1 - pan)
            out[i:j, 1] += p[:j - i] * (1 + pan)
        k += 1
        tt += beat * (2 if tt < cuts["b4"] else 1)
    # march pulse (frame-drum) through the exodus and the march
    tt = cuts["b4"]
    while tt < cuts["b8"] - 0.2:
        n = int(0.35 * SR)
        hit = lp(noise(n), 160) * env_exp(n, 0.09) * 0.9 + np.sin(2 * math.pi * 58 * np.arange(n) / SR) * env_exp(n, 0.12)
        i = int(tt * SR)
        j = min(length, i + n)
        g = 0.5 if tt < cuts["b6"] else 0.75
        out[i:j] += (hit[:j - i] * g)[:, None]
        tt += beat * 2
    out = reverb(out)
    # fade in/out
    fi = np.minimum(1, t / 1.2)
    fo = np.minimum(1, (T - t) / 1.4)
    return out * (fi * fo)[:, None]


# ------------------------------------------------------------------ mix
def voice_envelope(v, win=0.12):
    n = int(win * SR)
    e = np.sqrt(np.convolve(v ** 2, np.ones(n) / n, mode="same"))
    e = e / (e.max() + 1e-9)
    act = np.clip((e - 0.03) / 0.1, 0, 1)
    k = int(0.25 * SR)
    return np.convolve(act, np.ones(k) / k, mode="same")


def mix(scene, narration_wav, offset, out_path):
    length = int(scene.n_frames / geo.FPS * SR)
    v, sr = sf.read(narration_wav)
    v = resample_poly(v, SR, sr) if sr != SR else v
    voice = np.zeros(length)
    i0 = int(offset * SR)
    voice[i0:i0 + len(v)] = v[:max(0, length - i0)]
    vpeak = np.max(np.abs(voice))
    moves = scene.camera.moves()
    fr = lambda f: f / geo.FPS
    cuts = {"b2": fr(moves[0][0]), "b4": fr(moves[1][0]), "b5": fr(moves[1][1]) + 4.3,
            "b6": fr(moves[2][0]), "b7": fr(moves[2][1]) + 1.7, "b8": fr(moves[3][0])}
    mus = score(length, cuts)
    mus = norm(mus, 1.0)
    duck = 1 - 0.45 * voice_envelope(voice)
    vr = np.sqrt(np.mean(voice[voice != 0] ** 2))
    mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * vr * 10 ** (-13 / 20)
    mus *= duck[:, None]
    sfx = render_sfx(scene.events(), length, vpeak)
    sfx *= 0.32 * vpeak / (np.max(np.abs(sfx)) + 1e-9)     # SFX bus peaks at 0.32x the voice peak
    master = np.stack([voice, voice], 1) + mus + sfx
    # peak to -0.3 dBFS (checked on a 4x oversampled copy)
    up = resample_poly(master, 4, 1, axis=0)
    peak = np.max(np.abs(up))
    master *= 10 ** (-0.3 / 20) / peak
    sf.write(out_path, master.astype(np.float32), SR, subtype="FLOAT")
    sf.write(out_path.replace(".wav", "_music.wav"), (mus * 10 ** (-0.3 / 20) / peak).astype(np.float32), SR)
    sf.write(out_path.replace(".wav", "_sfx.wav"), (sfx * 10 ** (-0.3 / 20) / peak).astype(np.float32), SR)
    print(f"mix: {length / SR:.2f}s, voice peak {vpeak:.3f}, true-peak-normalised to -0.3 dBFS -> {out_path}")


if __name__ == "__main__":
    spec = importlib.util.spec_from_file_location("scene", sys.argv[1])
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    sc = mod.build()
    mix(sc, os.path.join(mod.ROOT, "build/master/narration.wav"), mod.OFFSET, sys.argv[2])
