"""Diagnose: muse-spark-1.1 EN empty — budget sweep + model sweep."""
import asyncio, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(".env")
import httpx

EN_Q = "What is artificial intelligence?"

async def t(label, model, budget, msg=None):
    key = os.getenv("MUSE_API_KEY")
    t0 = time.time()
    async with httpx.AsyncClient(timeout=120.0) as c:
        r = await c.post("https://api.meta.ai/v1/chat/completions",
                         headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                         json={"model": model,
                               "messages": [{"role": "user", "content": msg or EN_Q}],
                               "max_tokens": budget, "temperature": 0.6})
    j = r.json()
    ch = (j.get("choices") or [{}])[0]
    m = (ch.get("message") or {}).get("content") or ""
    print("%s: (%.1fs) finish=%s len=%d -> %r" % (label, time.time() - t0, ch.get("finish_reason"), len(m), m[:60]))

async def run():
    await t("1.1/b1500", "muse-spark-1.1", 1500)
    await t("1.1/b4000", "muse-spark-1.1", 4000)
    await t("1.3/b1500", "muse-spark-1.3", 1500)
    await t("1.2/b1500", "muse-spark-1.2", 1500)
    await t("1.1-shortQ/b1500", "muse-spark-1.1", 1500, "Hi")

asyncio.run(run())
