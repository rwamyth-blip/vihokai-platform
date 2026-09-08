import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class FirecrawlProvider(LibraryProvider):
    """04 AI SEARCH — Firecrawl search (snippet สะอาด).

    ใช้ FIRECRAWL_API_KEY ถ้าไม่มีคืน [] ให้ชั้นอื่นทำงานต่อ.
    """

    name = "firecrawl"
    BASE_URL = "https://api.firecrawl.dev/v1/search"

    def __init__(self):
        import os
        self.api_key = os.getenv("FIRECRAWL_API_KEY", "")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.api_key or self.api_key.startswith("your_"):
            return []
        async with httpx.AsyncClient() as client:
            r = await client.post(
                self.BASE_URL,
                json={"query": query, "limit": limit},
                headers=self.headers, timeout=15,
            )
            r.raise_for_status()
            data = r.json()
        results = []
        for i, item in enumerate(data.get("data", [])[:limit]):
            results.append({
                "title": item.get("title"),
                "authors": [],
                "year": None,
                "description": (item.get("snippet") or item.get("description") or "")[:500],
                "subjects": [],
                "rank": i,
                "source": "Firecrawl",
                "source_url": item.get("url"),
                "raw": item,
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            description=raw.get("description"),
            source="firecrawl",
            source_url=raw.get("source_url"),
            thumbnail=None,
            metadata=raw,
        )
