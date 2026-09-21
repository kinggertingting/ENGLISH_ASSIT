import os
from typing import Optional, TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from app.services.llm_service import LLMService

load_dotenv()


# State

class GeneratorInput(TypedDict):
    user_id: int
    level: str
    topic: str
    difficulty: str
    weaknesses: list[str]
    recent_sentences: Optional[list[str]]


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
        llm_service: Optional[LLMService] = None,
        model=None,
        tokenizer=None,
    ):
        if llm_service:
            self.llm_service = llm_service
        elif model is not None and tokenizer is not None:
            from app.services.llm_service import LocalTransformersLLMProvider
            provider = LocalTransformersLLMProvider(model=model, tokenizer=tokenizer)
            self.llm_service = LLMService(provider=provider)
        else:
            self.llm_service = LLMService()

    # ========================================================
    # Build Prompt
    # ========================================================

    def _build_prompt(
        self,
        level: str,
        topic: str,
        difficulty: str,
        weaknesses: list[str],
        recent_sentences: Optional[list[str]] = None,
    ) -> str:

        weaknesses_text = (
            ", ".join(weaknesses)
            if weaknesses
            else "No specific weaknesses yet"
        )
        recent_text = (
            "\n".join([f"- {s}" for s in recent_sentences])
            if recent_sentences
            else "None"
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

Recently practiced sentences (DO NOT repeat these or their exact structures):
{recent_text}

Prioritize the learner's weaknesses naturally while keeping the sentence unique.

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
        recent_sentences: Optional[list[str]] = None,
    ) -> GeneratedSentence:

        user_prompt = self._build_prompt(
            level=level,
            topic=topic,
            difficulty=difficulty,
            weaknesses=weaknesses,
            recent_sentences=recent_sentences,
        )

        data = self.llm_service.generate_json(
            prompt=user_prompt,
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
            max_tokens=1024,
        )

        return GeneratedSentence.model_validate(data)