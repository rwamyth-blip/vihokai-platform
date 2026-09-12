"""Diagnose: muse-spark-1.1 EN std returns empty but TH works."""
import asyncio, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(".env")
import main
import httpx

async def direct(label, messages, budget):
    key = os.getenv("MUSE_API_KEY")
    t0 = time.time()
    async with httpx.AsyncClient(timeout=90.0) as c:
        r = await c.post("https://api.meta.ai/v1/chat/completions",
                         headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
                         json={"model": "muse-spark-1.1", "messages": messages,
                               "max_tokens": budget, "temperature": 0.6})
    j = r.json()
    ch = (j.get("choices") or [{}])[0]
    msg = (ch.get("message") or {}).get("content") or ""
    print("%s: (%.1fs) finish=%s len=%d -> %r" % (label, time.time() - t0, ch.get("finish_reason"), len(msg), msg[:80]))

async def run():
    # tier/hint ที่ call_muse ใช้จริง
    for prompt, locale in [("What is artificial intelligence?", "en"),
                           ("อธิบายว่าปัญญาประดิษฐ์คืออะไร", "th")]:
        tier = main._length_tier(prompt, None)
        hint = main._tier_hint(tier, main.get_language_name(locale))
        print("Q:", prompt[:40], "| tier:", tier, "| budget:", max(main._tier_tokens(tier), 1500))
        await direct("  no-sys", [{"role": "user", "content": "คำถาม: %s %s" % (prompt, hint)}], 1500)
        await direct("  with-sys", [{"role": "system", "content": "You are VihokAI."},
                                    {"role": "user", "content": "คำถาม: %s %s" % (prompt, hint)}], 1500)

asyncio.run(run())
