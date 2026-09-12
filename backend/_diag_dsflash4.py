"""Reproduce: call_deepseek returns EMPTY for Lenovo specs question."""
import asyncio, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
load_dotenv(".env")
import main
from openai import AsyncOpenAI

PROMPT = "สเปกเครื่องคอม AI Notebook Lenovo"

async def run():
    tier = main._length_tier(PROMPT, None)
    hint = main._tier_hint(tier, main.get_language_name("th"))
    user_content = "%s %s " % (PROMPT, hint)
    print("tier:", tier, "tokens:", main._tier_tokens(tier))
    client = AsyncOpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com/v1")
    for temp in (0.6, 1.0):
        try:
            t0 = time.time()
            r = await client.chat.completions.create(
                model="deepseek-flash",
                messages=[{"role": "user", "content": user_content}],
                max_tokens=main._tier_tokens(tier),
                temperature=temp, timeout=120)
            c = r.choices[0].message.content or ""
            print("temp=%s: (%.1fs) len=%d finish=%s usage=%s -> %r" % (
                temp, time.time() - t0, len(c), r.choices[0].finish_reason, r.usage, c[:80]))
        except Exception as e:
            print("temp=%s: EXC %s %s" % (temp, type(e).__name__, str(e)[:250]))

asyncio.run(run())
