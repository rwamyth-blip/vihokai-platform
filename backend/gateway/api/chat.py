from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from gateway.rag.engine import RAGEngine

router = APIRouter(prefix="/chat", tags=["Chat"])
rag_engine = RAGEngine()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    use_library: bool = True
    top_k: int = 5
    search_query: Optional[str] = None

@router.post("")
async def chat(req: ChatRequest):
    q = req.search_query or req.message
    result = await rag_engine.answer(
        question=req.message,
        search_query=q,
        history=[m.model_dump() for m in req.history],
        use_library=req.use_library,
        top_k=req.top_k
    )
    return result

@router.post("/library")
async def chat_with_library(req: ChatRequest):
    # force library search first
    req.use_library = True
    return await chat(req)
