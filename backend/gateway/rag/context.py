from typing import List, Dict, Any

def build_context(docs: List[Dict[str, Any]], max_chars: int = 6000) -> str:
    ctx = []
    for i, d in enumerate(docs, 1):
        title = d.get("title","Untitled")
        authors = ", ".join(d.get("authors", [])[:3])
        source = d.get("source","")
        url = d.get("source_url","")
        desc = d.get("description") or d.get("abstract") or ""
        desc = desc[:500]
        year = d.get("year","")
        ctx.append(f"[{i}] Title: {title}\nAuthors: {authors}\nYear: {year}\nSource: {source} ({url})\nInfo: {desc}\n")
    combined = "\n".join(ctx)
    return combined[:max_chars]
