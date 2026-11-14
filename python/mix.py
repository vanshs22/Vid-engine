#!/usr/bin/env python3
"""Create a local narration + procedural music + semantic SFX mix.

All effects are synthesized locally. No downloaded music or copyrighted samples are required.
"""
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
    attack_count = max(1, min(length, int(attack * SR)))
    release_count = max(1, min(length, int(release * SR)))
    result[:attack_count] = np.linspace(0, 1, attack_count)
    result[-release_count:] *= np.linspace(1, 0, release_count)
    return result


def tone(frequency: float, duration: float, decay: float = 6.0) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    return np.sin(2 * np.pi * frequency * t) * np.exp(-t * decay)


def whoosh(duration: float = 0.35) -> np.ndarray:
    count = max(1, int(duration * SR))
    noise = np.random.default_rng(17).normal(0, 1, count)
    frequencies = np.linspace(220, 1500, count)
    sweep = np.sin(2 * np.pi * np.cumsum(frequencies) / SR)
    return (noise * 0.08 + sweep * 0.14) * envelope(count, 0.01, duration * 0.8)


def swirl(duration: float = 0.62) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    frequency = 180 + 1000 * (t / duration) ** 2
    carrier = np.sin(2 * np.pi * np.cumsum(frequency) / SR)
    shimmer = np.sin(2 * np.pi * (frequency * 1.51) * t)
    return (carrier * 0.12 + shimmer * 0.05) * envelope(count, 0.03, duration * 0.65)


def pop(duration: float = 0.13) -> np.ndarray:
    first = tone(540, duration, 28) * 0.45
    second = tone(820, duration * 0.55, 35) * 0.16
    offset = int(0.025 * SR)
    length = max(len(first), offset + len(second))
    result = np.zeros(length)
    result[:len(first)] += first
    result[offset:offset + len(second)] += second
    return result


def click(duration: float = 0.045) -> np.ndarray:
    count = max(1, int(duration * SR))
    noise = np.random.default_rng(4).normal(0, 1, count)
    return signal.lfilter([0.4], [1, -0.6], noise) * envelope(count, 0.001, duration * 0.75) * 0.15


def tick(duration: float = 0.07) -> np.ndarray:
    return tone(1250, duration, 32) * 0.2


def impact(duration: float = 0.32) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    low = np.sin(2 * np.pi * (70 - 35 * t / duration) * t) * np.exp(-t * 9)
    return low * 0.3


def riser(duration: float = 0.8) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    frequency = 140 * (1600 / 140) ** (t / duration)
    return np.sin(2 * np.pi * np.cumsum(frequency) / SR) * envelope(count, 0.3, 0.15) * 0.15


def success() -> np.ndarray:
    first = tone(660, 0.18, 8)
    second = tone(990, 0.28, 7)
    result = np.zeros(max(len(first), int(0.08 * SR) + len(second)))
    result[:len(first)] += first
    result[int(0.08 * SR):int(0.08 * SR) + len(second)] += second
    return result


def sparkle(duration: float = 0.55) -> np.ndarray:
    result = np.zeros(int(duration * SR))
    for index, frequency in enumerate((880, 1175, 1568)):
        sound = tone(frequency, 0.28, 8) * 0.12
        start = int(index * 0.1 * SR)
        result[start:start + len(sound)] += sound[:max(0, min(len(sound), len(result) - start))]
    return result


EFFECTS = {
    'whoosh': whoosh,
    'swirl': swirl,
    'pop': pop,
    'click': click,
    'tick': tick,
    'impact': impact,
    'riser': riser,
    'success': success,
    'sparkle': sparkle,
}


def music(duration: float) -> np.ndarray:
    count = max(1, int(duration * SR))
    t = np.arange(count) / SR
    chords = [(110.0, 164.8, 220.0), (98.0, 146.8, 196.0), (123.5, 185.0, 246.9), (110.0, 164.8, 220.0)]
    result = np.zeros(count)
    bar = 2.4
    for index, start in enumerate(np.arange(0, duration + bar, bar)):
        begin = int(start * SR)
        end = min(count, begin + int(bar * SR))
        if begin >= count: break
        local = t[begin:end] - start
        result[begin:end] += sum(np.sin(2 * np.pi * frequency * local) for frequency in chords[index % len(chords)]) / 3 * 0.055
    return result * envelope(count, 1.0, 1.4)


