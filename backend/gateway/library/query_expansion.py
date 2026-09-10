"""Query Expansion — แก้ปัญหา "ค้นหาไม่เจอ" (VihokAI Search Core V1.1)

ปัญหาหลัก: ผู้ใช้พิมพ์ภาษาไทย แต่ provider ส่วนใหญ่ (OpenLibrary, LoC, Crossref,
NASA, Google Books, Internet Archive) ค้นด้วยภาษาอังกฤษเป็นหลัก → ได้ 0 ผลลัพธ์

แนวทาง (ตามเอกสาร VihokAI Search Core):
  1. ตรวจภาษา (Thai/English)
  2. แปลงคำไทย → อังกฤษ ด้วยพจนานุกรม (เร็ว, deterministic, ไม่มีค่าใช้จ่าย)
  3. ขยาย synonym (ai → artificial intelligence, machine learning, ...)

หมายเหตุ: ออกแบบให้ไม่แตะ network เลย — ถ้าต้องการ AI translate ให้เปิด
SEARCH_AI_TRANSLATE=1 (ใช้ translate_text_async ของ backend หลัก, มี fallback)
"""

from __future__ import annotations

import os
import re
from typing import Dict, List

# ------------------------------------------------------------------ ภาษาไทย ----
_THAI_RE = re.compile(r"[\u0E00-\u0E7F]")


def has_thai(text: str) -> bool:
    """มีอักษรไทยอยู่ในข้อความไหม"""
    return bool(_THAI_RE.search(text or ""))


# --------------------------------------------------- คำไทย → คำอังกฤษ (core) ----
# เรียงจากคำยาวไปสั้น เพื่อให้แทนที่คำยาวก่อน (กัน "การแพทย์" ถูก "แพทย์" ทับ)
_TH_EN_TERMS: Dict[str, str] = {
    # เทคโนโลยี / AI
    "ปัญญาประดิษฐ์": "artificial intelligence",
    "การเรียนรู้ของเครื่อง": "machine learning",
    "การเรียนรู้เชิงลึก": "deep learning",
    "โครงข่ายประสาท": "neural network",
    "ควอนตัมคอมพิวติ้ง": "quantum computing",
    "ควอนตัม": "quantum",
    "บล็อกเชน": "blockchain",
    "คริปโตเคอเรนซี": "cryptocurrency",
    "คริปโต": "cryptocurrency",
    "หุ่นยนต์": "robotics robot",
    "ซอฟต์แวร์": "software",
    "ฮาร์ดแวร์": "hardware",
    "ความปลอดภัยไซเบอร์": "cybersecurity",
    "เทคโนโลยี": "technology",
    "คอมพิวเตอร์": "computer",
    "อินเทอร์เน็ต": "internet",
    "ข้อมูลขนาดใหญ่": "big data",
    # วิทยาศาสตร์
    "หลุมดำ": "black hole",
    "อวกาศ": "space",
    "ดาราศาสตร์": "astronomy",
    "ฟิสิกส์": "physics",
    "เคมี": "chemistry",
    "ชีววิทยา": "biology",
    "คณิตศาสตร์": "mathematics",
    "พันธุกรรม": "genetics",
    "ภูมิอากาศ": "climate",
    "สิ่งแวดล้อม": "environment",
    "พลังงาน": "energy",
    "นิวเคลียร์": "nuclear",
    "วิทยาศาสตร์": "science",
    # การแพทย์ / สุขภาพ
    "การแพทย์": "healthcare medical",
    "แพทยศาสตร์": "medicine",
    "สาธารณสุข": "public health",
    "สุขภาพ": "health",
    "โรคมะเร็ง": "cancer",
    "มะเร็ง": "cancer",
    "โรคเบาหวาน": "diabetes",
    "เบาหวาน": "diabetes",
    "โรคหัวใจ": "heart disease",
    "หัวใจ": "heart cardiac",
    "สมอง": "brain",
    "เลือด": "blood",
    "เชื้อไวรัส": "virus",
    "แบคทีเรีย": "bacteria",
    "โรคติดเชื้อ": "infectious disease",
    "ภูมิคุ้มกัน": "immunity immune",
    "วัคซีน": "vaccine",
    "การรักษา": "treatment therapy",
    "เภสัช": "pharmacy",
    # เศรษฐกิจ / การเงิน
    "เศรษฐกิจ": "economy",
    "การเงิน": "finance",
    "การลงทุน": "investment",
    "ตลาดหุ้น": "stock market",
    "หุ้น": "stock equity",
    "ธนาคาร": "bank banking",
    "ภาษี": "tax",
    "เงินเฟ้อ": "inflation",
    "การค้า": "trade commerce",
    # สังคม / การศึกษา
    "การศึกษา": "education",
    "มหาวิทยาลัย": "university",
    "นักเรียน": "student",
    "ครู": "teacher",
    "กฎหมาย": "law legal",
    "การเมือง": "politics",
    "ประวัติศาสตร์": "history",
    "วัฒนธรรม": "culture",
    "ศาสนา": "religion",
    "สังคม": "society",
    "จิตวิทยา": "psychology",
    "การตลาด": "marketing",
    "ธุรกิจ": "business",
    "บริษัท": "company business",
    "สตาร์ทอัพ": "startup",
    # เกษตร / อาหาร
    "การเกษตร": "agriculture farming",
    "เกษตรกรรม": "agriculture",
    "พืช": "plant crop",
    "ปศุสัตว์": "livestock",
    "อาหาร": "food",
    "โภชนาการ": "nutrition",
    "ท่องเที่ยว": "travel tourism",
    # ภูมิศาสตร์
    "ประเทศไทย": "thailand",
    "ไทย": "thailand",
    "ญี่ปุ่น": "japan",
    "จีน": "china",
    "เกาหลี": "korea",
    "อเมริกา": "united states america",
    "ยุโรป": "europe",
    "อาเซียน": "asean",
    "เอเชีย": "asia",
    # เอกสาร / ห้องสมุด
    "งานวิจัย": "research paper",
    "วิทยานิพนธ์": "thesis dissertation",
    "บทความ": "article paper",
    "หนังสือ": "book",
    "รายงาน": "report",
    "เอกสาร": "document",
    "รายชื่อ": "list",
}

