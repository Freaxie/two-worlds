"""Original synthesized sound effects. Every effect is generated from oscillators and noise;
no samples or recordings are used. make(event) -> stereo float array (48 kHz)."""
import numpy as np
from dsp import (SR, t_axis, exp_env, env_adsr, saw, square, sine, noise, lp, hp, bp, bp_sweep, lp_sweep,
                 pan, reverb, reverb_ir, db, soft_clip)

_IR_SMALL = None


def addp(*clips):
    """sum stereo clips of different lengths (zero-padded)"""
    n = max(len(c) for c in clips)
    out = np.zeros((n, 2))
    for c in clips:
        out[: len(c)] += c
    return out


def small_room():
    global _IR_SMALL
    if _IR_SMALL is None:
        _IR_SMALL = reverb_ir(dur=0.9, decay=0.6, seed=7, bright=7000)
    return _IR_SMALL


def click(seed=0, bright=3500, thock=180, level=1.0):
    """one mechanical key click: plastic tick + low thock"""
    rng = np.random.default_rng(seed)
    n = int(0.09 * SR)
    tick = bp(noise(n, seed), bright * 0.7, bright * 1.6) * exp_env(n, 0.004)
    body = sine(thock * (0.9 + 0.2 * rng.random()), n) * exp_env(n, 0.018) * 0.5
    rattle = bp(noise(n, seed + 99), 900, 2500) * exp_env(n, 0.01) * 0.25
    return (tick * 1.2 + body + rattle) * level


def typing(dur, seed=1, soft=False):
    rng = np.random.default_rng(seed)
    out = np.zeros((int((dur + 0.2) * SR), 2))
    t = 0.0
    k = 0
    while t < dur:
        c = click(seed * 100 + k, bright=2600 if soft else 3600, thock=140 if soft else 190, level=0.5 if soft else 0.9)
        i = int(t * SR)
        p = (rng.random() - 0.5) * 0.5
        out[i:i + len(c)] += pan(c, p)[: len(out) - i]
        t += 0.065 + rng.random() * 0.07 + (0.12 if rng.random() < 0.08 else 0)
        k += 1
    return out


def key_enter():
    c = click(7, bright=3000, thock=120, level=1.3)
    c2 = np.concatenate([np.zeros(int(0.03 * SR)), click(8, bright=2400, thock=100, level=0.6)])
    m = np.zeros(len(c2)); m[: len(c)] += c; m += c2
    return pan(m, 0.05)


def crt_on():
    n = int(1.6 * SR); t = t_axis(1.6)
    thump = sine(55 * (1 + 0.6 * np.exp(-t * 18)), n) * exp_env(n, 0.12) * 0.9
    static = hp(noise(n, 3), 2500) * (exp_env(n, 0.25) * (noise(n, 4) > 1.2)) * 0.35
    crackle = bp(noise(n, 5), 1000, 6000) * exp_env(n, 0.08) * 0.4
    whine = sine(15600, n) * env_adsr(n, 0.05, 0.3, 0.6, 0.6) * db(-34)
    degauss = sine(60, n) * sine(4.5, n) * exp_env(n, 0.5) * 0.25 + sine(120, n) * exp_env(n, 0.4) * 0.12
    m = thump + static + crackle + whine + degauss
    return reverb(pan(m, 0), small_room(), 0.2)


def crt_off():
    n = int(1.3 * SR); t = t_axis(1.3)
    zap = sine(2200 * np.exp(-t * 7) + 80, n) * exp_env(n, 0.25) * 0.35
    pop = lp(noise(n, 11), 1800) * exp_env(n, 0.02) * 0.9
    hum = sine(60, n) * exp_env(n, 0.3) * 0.2
    whine = sine(15600, n) * exp_env(n, 0.15) * db(-36)
    return reverb(pan(zap + pop + hum + whine, 0), small_room(), 0.3)


