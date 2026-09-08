from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from gateway.library.search_library import search_library as search_library_facade
from gateway.database.repository import SearchLogRepository

router = APIRouter(prefix="/library", tags=["Library"])

class SearchRequest(BaseModel):
    query: str = Field(..., examples=["artificial intelligence"])
    limit: int = Field(10, ge=1, le=50)
    sources: Optional[List[str]] = Field(
        None,
        description="openlibrary, loc, crossref, nasa, google_books, wikipedia, internet_archive",
    )
    enable_rerank: bool = True
    enable_dedup: bool = True

class IngestRequest(BaseModel):
    query: str
    limit: int = 10

@router.post("/search")
async def search_library(req: SearchRequest):
    norm = await search_library_facade(
        req.query,
        limit=req.limit,
        sources=req.sources,
        enable_rerank=req.enable_rerank,
        enable_dedup=req.enable_dedup,
    )
    # log
    try:
        SearchLogRepository().log(req.query, len(norm))
    except: pass
    return {"query": req.query, "count": len(norm), "results": norm}

@router.get("/search")
async def search_library_get(q: str = Query(...), limit: int = 10):
    return await search_library(SearchRequest(query=q, limit=limit))

@router.post("/ingest")
async def ingest_to_rag(req: IngestRequest):
    """Search + ingest to vector DB for RAG"""
    from gateway.workers.library_tasks import ingest_task
    task = ingest_task.delay(req.query, req.limit)
    return {"task_id": task.id, "status": "queued", "query": req.query}

@router.get("/providers")
def list_providers():
    return {
        "v1": ["openlibrary", "loc", "crossref", "nasa", "google_books", "wikipedia", "internet_archive"],
        "v2_planned": ["worldcat", "europeana", "hathitrust", "dpla", "openalex", "pubmed", "arxiv"],
        "v3_planned": ["esa", "semantic_scholar"]
    }
