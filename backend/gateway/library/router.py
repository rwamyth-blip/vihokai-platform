import asyncio
from typing import List, Dict, Any, Optional
from .providers.openlibrary import OpenLibraryProvider
from .providers.loc import LOCProvider
from .providers.crossref import CrossrefProvider
from .providers.nasa import NASAProvider
from .providers.google_books import GoogleBooksProvider
from .providers.wikipedia import WikipediaProvider
from .providers.internet_archive import InternetArchiveProvider
from .providers.searxng import SearXNGProvider
from .providers.firecrawl import FirecrawlProvider
from .providers.local import LocalProvider

class LibraryRouter:
    def __init__(self):
        self.providers_map = {
            # 01 WEB SEARCH
            "searxng": SearXNGProvider(),
            # 02 LOCAL SEARCH (Qdrant index ตัวเอง)
            "local": LocalProvider(),
            # 03 LIBRARY SEARCH
            "openlibrary": OpenLibraryProvider(),
            "loc": LOCProvider(),
            "crossref": CrossrefProvider(),
            "nasa": NASAProvider(),
            "google_books": GoogleBooksProvider(),
            "wikipedia": WikipediaProvider(),
            "internet_archive": InternetArchiveProvider(),
            # 04 AI SEARCH (แบบไม่ใช้ key แยก — ใช้ key เดิมของระบบ)
            "firecrawl": FirecrawlProvider(),
        }
        self.providers = list(self.providers_map.values())

    async def search(self, query: str, limit: int = 10, sources: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        selected = self.providers
        if sources:
            selected = [self.providers_map[s] for s in sources if s in self.providers_map]
        
        tasks = [p.search(query, limit) for p in selected]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        combined = []
        for provider, res in zip(selected, results):
            if isinstance(res, Exception):
                print(f"[{provider.name}] error: {res}")
                continue
            # tag each with provider name if not present
            for r in res:
                r["_provider"] = provider.name
            combined.extend(res)
        return combined

    def register(self, name: str, provider):
        """V2: add new provider without changing core"""
        self.providers_map[name] = provider
        self.providers = list(self.providers_map.values())
