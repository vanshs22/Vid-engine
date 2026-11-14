from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderConfig:
    # FreeLLMAPI is first. The direct GPT-compatible endpoint is fallback.
    freellmapi_base_url: str = os.getenv('FREELLMAPI_BASE_URL', 'http://localhost:3001/v1')
    freellmapi_api_key: str | None = os.getenv('FREELLMAPI_API_KEY')
    freellmapi_model: str = os.getenv('FREELLMAPI_MODEL', 'auto')
    fallback_llm_base_url: str = os.getenv('UVS_LLM_BASE_URL', os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1'))
    fallback_llm_api_key: str | None = os.getenv('UVS_LLM_API_KEY', os.getenv('OPENAI_API_KEY'))
    fallback_llm_model: str = os.getenv('UVS_LLM_MODEL', os.getenv('OPENAI_MODEL', 'gpt-4o-mini'))
    gemini_api_key: str | None = os.getenv('GEMINI_API_KEY')
    gemini_model: str = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    provider_timeout_seconds: int = int(os.getenv('UVS_PROVIDER_TIMEOUT', '120'))

    @property
    def llm_enabled(self) -> bool:
        return bool(self.freellmapi_api_key or self.fallback_llm_api_key)

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key)