def hum_bed(dur):
    """CRT/computer-room tone: mains hum harmonics + fan noise (used as a continuous bed)"""
    n = int(dur * SR)
    t = t_axis(dur)
    hum = sum(sine(60 * h, n) * a for h, a in [(1, 0.5), (2, 0.25), (3, 0.12), (5, 0.05)])
    hum *= 1 + 0.1 * sine(0.3, n)
    fan = lp(noise(n, 21), 400) * 0.6 + bp(noise(n, 22), 900, 1800) * 0.06
    return np.stack([hum * 0.5 + fan * 0.6, hum * 0.5 + lp(noise(n, 23), 400) * 0.36 + bp(noise(n, 24), 900, 1800) * 0.036], axis=1)


def error_beep():
    n = int(0.42 * SR)
    b = square(820, n) * env_adsr(n, 0.004, 0.02, 0.8, 0.05, hold=0.3)
    return reverb(pan(lp(b, 3000) * 0.45, 0), small_room(), 0.25)


def glitch(dur=0.35, seed=5, level=1.0):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    i = 0
    while i < n:
        seg = int(rng.integers(200, 2400))
        kind = rng.random()
        if kind < 0.4:
            x = noise(seg, int(rng.integers(1e6)))
            x = np.round(x * 3) / 3  # bit-crushed noise
        elif kind < 0.75:
            x = square(rng.choice([180, 440, 1250, 3100]), seg)
        else:
            x = np.zeros(seg)
        out[i:i + seg] = x[: n - i] * (0.3 + 0.7 * rng.random())
        i += seg
    out = lp(out, 7000) * exp_env(n, dur * 0.6)
    return pan(out * level * 0.5, (rng.random() - 0.5) * 0.4)


def glitch_hit():
    g = glitch(0.5, 9, 1.0)
    n = len(g)
    t = t_axis(n / SR)
    sub = sine(48 * (1 + np.exp(-t * 25)), n) * exp_env(n, 0.18) * 0.8
    return g + pan(sub, 0)


def data_burst(dur, seed=3, level=0.25):
    """modem-like FSK chatter (Bell-103-style 1070/1270 Hz tones), original pattern"""
    rng = np.random.default_rng(seed)
    baud = 300
    nb = int(dur * baud)
    bits = rng.integers(0, 2, nb)
    f = np.repeat(np.where(bits, 1270.0, 1070.0), SR // baud)
    n = len(f)
    x = sine(f, n) * env_adsr(n, 0.01, 0.05, 1, 0.05)
    x = bp(x, 600, 3000) * level
    return pan(x, 0.2)


def whoosh(dur, up=True, seed=12, level=0.7):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    curve = (300 + 3500 * t ** 1.6) if up else (3800 - 3400 * t ** 0.7)
    x = bp_sweep(noise(n, seed), curve, q=2.0)
    e = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.5
    x *= e * level * 2.2
    p = np.linspace(-0.6, 0.6, n)
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1)


def spark(seed=1, level=0.5):
    n = int(0.35 * SR)
    rng = np.random.default_rng(seed)
    x = np.zeros(n)
    for _ in range(int(rng.integers(6, 14))):
        i = int(rng.integers(0, n - 2000))
        L = int(rng.integers(60, 600))
        x[i:i + L] += noise(L, int(rng.integers(1e6))) * (0.4 + rng.random())
    x = hp(x, 1500) * exp_env(n, 0.12)
    return pan(x * level, (rng.random() - 0.5))


def riser(dur, level=0.5, seed=2):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = bp_sweep(noise(n, seed), 200 + 6000 * t ** 2, q=1.5) * t ** 2.2
    tone = sum(sine(f * (1 + 0.02 * t), n) for f in [146.8, 220.0, 293.7]) * t ** 3 * 0.15
    return reverb(pan((x * 1.5 + tone) * level, 0), small_room(), 0.35)


def ticks(dur, rate=18, freq=3200, level=0.25, seed=4):
    n = int((dur + 0.05) * SR)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    t = 0.0
    while t < dur:
        i = int(t * SR); L = int(0.006 * SR)
        out[i:i + L] += sine(freq * (0.9 + 0.2 * rng.random()), L) * exp_env(L, 0.0015)
        t += 1 / rate * (0.7 + 0.6 * rng.random())
    return pan(out * level, 0.15)


