#!/usr/bin/env python3
"""Align project words with a local faster-whisper model."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from difflib import SequenceMatcher
from pathlib import Path


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def align_words(script_words: list[str], heard: list[tuple[str, float, float]], start: float, end: float):
    expected = [normalize(word) for word in script_words]
    actual = [normalize(word[0]) for word in heard]
    times: list[tuple[float, float] | None] = [None] * len(expected)
    for block in SequenceMatcher(None, expected, actual, autojunk=False).get_matching_blocks():
        for offset in range(block.size):
            times[block.a + offset] = (heard[block.b + offset][1], heard[block.b + offset][2])
    index = 0
    while index < len(expected):
        if times[index] is not None:
            index += 1
            continue
        end_index = index
        while end_index < len(expected) and times[end_index] is None:
            end_index += 1
        low = times[index - 1][1] if index else start
        high = times[end_index][0] if end_index < len(expected) else end
        if high <= low:
            high = low + 0.05 * (end_index - index)
        weights = [max(1, len(expected[item])) for item in range(index, end_index)]
        total = sum(weights)
        cursor = low
        for item, weight in zip(range(index, end_index), weights):
            duration = (high - low) * weight / total
            times[item] = (cursor, cursor + duration * 0.9)
            cursor += duration
        index = end_index
    return times


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path)
    parser.add_argument("--audio")
    parser.add_argument("--model", default=None, help="local faster-whisper model directory; use --allow-model-download with a model name")
    parser.add_argument("--allow-model-download", action="store_true", help="allow faster-whisper to download the named model")
    args = parser.parse_args()
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("FFmpeg and FFprobe must be installed and available on PATH before alignment")
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise SystemExit("Install the optional alignment dependencies: pip install faster-whisper numpy") from exc

    model_name = args.model or "small.en"
    if not args.allow_model_download and not Path(model_name).exists():
        raise SystemExit(f"Whisper model directory not found: {model_name}. Pass a local model path with --model, or explicitly add --allow-model-download.")

    project = json.loads(args.project.read_text())
    data_dir = args.project.parent / "data"
    audio_path = Path(args.audio) if args.audio else data_dir / "narration.wav"
    if not audio_path.exists():
        raise SystemExit(f"Audio file not found: {audio_path}")
    try:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio_path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], check=True, capture_output=True).stdout
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"FFmpeg could not decode {audio_path}: {exc.stderr.decode(errors='replace').strip()}") from exc
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(np.frombuffer(raw, dtype=np.float32), word_timestamps=True, vad_filter=False)
    heard = [(word.word.strip(), word.start + 0.04, word.end) for segment in segments for word in segment.words]
    script_words = [(word, line_index) for line_index, line in enumerate(project["lines"]) for word in line["text"].split() if normalize(word)]
    try:
        duration = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio_path)], check=True, capture_output=True, text=True).stdout)
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"FFprobe could not read {audio_path}: {exc.stderr.strip()}") from exc
    aligned = align_words([word for word, _ in script_words], heard, 0.0, duration)
    words = [{"text": word, "lineId": project["lines"][line_index]["id"], "lineIndex": line_index, "startSeconds": round(start, 3), "endSeconds": round(end, 3)} for (word, line_index), (start, end) in zip(script_words, aligned)]
    lines = []
    for line_index, line in enumerate(project["lines"]):
        line_words = [word for word in words if word["lineIndex"] == line_index]
        if not line_words:
            raise SystemExit(f"Whisper produced no alignable words for line {line_index}: {line['text']}")
        lines.append({"lineId": line["id"], "lineIndex": line_index, "text": line["text"], "startSeconds": line_words[0]["startSeconds"], "endSeconds": line_words[-1]["endSeconds"]})
    timing = {"durationSeconds": round(duration, 3), "lines": lines, "words": words, "estimated": False}
    data_dir.mkdir(exist_ok=True)
    (data_dir / "timing.json").write_text(json.dumps(timing, indent=2))
    print(f"WROTE: {data_dir / 'timing.json'} ({len(words)} words)")


if __name__ == "__main__":
    main()
