import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()


class TavilySearchTool:

    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")

        if not api_key:
            raise ValueError("TAVILY_API_KEY is not set")

        self.client = TavilyClient(api_key=api_key)

    def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
    ):
        return self.client.search(
            query=query,
            search_depth=search_depth,
            max_results=max_results,
            include_answer=False,
        )