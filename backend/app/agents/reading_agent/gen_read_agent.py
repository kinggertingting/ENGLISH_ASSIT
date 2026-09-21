import json
import os
import re
from typing import List, TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel

from google import genai
from google.genai import types

from app.external_services.tavily.tavily_service import TavilySearchTool

load_dotenv()

# Input
class ReadingInput(TypedDict):
    title: str
    level: str

# Output
class ReadingOutput(BaseModel):
    title: str
    content: str
    sources: List[str]

SYSTEM_PROMPT = """
You are an English reading assistant.

Your task is to summarize information from the provided search results
into an English reading passage suitable for the user's English level.

Rules:
- Use only information supported by the search results.
- Do not invent facts.
- Make the passage clear and natural.
- Adapt the vocabulary and grammar to the user's level.
- Do not mention that you are an AI.
- Return valid JSON only.

Output format:
{
    "content": "reading passage here"
}
"""

# Reading Generator
class ReadingGenerator:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY or GOOGLE_API_KEY is not set."
            )

        self.client = genai.Client(api_key=api_key)

        self.search_tool = TavilySearchTool()
    # Build search query

    def build_search_query(self, title: str, level: str) -> str:

        prompt = f"""
Create one concise web search query for the following reading topic.

Topic:
{title}

English level:
{level}

The query should help find reliable and useful information
about the topic.

Return only the search query.
"""

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2
            )
        )

        return response.text.strip()


    
    # Search Tavily
    

    def search_from_tavily(self, query: str):

        response = self.search_tool.search(
            query=query,
            search_depth="basic",
            max_results=5
        )

        return response.get("results", [])


    
    # Build context
    

    def _build_context(self, results):

        context_blocks = []
        sources = []

        for result in results:

            title = result.get("title", "")
            content = result.get("content", "")
            url = result.get("url", "")

            context_blocks.append(
                f"Title: {title}\n"
                f"Content: {content}"
            )

            if url:
                sources.append(url)

        return "\n\n---\n\n".join(context_blocks), sources


    
    # Summarize
    

    def summarize_content(
        self,
        title: str,
        text: str,
        level: str
    ) -> str:

        prompt = f"""
Create an English reading passage about:

Topic:
{title}

English level:
{level}

Use the following search results as the factual source:

{ text }

Create a coherent reading passage suitable for the learner.

Return JSON only:
{{
    "content": "..."
}}
"""

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.5
            )
        )

        data = self._parse_json(response.text)

        return data["content"]


    
    # Main method
    

    def generate(
        self,
        title: str,
        level: str
    ) -> ReadingOutput:

        # 1. Generate search query
        query = self.build_search_query(
            title=title,
            level=level
        )

        # 2. Search web
        results = self.search_from_tavily(query)

        if not results:
            raise ValueError(
                "No search results were found."
            )

        # 3. Build context
        context, sources = self._build_context(results)

        # 4. Summarize
        content = self.summarize_content(
            title=title,
            text=context,
            level=level
        )

        # 5. Return structured output
        return ReadingOutput(
            title=title,
            content=content,
            sources=sources
        )


    
    # JSON parser
    

    @staticmethod
    def _parse_json(text: str):

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)

        if not match:
            raise ValueError(
                "Could not find valid JSON in model response."
            )

        return json.loads(match.group())