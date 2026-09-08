import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class WikipediaProvider(LibraryProvider):
    """Wikipedia via generator=search + pageimages in a single request."""

    name = "wikipedia"
    BASE_URL = "https://en.wikipedia.org/w/api.php"

    def __init__(self):
        self.headers = {
            "User-Agent": "VihokAI/1.0 (contact@vihokai.com)",
            "Accept": "application/json",
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": min(limit, 50),
            "prop": "pageimages|extracts",
            "exintro": 1,
            "explaintext": 1,
            "exsentences": 3,
            "pithumbsize": 300,
            "format": "json",
        }
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=self.headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        pages = (data.get("query") or {}).get("pages", {})
        for page_id, page in list(pages.items())[:limit]:
            thumb = (page.get("thumbnail") or {}).get("source")
            results.append({
                "title": page.get("title"),
                "authors": [],
                "year": None,
                "description": page.get("extract"),
                "subjects": [],
                "key": str(page_id),
                "source": "Wikipedia",
                "source_url": f"https://en.wikipedia.org/?curid={page_id}",
                "thumbnail": thumb,
                "raw": page,
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            authors=[],
            year=None,
            description=raw.get("description"),
            subjects=[],
            source="wikipedia",
            source_url=raw.get("source_url"),
            source_id=raw.get("key"),
            thumbnail=raw.get("thumbnail"),
            metadata=raw,
        )
