from typing import List, Dict, Any, Optional
from gateway.vector_db.search import semantic_search
from gateway.library.search_library import search_library as search_library_facade

class HybridRetriever:
    def __init__(self):
        pass

    async def retrieve(self, query: str, top_k: int = 5, use_library: bool = True, search_live: bool = False, sources: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        results = []
        # 1) Vector DB
        try:
            vdb = semantic_search(query, top_k=top_k)
            results.extend(vdb)
        except Exception as e:
            print(f"Qdrant search fail: {e}")

        # 2) Live library search for fresh context (optional)
        if use_library and search_live:
            try:
                ranked = await search_library_facade(query, limit=top_k, sources=sources)
                results.extend(ranked[:top_k])
            except Exception as e:
                print(f"Live search fail: {e}")
        
        # simple dedup by title
        seen = set()
        uniq = []
        for r in results:
            t = (r.get("title","") or "").lower()
            if t and t not in seen:
                seen.add(t)
                uniq.append(r)
        return uniq[:top_k]
