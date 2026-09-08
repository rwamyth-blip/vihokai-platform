"""Async facade ครอบ pipeline มาตรฐานของ Global Library.

รวม LibraryRouter (transport) + normalize + dedup + rank ไว้จุดเดียว
เพื่อให้ /library/search และ RAG retriever เรียกทางเดียวกัน
(ไฟล์เดิม search_library.py แบบ sync/requests ย้ายไป search_library.py.bak)
"""
import asyncio
from typing import List, Dict, Any, Optional

from .router import LibraryRouter
from .normalizer import normalize_results
from .deduplicator import deduplicate
from .ranking import rank_results


async def search_library(
    query: str,
    limit: int = 10,
    sources: Optional[List[str]] = None,
    enable_rerank: bool = True,
    enable_dedup: bool = True,
) -> List[Dict[str, Any]]:
    router = LibraryRouter()
    raw = await router.search(query, limit=limit, sources=sources)
    norm = normalize_results(raw)
    if enable_dedup:
        norm = deduplicate(norm)
    if enable_rerank:
        norm = rank_results(norm, query)
    return norm


if __name__ == "__main__":
    q = "wind energy"
    print(f"ค้นหา: {q}")
    results = asyncio.run(search_library(q, limit=3))
    print(f"พบ {len(results)} รายการ")
    for i, item in enumerate(results, 1):
        print(f"{i}. [{item.get('source')}] {item.get('title')}")
