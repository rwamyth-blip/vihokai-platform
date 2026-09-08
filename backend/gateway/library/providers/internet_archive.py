import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class InternetArchiveProvider(LibraryProvider):
    name = "internet_archive"
    BASE_URL = "https://archive.org/advancedsearch.php"

    def __init__(self):
        self.headers = {
            "User-Agent": "VihokAI/1.0 (contact@vihokai.com)",
            "Accept": "application/json",
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = [
            ("q", query),
            ("fl[]", "identifier"),
            ("fl[]", "title"),
            ("fl[]", "creator"),
            ("fl[]", "year"),
            ("fl[]", "description"),
            ("rows", limit),
            ("output", "json"),
        ]
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=self.headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        docs = data.get("response", {}).get("docs", [])
        for doc in docs[:limit]:
            identifier = doc.get("identifier", "")
            creator = doc.get("creator", [])
            authors = creator if isinstance(creator, list) else ([creator] if creator else [])
            description = doc.get("description", "")
            if isinstance(description, list):
                description = description[0] if description else ""
            results.append({
                "title": doc.get("title"),
                "authors": authors,
                "year": str(doc.get("year", "")) if doc.get("year") else None,
                "description": description,
                "subjects": [],
                "key": identifier,
                "source": "Internet Archive",
                "source_url": f"https://archive.org/details/{identifier}" if identifier else None,
                "thumbnail": f"https://archive.org/services/img/{identifier}" if identifier else None,
                "raw": doc,
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
            subjects=[],
            source="internet_archive",
            source_url=raw.get("source_url"),
            source_id=raw.get("key"),
            thumbnail=raw.get("thumbnail"),
            metadata=raw,
        )
