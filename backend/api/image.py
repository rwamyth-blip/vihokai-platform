
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ai.agents.image_agent import ImageAgent
from api_keys import require_api_key

router = APIRouter()
agent = ImageAgent()

class ImageRequest(BaseModel):
    prompt: str
    style: str = "photorealistic"

@router.post("/image/generate")
async def gen(req: ImageRequest, _key: dict = Depends(require_api_key)):
    return await agent.generate(req.prompt, req.style)
