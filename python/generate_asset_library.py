#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import numpy as np
from scipy.io import wavfile

SR = 48_000
ROOT = Path('assets/library/audio')


def env(n: int, attack: float = .01, release: float = .3):
    out = np.ones(n)
    a = min(n, max(1, int(attack * SR))); r = min(n, max(1, int(release * SR)))
    out[:a] = np.linspace(0, 1, a); out[-r:] *= np.linspace(1, 0, r)
    return out


def tone(f0: float, f1: float, seconds: float, decay: float = 5):
    n = max(1, int(seconds * SR)); t = np.arange(n) / SR
    freq = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * decay) * env(n, .003, seconds * .8)


def noise(seconds: float):
    n = max(1, int(seconds * SR))
    return np.random.default_rng(23).normal(0, 1, n) * env(n, .01, seconds * .8)


def write(name: str, samples: np.ndarray):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(float(np.max(np.abs(samples))), 1e-9)
    wavfile.write(path, SR, np.clip(samples / peak * .75, -1, 1).astype(np.float32))


# Sound effects are short, synthetic, and intentionally unobtrusive under narration.
write('sfx/whoosh.wav', noise(.35) * .2 + tone(220, 1500, .35) * .35)
write('sfx/swirl.wav', tone(160, 1500, .62) * .3 + tone(440, 2100, .62) * .1)
write('sfx/click.wav', noise(.045) * .18)
write('sfx/pop.wav', tone(540, 180, .13, 28) * .7)
write('sfx/impact.wav', tone(90, 45, .32, 8) * .55)
write('sfx/riser.wav', tone(140, 1600, .8, 1.5) * .2)
success_a = tone(660, 660, .18, 8)
success_b = tone(990, 990, .28, 8)
success_mix = np.zeros(max(len(success_a), int(.08 * SR) + len(success_b)))
success_mix[:len(success_a)] += success_a
success_mix[int(.08 * SR):int(.08 * SR) + len(success_b)] += success_b
write('sfx/success.wav', success_mix)
write('sfx/sparkle.wav', tone(880, 1568, .55, 5) * .2)
write('sfx/tick.wav', tone(1250, 1250, .07, 32) * .25)

# Low, loopable procedural beds.
def bed(chords, seconds=15):
    n = int(seconds * SR); t = np.arange(n) / SR; out = np.zeros(n); bar = 2.5
    for i, start in enumerate(np.arange(0, seconds, bar)):
        a = int(start * SR); b = min(n, a + int(bar * SR)); local = t[a:b] - start
        out[a:b] += sum(np.sin(2 * np.pi * f * local) for f in chords[i % len(chords)]) / len(chords[i % len(chords)]) * .12
    return out * env(n, 1.0, 1.2)

write('music/cinematic-bed.wav', bed([(110, 165, 220), (98, 147, 196), (123, 185, 247)]))
write('music/tech-pulse.wav', bed([(110, 220), (123, 247), (98, 196)]))
write('music/suspense-drone.wav', bed([(55, 82), (49, 73), (58, 87)]))
print(f'generated audio library under {ROOT}')
