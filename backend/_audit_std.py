"""Audit มาตรฐานคำตอบ VihokAI ครบทุก provider (TH+EN):
short (ถามสั้น) / std (ถามกลาง) / long (ถามละเอียด) + ตรวจภาษาตรง + มีโครงสร้าง"""
import os, asyncio, sys, time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import main
from main import (call_vihokai, call_groq, call_gemini, call_openai, call_deepseek,
                  call_kimi, call_qwen, call_muse, call_claude)

PROVIDERS = [("vihokai", call_vihokai), ("groq", call_groq), ("gemini", call_gemini),
             ("chatgpt", call_openai), ("deepseek", call_deepseek), ("kimi", call_kimi),
             ("qwen", call_qwen), ("muse", call_muse), ("claude", call_claude)]

CASES = [
    ("short-TH", "2+2 เท่ากับเท่าไหร่", "th", 30, 400),
    ("std-TH", "อธิบายว่าปัญญาประดิษฐ์คืออะไร", "th", 100, 3000),
    ("long-TH", "อธิบาย Transformer อย่างละเอียด", "th", 1500, 12000),
    ("short-EN", "What is 2+2? short", "en", 5, 400),
    ("std-EN", "What is artificial intelligence?", "en", 100, 3000),
    ("long-EN", "Explain Transformer in detail", "en", 1500, 12000),
]

TH_CHARS = set("กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะาิีึืุูเแโใไำๅๆ็่้๊๋์")


def lang_ok(ans, locale):
    if not ans:
        return False
    th = sum(1 for c in ans if c in TH_CHARS)
    return (th > len(ans) * 0.05) if locale == "th" else (th < len(ans) * 0.05)


async def one(name, fn, case, q, locale, lo, hi):
    t = time.time()
    try:
        ans = await asyncio.wait_for(fn(q, locale), timeout=120)
        dt = time.time() - t
        ln = len(ans or "")
        ok_len = lo <= ln <= hi if ans else False
        ok_lang = lang_ok(ans, locale)
        verdict = "PASS" if (ok_len and ok_lang) else ("LANG?" if not ok_lang else "LEN?")
        return "%-8s %-9s %s %5dch %5.1fs lang=%s :: %r" % (
            name, case, verdict, ln, dt, "OK" if ok_lang else "WRONG", (ans or "<EMPTY>")[:70])
    except asyncio.TimeoutError:
        return "%-8s %-9s TIMEOUT" % (name, case)
    except Exception as e:
        return "%-8s %-9s EXC %s" % (name, case, str(e)[:100])


async def main_fn():
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    for name, fn in PROVIDERS:
        if only and only not in name:
            continue
        for case, q, locale, lo, hi in CASES:
            print(await one(name, fn, case, q, locale, lo, hi), flush=True)

asyncio.run(main_fn())
