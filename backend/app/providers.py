from __future__ import annotations

import json
import os
from dataclasses import dataclass
from urllib.request import Request, urlopen


@dataclass
class ResearchProvider:
    def fetch_url(self, url: str) -> dict:
        request = Request(url, headers={"User-Agent": "UniversalVideoStudio/0.1"})
        with urlopen(request, timeout=20) as response:
            body = response.read(100_000).decode("utf-8", errors="replace")
        return {"url": url, "content": body}


@dataclass
class OpenAICompatibleProvider:
    base_url: str = ""
    api_key_env: str = "OPENAI_API_KEY"

    def available(self) -> bool:
        return bool(self.base_url and os.environ.get(self.api_key_env))

    def generate(self, messages: list[dict], model: str) -> dict:
        if not self.available():
            raise RuntimeError("No OpenAI-compatible provider configured; use deterministic local mode")
        payload = json.dumps({"model": model, "messages": messages}).encode()
        request = Request(f"{self.base_url.rstrip('/')}/chat/completions", data=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {os.environ[self.api_key_env]}"})
        with urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode())


@dataclass
class VisionReviewProvider:
    def review(self, frame_paths: list[str], prompt: str) -> dict:
        return {"status": "not_configured", "prompt": prompt, "frames": frame_paths, "message": "Configure a vision provider adapter to enable model review."}