# ------------------------------------------------------------------ synonyms ----
_SYNONYMS: Dict[str, List[str]] = {
    "artificial intelligence": ["machine learning", "deep learning"],
    "machine learning": ["deep learning", "neural network"],
    "quantum": ["quantum computing", "quantum physics"],
    "cryptocurrency": ["blockchain", "digital asset"],
    "climate": ["climate change", "global warming"],
    "cancer": ["oncology", "tumor"],
    "covid": ["sars-cov-2", "coronavirus"],
    "stock": ["equity", "shares"],
    "startup": ["venture capital", "entrepreneurship"],
}

# ------------------------------------------------------------------- helpers ----
def _sort_terms_by_length() -> List[str]:
    return sorted(_TH_EN_TERMS.keys(), key=len, reverse=True)


_TERMS_BY_LEN = _sort_terms_by_length()

# provider ที่จัดการภาษาไทยได้ดีอยู่แล้ว → ไม่ต้องแปล
THAI_CAPABLE_PROVIDERS = {"searxng", "wikipedia", "local"}


def to_english(query: str) -> str:
    """แทนคำไทยด้วยคำอังกฤษด้วยพจนานุกรม (ไม่แตะ network)"""
    out = query or ""
    for th in _TERMS_BY_LEN:
        if th in out:
            out = out.replace(th, _TH_EN_TERMS[th])
    # เก็บเฉพาะอักษร/ตัวเลข/ช่องว่างที่เหลือ (ตัดเครื่องหมายไทยที่ค้าง)
    out = re.sub(r"[\u0E00-\u0E7F]+", " ", out)
    return " ".join(out.split())


async def ai_translate(query: str) -> str | None:
    """แปลด้วย AI (optional) — เปิดด้วย SEARCH_AI_TRANSLATE=1

    ใช้ translate_text_async ของ backend หลัก ถ้ามี; ถ้า import/เรียกไม่ได้
    จะคืน None เพื่อให้ผู้เรียก fallback ไปใช้พจนานุกรมแทน
    """
    if os.getenv("SEARCH_AI_TRANSLATE", "0") not in {"1", "true", "yes"}:
        return None
    try:
        from translate import translate_text_async  # type: ignore

        translated = await translate_text_async(query, target_lang="en", source_lang="auto")
        if translated and not has_thai(translated):
            return " ".join(translated.split())
    except Exception as exc:  # pragma: no cover - best effort
        print(f"[query_expansion] AI translate skipped: {type(exc).__name__}: {exc}")
    return None


def _add_synonyms(query: str, variants: List[str], limit: int) -> None:
    lowered = query.lower()
    for key, syns in _SYNONYMS.items():
        if key in lowered:
            for syn in syns:
                if len(variants) >= limit:
                    return
                # ข้าม synonym ที่มีอยู่ใน query อยู่แล้ว (กัน "quantum computing quantum computing")
                if syn.lower() in lowered:
                    continue
                variants.append(f"{query} {syn}")


def expand_query(query: str, max_variants: int = 3) -> List[str]:
    """คืน query variants: [original, english, ...synonym] (ไม่ซ้ำ, จำกัดจำนวน)"""
    q = " ".join((query or "").split())
    if not q:
        return []

    variants: List[str] = [q]

    if has_thai(q):
        en = to_english(q)
        if en and en != q:
            variants.append(en)
            _add_synonyms(en, variants, max_variants)
    else:
        _add_synonyms(q, variants, max_variants)

    # dedupe + จำกัดจำนวน
    out: List[str] = []
    for v in variants:
        v = " ".join(v.split())
        if v and v not in out:
            out.append(v)
    return out[:max_variants]


async def expand_query_async(query: str, max_variants: int = 3) -> List[str]:
    """เหมือน expand_query แต่ลอง AI translate ก่อน (ถ้าเปิดใช้)"""
    variants = expand_query(query, max_variants=max_variants)

    if has_thai(query or ""):
        ai = await ai_translate(query)
        if ai and ai not in variants:
            variants.insert(1 if variants else 0, ai)
            _add_synonyms(ai, variants, max_variants)

    out: List[str] = []
    for v in variants:
        v = " ".join(v.split())
        if v and v not in out:
            out.append(v)
    return out[:max_variants]


def provider_queries(query: str, provider_name: str, variants: List[str]) -> List[str]:
    """เลือก query ที่เหมาะกับ provider

    provider ที่เก่งภาษาไทย (searxng/wikipedia/local) → ใช้ query เดิม
    provider ที่ค้นอังกฤษเป็นหลัก → ใช้ query ที่แปลแล้วถ้ามี
    """
    if provider_name in THAI_CAPABLE_PROVIDERS or len(variants) <= 1:
        return [variants[0]] if variants else []

    english = variants[1] if len(variants) > 1 else variants[0]
    return [english] if english else []
