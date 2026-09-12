"""Matrix: deepseek-flash budget sweep on Lenovo question (reasoning eats quota?)."""
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
    client = AsyncOpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com/v1")
    for mt in (1500, 3000, 4000, 8000):
        try:
            t0 = time.time()
            r = await client.chat.completions.create(
                model="deepseek-flash",
                messages=[{"role": "user", "content": user_content}],
                max_tokens=mt, temperature=0.6, timeout=180)
            c = r.choices[0].message.content or ""
            u = r.usage
            rt = (u.completion_tokens_details.reasoning_tokens
                  if u and u.completion_tokens_details else None)
            print("max=%d: (%.1fs) len=%d finish=%s reasoning=%s -> %r" % (
                mt, time.time() - t0, len(c), r.choices[0].finish_reason, rt, c[:60]))
        except Exception as e:
            print("max=%d: EXC %s %s" % (mt, type(e).__name__, str(e)[:200]))

asyncio.run(run())