def chime(notes=(1318.5, 1975.5), level=0.35):
    n = int(1.2 * SR)
    out = np.zeros(n)
    for k, f in enumerate(notes):
        i = int(k * 0.09 * SR)
        L = n - i
        out[i:] += (sine(f, L) + 0.3 * sine(f * 2, L)) * exp_env(L, 0.25) * env_adsr(L, 0.005, 0.05, 1, 0.1)
    return reverb(pan(out * level, 0), small_room(), 0.35)


def disk_seek(dur, seed=6):
    n = int((dur + 0.1) * SR)
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    t = 0.0
    while t < dur:
        i = int(t * SR); L = int(0.03 * SR)
        out[i:i + L] += bp(noise(L, int(rng.integers(1e6))), 400, 1600) * exp_env(L, 0.006) * (0.5 + rng.random())
        t += 0.04 + rng.random() * 0.12
    whir = sine(5400, n) * 0.02 + bp(noise(n, 61), 2000, 4000) * 0.03
    return pan(out * 0.5 + whir, -0.2)


def scan_sweep(dur):
    n = int(dur * SR); t = t_axis(dur)
    f = 400 + 900 * (t / dur)
    x = sine(f, n) * (0.5 + 0.5 * sine(9, n)) * env_adsr(n, 0.1, 0.1, 0.8, 0.3) * 0.18
    return addp(reverb(pan(x, 0), small_room(), 0.3), ticks(dur, 14, 2800, 0.15))


def ping(freq=1567.98, level=0.45):
    n = int(2.0 * SR)
    x = (sine(freq, n) + 0.5 * sine(freq * 1.5, n) + 0.25 * sine(freq * 2.01, n)) * exp_env(n, 0.35)
    st = pan(x * level, 0.1)
    return reverb(st, reverb_ir(2.0, 1.8, 3, 9000), 0.35)


def packet(dur, up=True):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    f = 500 + 1500 * (t if up else 1 - t)
    x = sine(f + 40 * sine(31, n), n) * np.sin(np.pi * t) ** 0.5 * 0.2
    pulses = (sine(18, n) > 0.6) * 0.5 + 0.5
    p = np.linspace(-0.5, 0.6, n) if up else np.linspace(0.6, -0.5, n)
    x = x * pulses
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1)


def blips(count=2, freq=1800, gap=0.11, level=0.25):
    n = int((count * gap + 0.2) * SR)
    out = np.zeros(n)
    for k in range(count):
        i = int(k * gap * SR); L = int(0.06 * SR)
        out[i:i + L] += square(freq, L) * env_adsr(L, 0.002, 0.01, 0.8, 0.02)
    return pan(lp(out, 5000) * level, 0.3)


def printout(dur):
    return addp(typing(dur, seed=33, soft=False) * 0.6, ticks(dur, 40, 4200, 0.1, 9))


def holo_on():
    n = int(1.0 * SR); t = t_axis(1.0)
    x = sum(sine(f * (1 + 0.5 * np.exp(-t * 8)), n) for f in [587.3, 880, 1174.7]) * exp_env(n, 0.3) * 0.12
    sh = hp(noise(n, 71), 5000) * exp_env(n, 0.2) * 0.15
    return reverb(pan(x + sh, 0), small_room(), 0.4)


def zaps(dur, seed=8):
    rng = np.random.default_rng(seed)
    n = int((dur + 0.3) * SR)
    out = np.zeros((n, 2))
    t = 0.0
    while t < dur:
        L = int(0.14 * SR); tt = np.linspace(0, 1, L)
        f0 = rng.choice([1400, 1800, 1100])
        z = square(f0 * np.exp(-tt * 2.2), L) * exp_env(L, 0.05) * 0.18
        i = int(t * SR)
        out[i:i + L] += pan(lp(z, 4000), rng.choice([-0.6, 0.6]))[: n - i]
        t += 0.22 + rng.random() * 0.35
    return out


