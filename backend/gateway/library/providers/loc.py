import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc

class LOCProvider(LibraryProvider):
    name = "loc"
    BASE_URL = "https://www.loc.gov/search/"

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"q": query, "fo": "json", "c": limit}
        headers = {"User-Agent": "VihokAI/1.0 (contact@vihokai.com)"}
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        for item in data.get("results", []):
            # item can be dict with various fields
            results.append({
                "title": item.get("title") or item.get("original_format"),
                "description": item.get("description", [""])[0] if isinstance(item.get("description"), list) else item.get("description"),
                "date": item.get("date"),
                "subjects": item.get("subject", [])[:10] if isinstance(item.get("subject"), list) else [],
                "source": "Library of Congress",
                "source_url": item.get("id"),
                "image": (item.get("image_url") or [None])[0] if isinstance(item.get("image_url"), list) else item.get("image_url"),
                "raw": item
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        year = None
        try:
            if raw.get("date"):
                import re
                m = re.search(r"(\d{4})", str(raw["date"]))
                if m: year = int(m.group(1))
        except: pass
        return NormalizedDoc(
            title=raw.get("title") or "LOC Item",
            description=raw.get("description"),
            year=year,
            subjects=raw.get("subjects", []),
            source="loc",
            source_url=raw.get("source_url"),
            thumbnail=raw.get("image"),
            metadata=raw
        )
