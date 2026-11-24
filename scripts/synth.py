"""
Shared building blocks for the reels' scores: oscillators, envelopes, a
fast time-varying lowpass, a looping stereo mix bus and a hall reverb.

A score renders three identical loops into a Loop, reverberates the whole
buffer and keeps the middle loop, so reverb tails carry across the seam
and the file loops without a click.
"""

import wave

import numpy as np

SR = 48000


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, r, sustain_len):
    """attack / hold / release envelope, lengths in seconds"""
    e = np.zeros(n)
    ia = max(1, int(a * SR))
    ih = int(sustain_len * SR)
    ir = max(1, int(r * SR))
    e[:ia] = np.linspace(0, 1, ia) ** 2
    e[ia : ia + ih] = 1
    end = min(n, ia + ih + ir)
    e[ia + ih : end] = np.linspace(1, 0, end - ia - ih) ** 1.5
    return e


def onepole_lp(x, cutoff, block=64):
    """one-pole lowpass with a cutoff (Hz) that may vary over time; solved per block in closed form"""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    y = np.empty_like(x)
    s = 0.0
    k = np.arange(block)
    for i in range(0, len(x), block):
        xb = x[i : i + block]
        m = len(xb)
        a = np.exp(-2 * np.pi * c[i] / SR)
        p = a ** (k[:m] + 1)
        # y[n] = a^(n+1) s + (1-a) sum_{j<=n} a^(n-j) x[j]
        acc = np.cumsum(xb / (a ** k[:m])) * (a ** k[:m]) * (1 - a)
        yb = acc + p * s
        y[i : i + m] = yb
        s = yb[-1]
    return y


def saw(f, t, phase=0.0):
    p = (f * t + phase) % 1.0
    # gentle band-limit: soften the edge with a cubic
    return 2 * p - 1 - (2 * p - 1) ** 3 * 0.25


class Loop:
    """A stereo bus three loops long; signals that run past the end wrap to the start"""

    def __init__(self, seconds):
        self.seconds = seconds
        self.n = int(seconds * SR)
        self.total = 3 * self.n
        self.L = np.zeros(self.total)
        self.R = np.zeros(self.total)

    def add(self, sig, start, pan=0.0, gain=1.0):
        i = int(start * SR) % self.total
        n = len(sig)
        lg = np.cos((pan + 1) * np.pi / 4) * gain
        rg = np.sin((pan + 1) * np.pi / 4) * gain
        first = min(n, self.total - i)
        self.L[i : i + first] += sig[:first] * lg
        self.R[i : i + first] += sig[:first] * rg
        if first < n:
            self.L[: n - first] += sig[first:] * lg
            self.R[: n - first] += sig[first:] * rg


def hall_ir(seed, length=4.2, decay=3.6, bright=7000):
    """stereo decorrelated noise IR, darkening as it decays"""
    rng = np.random.default_rng(seed)
    ir_len = int(length * SR)
    ti = np.arange(ir_len) / SR
    irs = []
    for _ in range(2):
        n = rng.standard_normal(ir_len) * np.exp(-ti * 6.9 / decay)
        n = onepole_lp(n, bright * np.exp(-ti * 0.9) + 400)
        n[: int(0.012 * SR)] = 0  # predelay
        irs.append(n / np.sqrt(np.sum(n**2)))
    return irs


def convolve(x, h):
    """circular FFT convolution: tails past the end of the buffer wrap to its start"""
    m = len(x) + len(h) - 1
    size = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)[:m]
    out = y[: len(x)].copy()
    out[: m - len(x)] += y[len(x) :]
    return out


def master(mix, irs, dry=0.72, wet=0.9, drive=1.6, ceiling=0.89):
    """reverb, keep the middle loop, glue and normalise; returns int16 stereo"""
    wetL = convolve(mix.L, irs[0])
    wetR = convolve(mix.R, irs[1])
    seg = slice(mix.n, 2 * mix.n)
    out = np.stack([(mix.L * dry + wetL * wet)[seg], (mix.R * dry + wetR * wet)[seg]], axis=1)
    out = np.tanh(out * drive) / drive
    out *= ceiling / np.max(np.abs(out))
    return (out * 32767).astype(np.int16)


def write_wav(path, pcm):
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
