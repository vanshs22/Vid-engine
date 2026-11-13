#!/usr/bin/env python3
"""Create a local narration + procedural music + scene-transition mix."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48_000


def read_mono(path: Path) -> np.ndarray:
    source_rate, raw = wavfile.read(path)
    integer = np.issubdtype(raw.dtype, np.integer)
    data = np.asarray(raw, dtype=np.float64)
    if data.ndim == 2:
        data = data.mean(axis=1)
    if integer:
        data = data / np.iinfo(raw.dtype).max
    if source_rate != SR:
        data = signal.resample_poly(data, SR, source_rate)
    return data.astype(np.float64)


def envelope(length: int, attack: float, release: float) -> np.ndarray:
    result = np.ones(length)
    attack_count = max(1, int(attack * SR))
    release_count = max(1, int(release * SR))
    result[:attack_count] = np.linspace(0, 1, attack_count)
    result[-release_count:] *= np.linspace(1, 0, release_count)
    return result


def whoosh(duration: float = 0.35) -> np.ndarray:
    count = max(1, int(duration * SR))
    noise = np.random.default_rng(17).normal(0, 1, count)
    frequencies = np.linspace(220, 1500, count)
    tone = np.sin(2 * np.pi * np.cumsum(frequencies) / SR)
    return (noise * 0.08 + tone * 0.14) * envelope(count, 0.01, duration * 0.8)


def music(duration: float) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    chords = [(110.0, 164.8, 220.0), (98.0, 146.8, 196.0), (123.5, 185.0, 246.9), (110.0, 164.8, 220.0)]
    result = np.zeros(count)
    bar = 2.4
    for index, start in enumerate(np.arange(0, duration + bar, bar)):
        begin = int(start * SR)
        end = min(count, begin + int(bar * SR))
        if begin >= count:
            break
        local = t[begin:end] - start
        chord = chords[index % len(chords)]
        pad = sum(np.sin(2 * np.pi * frequency * local) for frequency in chord) / 3
        result[begin:end] += pad * 0.055
    result *= envelope(count, 1.0, 1.4)
    return result


def main() -> None:
    project_path = Path(sys.argv[1] if len(sys.argv) > 1 else 'projects/sample/project.json')
    data_dir = project_path.parent / 'data'
    timing = json.loads((data_dir / 'timing.json').read_text())
    duration = float(timing['durationSeconds'])
    narration = read_mono(data_dir / 'narration.wav') if (data_dir / 'narration.wav').exists() else np.zeros(int(duration * SR))
    count = max(len(narration), int((duration + 0.1) * SR))
    narration = np.pad(narration, (0, max(0, count - len(narration))))[:count]
    mix = np.zeros((count, 2), dtype=np.float64)
    voice_rms = np.sqrt(np.mean(narration**2) + 1e-12)
    if voice_rms > 0:
        narration = narration * (10 ** (-18 / 20)) / voice_rms
    mix += narration[:, None]

    settings = json.loads(project_path.read_text())
    if settings.get('music', {}).get('mode') != 'none':
        bed = music(duration + 0.1) * (10 ** (-27 / 20))
        smooth = signal.lfilter([0.01], [1, -0.99], np.abs(narration))
        smooth = np.clip(smooth / max(float(smooth.max()), 1e-9) * 4, 0, 1)
        bed *= (1 - smooth * 0.65)
        mix += bed[:, None]

    for line in timing.get('lines', []):
        start = int(float(line['startSeconds']) * SR)
        effect = whoosh()
        end = min(count, start + len(effect))
        if start < count:
            mix[start:end, 0] += effect[:end - start] * 0.09
            mix[start:end, 1] += effect[:end - start] * 0.12

    peak = max(float(np.max(np.abs(mix))), 1e-9)
    mix = mix / peak * (10 ** (-1.0 / 20))
    data_dir.mkdir(exist_ok=True)
    wavfile.write(data_dir / 'mix.wav', SR, np.clip(mix, -1, 1).astype(np.float32))
    print(f'WROTE: {data_dir / "mix.wav"} ({duration:.2f}s, narration={voice_rms > 0}, music={settings.get("music", {}).get("mode")})')


if __name__ == '__main__':
    main()
