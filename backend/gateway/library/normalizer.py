from typing import List, Dict, Any
from .providers.base import NormalizedDoc
from .providers.openlibrary import OpenLibraryProvider
from .providers.loc import LOCProvider
from .providers.crossref import CrossrefProvider
from .providers.nasa import NASAProvider
from .providers.google_books import GoogleBooksProvider
from .providers.wikipedia import WikipediaProvider
from .providers.internet_archive import InternetArchiveProvider

_provider_normalizers = {
    "openlibrary": OpenLibraryProvider(),
    "loc": LOCProvider(),
    "crossref": CrossrefProvider(),
    "nasa": NASAProvider(),
    "google_books": GoogleBooksProvider(),
    "wikipedia": WikipediaProvider(),
    "internet_archive": InternetArchiveProvider(),
}

def normalize_results(raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for raw in raw_results:
        prov = raw.get("_provider", "unknown")
        normalizer = _provider_normalizers.get(prov)
        try:
            if normalizer:
                doc: NormalizedDoc = normalizer.normalize(raw)
                normalized.append(doc.model_dump())
            else:
                normalized.append({
                    "title": raw.get("title","Untitled"),
                    "source": prov,
                    "source_url": raw.get("source_url"),
                    "metadata": raw
                })
        except Exception as e:
            normalized.append({"title": raw.get("title","Untitled"), "source": prov, "error": str(e), "metadata": raw})
    return normalized
