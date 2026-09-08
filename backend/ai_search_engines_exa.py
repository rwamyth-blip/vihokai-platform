"""
ai_search_engines_exa.py
เครื่องมือค้นหาสำหรับ AI Chatting ที่ประหยัด Token
รองรับ Exa, Firecrawl, Serper, Brave Search API
"""

import os
import requests
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import json

# --------------------------- Data Class ----------------------------------
@dataclass
class SearchResult:
    """ผลลัพธ์จากการค้นหาแบบ AI-Native"""
    title: str
    content: str          # Markdown, summary หรือ highlight
    url: str
    source: str           # ชื่อแหล่งข้อมูล
    score: Optional[float] = None
    metadata: Optional[Dict] = None


# --------------------------- Exa (เดิม Metaphor) -------------------------
class ExaSearch:
    """
    Exa (metaphor) Search Engine - คืนค่า Highlights/Summary ที่เกี่ยวข้องโดยตรง
    เอกสาร: https://docs.exa.ai
    """
    BASE_URL = "https://api.exa.ai"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("EXA_API_KEY")
        if not self.api_key:
            raise ValueError("Missing EXA_API_KEY environment variable")
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def search(self, query: str, num_results: int = 5, use_highlights: bool = True) -> List[SearchResult]:
        """
        ค้นหาด้วย Exa และคืนค่า Highlights (ซึ่งเป็นเนื้อหาสรุปที่เกี่ยวข้อง)
        """
        endpoint = f"{self.BASE_URL}/search"
        payload = {
            "query": query,
            "numResults": num_results,
            "useAutoprompt": True,        # ปรับปรุงคำค้นให้ดีขึ้น
            "includeHighlights": use_highlights  # รับ Highlights แทน Full Text
        }

        resp = requests.post(endpoint, json=payload, headers=self.headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("results", []):
            # ดึง highlights มาประกอบเป็น content ถ้ามี
            highlights = item.get("highlights", [])
            content = " ".join(highlights) if highlights else item.get("text", "")
            results.append(SearchResult(
                title=item.get("title", ""),
                content=content,
                url=item.get("url", ""),
                source="Exa",
                score=item.get("score")
            ))
        return results


# --------------------------- Firecrawl ----------------------------------
class FirecrawlSearch:
    """
    Firecrawl - รับ URL หรือค้นหาและแปลงเนื้อหาเป็น Markdown สะอาด
    เอกสาร: https://docs.firecrawl.dev
    """
    BASE_URL = "https://api.firecrawl.dev/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise ValueError("Missing FIRECRAWL_API_KEY environment variable")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def search(self, query: str, num_results: int = 5) -> List[SearchResult]:
        """
        Firecrawl มี 'search' endpoint ที่คืนรายการ URL + snippet 
        จากนั้นเราสามารถดึงเนื้อหา Markdown ของแต่ละ URL ได้ (หรือใช้ snippet)
        """
        # 1. ค้นหาก่อน
        search_url = f"{self.BASE_URL}/search"
        payload = {"query": query, "limit": num_results}
        resp = requests.post(search_url, json=payload, headers=self.headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("data", []):
            # ได้ snippet มาแล้ว (อาจเพียงพอ)
            content = item.get("snippet", "") or item.get("description", "")
            results.append(SearchResult(
                title=item.get("title", ""),
                content=content,
                url=item.get("url", ""),
                source="Firecrawl",
                score=None
            ))

        # 2. (ทางเลือก) ถ้าต้องการ Markdown เต็มของหน้าแรก
        #    เราสามารถเรียก scrape endpoint กับ URL แรกได้ เช่น
        #    if results:
        #        first_url = results[0].url
        #        md = self.scrape_url(first_url)
        #        results[0].content = md   # ใช้ Markdown เต็ม
        return results

    def scrape_url(self, url: str) -> str:
        """ดึงเนื้อหา Markdown ของ URL เดียว (ไม่ใช้ใน search โดยตรง)"""
        scrape_url = f"{self.BASE_URL}/scrape"
        payload = {"url": url}
        resp = requests.post(scrape_url, json=payload, headers=self.headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data.get("markdown", "")


# --------------------------- Serper (Google SERP) -----------------------
class SerperSearch:
    """
    Serper - SERP API ราคาประหยัด คืนค่า JSON ของ Google Search
    เอกสาร: https://serper.dev
    """
    BASE_URL = "https://google.serper.dev"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SERPER_API_KEY")
        if not self.api_key:
            raise ValueError("Missing SERPER_API_KEY environment variable")
        self.headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

    def search(self, query: str, num_results: int = 5) -> List[SearchResult]:
        endpoint = f"{self.BASE_URL}/search"
        payload = {"q": query, "num": num_results}
        resp = requests.post(endpoint, json=payload, headers=self.headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("organic", []):
            # snippet อาจมี HTML tag ให้ clean เล็กน้อย
            snippet = item.get("snippet", "")
            # ตัด tag HTML (ถ้ามี)
            import re
            snippet = re.sub(r"<[^>]+>", "", snippet)
            results.append(SearchResult(
                title=item.get("title", ""),
                content=snippet,
                url=item.get("link", ""),
                source="Serper",
                score=None
            ))
        return results


# --------------------------- Brave Search --------------------------------
class BraveSearch:
    """
    Brave Search API - Privacy-first มี LLM Context endpoint
    เอกสาร: https://brave.com/search/api/
    """
    BASE_URL = "https://api.search.brave.com/res/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("BRAVE_API_KEY")
        if not self.api_key:
            raise ValueError("Missing BRAVE_API_KEY environment variable")
        self.headers = {
            "X-Subscription-Token": self.api_key,
            "Accept": "application/json"
        }

    def search(self, query: str, num_results: int = 5, use_llm_context: bool = True) -> List[SearchResult]:
        """
        ถ้า use_llm_context=True จะเรียก /web/search พร้อม extra snippets
        """
        endpoint = f"{self.BASE_URL}/web/search"
        params = {
            "q": query,
            "count": num_results,
            "safety": "moderate",
            "extra_snippets": "true" if use_llm_context else "false"
        }
        resp = requests.get(endpoint, params=params, headers=self.headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("web", {}).get("results", []):
            # Brave ให้ description และ extra_snippets (ถ้ามี)
            snippets = item.get("extra_snippets", [])
            content = " ".join(snippets) if snippets else item.get("description", "")
            results.append(SearchResult(
                title=item.get("title", ""),
                content=content,
                url=item.get("url", ""),
                source="Brave",
                score=None
            ))
        return results


# --------------------------- ฟังก์ชันรวม (Factory) -----------------------
def search_ai(
    query: str,
    engine: str = "exa",
    num_results: int = 5,
    **kwargs
) -> List[SearchResult]:
    """
    ฟังก์ชันหลักสำหรับค้นหาข้อมูลด้วย AI-Native Search Engine
    engine: "exa", "firecrawl", "serper", "brave"
    ตัวอย่าง:
        results = search_ai("แนวโน้ม AI ปี 2025", engine="exa")
    """
    engine_lower = engine.lower()

    if engine_lower == "exa":
        searcher = ExaSearch()
        return searcher.search(query, num_results, use_highlights=True)
    elif engine_lower == "firecrawl":
        searcher = FirecrawlSearch()
        return searcher.search(query, num_results)
    elif engine_lower == "serper":
        searcher = SerperSearch()
        return searcher.search(query, num_results)
    elif engine_lower == "brave":
        searcher = BraveSearch()
        return searcher.search(query, num_results, use_llm_context=True)
    else:
        raise ValueError(f"Unsupported engine: {engine}. Choose from exa, firecrawl, serper, brave")


# --------------------------- ตัวอย่างการใช้งาน --------------------------
if __name__ == "__main__":
    # ตั้งค่า API keys ใน environment หรือแก้ด้านล่าง
    # os.environ["EXA_API_KEY"] = "your-key"
    # os.environ["FIRECRAWL_API_KEY"] = "your-key"
    # os.environ["SERPER_API_KEY"] = "your-key"
    # os.environ["BRAVE_API_KEY"] = "your-key"

    # ทดสอบ Exa
    try:
        results = search_ai("machine learning trends 2025", engine="exa", num_results=3)
        print("=== Exa Results ===")
        for r in results:
            print(f"{r.title}\n{r.content[:200]}...\n{r.url}\n")
    except Exception as e:
        print("Exa error:", e)

    # ทดสอบ Brave
    try:
        results = search_ai("RAG best practices", engine="brave", num_results=3)
        print("=== Brave Results ===")
        for r in results:
            print(f"{r.title}\n{r.content[:200]}...\n{r.url}\n")
    except Exception as e:
        print("Brave error:", e)