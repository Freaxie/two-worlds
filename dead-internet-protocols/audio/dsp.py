"""Small DSP toolkit (numpy/scipy) shared by the music, SFX and mix scripts. 48 kHz float."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, hold=None):
    """ADSR over n samples; hold = sustain duration (s) before release, default fills."""
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    H = max(0, n - A - D - R) if hold is None else int(hold * SR)
    e = np.concatenate([np.linspace(0, 1, max(A, 1)), np.linspace(1, s, max(D, 1)), np.full(H, s), np.linspace(s, 0, max(R, 1))])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def exp_env(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def saw(freq, n, phase=0.0):
    """Band-limited-ish saw via polyBLEP. freq may be scalar or array."""
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    # polyBLEP correction
    m1 = ph < dt
    tt = ph[m1] / dt[m1]
    y[m1] -= tt + tt - tt * tt - 1
    m2 = ph > 1 - dt
    tt = (ph[m2] - 1) / dt[m2]
    y[m2] -= tt * tt + tt + tt + 1
    return y


def square(freq, n, pw=0.5):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph = np.cumsum(f / SR) % 1.0
    return np.where(ph < pw, 1.0, -1.0)


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * (phase + np.cumsum(f / SR)))


def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)


def lp_sweep(x, fcs, block=256, order=2):
    """Time-varying low-pass: fcs is an array (per sample) of cutoff frequencies."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        fc = float(np.clip(fcs[min(i, len(fcs) - 1)], 30, SR * 0.45))
        sos = butter(order, fc, 'low', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


def bp_sweep(x, fcs, q=4.0, block=256):
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        fc = float(np.clip(fcs[min(i, len(fcs) - 1)], 60, SR * 0.4))
        bw = fc / q
        sos = butter(1, [max(30, fc - bw / 2), min(SR * 0.45, fc + bw / 2)], 'band', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


def peaking(x, f0, gain_db, q=1.0):
    """RBJ peaking EQ."""
    from scipy.signal import lfilter
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def reverb_ir(dur=2.5, decay=2.2, seed=1, bright=6000, predelay=0.012):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    ir = np.zeros((n, 2))
    e = np.exp(-np.arange(n) / (decay / 6.9 * SR))
    for c in range(2):
        x = rng.standard_normal(n) * e
        ir[:, c] = lp(x, bright)
    pd = int(predelay * SR)
    ir = np.vstack([np.zeros((pd, 2)), ir])
    return ir / np.sqrt((ir ** 2).sum(axis=0).mean())


def reverb(stereo, ir, mix=0.25):
    wet = np.stack([fftconvolve(stereo[:, c], ir[:, c])[:len(stereo)] for c in range(2)], axis=1)
    return stereo * (1 - mix) + wet * mix


def pan(mono, p=0.0):
    """equal-power pan, p in [-1, 1]"""
    th = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(th), mono * np.sin(th)], axis=1)


def delay_pingpong(stereo, time=0.375, fb=0.4, mix=0.3):
    d = int(time * SR)
    out = stereo.copy()
    # a few explicit alternating taps (cheap and stable)
    taps = np.zeros_like(stereo)
    g = 1.0
    for k in range(1, 6):
        off = d * k
        if off >= len(stereo):
            break
        g *= fb
        src = stereo[:-off]
        if k % 2:
            taps[off:, 0] += src[:, 1] * g
            taps[off:, 1] += src[:, 0] * g * 0.6
        else:
            taps[off:, 1] += src[:, 0] * g
            taps[off:, 0] += src[:, 1] * g * 0.6
    return out + taps * mix


def db(x):
    return 10 ** (x / 20)


def place(track, clip, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(track):
        return
    if clip.ndim == 1:
        clip = np.stack([clip, clip], axis=1)
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i] * gain


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)
