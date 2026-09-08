import httpx
from typing import List, Dict, Any
from .base import LibraryProvider, NormalizedDoc

class CrossrefProvider(LibraryProvider):
    name = "crossref"
    BASE_URL = "https://api.crossref.org/works"

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        params = {"query": query, "rows": limit, "sort": "relevance"}
        headers = {"User-Agent": "VihokAI/1.0 (mailto:contact@vihokai.com)"}
        async with httpx.AsyncClient() as client:
            r = await client.get(self.BASE_URL, params=params, headers=headers, timeout=25)
            r.raise_for_status()
            data = r.json()
        results = []
        for item in data.get("message", {}).get("items", []):
            authors = []
            for a in item.get("author", [])[:10]:
                name = f"{a.get('given','')} {a.get('family','')}".strip()
                if name: authors.append(name)
            doi = item.get("DOI")
            results.append({
                "title": (item.get("title") or [""])[0],
                "authors": authors,
                "doi": doi,
                "publisher": item.get("publisher"),
                "year": (item.get("published", {}).get("date-parts", [[None]])[0][0] if item.get("published") else None) or (item.get("created", {}).get("date-parts", [[None]])[0][0] if item.get("created") else None),
                "type": item.get("type"),
                "subjects": item.get("subject", [])[:10],
                "abstract": item.get("abstract"),
                "source": "Crossref",
                "source_url": f"https://doi.org/{doi}" if doi else item.get("URL"),
                "raw": item
            })
        return results

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        return NormalizedDoc(
            title=raw.get("title") or "Untitled",
            authors=raw.get("authors", []),
            year=raw.get("year"),
            publisher=raw.get("publisher"),
            doi=raw.get("doi"),
            subjects=raw.get("subjects", []),
            abstract=raw.get("abstract"),
            source="crossref",
            source_url=raw.get("source_url"),
            source_id=raw.get("doi"),
            metadata=raw
        )
