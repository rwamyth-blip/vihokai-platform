import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc

class OpenLibraryProvider(LibraryProvider):
    name = "openlibrary"
    BASE_URL = "https://openlibrary.org/search.json"

    def __init__(self):
        self.headers = {
            "User-Agent": "VihokAI/1.0 (contact@vihokai.com)",
            "Accept": "application/json"
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"q": query, "limit": limit, "fields": "key,title,author_name,first_publish_year,isbn,publisher,language,subject,cover_i,edition_count"}
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=self.headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        for item in data.get("docs", []):
            cover = f"https://covers.openlibrary.org/b/id/{item.get('cover_i')}-L.jpg" if item.get('cover_i') else None
            results.append({
                "title": item.get("title"),
                "authors": item.get("author_name", []),
                "year": item.get("first_publish_year"),
                "isbn": item.get("isbn", [])[:5],
                "publisher": (item.get("publisher") or [None])[0],
                "language": (item.get("language") or [None])[0],
                "subjects": item.get("subject", [])[:10],
                "cover": cover,
                "edition_count": item.get("edition_count"),
                "key": item.get("key"),
                "source": "Open Library",
                "source_url": f"https://openlibrary.org{item.get('key')}" if item.get('key') else "https://openlibrary.org",
                "raw": item
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            authors=raw.get("authors", []),
            year=raw.get("year"),
            publisher=raw.get("publisher"),
            language=raw.get("language"),
            isbn=raw.get("isbn", []),
            subjects=raw.get("subjects", []),
            source="openlibrary",
            source_url=raw.get("source_url"),
            source_id=raw.get("key"),
            thumbnail=raw.get("cover"),
            metadata=raw
        )
