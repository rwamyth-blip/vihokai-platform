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
    target_lang: Optional[str] = Field(
        None,
        description="เช่น th/en/ja — ถ้าระบุ จะแปล title+description ด้วย AI (translate.py) ใส่ title_translated/description_translated",
    )

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
    translated = False
    if req.target_lang:
        # แปล title+description ด้วย AI เดิม (translate.py) แบบขนาน
        # ไม่มี googletrans dependency เพิ่ม — ใช้ provider เดิมของระบบ
        # + cache in-memory (text:lang) กันแปลซ้ำเปลือง token
        # + prompt แยก: title สั้นตรงตัว / description ธรรมชาติ
        import asyncio as _asyncio
        import hashlib as _hashlib
        from translate import SUPPORTED_LANGUAGES as _LANGS
        from translate import translate_with_ai as _translate_ai

        _lang_names = {L["code"]: L["name"] for L in _LANGS}
        _tname = _lang_names.get(req.target_lang, req.target_lang)
        _cache: dict = getattr(search_library, "_tr_cache", None) or {}
        setattr(search_library, "_tr_cache", _cache)

        def _ck(text: str, lang: str, kind: str) -> str:
            h = _hashlib.md5(text.encode()).hexdigest()[:16]
            return f"{kind}:{lang}:{h}"

        async def _tr_cached(text: str, lang: str, kind: str) -> str:
            key = _ck(text, lang, kind)
            if key in _cache:
                return _cache[key]
            if kind == "title":
                prompt_src, prompt_tgt = "auto", lang
                prompt_text = (
                    f"Translate ONLY the following book/article title from {prompt_src} "
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

        async def _tr(doc: dict) -> dict:
            out = dict(doc)
            title = (doc.get("title") or "").strip()
            desc = (doc.get("description") or doc.get("abstract") or "").strip()
            if title:
                out["title_translated"] = await _tr_cached(title, req.target_lang, "title")
            if desc:
                out["description_translated"] = await _tr_cached(desc, req.target_lang, "desc")
            return out

        norm = list(await _asyncio.gather(*(_tr(d) for d in norm)))
        translated = True
    # log
    try:
        SearchLogRepository().log(req.query, len(norm))
    except: pass
    return {"query": req.query, "count": len(norm), "results": norm, "translated": translated}

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
        "v1": ["openlibrary", "loc", "crossref", "nasa", "google_books", "wikipedia", "internet_archive"],
        "v2_planned": ["worldcat", "europeana", "hathitrust", "dpla", "openalex", "pubmed", "arxiv"],
        "v3_planned": ["esa", "semantic_scholar"]
    }
