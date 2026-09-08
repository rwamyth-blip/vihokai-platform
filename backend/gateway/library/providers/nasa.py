import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc

class NASAProvider(LibraryProvider):
    name = "nasa"
    BASE_URL = "https://images-api.nasa.gov/search"

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"q": query, "media_type": "image"}
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        collection = data.get("collection", {})
        for item in collection.get("items", [])[:limit]:
            info = (item.get("data") or [{}])[0]
            links = item.get("links") or []
            thumb = links[0].get("href") if links else None
            results.append({
                "title": info.get("title"),
                "description": info.get("description"),
                "date": info.get("date_created"),
                "nasa_id": info.get("nasa_id"),
                "keywords": info.get("keywords", [])[:10],
                "thumbnail": thumb,
                "source": "NASA",
                "source_url": item.get("href"),
                "raw": item
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        year = None
        try:
            if raw.get("date"):
                year = int(str(raw["date"])[:4])
        except: pass
        return NormalizedDoc(
            title=raw.get("title") or "NASA Image",
            description=raw.get("description"),
            year=year,
            subjects=raw.get("keywords", []),
            source="nasa",
            source_url=raw.get("source_url"),
            source_id=raw.get("nasa_id"),
            thumbnail=raw.get("thumbnail"),
            metadata=raw
        )
