"""QueryRouter — จัดลำดับ providers ตามโครง SEARCH MESH.

01 WEB (searxng) → 03 LIBRARY (7 แหล่ง) → 04 AI (firecrawl + Exa/Serper/Brave
ผ่าน chat_service) → 05 LLM / 06 RAG อยู่ชั้นบน (main.py / gateway/rag).

02 LOCAL OpenSearch ยังไม่ต่อ (ต้องมี index + server ก่อน) — คืน [] แบบ silent.
"""
from typing import List, Optional

# ชุดตามหมวด MESH
WEB = ["searxng"]
LOCAL = ["local"]
LIBRARY = [
    "openlibrary", "loc", "crossref", "nasa",
    "google_books", "wikipedia", "internet_archive",
]
AI_DIRECT = ["firecrawl"]  # ตัวที่มี provider ใน gateway แล้ว


def route(query: str, sources: Optional[List[str]] = None) -> List[str]:
    """คืนลำดับ providers ตาม intent. ถ้าระบุ sources มาใช้ตามนั้นเลย."""
    if sources:
        return [s for s in sources]
    ql = (query or "").lower()
    if any(k in ql for k in ["nasa", "mars", "space", "อวกาศ"]):
        return ["nasa", "searxng", "wikipedia"] + [s for s in LIBRARY if s != "nasa"]
    if any(k in ql for k in ["research", "paper", "งานวิจัย", "doi", "arxiv", "วิทยานิพนธ์"]):
        return ["crossref", "openlibrary", "google_books", "searxng", "wikipedia"]
    if any(k in ql for k in ["book", "หนังสือ", "ตำรา", "นิยาย"]):
        return ["openlibrary", "google_books", "internet_archive", "wikipedia", "searxng"]
    # default: local ก่อน (ของตัวเอง) แล้ว web + library (search-first ตาม MESH)
    return LOCAL + WEB + LIBRARY + AI_DIRECT
