import os
from typing import Optional, TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from app.services.llm_service import LLMService

load_dotenv()


# Input

class AnalyzerInput(TypedDict):
    user_id: int
    vietnamese_text: str
    english_answer: str
    user_answer: str


# Output Schema

class Mistake(BaseModel):
    mistake_type: str = Field(
        description="Broad category such as Grammar, Vocabulary, Spelling, or Word Order."
    )

    mistake_subtype: str = Field(
        description="Specific error such as Past Simple, Article, Preposition, Subject-Verb Agreement."
    )

    wrong_text: str = Field(
        description="The incorrect part of the learner's answer."
    )

    correct_text: str = Field(
        description="The corrected version."
    )

    explanation: str = Field(
        description="Short explanation of the mistake."
    )


class AnalysisResult(BaseModel):
    score: float = Field(
        ge=0,
        le=100,
        description="Translation score from 0 to 100."
    )

    is_correct: bool = Field(
        description="Whether the learner's answer is sufficiently correct."
    )

    corrected_answer: str = Field(
        description="Natural corrected English answer."
    )

    feedback: str = Field(
        description="Clear and concise feedback for the learner."
    )

    mistakes: list[Mistake] = Field(
        description="Actual mistakes found in the learner's answer."
    )


# Prompt

SYSTEM_PROMPT = """
You are an English language teacher and translation evaluator.

Your task is to evaluate a Vietnamese-to-English translation.

You will receive:

1. The original Vietnamese sentence.
2. The expected English answer.
3. The learner's English answer.

Evaluate the learner's answer carefully.

IMPORTANT RULES:

1. Focus on meaning, grammar, vocabulary, spelling, and naturalness.
2. Do NOT mark an answer wrong simply because it is different from the expected answer.
3. Different natural English expressions can be correct.
4. Do not invent mistakes.
5. Only report an actual mistake when there is a clear reason.
6. Minor stylistic differences should not automatically be treated as errors.
7. If the learner's answer is fully correct, return an empty mistakes list.
8. Identify the specific part of the learner's answer that is wrong.
9. Provide the correct form.
10. Explain the reason clearly.
11. Score the translation from 0 to 100.
12. The score should reflect the overall quality of the translation.
13. Return ONLY valid JSON.

Use this exact JSON structure:

{
    "score": 0,
    "is_correct": false,
    "corrected_answer": "...",
    "feedback": "...",
    "mistakes": [
        {
            "mistake_type": "...",
            "mistake_subtype": "...",
            "wrong_text": "...",
            "correct_text": "...",
            "explanation": "..."
        }
    ]
}
"""


# ============================================================
# Analyzer
# ============================================================

class SentenceAnalyzer:

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
        vietnamese_text: str,
        english_answer: str,
        user_answer: str,
    ) -> str:

        return f"""
Evaluate the following English translation.

Original Vietnamese:
{vietnamese_text}

Expected English answer:
{english_answer}

Learner's answer:
{user_answer}

Analyze the learner's answer carefully.

Determine:

- overall score
- whether the answer is correct
- corrected answer
- useful feedback
- actual mistakes

Do not invent mistakes.
Different natural English expressions can be accepted if they preserve
the original meaning.

Return JSON only.
"""

    # ========================================================
    # Analyze
    # ========================================================

    def analyze(
        self,
        vietnamese_text: str,
        english_answer: str,
        user_answer: str,
    ) -> AnalysisResult:

        user_prompt = self._build_prompt(
            vietnamese_text=vietnamese_text,
            english_answer=english_answer,
            user_answer=user_answer,
        )

        data = self.llm_service.generate_json(
            prompt=user_prompt,
            system_instruction=SYSTEM_PROMPT,
            temperature=0.0,
            max_tokens=512,
        )

        return AnalysisResult.model_validate(data)