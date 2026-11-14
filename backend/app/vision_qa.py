from __future__ import annotations

import os
from pathlib import Path

from .providers import GeminiProvider, ProviderConfig


class VisionQAGate:
    def __init__(self, config: ProviderConfig | None = None):
        self.config = config or ProviderConfig()

    def review_frames(self, frames: list[Path]) -> dict:
        if not self.config.gemini_enabled:
            return {'status': 'not_configured', 'reason': 'GEMINI_API_KEY is not set', 'frames': [str(frame) for frame in frames]}
        reviews = []
        provider = GeminiProvider(self.config)
        for frame in frames:
            reviews.append(provider.review('Review this video frame for black frames, missing assets, text clipping, caption overlap, and whether the visual matches the narration. Return concise JSON findings.', frame.read_bytes()))
        return {'status': 'completed', 'reviews': reviews}
