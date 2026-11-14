from __future__ import annotations

import json
from dataclasses import dataclass

from .config import ProviderConfig
from .providers import OpenAICompatibleProvider


SYSTEM_PROMPT = """You are the Prompt Director for a professional AI video production OS.
Create production-ready, structured instructions, not vague prose. Preserve character identity,
environment continuity, camera language, lighting, safe caption margins, and sentence-to-visual relevance.
Every sentence must specify subject, action, visual evidence, camera, animation, UI choice, transition,
and audio event. Do not invent facts, statistics, screenshots, or product results. Prefer local/free tools.
Avoid repeating a generic UI panel. Use a real screen capture only when an asset exists; otherwise label a
recreated interface as illustrative. Keep prompts short enough to fit the provider budget while retaining
all production-critical constraints."""


@dataclass
class PromptDirector:
    config: ProviderConfig

    def build(self, task: str, input_data: dict) -> dict:
        provider = OpenAICompatibleProvider(self.config)
        if not provider.available():
            return {"provider": "deterministic", "system": SYSTEM_PROMPT, "task": task, "input": input_data, "instructions": self._fallback(task, input_data)}
        response = provider.generate([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({"task": task, "input": input_data})},
        ], response_format={"type": "json_object"})
        content = response["choices"][0]["message"]["content"]
        try:
            result = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError("Prompt provider returned non-JSON output") from exc
        return {"provider": "llm", "task": task, "result": result}

    def _fallback(self, task: str, data: dict) -> list[dict]:
        if task == "script":
            return [{"beat": "hook", "instruction": f"Open with a surprising, factual hook about {data.get('topic')}"}, {"beat": "body", "instruction": "Explain one mechanism per sentence with a concrete visual"}, {"beat": "close", "instruction": "End with a concise takeaway and no invented claim"}]
        if task == "scene":
            return [{"sentence": sentence, "visual": "Choose the literal subject/action visual; never reuse a generic panel", "camera": "Use a motivated push, track, or close-up", "animation": "Animate the relevant object or character"} for sentence in data.get("sentences", [])]
        return [{"instruction": "Use the approved style profile and keep every scene visually specific"}]
