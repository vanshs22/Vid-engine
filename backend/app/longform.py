from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


CropMode = Literal['TRACK', 'GENERAL', 'SPLIT', 'SCREENCAST']


class ClipCandidate(BaseModel):
    index: int
    start_seconds: float
    end_seconds: float
    hook_score: float
    crop_mode: CropMode
    reason: str
    words: list[str] = Field(default_factory=list)


class LongFormPlan(BaseModel):
    source: str
    duration_seconds: float
    target_clip_seconds: int
    candidates: list[ClipCandidate]
    transcription_source: str
    provider: str = 'deterministic'


@dataclass
class LongFormEditor:
    ffprobe: Path = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe')
    ffmpeg: Path = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')

    def probe_duration(self, source: Path) -> float:
        result = subprocess.run([str(self.ffprobe), '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(source)], capture_output=True, text=True, check=True)
        return float(result.stdout.strip())

    def plan(self, source: Path, target_clip_seconds: int = 30, transcript: Path | None = None, split_screen: bool = False, screencast: bool = False) -> LongFormPlan:
        duration = self.probe_duration(source)
        words = self._load_words(transcript)
        windows = self._windows(duration, target_clip_seconds, words)
        candidates = []
        for index, (start, end, window_words) in enumerate(windows):
            text = ' '.join(window_words).lower()
            hook = self._hook_score(text, index, start)
            mode: CropMode = 'SCREENCAST' if screencast else 'SPLIT' if split_screen else 'TRACK' if words else 'GENERAL'
            candidates.append(ClipCandidate(index=index, start_seconds=round(start, 3), end_seconds=round(end, 3), hook_score=hook, crop_mode=mode, reason=self._reason(text, mode), words=window_words[:40]))
        candidates.sort(key=lambda item: item.hook_score, reverse=True)
        return LongFormPlan(source=str(source), duration_seconds=duration, target_clip_seconds=target_clip_seconds, candidates=candidates, transcription_source=str(transcript) if transcript else 'deterministic_windows')

    def render_clip(self, source: Path, candidate: ClipCandidate, output: Path) -> None:
        output.parent.mkdir(parents=True, exist_ok=True)
        duration = candidate.end_seconds - candidate.start_seconds
        vf = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2'
        subprocess.run([str(self.ffmpeg), '-y', '-v', 'error', '-ss', str(candidate.start_seconds), '-i', str(source), '-t', str(duration), '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-movflags', '+faststart', str(output)], check=True)

    def _load_words(self, transcript: Path | None) -> list[str]:
        if not transcript or not transcript.exists(): return []
        payload = json.loads(transcript.read_text())
        raw = payload.get('words', payload) if isinstance(payload, dict) else payload
        return [str(item.get('text', item.get('word', '')) if isinstance(item, dict) else item) for item in raw if str(item.get('text', item.get('word', '')) if isinstance(item, dict) else item).strip()]

    def _windows(self, duration: float, length: int, words: list[str]):
        windows = []
        step = max(10, length - 5)
        for start in range(0, max(1, int(duration)), step):
            end = min(duration, start + length)
            if end - start < 8: continue
            window_words = words[int(len(words) * start / max(duration, 1)):int(len(words) * end / max(duration, 1))] if words else []
            windows.append((float(start), float(end), window_words))
        return windows or [(0.0, duration, words)]

    def _hook_score(self, text: str, index: int, start: float) -> float:
        signals = sum(1 for token in ('why', 'how', 'secret', 'mistake', 'never', 'truth', 'cost', 'free', 'problem') if re.search(rf'\b{token}\b', text))
        return round(signals * 2 + (2 if index == 0 or start < 5 else 0) + min(len(text) / 180, 2), 3)

    def _reason(self, text: str, mode: CropMode) -> str:
        return f'{mode} layout; hook signals and transcript window selected for: {text[:120]}'
