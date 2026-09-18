import json
import os
import re
from typing import TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct")


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
                    temperature=0.0,
                ),
            )
            data = self._parse_json(response.text)
            return AnalysisResult.model_validate(data)

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
                max_new_tokens=512,
                do_sample=False,
                temperature=0.0,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated_tokens = outputs[0, inputs["input_ids"].shape[1] :]
        generated_text = self.tokenizer.decode(
            generated_tokens, skip_special_tokens=True
        ).strip()

        data = self._parse_json(generated_text)
        return AnalysisResult.model_validate(data)

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
            raise ValueError(f"Could not find JSON in analyzer output:\n{text}")

        json_text = match.group(0)
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON generated by analyzer:\n{text}") from exc