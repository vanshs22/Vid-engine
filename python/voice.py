#!/usr/bin/env python3
"""Generate local Kokoro narration and line timings.

This adapter intentionally does not download models automatically. Set KOKORO_HOME or
pass --model/--voices after installing kokoro-onnx, numpy, and scipy.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

try:
    import numpy as np
    from scipy.io import wavfile
except ImportError as exc:
    raise SystemExit("Install the optional voice dependencies: pip install kokoro-onnx numpy scipy") from exc

SAMPLE_RATE = 24_000


def trim(samples: np.ndarray) -> np.ndarray:
    active = np.where(np.abs(samples) > 0.008)[0]
    if not len(active):
        return samples
    start = max(0, int(active[0] - SAMPLE_RATE * 0.01))
    end = min(len(samples), int(active[-1] + SAMPLE_RATE * 0.03))
    return samples[start:end]


def ensure_paths(args: argparse.Namespace) -> tuple[Path, Path]:
    root = Path(args.kokoro_home or os.environ.get("KOKORO_HOME", Path.home() / ".cache/universal-ai-video-studio/kokoro"))
    model = Path(args.model or root / "kokoro-v1.0.onnx")
    voices = Path(args.voices or root / "voices-v1.0.bin")
    missing = [str(path) for path in (model, voices) if not path.exists()]
    if missing:
        raise SystemExit("Missing Kokoro model files:\n" + "\n".join(missing) + "\nInstall them locally before using --provider kokoro-onnx.")
    return model, voices


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path)
    parser.add_argument("--voice")
    parser.add_argument("--speed", type=float)
    parser.add_argument("--kokoro-home")
    parser.add_argument("--model")
    parser.add_argument("--voices")
    args = parser.parse_args()

    try:
        from kokoro_onnx import Kokoro
    except ImportError as exc:
        raise SystemExit("Install the optional local voice dependencies: pip install kokoro-onnx numpy scipy") from exc

    project = json.loads(args.project.read_text())
    model_path, voices_path = ensure_paths(args)
    voice_name = args.voice or project.get("voice", {}).get("name", "am_michael")
    speed = args.speed or project.get("voice", {}).get("speed", 1.0)
    kokoro = Kokoro(str(model_path), str(voices_path))

    def speak(text: str) -> np.ndarray:
        language = "en-gb" if voice_name.startswith("b") else "en-us"
        return trim(np.asarray(kokoro.create(text, voice=voice_name, speed=speed, lang=language)[0], dtype=np.float64))

    output_dir = args.project.parent / "data"
    output_dir.mkdir(exist_ok=True)
    groups: list[list[int]] = []
    current: list[int] = []
    for index, line in enumerate(project["lines"]):
        current.append(index)
        if re.search(r'[.?!]["\')]*$', line["text"].strip()) or line.get("break") or index == len(project["lines"]) - 1:
            groups.append(current)
            current = []

    audio_parts = [np.zeros(int(float(project.get("leadSeconds", 0.45)) * SAMPLE_RATE))]
    cursor = len(audio_parts[0]) / SAMPLE_RATE
    line_timings: list[dict] = [None] * len(project["lines"])
    speech_cache: dict[str, np.ndarray] = {}

    def cached_speech(text: str) -> np.ndarray:
        if text not in speech_cache:
            speech_cache[text] = speak(text)
        return speech_cache[text]

    for group in groups:
        text = " ".join(project["lines"][index]["text"] for index in group)
        audio = speak(text)
        duration = len(audio) / SAMPLE_RATE
        estimates = np.array([max(1, len(cached_speech(project["lines"][index]["text"]))) for index in group], dtype=float)
        cuts = np.cumsum(estimates)[:-1] / estimates.sum() * duration
        boundaries = [0.0, *cuts, duration]
        for offset, index in enumerate(group):
            start = cursor + boundaries[offset]
            end = cursor + boundaries[offset + 1]
            line_timings[index] = {"lineId": project["lines"][index]["id"], "lineIndex": index, "text": project["lines"][index]["text"], "startSeconds": round(start, 3), "endSeconds": round(end, 3)}
        gap = float(project["lines"][group[-1]].get("gapSeconds", 0.3))
        audio_parts.extend([audio, np.zeros(int(gap * SAMPLE_RATE))])
        cursor += duration + gap

    outro = float(project.get("outroSeconds", 0.9))
    audio_parts.append(np.zeros(int(outro * SAMPLE_RATE)))
    audio_data = np.concatenate(audio_parts)
    audio_data = audio_data / max(np.max(np.abs(audio_data)), 1e-9) * 0.9
    wavfile.write(output_dir / "narration.wav", SAMPLE_RATE, (audio_data * 32767).astype(np.int16))
    timing = {"durationSeconds": round(cursor + float(project.get("outroSeconds", 0.9)), 3), "lines": line_timings, "words": [], "estimated": False}
    (output_dir / "lines.json").write_text(json.dumps({"duration": round(cursor + float(project.get("outroSeconds", 0.9)), 3), "lines": line_timings}, indent=2))
    print(f"WROTE: {output_dir / 'narration.wav'}")
    print(f"WROTE: {output_dir / 'lines.json'}")
    print("NEXT: run python python/align.py <project> before rendering word-synced captions")


if __name__ == "__main__":
    main()
