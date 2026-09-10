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
        description="01 WEB: searxng | 02 LOCAL: local (Qdrant) | 03 LIBRARY: openlibrary, loc, crossref, nasa, google_books, wikipedia, internet_archive | 04 AI: firecrawl (ว่าง = QueryRouter จัดตาม MESH)",
    )
    enable_rerank: bool = True
    enable_dedup: bool = True
    target_lang: Optional[str] = Field(
        None,
        description="เช่น th/en/ja — ถ้าระบุ จะแปล title+description ด้วย AI (translate.py) ใส่ title_translated/description_translated",
    )

class IngestRequest(BaseModel):
    query: str
    limit: int = 10

@router.post("/search")
async def search_library(req: SearchRequest):
    import asyncio as _asyncio
    import hashlib as _hashlib
    import time as _time

    # L1: result cache แบบ vihok-search-v1 (in-memory + TTL 10 นาที)
    # key ครอบ query+limit+sources+flags+lang กันชนข้ามเงื่อนไข
    _rcache: dict = getattr(search_library, "_result_cache", None) or {}
    setattr(search_library, "_result_cache", _rcache)

    def _rkey() -> str:
        raw = f"{req.query}|{req.limit}|{sorted(req.sources or [])}|{req.enable_rerank}|{req.enable_dedup}|{req.target_lang}"
        return "res:" + _hashlib.md5(raw.encode()).hexdigest()

    _rk = _rkey()
    _hit = _rcache.get(_rk)
    if _hit and (_time.time() - _hit["ts"]) < 600:
        return {**_hit["payload"], "cached": True}

    norm = await search_library_facade(
        req.query,
        limit=req.limit,
        sources=req.sources,
        enable_rerank=req.enable_rerank,
        enable_dedup=req.enable_dedup,
    )
    # L2: confidence routing แบบ search-first — score สูงพอส่งเลยไม่ต้องรอแปล
    # (top BM25 score >= 5.0 ถือว่ามั่นใจ)
    _top = max((d.get("score", 0) or 0 for d in norm), default=0)
    translated = False
    # L3: แปลเฉพาะเมื่อจำเป็น — ข้ามข้อความที่เป็นภาษาเป้าหมายอยู่แล้ว
    # (กัน Groq 429: แปลทีละ 3 รายการ OTPM limit 1000)
    if req.target_lang:
        import re as _re
        from translate import SUPPORTED_LANGUAGES as _LANGS
        from translate import translate_with_ai as _translate_ai

        _lang_names = {L["code"]: L["name"] for L in _LANGS}
        _tname = _lang_names.get(req.target_lang, req.target_lang)
        _cache: dict = getattr(search_library, "_tr_cache", None) or {}
        setattr(search_library, "_tr_cache", _cache)
        _sem = _asyncio.Semaphore(3)

        def _ck(text: str, lang: str, kind: str) -> str:
            h = _hashlib.md5(text.encode()).hexdigest()[:16]
            return f"{kind}:{lang}:{h}"

        def _already_target(text: str, lang: str) -> bool:
            # heuristic เบาๆ: th = มีอักษรไทยเกินครึ่ง, en = ascii เกือบทั้งหมด
            if not text:
                return True
            if lang == "th":
                th = len(_re.findall(r"[ก-๛]", text))
                return th / max(len(text), 1) > 0.3
            if lang == "en":
                try:
                    text.encode("ascii")
                    return True
                except UnicodeEncodeError:
                    return False
            return False

        async def _tr_cached(text: str, lang: str, kind: str) -> str:
            key = _ck(text, lang, kind)
            if key in _cache:
                return _cache[key]
            if _already_target(text, lang):
                _cache[key] = text
                return text
            async with _sem:
                if kind == "title":
                    prompt_text = (
                        "Translate ONLY the following book/article title from auto "
                        f"to {_tname} ({lang}). Return ONLY the translated title, "
                        f"no explanation, no quotes.\n\nTitle: {text}"
                    )
                else:
                    prompt_text = text
                try:
                    if kind == "title":
                        out = await _translate_ai(prompt_text, "auto", lang)
                    else:
                        from translate import translate_text_async as _translate
                        out = await _translate(text[:800], lang)
                except Exception:
                    out = text
                out = (out or text).strip()
                # กัน AI อธิบายยาวสำหรับ title: ตัดบรรทัดแรกถ้ายาวเกิน 3x
                if kind == "title":
                    first = out.split("\n")[0].strip()
                    if len(first) < len(out) and len(out) > len(text) * 3:
                        out = first
                if len(_cache) > 2000:  # กัน memory บวม: ล้างครึ่งเก่า
                    for k in list(_cache)[:1000]:
                        _cache.pop(k, None)
                _cache[key] = out
                return out

        async def _tr_inplace(doc: dict) -> None:
            title = (doc.get("title") or "").strip()
            desc = (doc.get("description") or doc.get("abstract") or "").strip()
            if title and "title_translated" not in doc:
                doc["title_translated"] = await _tr_cached(title, req.target_lang, "title")
            if desc and "description_translated" not in doc:
                doc["description_translated"] = await _tr_cached(desc, req.target_lang, "desc")

        # แปลเฉพาะผล Top-N ตาม BM25 score (กัน timeout/429 จากการแปลทั้งกอง)
        import os as _os
        _tr_limit = max(1, int(_os.getenv("SEARCH_TRANSLATE_LIMIT", "12")))
        _subset = sorted(norm, key=lambda d: d.get("score", 0) or 0, reverse=True)[:_tr_limit]
        await _asyncio.gather(*(_tr_inplace(d) for d in _subset))
        translated = True
    payload = {"query": req.query, "count": len(norm), "results": norm, "translated": translated}
    # เก็บ cache (TTL 10 นาที) — รอบซ้ำไม่ต้องค้น+แปลใหม่
    if len(_rcache) > 500:
        for k in list(_rcache)[:250]:
            _rcache.pop(k, None)
    _rcache[_rk] = {"ts": _time.time(), "payload": payload}
    # log
    try:
        SearchLogRepository().log(req.query, len(norm))
    except: pass
    return payload

