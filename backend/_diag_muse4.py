"""Diagnose: hint variants on muse EN (sequential, long timeout)."""
import asyncio, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(".env")
import httpx

async def post(label, content):
    key = os.getenv("MUSE_API_KEY")
    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=120.0) as c:
            r = await c.post("https://api.meta.ai/v1/chat/completions",
                             headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                             json={"model": "muse-spark-1.1",
                                   "messages": [{"role": "user", "content": content}],
                                   "max_tokens": 1500, "temperature": 0.6})
        j = r.json()
        ch = (j.get("choices") or [{}])[0]
        m = (ch.get("message") or {}).get("content") or ""
        print("%s: (%.1fs) finish=%s len=%d -> %r" % (label, time.time() - t0, ch.get("finish_reason"), len(m), m[:50]), flush=True)
    except Exception as e:
        print("%s: EXC %s %s" % (label, type(e).__name__, str(e)[:120]), flush=True)

async def run():
    await post("bare", "What is artificial intelligence?")
    await post("paren-hint", "What is artificial intelligence? (Answer in English completely with structure and examples.)")
    await post("thai-prefix", "What is artificial intelligence?")

asyncio.run(run())
