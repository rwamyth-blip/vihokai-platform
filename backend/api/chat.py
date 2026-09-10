
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ai.orchestrator import AIOrchestrator
from api_keys import require_api_key

router = APIRouter()
orchestrator = AIOrchestrator()

class ChatRequest(BaseModel):
    question: str
    mode: str = "synthesize"
    selected_ai: str = "auto"

@router.post("/chat")
async def chat_endpoint(req: ChatRequest, _key: dict = Depends(require_api_key)):
    result = await orchestrator.run(req.question, mode=req.mode, selected_ai=req.selected_ai)
    return result
