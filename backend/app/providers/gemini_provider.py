from google import genai

from app.providers.base_provider import BaseLLMProvider
import os
import re
import json
from typing import Optional

from google import genai
from google.genai import types

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key: raise ValueError(
                "GEMINI_API_KEY is not configured."
            )
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.client = genai.Client(api_key=self.api_key)

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

        return response.text or ""

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict:

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

        return self._parse_json(
            response.text or ""
        )

    @staticmethod
    def _parse_json(text: str) -> dict:

        text = text.strip()

        # Remove markdown code fence
        text = re.sub(
            r"^```json\s*",
            "",
            text
        )

        text = re.sub(
            r"^```\s*",
            "",
            text
        )

        text = re.sub(
            r"\s*```$",
            "",
            text
        )

        try:
            return json.loads(text)

        except json.JSONDecodeError:

            match = re.search(
                r"\{.*\}",
                text,
                re.DOTALL
            )

            if not match:
                raise ValueError(
                    "Could not parse JSON from LLM response."
                )

            try:
                return json.loads(
                    match.group(0)
                )

            except json.JSONDecodeError as exc:
                raise ValueError(
                    "Invalid JSON returned by LLM."
                ) from exc
    