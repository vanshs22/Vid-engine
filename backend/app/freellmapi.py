from __future__ import annotations

from dataclasses import dataclass

from .config import ProviderConfig
from .providers import OpenAICompatibleProvider


@dataclass
class FreeLLMAPIAdapter:
    """FreeLLMAPI adapter using its OpenAI-compatible /v1 router."""

    config: ProviderConfig

    def available(self) -> bool:
        return self.config.llm_enabled and ('freellmapi' in self.config.llm_base_url.lower() or self.config.llm_base_url.startswith('http://localhost:3001'))

    def client(self) -> OpenAICompatibleProvider:
        return OpenAICompatibleProvider(self.config)

    def health(self) -> dict:
        if not self.available():
            return {'status': 'not_configured', 'base_url': self.config.llm_base_url}
        return {'status': 'configured', 'base_url': self.config.llm_base_url, 'model': self.config.llm_model, 'routing': 'FreeLLMAPI auto/failover'}
