from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.parse import quote
from urllib.request import Request, urlopen

from .config import ProviderConfig


@dataclass
class ResearchProvider:
    timeout_seconds: int = 20

    def fetch_url(self, url: str) -> dict:
        if not url.startswith(('https://', 'http://')):
            raise ValueError('Research URL must use http or https')
        request = Request(url, headers={'User-Agent': 'UniversalVideoStudio/0.1'})
        with urlopen(request, timeout=self.timeout_seconds) as response:
            body = response.read(100_000).decode('utf-8', errors='replace')
        return {'url': url, 'content': body}


@dataclass
class OpenAICompatibleProvider:
    config: ProviderConfig = ProviderConfig()
    base_url: str | None = None
    api_key: str | None = None
    default_model: str | None = None

    def available(self) -> bool:
        return bool(self.api_key or self.config.llm_enabled)

    def generate(self, messages: list[dict], model: str | None = None, response_format: dict | None = None) -> dict:
        if not self.available():
            raise RuntimeError('No LLM provider configured; use deterministic local mode')
        base_url = self.base_url or self.config.fallback_llm_base_url
        api_key = self.api_key or self.config.fallback_llm_api_key or self.config.freellmapi_api_key
        route_model = model or self.default_model or self.config.fallback_llm_model
        payload: dict = {'model': route_model, 'messages': messages, 'temperature': 0.4}
        if response_format: payload['response_format'] = response_format
        data = json.dumps(payload).encode()
        request = Request(f"{base_url.rstrip('/')}/chat/completions", data=data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'})
        with urlopen(request, timeout=self.config.provider_timeout_seconds) as response:
            return json.loads(response.read().decode())

    def text(self, messages: list[dict], model: str | None = None) -> str:
        body = self.generate(messages, model)
        return body['choices'][0]['message']['content']


@dataclass
class GeminiProvider:
    config: ProviderConfig = ProviderConfig()

    def available(self) -> bool:
        return self.config.gemini_enabled

    def review(self, prompt: str, image_bytes: bytes | None = None, mime_type: str = 'image/jpeg') -> dict:
        if not self.available():
            return {'status': 'not_configured', 'message': 'Set GEMINI_API_KEY to enable vision review'}
        parts: list[dict] = [{'text': prompt}]
        if image_bytes:
            import base64
            parts.append({'inline_data': {'mime_type': mime_type, 'data': base64.b64encode(image_bytes).decode()}})
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{quote(self.config.gemini_model)}:generateContent?key={self.config.gemini_api_key}"
        request = Request(url, data=json.dumps({'contents': [{'parts': parts}]}).encode(), headers={'Content-Type': 'application/json'})
        with urlopen(request, timeout=self.config.provider_timeout_seconds) as response:
            return json.loads(response.read().decode())


@dataclass
class VisionReviewProvider:
    config: ProviderConfig = ProviderConfig()

    def review(self, frame_paths: list[str], prompt: str) -> dict:
        if not self.config.gemini_enabled:
            return {'status': 'not_configured', 'prompt': prompt, 'frames': frame_paths, 'message': 'Set GEMINI_API_KEY to enable vision review.'}
        from pathlib import Path
        first = Path(frame_paths[0]).read_bytes() if frame_paths else None
        return GeminiProvider(self.config).review(prompt, first)


@dataclass
class LLMRouter:
    """FreeLLMAPI first, direct GPT-compatible endpoint second."""

    config: ProviderConfig

    def available(self) -> bool:
        return self.config.llm_enabled

    def generate(self, messages: list[dict], model: str | None = None, response_format: dict | None = None) -> dict:
        errors: list[str] = []
        routes = [
            (self.config.freellmapi_api_key, self.config.freellmapi_base_url, self.config.freellmapi_model),
            (self.config.fallback_llm_api_key, self.config.fallback_llm_base_url, self.config.fallback_llm_model),
        ]
        for key, base_url, route_model in routes:
            if not key: continue
            try:
                return OpenAICompatibleProvider(self.config, base_url=base_url, api_key=key, default_model=route_model).generate(messages, model or route_model, response_format)
            except Exception as exc:
                errors.append(str(exc))
        raise RuntimeError('All configured LLM routes failed: ' + ' | '.join(errors))

    def text(self, messages: list[dict], model: str | None = None) -> str:
        body = self.generate(messages, model)
        return body['choices'][0]['message']['content']