def modem_call(dur=0.9):
    """DTMF dial digits + 2100 Hz answer tone + scrambled carrier burst (standard signal types, original sequence)"""
    dtmf = {'3': (697, 1477), '1': (697, 1209), '0': (941, 1336), '2': (697, 1336)}
    seq = '3110'
    out = []
    for d in seq:
        L = int(0.07 * SR)
        a, b = dtmf[d]
        out.append((sine(a, L) + sine(b, L)) * 0.2 * env_adsr(L, 0.003, 0.01, 1, 0.005))
        out.append(np.zeros(int(0.03 * SR)))
    L = int(0.35 * SR)
    out.append(sine(2100, L) * 0.18 * env_adsr(L, 0.01, 0.01, 1, 0.02))
    L = int(max(0.1, dur - 0.75) * SR)
    out.append(bp(noise(L, 81), 600, 3200) * 0.2 * env_adsr(L, 0.01, 0.02, 1, 0.05))
    x = np.concatenate(out)
    return pan(x, -0.15)


def slam(i=0):
    n = int(1.4 * SR); t = t_axis(1.4)
    f0 = [52, 58, 65][i % 3]
    sub = sine(f0 * (1 + 1.5 * np.exp(-t * 30)), n) * exp_env(n, 0.3)
    metal = bp(noise(n, 90 + i), 1500, 6000) * exp_env(n, 0.04) * 0.5
    tone = sine([220, 246.9, 293.7][i % 3], n) * exp_env(n, 0.4) * 0.12
    x = soft_clip((sub * 0.9 + metal + tone) * 1.2, 1.5)
    return reverb(pan(x * 0.8, [-0.3, 0.3, 0][i % 3]), reverb_ir(1.8, 1.5, 5), 0.3)


def break_apart(dur):
    n = int(dur * SR)
    out = np.zeros((n, 2))
    rng = np.random.default_rng(17)
    for k in range(9):
        s = spark(100 + k, 0.6)
        i = int(rng.random() * (n - len(s)))
        out[i:i + len(s)] += s
    t = t_axis(dur)
    fall = sine(900 * np.exp(-t * 2.5) + 60, n) * env_adsr(n, 0.02, 0.2, 0.6, 0.4) * 0.1
    rumble = lp(noise(n, 91), 120) * env_adsr(n, 0.2, 0.3, 0.7, 0.5) * 0.6
    g = glitch(min(0.6, dur), 23, 0.8)
    out[: len(g)] += g
    return out + pan(fall + rumble, 0)


def sparkle(dur, seed=5):
    rng = np.random.default_rng(seed)
    n = int((dur + 1.0) * SR)
    out = np.zeros((n, 2))
    t = 0.0
    scale = [1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3]
    while t < dur:
        L = int(0.6 * SR)
        f = rng.choice(scale)
        x = sine(f, L) * exp_env(L, 0.12) * 0.07
        i = int(t * SR)
        out[i:i + L] += pan(x, rng.random() * 1.6 - 0.8)[: n - i]
        t += 0.05 + rng.random() * 0.12
    return reverb(out, reverb_ir(2.5, 2.2, 9, 10000), 0.45)


def final_hit():
    n = int(5.0 * SR); t = t_axis(5.0)
    sub = sine(42 * (1 + 0.8 * np.exp(-t * 6)), n) * exp_env(n, 1.1)
    body = lp(noise(n, 77), 900) * exp_env(n, 0.25) * 0.5
    chord = sum(sine(f, n) * a for f, a in [(73.4, 0.3), (110, 0.2), (146.8, 0.15), (220, 0.08), (293.7, 0.05)]) * env_adsr(n, 0.02, 0.5, 0.6, 3.0)
    x = soft_clip(sub * 0.9 + body + chord, 1.2)
    return reverb(pan(x * 0.9, 0), reverb_ir(4.0, 3.5, 13, 5000), 0.35)


