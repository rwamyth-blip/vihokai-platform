from typing import List, Dict, Any
from gateway.vector_db.search import semantic_search
from gateway.library.router import LibraryRouter
from gateway.library.normalizer import normalize_results
from gateway.library.ranking import rank_results

class HybridRetriever:
    def __init__(self):
        self.router = LibraryRouter()

    async def retrieve(self, query: str, top_k: int = 5, use_library: bool = True, search_live: bool = False) -> List[Dict[str, Any]]:
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
                raw = await self.router.search(query, limit=top_k)
                norm = normalize_results(raw)
                ranked = rank_results(norm, query)[:top_k]
                results.extend(ranked)
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
