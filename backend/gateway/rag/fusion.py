"""RRF (Reciprocal Rank Fusion) — port จาก vihokai-ai-core-v1/app/rag/hybrid.py

รวม ranked lists หลายช่องทาง (เช่น Qdrant semantic + Library BM25)
เอกสารที่ติดอันดับสูงในหลายช่องทางจะได้คะแนนรวมสูง
สูตร: score(d) = Σ 1 / (k + rank), k=60

ใช้แทนการต่อ list กันเฉยๆ ใน retriever เดิม
"""

from __future__ import annotations

from typing import Any, Dict, List


def _key(doc: Dict[str, Any]) -> str:
    url = (doc.get("source_url") or "").strip().lower()
    if url:
        return "url:" + url
    title = (doc.get("title") or "").strip().lower()
    if title:
        return "title:" + title
    return "id:" + str(id(doc))


def rrf_fuse(
    ranked_lists: List[List[Dict[str, Any]]],
    k: int = 60,
) -> List[Dict[str, Any]]:
    """Fuse ranked lists ด้วย Reciprocal Rank Fusion (คืนเรียงตาม rrf_score)."""
    scores: Dict[str, float] = {}
    items: Dict[str, Dict[str, Any]] = {}
    for ranked in ranked_lists:
        for rank, doc in enumerate(ranked or [], start=1):
            key = _key(doc)
            items[key] = doc
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
    for key, doc in items.items():
        doc["rrf_score"] = scores[key]
    return sorted(items.values(), key=lambda d: d["rrf_score"], reverse=True)
