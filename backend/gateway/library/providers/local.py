from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class LocalProvider(LibraryProvider):
    """02 LOCAL SEARCH — ค้น index ตัวเองผ่าน Qdrant (มี server รันอยู่แล้ว).

    ไม่ต้องมี OpenSearch — ใช้ vector DB เดิมของ RAG.
    ถ้า Qdrant ว่าง/ล่ม คืน [] ให้ชั้นอื่น (federated) ทำงานต่อ.
    """

    name = "local"

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            from gateway.vector_db.search import semantic_search
            hits = semantic_search(query, top_k=limit)
        except Exception as e:
            print(f"[local] Qdrant unavailable: {e}")
            return []
        results = []
        for h in hits[:limit]:
            results.append({
                "title": h.get("title"),
                "authors": h.get("authors", []),
                "year": h.get("year"),
                "description": h.get("description") or h.get("abstract"),
                "subjects": h.get("subjects", []),
                "source": "Local Index",
                "source_url": h.get("source_url"),
                "thumbnail": h.get("thumbnail"),
                "local_score": h.get("qdrant_score"),
                "raw": h,
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        year = None
        try:
            if raw.get("year"):
                year = int(str(raw["year"])[:4])
        except (ValueError, TypeError):
            pass
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            authors=raw.get("authors", []),
            year=year,
            description=raw.get("description"),
            subjects=raw.get("subjects", []),
            source="local",
            source_url=raw.get("source_url"),
            thumbnail=raw.get("thumbnail"),
            metadata=raw,
        )
