from typing import List, Dict, Any
from .retriever import HybridRetriever
from .context import build_context
from .llm import multi_ai_answer

class RAGEngine:
    def __init__(self):
        self.retriever = HybridRetriever()
    
    async def answer(self, question: str, search_query: str = None, history: List[Dict]=None, use_library: bool=True, top_k: int=5):
        q = search_query or question
        # Python สืบค้นจาก Library ก่อน แล้วป้อน context ให้ LLM — LLM ไม่ติดต่อห้องสมุดเอง
        docs = await self.retriever.retrieve(q, top_k=top_k, use_library=use_library, search_live=use_library)
        context = build_context(docs)
        
        llm_answer = await multi_ai_answer(question, context, history)

        return {
            "question": question,
            "answer": llm_answer,
            "sources": docs,
            "context_used": context,
            "citations": [{"title": d.get("title"), "source": d.get("source"), "url": d.get("source_url")} for d in docs]
        }