def cut():
    g = glitch(0.28, 41, 0.7)
    w = whoosh(0.35, True, 43, 0.35)
    out = np.zeros((max(len(g), len(w)), 2)); out[: len(g)] += g; out[: len(w)] += w
    return out


def make(ev):
    k, d = ev['type'], ev.get('dur', 0.5)
    i = ev.get('i', 0)
    table = {
        'crt_on': lambda: crt_on(), 'crt_off': lambda: crt_off(), 'hum_start': lambda: np.zeros((10, 2)),
        'typing': lambda: typing(d, seed=int(ev['t'] * 10)), 'key': lambda: pan(click(int(ev['t'] * 100), level=1.0), 0.05),
        'key_enter': lambda: key_enter(), 'error_beep': lambda: error_beep(), 'glitch_hit': lambda: glitch_hit(),
        'glitch_small': lambda: glitch(0.25, int(ev['t'] * 7), 0.6), 'data_burst': lambda: data_burst(d, int(ev['t'])),
        'whoosh': lambda: whoosh(d, True, int(ev['t'] * 3)), 'whoosh_back': lambda: whoosh(d, False, int(ev['t'] * 3), 0.8),
        'whoosh_down': lambda: whoosh(d, False, int(ev['t'] * 5), 0.7), 'spark': lambda: spark(int(ev['t'] * 13), ev.get('gain', 0.5)),
        'reveal_swell': lambda: riser(d, 0.45, int(ev['t'])), 'revive_swell': lambda: riser(d, 0.4, 61),
        'menu_draw': lambda: ticks(d, 22, 3000, 0.2, int(ev['t'])), 'modern_chime': lambda: chime(),
        'connect': lambda: data_burst(d, int(ev['t'] * 3), 0.18), 'disk_seek': lambda: disk_seek(d, int(ev['t'])),
        'scan_sweep': lambda: scan_sweep(d), 'found_ping': lambda: ping(), 'results_tick': lambda: ticks(d, 10, 2400, 0.25),
        'modern_type': lambda: typing(d, seed=5, soft=True), 'packet_out': lambda: packet(d, True), 'packet_in': lambda: packet(d, False),
        'server_blip': lambda: blips(2, 1900), 'printout': lambda: printout(d), 'highlight': lambda: blips(1, 2400, level=0.18),
        'holo_on': lambda: holo_on(), 'lan_chatter': lambda: ticks(d, 30, 1800, 0.12, 3), 'game_zaps': lambda: zaps(d),
        'x25_call': lambda: modem_call(max(0.9, d)), 'x25_data': lambda: data_burst(d, 77, 0.14), 'slam': lambda: slam(i),
        'break_apart': lambda: break_apart(d), 'irc_ping': lambda: blips(3, 1500, 0.33, 0.16), 'sparkle': lambda: sparkle(d),
        'final_hit': lambda: final_hit(), 'cut': lambda: cut(),
    }
    return table[k]()


GAIN = {  # per-type mix level (dB)
    'typing': -11, 'key': -9, 'key_enter': -5, 'spark': -12, 'whoosh': -13, 'whoosh_back': -15, 'whoosh_down': -10,
    'reveal_swell': -9, 'revive_swell': -10, 'menu_draw': -10, 'data_burst': -12, 'connect': -14, 'cut': -9,
    'crt_on': -4, 'crt_off': -5, 'error_beep': -10, 'glitch_hit': -6, 'glitch_small': -10, 'disk_seek': -10,
    'scan_sweep': -11, 'found_ping': -9, 'results_tick': -12, 'modern_type': -10, 'modern_chime': -12,
    'packet_out': -10, 'packet_in': -10, 'server_blip': -12, 'printout': -10, 'highlight': -12, 'holo_on': -11,
    'lan_chatter': -21, 'game_zaps': -18, 'x25_call': -12, 'x25_data': -15, 'slam': -6, 'break_apart': -8,
    'irc_ping': -11, 'sparkle': -13, 'final_hit': -3,
}