def semantic_cues(settings: dict, timing: dict) -> list[dict]:
    cues: list[dict] = []
    scenes = settings.get('scenes', [])
    lines = timing.get('lines', [])
    for index, scene in enumerate(scenes):
        line = lines[index] if index < len(lines) else None
        if not line:
            continue
        start = float(line['startSeconds'])
        text = f"{scene.get('description', '')} {' '.join(scene.get('animation', []))}".lower()
        if index > 0:
            cues.append({'type': 'whoosh', 'time': start, 'gain': 0.45})
        if any(word in text for word in ('download', 'install', 'local')):
            cues.extend([{'type': 'click', 'time': start + 0.35, 'gain': 0.8}, {'type': 'tick', 'time': start + 0.9, 'gain': 0.55}])
        elif any(word in text for word in ('record', 'clone')):
            cues.extend([{'type': 'click', 'time': start + 0.25, 'gain': 0.8}, {'type': 'swirl', 'time': start + 0.55, 'gain': 0.45}])
        elif any(word in text for word in ('design', 'slider')):
            cues.extend([{'type': 'tick', 'time': start + 0.45, 'gain': 0.5}, {'type': 'tick', 'time': start + 0.9, 'gain': 0.5}, {'type': 'pop', 'time': start + 1.35, 'gain': 0.45}])
        elif any(word in text for word in ('generate', 'type')):
            cues.extend([{'type': 'riser', 'time': start + 0.3, 'gain': 0.7}, {'type': 'success', 'time': start + 1.4, 'gain': 0.55}])
        elif any(word in text for word in ('caption', 'sync')):
            cues.extend([{'type': 'tick', 'time': start + 0.4, 'gain': 0.45}, {'type': 'tick', 'time': start + 0.9, 'gain': 0.45}])
        elif any(word in text for word in ('permission', 'right')):
            cues.append({'type': 'sparkle', 'time': start + 0.35, 'gain': 0.4})
        else:
            cues.append({'type': 'impact', 'time': start + 0.15, 'gain': 0.25})
    return cues


def main() -> None:
    project_path = Path(sys.argv[1] if len(sys.argv) > 1 else 'projects/sample/project.json')
    data_dir = project_path.parent / 'data'
    timing = json.loads((data_dir / 'timing.json').read_text())
    settings = json.loads(project_path.read_text())
    duration = float(timing['durationSeconds'])
    narration = read_mono(data_dir / 'narration.wav') if (data_dir / 'narration.wav').exists() else np.zeros(int(duration * SR))
    count = max(len(narration), int((duration + 0.1) * SR))
    narration = np.pad(narration, (0, max(0, count - len(narration))))[:count]
    mix = np.zeros((count, 2), dtype=np.float64)
    voice_rms = np.sqrt(np.mean(narration**2) + 1e-12)
    has_voice = voice_rms > 0.00001
    if has_voice:
        narration = narration * (10 ** (-18 / 20)) / voice_rms
    mix += narration[:, None]

    if settings.get('music', {}).get('mode') != 'none':
        bed = music(duration + 0.1) * (10 ** (-27 / 20))
        smooth = signal.lfilter([0.01], [1, -0.99], np.abs(narration))
        smooth = np.clip(smooth / max(float(smooth.max()), 1e-9) * 4, 0, 1)
        bed *= (1 - smooth * 0.65)
        mix += bed[:, None]

    cues = semantic_cues(settings, timing) + [cue for scene in settings.get('scenes', []) for cue in scene.get('audioCues', [])]
    for cue in cues:
        effect_fn = EFFECTS.get(cue.get('type'))
        if not effect_fn:
            continue
        effect = effect_fn()
        start = int(float(cue.get('time', 0)) * SR)
        end = min(count, start + len(effect))
        if start < count:
            gain = float(cue.get('gain', 1.0))
            mix[start:end, 0] += effect[:end - start] * gain * 0.8
            mix[start:end, 1] += effect[:end - start] * gain

    peak = max(float(np.max(np.abs(mix))), 1e-9)
    mix = mix / peak * (10 ** (-1.0 / 20))
    data_dir.mkdir(exist_ok=True)
    wavfile.write(data_dir / 'mix.wav', SR, np.clip(mix, -1, 1).astype(np.float32))
    print(f'WROTE: {data_dir / "mix.wav"} ({duration:.2f}s, narration={has_voice}, cues={len(cues)}, music={settings.get("music", {}).get("mode")})')


if __name__ == '__main__':
    main()
