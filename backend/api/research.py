
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ai.agents.research_agent import ResearchAgent
from api_keys import require_api_key

router = APIRouter()
agent = ResearchAgent()

class ResearchRequest(BaseModel):
    question: str

@router.post("/research")
async def research(req: ResearchRequest, _key: dict = Depends(require_api_key)):
    return await agent.research(req.question)
