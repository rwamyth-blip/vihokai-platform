from typing import List, Dict, Any
import hashlib

def _doc_hash(doc: Dict[str, Any]) -> str:
    key = (doc.get("doi") or "").lower()
    if key:
        return f"doi:{key}"
    isbn = (doc.get("isbn") or [])
    if isinstance(isbn, list) and isbn:
        return f"isbn:{isbn[0]}"
    title = (doc.get("title") or "").lower().strip()
    authors = ",".join(sorted([a.lower() for a in doc.get("authors", [])[:2]]))
    return hashlib.md5(f"{title}|{authors}".encode()).hexdigest()

def deduplicate(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = {}
    out = []
    for d in docs:
        h = _doc_hash(d)
        if h not in seen:
            seen[h] = True
            out.append(d)
        else:
            # merge sources
            existing = next((x for x in out if _doc_hash(x)==h), None)
            if existing:
                existing.setdefault("merged_sources", []).append(d.get("source"))
    return out
