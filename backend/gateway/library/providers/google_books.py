import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc


class GoogleBooksProvider(LibraryProvider):
    name = "google_books"
    BASE_URL = "https://www.googleapis.com/books/v1/volumes"

    def __init__(self):
        self.headers = {
            "User-Agent": "VihokAI/1.0 (contact@vihokai.com)",
            "Accept": "application/json",
        }

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"q": query, "maxResults": min(limit, 40)}
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=self.headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        results = []
        for item in data.get("items", [])[:limit]:
            info = item.get("volumeInfo", {})
            image_links = info.get("imageLinks", {}) or {}
            thumbnail = image_links.get("thumbnail") or image_links.get("smallThumbnail")
            published = info.get("publishedDate", "") or ""
            year = published.split("-")[0] if published else None
            isbn_list = [
                i.get("identifier") for i in info.get("industryIdentifiers", [])
                if i.get("identifier")
            ][:5]
            results.append({
                "title": info.get("title"),
                "authors": info.get("authors", []),
                "year": year,
                "publisher": info.get("publisher"),
                "language": info.get("language"),
                "isbn": isbn_list,
                "subjects": (info.get("categories", []) or [])[:10],
                "description": info.get("description"),
                "page_count": info.get("pageCount"),
                "key": item.get("id"),
                "source": "Google Books",
                "source_url": info.get("infoLink"),
                "thumbnail": thumbnail,
                "raw": item,
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
            publisher=raw.get("publisher"),
            language=raw.get("language"),
            isbn=raw.get("isbn", []),
            subjects=raw.get("subjects", []),
            description=raw.get("description"),
            source="google_books",
            source_url=raw.get("source_url"),
            source_id=raw.get("key"),
            thumbnail=raw.get("thumbnail"),
            metadata=raw,
        )
