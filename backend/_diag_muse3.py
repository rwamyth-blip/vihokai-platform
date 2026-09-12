"""Diagnose: muse EN via call_muse shape vs direct (same hint?)."""
import asyncio, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(".env")
import main
import httpx

async def post(label, messages, budget=1500):
    key = os.getenv("MUSE_API_KEY")
    t0 = time.time()
    async with httpx.AsyncClient(timeout=90.0) as c:
        r = await c.post("https://api.meta.ai/v1/chat/completions",
                         headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                         json={"model": "muse-spark-1.1", "messages": messages,
                               "max_tokens": budget, "temperature": 0.6})
    j = r.json()
    ch = (j.get("choices") or [{}])[0]
    m = (ch.get("message") or {}).get("content") or ""
    print("%s: (%.1fs) finish=%s len=%d -> %r" % (label, time.time() - t0, ch.get("finish_reason"), len(m), m[:60]))

async def run():
    prompt = "What is artificial intelligence?"
    tier = main._length_tier(prompt, None)
    print("tier:", tier)
    # รูปที่ call_muse ส่งจริง (หลังแก้ hint EN)
    mem, hint = "", "(Answer in English completely with structure and examples.)"
    user_en = "คำถาม: %s %s" % (prompt, hint)
    await post("th-prefix+en-hint", [{"role": "user", "content": user_en}])
    await post("pure-en", [{"role": "user", "content": "%s %s" % (prompt, hint)}])
    await post("no-hint", [{"role": "user", "content": prompt}])

asyncio.run(run())
