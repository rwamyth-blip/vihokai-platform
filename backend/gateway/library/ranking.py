from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import re

def _tokenize(text: str) -> List[str]:
    return re.findall(r"\w+", text.lower())

def rank_results(docs: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
    if not docs:
        return docs
    # BM25 over title+authors+subjects
    corpus = []
    for d in docs:
        txt = f"{d.get('title','')} {' '.join(d.get('authors',[]))} {' '.join(d.get('subjects',[]))} {d.get('description','') or ''} {d.get('abstract','') or ''}"
        corpus.append(_tokenize(txt))
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(_tokenize(query))
    
    # Boost by source credibility and recency (ตามลำดับ MESH)
    source_weights = {
        # 01 WEB
        "searxng": 1.2,
        # 02 LOCAL (index ตัวเอง — ให้สูงสุดเพราะคัดมาแล้ว)
        "local": 1.5,
        # 03 LIBRARY
        "crossref": 1.2,
        "openlibrary": 1.0,
        "loc": 1.1,
        "nasa": 0.9,
        "google_books": 1.0,
        "wikipedia": 1.1,
        "internet_archive": 0.9,
        # 04 AI
        "firecrawl": 1.1,
    }
    for i, d in enumerate(docs):
        src = d.get("source","")
        w = source_weights.get(src, 1.0)
        year = d.get("year") or 0
        recency_boost = 0
        if year and year > 2015:
            recency_boost = (year - 2015) * 0.02
        d["score"] = float(scores[i]) * w + recency_boost

    return sorted(docs, key=lambda x: x.get("score",0), reverse=True)
