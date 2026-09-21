import os

from app.providers.base_provider import BaseLLMProvider
from app.providers.gemini_provider import GeminiProvider


class LLMService:

    def __init__(
        self,
        provider: BaseLLMProvider | None = None,
    ):
        self.provider = (
            provider
            or self._create_provider()
        )

    @staticmethod
    def _create_provider() -> BaseLLMProvider:

        provider_name = os.getenv(
            "LLM_PROVIDER",
            "gemini"
        ).lower()

        if provider_name == "gemini":
            return GeminiProvider()

        raise ValueError(
            f"Unsupported LLM provider: {provider_name}"
        )

    def generate_text(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:

        return self.provider.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict:

        return self.provider.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temperature,
            max_tokens=max_tokens,
        )