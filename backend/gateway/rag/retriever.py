from typing import List, Dict, Any, Optional
from gateway.vector_db.search import semantic_search
from gateway.library.search_library import search_library as search_library_facade
from gateway.library.ranking import rank_results
from gateway.rag.fusion import rrf_fuse
from gateway.rag.local_knowledge import search_local_knowledge


def _lexical_hits(query: str, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """ชั้น lexical แบบ ai-core (keyword ตรงใน title/description → คงลำดับเดิม)."""
    q = (query or "").lower().split()
    if not q:
        return []
    out = []
    for d in docs:
        text = f"{d.get('title', '')} {d.get('description', '') or d.get('abstract', '')}".lower()
        if any(w and w in text for w in q):
            out.append(d)
    return out


class HybridRetriever:
    def __init__(self):
        pass

    async def retrieve(self, query: str, top_k: int = 5, use_library: bool = True, search_live: bool = False, sources: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        ranked_lists: List[List[Dict[str, Any]]] = []

        # 0) Local knowledge seed (ai-core port) — keyword ตรงหัวข้อ
        try:
            local_docs = search_local_knowledge(query, top_k=top_k)
            if local_docs:
                ranked_lists.append(local_docs)
        except Exception as e:
            print(f"Local knowledge fail: {e}")

        # 1) Vector DB
        try:
            vdb = semantic_search(query, top_k=top_k)
            if vdb:
                ranked_lists.append(vdb)
        except Exception as e:
            print(f"Qdrant search fail: {e}")

        # 2) Live library search for fresh context (optional)
        live_docs: List[Dict[str, Any]] = []
        if use_library and search_live:
            try:
                ranked = await search_library_facade(query, limit=top_k, sources=sources)
                live_docs = ranked[:top_k]
            except Exception as e:
                print(f"Live search fail: {e}")

        # 2a) Lexical channel แบบ ai-core: BM25 จัดลำดับ แล้วดึง top ที่ตรง keyword
        scored = rank_results(list(live_docs), query) if live_docs else []
        ranked_lists.append(scored)
        ranked_lists.append(_lexical_hits(query, list(live_docs)))

        # 3) RRF fusion แทนการ concat+dedup แบบเดิม
        fused = rrf_fuse([r for r in ranked_lists if r])
        if not fused:
            # fallback: รวมดิบถ้าไม่มี ranked list เลย (กันเคส edge)
            seen: set = set()
            out: List[Dict[str, Any]] = []
            for r in live_docs:
                t = (r.get("title", "") or "").lower()
                if t and t not in seen:
                    seen.add(t)
                    out.append(r)
            return out[:top_k]
        return fused[:top_k]
