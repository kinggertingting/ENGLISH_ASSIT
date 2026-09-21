from abc import ABC, abstractmethod
from typing import Optional


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        pass

    @abstractmethod
    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict:
        pass