@router.get("/search")
async def search_library_get(
    q: str = Query(...),
    limit: int = 10,
    target_lang: Optional[str] = Query(default=None, description="เช่น th/en/ja"),
):
    return await search_library(
        SearchRequest(query=q, limit=limit, target_lang=target_lang)
    )

@router.post("/ingest")
async def ingest_to_rag(req: IngestRequest):
    """Search + ingest to vector DB for RAG"""
    from gateway.workers.library_tasks import ingest_task
    task = ingest_task.delay(req.query, req.limit)
    return {"task_id": task.id, "status": "queued", "query": req.query}

@router.get("/providers")
def list_providers():
    return {
        "mesh": {
            "01_web": ["searxng"],
            "02_local": ["local (Qdrant index ตัวเอง)"],
            "03_library": ["openlibrary", "loc", "crossref", "nasa", "google_books", "wikipedia", "internet_archive"],
            "04_ai": ["firecrawl", "exa/serper/brave (ผ่าน chat_service)"],
            "05_llm": ["groq", "gemini", "openai", "deepseek", "kimi", "claude", "meta_llama"],
            "06_rag_agents": ["research_agent", "judge_agent", "image_agent", "multi_ai_rag"],
        },
        "v1": ["local", "searxng", "openlibrary", "loc", "crossref", "nasa", "google_books", "wikipedia", "internet_archive", "firecrawl"],
        "v2_planned": ["worldcat", "europeana", "hathitrust", "dpla", "openalex", "pubmed", "arxiv", "opensearch"],
        "v3_planned": ["esa", "semantic_scholar"]
    }
