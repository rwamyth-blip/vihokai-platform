"""Local knowledge seed — port เนื้อหาส่วน `knowledge/` ของ vihokai-ai-core-v1.

มาในรูป dict ล้วน (ไม่แตะ DB/Qdrant) ใช้เป็นชั้น `local_knowledge` ใน retriever:
- ค้นคำค้นแบบ keyword (ตรงกับหัวข้อ/แท็ก) ก่อน semantic อื่นๆ
- คืน NormalizedDoc ชุดเดียวกับ provider อื่น → pipeline เดิม (dedup/BM25/context) ใช้ได้ทันที
"""

from __future__ import annotations

from typing import Any, Dict, List

SEED_DOCS: List[Dict[str, Any]] = [
    {
        "title": "Transformer",
        "authors": [],
        "year": None,
        "description": (
            "Transformer คือสถาปัตยกรรมโครงข่ายประสาทที่ใช้กลไก attention "
            "สมการ Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V "
            "องค์ประกอบหลัก: token embeddings, positional information, "
            "multi-head attention, feed-forward network, residual "
            "connections, normalization"
        ),
        "subjects": ["machine_learning", "deep learning", "neural network", "transformer", "llm", "attention", "self-attention"],
        "keywords": ["transformer", "attention", "self-attention", "positional", "multi-head"],
        "source": "local_knowledge",
        "source_url": None,
    },
    {
        "title": "Retrieval Augmented Generation",
        "authors": [],
        "year": None,
        "description": (
            "RAG คือการรวมการค้นคืนจากฐานความรู้ภายนอกเข้ากับการสร้างภาษา "
            "Pipeline: Question -> Embedding -> Vector Search -> Relevant "
            "Context -> LLM -> Answer ช่วยลดการพึ่งพาความจำของโมเดลในเรื่องเฉพาะทาง"
        ),
        "subjects": ["rag", "retrieval", "vector search", "llm", "machine_learning"],
        "source": "local_knowledge",
        "source_url": None,
    },
    {
        "title": "Gradient Descent",
        "authors": [],
        "year": None,
        "description": (
            "Gradient Descent คืออัลกอริทึม optimization ที่ใช้ลด loss function: "
            "ปรับพารามิเตอร์ไปทิศที่ลด loss (theta_new = theta - eta * grad L(theta)). "
            "ขั้นตอน: คำนวณ gradient, คูณ learning rate, ขยับพารามิเตอร์ทิศลบ, ทำซ้ำจนถึงเงื่อนไขหยุด. "
            "ใช้ใน Neural Networks, Deep Learning, LLM Training"
        ),
        "subjects": ["machine_learning", "optimization", "gradient descent", "deep learning"],
        "source": "local_knowledge",
        "source_url": None,
    },
]


def _score_doc(doc: Dict[str, Any], query: str) -> float:
    """คะแนน keyword ง่ายๆ: title > keywords/subjects > description"""
    q = (query or "").strip().lower()
    if not q:
        return 0.0
    words = {w for w in q.replace("-", " ").split() if w}
    title = (doc.get("title") or "").lower()
    title_words = {w for w in title.replace("-", " ").split() if w}
    score = 0.0
    if q in title:
        score += 3.0
    score += 2.0 * len(words & title_words)
    for s in list(doc.get("keywords", []) or []) + list(doc.get("subjects", []) or []):
        s = str(s).lower()
        if q == s or q in s or s in q:
            score += 2.0
    if q in (doc.get("description") or "").lower():
        score += 1.0
    return score


def search_local_knowledge(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """ค้น seed knowledge แบบ keyword — คืน dict รูปแบบ NormalizedDoc."""
    out = []
    for doc in SEED_DOCS:
        score = _score_doc(doc, query)
        if score > 0:
            d = dict(doc)
            d["score"] = score
            out.append(d)
    out.sort(key=lambda d: d["score"], reverse=True)
    return out[:top_k]
