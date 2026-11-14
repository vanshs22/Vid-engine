from __future__ import annotations

import json
import subprocess
from pathlib import Path


class RawFootageEditor:
    """Deterministic editing helpers for Mode B; no LLM required."""

    def probe(self, input_path: Path) -> dict:
        ffprobe = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe')
        result = subprocess.run([str(ffprobe), '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(input_path)], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)

    def extract_audio(self, input_path: Path, output_path: Path) -> None:
        ffmpeg = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')
        output_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([str(ffmpeg), '-y', '-v', 'error', '-i', str(input_path), '-ac', '1', '-ar', '16000', str(output_path)], check=True)

    def render_passthrough(self, input_path: Path, output_path: Path) -> None:
        ffmpeg = Path('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg')
        output_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([str(ffmpeg), '-y', '-v', 'error', '-i', str(input_path), '-c', 'copy', '-movflags', '+faststart', str(output_path)], check=True)

    def edit_plan(self, input_path: Path) -> dict:
        metadata = self.probe(input_path)
        video = next((stream for stream in metadata.get('streams', []) if stream.get('codec_type') == 'video'), {})
        return {'input': str(input_path), 'durationSeconds': float(metadata.get('format', {}).get('duration', 0)), 'width': video.get('width'), 'height': video.get('height'), 'segments': [{'start': 0.0, 'end': float(metadata.get('format', {}).get('duration', 0)), 'reason': 'deterministic local baseline; replace with transcript cuts'}]}
