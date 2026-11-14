from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


class EditSegment(BaseModel):
    start: float
    end: float
    reason: str = 'selected'
    broll_path: str | None = None


class EditDecisionList(BaseModel):
    source: str
    duration_seconds: float
    segments: list[EditSegment] = Field(default_factory=list)
    removed_silences: list[dict] = Field(default_factory=list)
    crop_mode: Literal['TRACK', 'GENERAL', 'SPLIT', 'SCREENCAST'] = 'TRACK'


class RawFootagePipeline:
    def __init__(self, ffmpeg: Path = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'), ffprobe: Path = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe')):
        self.ffmpeg, self.ffprobe = ffmpeg, ffprobe

    def probe(self, source: Path) -> dict:
        result = subprocess.run([str(self.ffprobe), '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(source)], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)

    def detect_silence(self, source: Path, noise_db: int = -35, minimum: float = 0.14) -> list[dict]:
        result = subprocess.run([str(self.ffmpeg), '-v', 'info', '-i', str(source), '-af', f'silencedetect=noise={noise_db}dB:d={minimum}', '-f', 'null', '-'], capture_output=True, text=True)
        text = result.stderr
        starts = [float(value) for value in re.findall(r'silence_start: ([0-9.]+)', text)]
        ends = [float(value) for value in re.findall(r'silence_end: ([0-9.]+)', text)]
        return [{'start': start, 'end': ends[index] if index < len(ends) else None, 'duration': (ends[index] - start) if index < len(ends) else None} for index, start in enumerate(starts)]

    def plan(self, source: Path, max_silence: float = 0.25, crop_mode: str = 'TRACK') -> EditDecisionList:
        metadata = self.probe(source)
        duration = float(metadata.get('format', {}).get('duration', 0))
        silences = self.detect_silence(source)
        cuts = [item for item in silences if item.get('duration') and item['duration'] > max_silence and item['start'] > 0.3 and item['end']]
        cursor = 0.0
        segments: list[EditSegment] = []
        for item in cuts:
            if item['start'] > cursor + 0.05: segments.append(EditSegment(start=cursor, end=item['start'], reason='speech_between_silences'))
            cursor = float(item['end'])
        if cursor < duration - 0.02: segments.append(EditSegment(start=cursor, end=duration, reason='tail'))
        return EditDecisionList(source=str(source), duration_seconds=duration, segments=segments or [EditSegment(start=0, end=duration, reason='fallback_full_take')], removed_silences=cuts, crop_mode=crop_mode) 

    def render(self, plan: EditDecisionList, output: Path) -> None:
        output.parent.mkdir(parents=True, exist_ok=True)
        inputs = []
        filters = []
        for index, segment in enumerate(plan.segments):
            inputs.extend(['-ss', str(segment.start), '-to', str(segment.end), '-i', plan.source])
            filters.append(f'[{index}:v]setpts=PTS-STARTPTS[v{index}];[{index}:a]asetpts=PTS-STARTPTS[a{index}]')
        concat_inputs = ''.join(f'[v{i}][a{i}]' for i in range(len(plan.segments)))
        filters.append(f'{concat_inputs}concat=n={len(plan.segments)}:v=1:a=1[v][a]')
        subprocess.run([str(self.ffmpeg), '-y', '-v', 'error', *inputs, '-filter_complex', ';'.join(filters), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-movflags', '+faststart', str(output)], check=True)
