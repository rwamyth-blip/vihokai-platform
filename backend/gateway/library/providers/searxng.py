import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class SearXNGProvider(LibraryProvider):
    """01 WEB SEARCH — SearXNG metasearch (self-host/สาธารณะ).

    URL ตั้งผ่าน SEARXNG_URL (default http://localhost:8080).
    ไม่มี key — ถ้า server ไม่ตอบจะคืน [] ให้ชั้นอื่นทำงานต่อ.
    """

    name = "searxng"

    def __init__(self):
        import os
        self.base_url = os.getenv("SEARXNG_URL", "http://localhost:8080")
        self.headers = {
            "User-Agent": "VihokAI/1.0 (contact@vihokai.com)",
            "Accept": "application/json",
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"q": query, "format": "json", "categories": "general"}
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/search", params=params,
                headers=self.headers, timeout=15,
            )
            r.raise_for_status()
            data = r.json()
        results = []
        for i, item in enumerate(data.get("results", [])[:limit]):
            results.append({
                "title": item.get("title"),
                "authors": [],
                "year": None,
                "description": (item.get("content") or "")[:500],
                "subjects": [],
                "rank": i,
                "source": "SearXNG",
                "source_url": item.get("url"),
                "raw": item,
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            description=raw.get("description"),
            source="searxng",
            source_url=raw.get("source_url"),
            thumbnail=None,
            metadata=raw,
        )
