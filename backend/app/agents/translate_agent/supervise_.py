import os
from typing import List, Optional, TypedDict
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.agents.analyze_agent import AnalysisResult, SentenceAnalyzer
from app.agents.model_loader import get_shared_model_and_tokenizer
from app.agents.sentence_generate_agent import GeneratedSentence, SentenceGenerator

load_dotenv()


# =============================================================================
# LangGraph State Schema
# =============================================================================

class LearningState(TypedDict):
    user_id: str
    level: str
    topic: str
    difficulty: str
    weaknesses: List[str]
    vietnamese_text: Optional[str]
    english_answer: Optional[str]
    user_answer: Optional[str]
    generated_exercise: Optional[GeneratedSentence]
    analysis_result: Optional[AnalysisResult]


# =============================================================================
# LangGraph Supervisor Agent
# =============================================================================

class SupervisorAgent:
    """
    LangGraph-powered Supervisor Agent orchestrating the English learning workflow:
    1. Router Node & Conditional Edges: Routes execution flow dynamically based on state.
    2. Generator Node: Generates adaptive exercises matching level, topic, and past weaknesses.
    3. Analyzer Node: Evaluates user translation, grades score (0-100), extracts mistake subtypes.
    """

    def __init__(
        self,
        generator: Optional[SentenceGenerator] = None,
        analyzer: Optional[SentenceAnalyzer] = None,
        lazy_load: bool = True,
    ):
        self._generator = generator
        self._analyzer = analyzer
        self._graph = None
        if not lazy_load:
            self._init_graph()

    def _init_graph(self):
        if self._graph is not None:
            return

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            if self._generator is None:
                self._generator = SentenceGenerator()
            if self._analyzer is None:
                self._analyzer = SentenceAnalyzer()
        else:
            model, tokenizer = get_shared_model_and_tokenizer()
            if self._generator is None:
                self._generator = SentenceGenerator(model=model, tokenizer=tokenizer)
            if self._analyzer is None:
                self._analyzer = SentenceAnalyzer(model=model, tokenizer=tokenizer)

        # ---------------------------------------------------------------------
        # LangGraph StateGraph Definition
        # ---------------------------------------------------------------------

        builder = StateGraph(LearningState)

        # Router Node
        def router_node(state: LearningState):
            return {}

        # Conditional Edge Router
        def route_next(state: LearningState):
            if state.get("vietnamese_text") and state.get("user_answer"):
                return "analyze_translation"
            return "generate_exercise"

        # Node 1: Generator Node
        def generate_node(state: LearningState):
            exercise = self._generator.generate(
                level=state["level"],
                topic=state["topic"],
                difficulty=state.get("difficulty", "medium"),
                weaknesses=state.get("weaknesses", []),
            )
            return {
                "generated_exercise": exercise,
                "vietnamese_text": exercise.vietnamese_text,
                "english_answer": exercise.english_answer,
            }

        # Node 2: Analyzer Node
        def analyze_node(state: LearningState):
            analysis = self._analyzer.analyze(
                vietnamese_text=state["vietnamese_text"],
                english_answer=state["english_answer"],
                user_answer=state["user_answer"],
            )
            return {"analysis_result": analysis}

        # Add Nodes to Graph
        builder.add_node("router", router_node)
        builder.add_node("generate_exercise", generate_node)
        builder.add_node("analyze_translation", analyze_node)

        # Add Edges
        builder.add_edge(START, "router")
        builder.add_conditional_edges(
            "router",
            route_next,
            {
                "generate_exercise": "generate_exercise",
                "analyze_translation": "analyze_translation",
            },
        )
        builder.add_edge("generate_exercise", END)
        builder.add_edge("analyze_translation", END)

        # Compile Graph
        self._graph = builder.compile()

    @property
    def generator(self) -> SentenceGenerator:
        if self._generator is None:
            self._init_graph()
        return self._generator

    @property
    def analyzer(self) -> SentenceAnalyzer:
        if self._analyzer is None:
            self._init_graph()
        return self._analyzer

    def generate_exercise(
        self,
        level: str,
        topic: str,
        difficulty: str = "medium",
        weaknesses: Optional[List[str]] = None,
    ) -> GeneratedSentence:
        """
        Executes the LangGraph StateGraph to create a customized exercise.
        """
        self._init_graph()
        initial_state: LearningState = {
            "user_id": "",
            "level": level,
            "topic": topic,
            "difficulty": difficulty,
            "weaknesses": weaknesses or [],
            "vietnamese_text": None,
            "english_answer": None,
            "user_answer": None,
            "generated_exercise": None,
            "analysis_result": None,
        }
        output_state = self._graph.invoke(initial_state)
        return output_state["generated_exercise"]

    def evaluate_exercise(
        self,
        vietnamese_text: str,
        english_answer: str,
        user_answer: str,
    ) -> AnalysisResult:
        """
        Executes the LangGraph StateGraph to evaluate and grade the translation.
        """
        self._init_graph()
        initial_state: LearningState = {
            "user_id": "",
            "level": "",
            "topic": "",
            "difficulty": "",
            "weaknesses": [],
            "vietnamese_text": vietnamese_text,
            "english_answer": english_answer,
            "user_answer": user_answer,
            "generated_exercise": None,
            "analysis_result": None,
        }
        output_state = self._graph.invoke(initial_state)
        return output_state["analysis_result"]
