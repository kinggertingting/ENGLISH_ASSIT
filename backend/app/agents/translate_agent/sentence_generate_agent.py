import json
import os
import re
from typing import TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct")


# State

class GeneratorInput(TypedDict):
    user_id: int
    level: str
    topic: str
    difficulty: str
    weaknesses: list[str]


# Output Schema

class GeneratedSentence(BaseModel):
    vietnamese_text: str = Field(
        description="The Vietnamese sentence shown to the learner."
    )

    english_answer: str = Field(
        description="The expected natural English translation."
    )

    target_grammar: list[str] = Field(
        description="Grammar concepts intentionally practiced."
    )

    target_vocabulary: list[str] = Field(
        description="Important vocabulary used in the sentence."
    )

    explanation: str = Field(
        description="Short explanation of why the sentence practices these concepts."
    )


# Prompt

SYSTEM_PROMPT = """
You are an English-learning exercise generator.

Your task is to generate ONE Vietnamese sentence that a learner
must translate into English.

The exercise must satisfy all of these requirements:

1. The Vietnamese sentence must be original.
2. It must sound natural to a native Vietnamese speaker.
3. It must be unambiguous enough to have a clear English translation.
4. It must match the requested CEFR level.
5. It must match the requested topic.
6. It must match the requested difficulty.
7. It should intentionally practice the learner's weaknesses when possible.
8. Do not make the sentence artificially complicated just to include a weakness.
9. The expected English answer must be natural English.
10. Do not generate multiple sentences.
11. Do not include explanations outside the JSON object.

Return ONLY valid JSON using exactly this structure:

{
    "vietnamese_text": "...",
    "english_answer": "...",
    "target_grammar": ["..."],
    "target_vocabulary": ["..."],
    "explanation": "..."
}
"""


# ============================================================
# Generator
# ============================================================

class SentenceGenerator:

    def __init__(
        self,
        model=None,
        tokenizer=None,
        model_name: str = MODEL_NAME,
    ):
        self.model_name = model_name
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if self.api_key:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            if model is not None and tokenizer is not None:
                self.model = model
                self.tokenizer = tokenizer
            else:
                from app.agents.model_loader import get_shared_model_and_tokenizer
                self.model, self.tokenizer = get_shared_model_and_tokenizer(model_name)

    # ========================================================
    # Build Prompt
    # ========================================================

    def _build_prompt(
        self,
        level: str,
        topic: str,
        difficulty: str,
        weaknesses: list[str],
    ) -> str:

        weaknesses_text = (
            ", ".join(weaknesses)
            if weaknesses
            else "No specific weaknesses yet"
        )

        return f"""
Generate one English translation exercise.

Learner level:
{level}

Topic:
{topic}

Difficulty:
{difficulty}

Learner weaknesses:
{weaknesses_text}

Prioritize the learner's weaknesses naturally.

Remember:
- Vietnamese sentence only for the learner
- exactly one sentence
- natural Vietnamese
- natural English answer
- appropriate for the CEFR level
- return JSON only
"""

    # ========================================================
    # Generate
    # ========================================================

    def generate(
        self,
        level: str,
        topic: str,
        difficulty: str,
        weaknesses: list[str],
    ) -> GeneratedSentence:

        user_prompt = self._build_prompt(
            level=level,
            topic=topic,
            difficulty=difficulty,
            weaknesses=weaknesses,
        )

        # ----------------------------------------------------
        # Use Gemini API if available
        # ----------------------------------------------------

        if self.client:
            from google.genai import types
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
            response = self.client.models.generate_content(
                model=gemini_model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )
            data = self._parse_json(response.text)
            return GeneratedSentence.model_validate(data)

        # ----------------------------------------------------
        # Local Transformers Fallback
        # ----------------------------------------------------

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ]

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
        )

        import torch
        device = next(self.model.parameters()).device
        inputs = {key: value.to(device) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=384,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.05,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated_tokens = outputs[0, inputs["input_ids"].shape[1] :]
        generated_text = self.tokenizer.decode(
            generated_tokens, skip_special_tokens=True
        ).strip()

        data = self._parse_json(generated_text)
        return GeneratedSentence.model_validate(data)

    # ========================================================
    # JSON Parser
    # ========================================================

    @staticmethod
    def _parse_json(text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError(f"Could not find JSON in model output:\n{text}")

        json_text = match.group(0)
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON generated by model:\n{text}") from exc