import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from ai_search_engines_exa import search_ai

# ลำดับ fallback: ตัวไหนมี key จริง (ไม่ใช่ placeholder) ใช้ตัวนั้นก่อน
_ENGINE_ORDER = ("exa", "serper", "firecrawl", "brave")
_KEY_NAMES = {
    "exa": "EXA_API_KEY",
    "serper": "SERPER_API_KEY",
    "firecrawl": "FIRECRAWL_API_KEY",
    "brave": "BRAVE_API_KEY",
}


def _has_real_key(engine: str) -> bool:
    v = (os.getenv(_KEY_NAMES[engine]) or "").strip()
    return bool(v) and not v.startswith("your_") and v != "your-key"


def build_context_from_query(user_query: str, engine: str | None = None) -> str:
    # เรียก search (เลือก engine ที่มี API key จริง ตัวแรกที่เรียกสำเร็จ)
    tried: list[str] = []
    engines = [engine] if engine else list(_ENGINE_ORDER)
    last_err: Exception | None = None
    for eng in engines:
        if not _has_real_key(eng):
            tried.append(f"{eng}(no-key)")
            continue
        try:
            results = search_ai(user_query, engine=eng, num_results=5)
            if not results:
                tried.append(f"{eng}(empty)")
                continue
            # สร้างข้อความ Context
            context_parts = []
            for r in results:
                context_parts.append(f"Title: {r.title}\nContent: {r.content}\nURL: {r.url}")
            return "\n---\n".join(context_parts)
        except Exception as e:
            last_err = e
            tried.append(f"{eng}(error:{e})")
            continue
    return f"[Search unavailable: {'; '.join(tried)}; last_err={last_err}]"