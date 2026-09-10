"""Multi-AI LLM layer for RAG answers.

หลักการ: LLM ถูกเรียกด้วย context ที่ Python (Library Router) สืบค้นมาให้แล้วเท่านั้น
LLM ไม่มีสิทธิ์ / ไม่ถูกสั่งให้ติดต่อห้องสมุดโดยตรง — Python เป็นตัวกลางเสมอ
"""
import os
from typing import List, Dict, Optional

# OpenAI-compatible providers — ใช้ openai SDK ตัวเดียวเรียกได้หลายเจ้า
# "params" = extra kwargs per provider. GPT-5 family (reasoning models) rejects
# temperature/max_tokens and needs max_completion_tokens + reasoning_effort.
PROVIDERS = [
    {"name": "openai",   "key": "OPENAI_API_KEY",    "base_url": None,                               "model": "gpt-5-nano",
     "params": {"max_completion_tokens": 2000, "reasoning_effort": "minimal"}},
    {"name": "groq",     "key": "GROQ_API_KEY",      "base_url": "https://api.groq.com/openai/v1",   "model": "openai/gpt-oss-120b",
     "params": {"temperature": 0.3}},
    {"name": "deepseek", "key": "DEEPSEEK_API_KEY",  "base_url": "https://api.deepseek.com/v1",      "model": "deepseek-chat",
     "params": {"temperature": 0.3}},
    {"name": "kimi",     "key": "KIMI_API_KEY",      "base_url": "https://api.moonshot.ai/v1",       "model": "kimi-k3",
     "params": {"temperature": 0.3}},
]


def _provider_config(provider: dict) -> dict:
    """Allow env override: OPENAI_MODEL / OPENAI_BASE_URL etc. (name -> NAME_MODEL)."""
    name = provider["name"].upper()
    cfg = dict(provider)
    cfg["model"] = os.getenv(f"{name}_MODEL", provider["model"])
    cfg["base_url"] = os.getenv(f"{name}_BASE_URL", provider["base_url"])
    return cfg

SYSTEM_PROMPT = (
    "คุณคือ VihokAI ผู้ช่วยค้นคว้าจาก Global Library Gateway. "
    "ตอบโดยใช้เฉพาะ Context ที่ให้มาเท่านั้น ห้ามอ้างว่าได้ติดต่อห้องสมุด/API ภายนอกด้วยตัวเอง "
    "เพราะ Python (Library Router) เป็นผู้สืบค้นและเตรียมข้อมูลให้แล้ว. "
    "ถ้า Context ไม่มีข้อมูล ให้บอกตามตรงว่าไม่พบ และอ้างอิงแหล่งที่มาจาก Context ทุกครั้ง"
)


def _mock_answer(question: str, context: str) -> str:
    n = context.count("Title:")
    return (
        "(Mock RAG — ยังไม่มี AI key ที่ใช้งานได้)\n\n"
        f"คำถาม: {question}\n\n"
        f"Python สืบค้นจาก Global Library ได้ {n} รายการ:\n"
        f"{context[:1200]}\n\n"
        "สรุป: ดู citations ด้านล่างประกอบ"
    )


async def _call_provider(provider: dict, question: str, context: str, history: Optional[List[Dict]]) -> Optional[str]:
    from openai import AsyncOpenAI

    cfg = _provider_config(provider)
    key = os.getenv(cfg["key"], "")
    if not key or key.startswith("sk-..."):  # placeholder -> skip
        return None

    client = AsyncOpenAI(api_key=key, base_url=cfg["base_url"])
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history[-6:])
    messages.append({"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"})

    resp = await client.chat.completions.create(
        model=cfg["model"],
        messages=messages,
        **cfg.get("params", {}),
    )
    return resp.choices[0].message.content


async def multi_ai_answer(question: str, context: str, history: Optional[List[Dict]] = None) -> str:
    """ลองทีละ provider ตัวแรกที่ตอบได้ — Python สืบค้นมาแล้ว ป้อนแต่ context ให้ LLM"""
    for p in PROVIDERS:
        try:
            ans = await _call_provider(p, question, context, history)
            if ans:
                return ans
        except Exception as e:
            print(f"[llm:{p['name']}] error: {e}")
    return _mock_answer(question, context)
