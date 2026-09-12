"""
VihokAI Main.py - FAST VERSION + COMMANDS + TRANSLATE
เชื่อม Groq + Gemini + OpenAI + DeepSeek + Kimi + Claude + Qwen
รองรับ 3 โหมด: Single, Compare, Stream
รองรับ Slash Commands (/explain, /code, /godmode, etc.)
รองรับ Translation API (/api/translate, /api/languages)
"""
from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid, os, asyncio, json
from urllib.parse import urlencode
from dotenv import load_dotenv
from pathlib import Path
from db import (
    supabase,
    db_get_conversations,
    db_get_conversation,
    db_create_conversation,
    db_append_message,
    db_delete_conversation,
    db_get_memories,
    db_save_memory,
    db_clear_memories,
)

# ✅ Import ai_commands
from ai_commands import process_question_with_command, format_command_help

# ✅ Import translate
from translate import router as translate_router
from translate import SUPPORTED_LANGUAGES
from translate import translate_text_async
from api.auth.google.callback import router as google_callback_router
from api.auth.password import router as password_auth_router
from api.auth.password_reset import router as password_reset_router
from auth import current_user_id, verify_jwt

# ✅ Import Global Library Gateway (Library Search + RAG)
from gateway.api import library as gateway_library
from gateway.api import chat as gateway_chat

# ✅ Import AI Agents routers (Research / Image / Orchestrator + Judge)
from api import research as research_api
from api import image as image_api
from api import chat as ai_chat_api

# ✅ Kola Memory & Context (backend/kola_memory.py + supabase_kola_memory.sql)
try:
    import kola_memory as kola
    print("🧠 Kola Memory: ✅ module loaded")
except Exception as _kola_err:
    kola = None  # type: ignore
    print(f"🧠 Kola Memory: ❌ module failed ({_kola_err}) — endpoints จะตอบ 503")

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="Vihok AI v4 - Fast Version + Commands + Translate", version="5.0")
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://vihokai.com,https://www.vihokai.com"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ จัดการ exception ทั่วไป: ส่ง JSON พร้อม CORS + log traceback
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal error: {exc}"},
    )

# ✅ รวม Router
app.include_router(translate_router)
app.include_router(google_callback_router)

# ✅ Direct email + password auth (ไม่ใช้ 2FA / ไม่ใช้ reCAPTCHA)
app.include_router(password_auth_router)

# ✅ ลืมรหัสผ่าน (reset token ทางอีเมล · ใช้ครั้งเดียว · หมดอายุ 30 นาที)
app.include_router(password_reset_router)

# ✅ Global Library Gateway routers (Library Search + RAG Chat)
app.include_router(gateway_library.router)
app.include_router(gateway_chat.router)

# ✅ AI Agents routers
app.include_router(research_api.router)               # POST /research        (Research Agent)
app.include_router(image_api.router)                  # POST /image/generate  (Image Agent)
app.include_router(ai_chat_api.router, prefix="/ai")  # POST /ai/chat         (Orchestrator + Judge)

# ===== ตรวจสอบ API Keys =====
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
KIMI_API_KEY = os.getenv("KIMI_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

print(f"🔑 GROQ: {'✅' if GROQ_API_KEY else '❌'}")
print(f"🔑 Gemini: {'✅' if GEMINI_API_KEY else '❌'}")
print(f"🔑 OpenAI: {'✅' if OPENAI_API_KEY else '❌'}")
print(f"🔑 DeepSeek: {'✅' if DEEPSEEK_API_KEY else '❌'}")
print(f"🔑 Kimi: {'✅' if KIMI_API_KEY else '❌'}")
print(f"🔑 Claude: {'✅' if CLAUDE_API_KEY else '❌'}")

# ===== Models =====
class ChatRequest(BaseModel):
    question: str
    user_id: str = "anon"
    locale: str = "th"
    mode: str = "single"
    selected_ai: str = "auto"
    conversation_id: str | None = None

class MemorySaveRequest(BaseModel):
    user_id: str = "anon"
    question: str = ""
    answer: str = ""
    key: str | None = None
    value: str | None = None

class MemoryRecallRequest(BaseModel):
    user_id: str = "anon"
    key: str | None = None
    query: str | None = None

class NewChatRequest(BaseModel):
    user_id: str = "anon"
    title: str = "New Chat"

# ===== Databases =====
memories_db = {}
conversations_db = {}
current_conversation = {}

# ✅ ถ้า Supabase พร้อมใช้งาน → ใช้ฐานข้อมูลจริง
#    ถ้าไม่ → fallback ใช้ in-memory (ข้อมูลหายเมื่อ restart)
USE_SUPABASE = supabase is not None

if USE_SUPABASE:
    print("🗄️ Supabase storage: ENABLED")
else:
    print("⚠️ Supabase not configured — using in-memory storage. Data will be lost on restart.")

# ✅ Cache สำหรับลดการเรียกซ้ำ
answer_cache = {}

LANGUAGE_NAMES = {
    language["code"]: f'{language["name"]} ({language["native"]})'
    for language in SUPPORTED_LANGUAGES
}


def get_language_name(locale: str) -> str:
    normalized_locale = (locale or "th").strip().lower()
    return LANGUAGE_NAMES.get(normalized_locale, normalized_locale)

# ===== AI Providers (สมดุล: เร็วพอ + ตอบปานกลาง) =====
# VihokAI 1.0 Siri — อ่านรุ่นจาก env: VIHOK_AI_MODEL (รองรับชื่อเก่า VIHOKAI_MODEL ด้วย)
# คั่นหลายรุ่นด้วย comma ได้ เช่น "qwen/qwen3.8-27b, qwen/qwen3.6-27b" (ลองทีละตัวจนกว่าจะตอบได้)
# คีย์: VIHOK_API_KEY (ว่างได้ -> fallback GROQ_API_KEY), base: VIHOK_BASE_URL (ว่างได้ -> GROQ_BASE_URL)
def _vihokai_models() -> list:
    raw = (
        os.getenv("VIHOK_AI_MODEL")
        or os.getenv("VIHOKAI_MODEL")
        or "openai/gpt-oss-120b"
    )
    models = [m.strip() for m in raw.split(",") if m.strip()]
    return [m for m in models if " " not in m] or ["openai/gpt-oss-120b"]


def _vihokai_key() -> str | None:
    # ลอง VIHOK_API_KEY ก่อน — ถ้า 401 ค่อยตกไป GROQ_API_KEY (กันคีย์คนละระบบ)
    for env_name in ("VIHOK_API_KEY", "VIHOKAI_API_KEY", "GROQ_API_KEY"):
        key = (os.getenv(env_name) or "").strip()
        if not key:
            continue
        # Groq-compatible keys ขึ้นต้น gsk_ — คีย์รูปแบบอื่น (เช่น LLM_...) ใช้กับ Groq ไม่ได้ ข้ามเลย
        base = _vihokai_base_url()
        if "groq.com" in base and not key.startswith("gsk_"):
            print(f"⚠️ {env_name} ไม่ใช่ Groq key (ข้าม -> ตัวถัดไป)")
            continue
        return key
    return None


def _vihokai_base_url() -> str:
    return (
        os.getenv("VIHOK_BASE_URL")
        or os.getenv("VIHOKAI_BASE_URL")
        or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    )


def _is_reasoning_model(model: str) -> bool:
    """GPT-5 / o-series เป็น reasoning model — ห้ามส่ง temperature/max_tokens"""
    m = (model or "").lower()
    return m.startswith("gpt-5") or m.startswith("o1") or m.startswith("o3") or m.startswith("o4")


def _nano_budget(long: bool = False) -> int:
    """โควตา token ฝั่ง GPT-5-nano — default 1024, โหมดยาว 4000 (ปรับผ่าน NANO_BUDGET / NANO_BUDGET_LONG)"""
    try:
        if long:
            return max(1024, min(8000, int(os.getenv("NANO_BUDGET_LONG", "4000"))))
        return max(256, min(4000, int(os.getenv("NANO_BUDGET", "1024"))))
    except ValueError:
        return 4000 if long else 1024


# ===== ระดับความยาวคำตอบ (มาตรฐาน AI ทั่วไป) =====
# short  = ตอบสั้น (ถามสั้น/ทักทาย) → max_tokens 300
# std    = มาตรฐาน (default) → max_tokens 1500 (~800-1200 คำ)
# long   = ยาว (ถามละเอียด/มีคำสั่ง /expand /deep /godmode...) → max_tokens 4000
LONG_COMMANDS = {"/expand", "/lengthen", "/deep", "/expert", "/research", "/godmode", "/steps", "/howto", "/plan", "/strategy", "/seo", "/compare", "/contrast", "/proscons", "/critic", "/interview", "/quiz", "/flashcards", "/examples", "/analogy", "/teacher", "/artifacts", "/ooda"}
LONG_KEYWORDS = ("อย่างละเอียด", "ละเอียด", "เจาะลึก", "ยาว", "step", "วิธีทำ", "ขั้นตอน", "เปรียบเทียบ", "วิเคราะห์", "แผน", "in detail", "detailed", "step-by-step", "step by step", "comprehensive", "thorough")
SHORT_KEYWORDS = ("สั้นๆ", "สั้น", "สั้นที่สุด", "one word", "สั้นๆ", "brief", "สั้น", "ย่อ")


def _length_tier(question: str, command: str | None = None) -> str:
    """ตัดสินใจระดับความยาวจากคำสั่ง + คำถาม: short | std | long"""
    if command in LONG_COMMANDS:
        return "long"
    q = (question or "").lower()
    if any(k in q for k in LONG_KEYWORDS):
        return "long"
    if len(q) <= 30 or any(k in q for k in SHORT_KEYWORDS):
        return "short"
    return "std"


def _tier_tokens(tier: str) -> int:
    return {"short": 300, "std": 1500, "long": 4000}.get(tier, 1500)


def _tier_hint(tier: str, language_name: str) -> str:
    if tier == "long":
        return f"(ตอบเป็นภาษา {language_name} อย่างละเอียด มีโครงสร้าง หัวข้อ ตัวอย่างประกอบ ตอบยาวได้เต็มที่)"
    if tier == "short":
        return f"(ตอบเป็นภาษา {language_name} สั้นๆ กระชับ ตรงประเด็น)"
    return f"(ตอบเป็นภาษา {language_name} ครบถ้วน มีโครงสร้างและตัวอย่างพอควร)"


async def _call_groq_model(model: str, prompt: str, locale: str, name: str = None, system_prompt: str = None, api_key: str | None = None, base_url: str | None = None) -> str | None:
    """เรียก Groq/OpenAI-compatible API ด้วย model ที่ระบุ — ใช้ร่วมกันระหว่าง call_groq / call_vihokai"""
    key = api_key or GROQ_API_KEY
    if not key:
        return None
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=key,
        base_url=base_url or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    )
    mem_text = f"จำไว้: ผู้ใช้ชื่อ {name}. " if name else ""

    language_name = get_language_name(locale)
    tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
    # มาตรฐาน AI: ตอบตรงภาษาผู้ใช้ + ครบถ้วนตามระดับความยาว
    std_system = (
        "You are VihokAI, a helpful assistant. Always reply in the user's language. "
        "Be accurate and complete: cover the key points with structure and examples. No filler."
    )
    full_prompt = f"{mem_text}คำถาม: {prompt} {_tier_hint(tier, language_name)}"

    messages = [{"role": "system", "content": f"{std_system} {system_prompt or ''}".strip()}]
    messages.append({"role": "user", "content": full_prompt})

    # reasoning models (GPT-5/o-series): ใช้ max_completion_tokens + reasoning_effort แทน
    # Groq free tier จำกัด OTPM ~1000 (qwen โดน 429 เมื่อขอ long 4000) → clamp เหลือ 900 กัน rate limit
    def _groq_budget(t: str) -> int:
        try:
            cap = int(os.getenv("GROQ_MAX_TOKENS", "900"))
        except ValueError:
            cap = 900
        return min(_tier_tokens(t), max(300, cap))
    kwargs = (
        {"max_completion_tokens": _nano_budget(long=(tier == "long")), "reasoning_effort": "minimal"}
        if _is_reasoning_model(model)
        else {"max_tokens": _groq_budget(tier), "temperature": 0.6}
    )
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        **kwargs
    )
    return response.choices[0].message.content


async def call_vihokai(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    """VihokAI 1.0 Siri — รุ่น/คีย์อ่านจาก env: VIHOK_AI_MODEL + VIHOK_API_KEY (fallback Groq)"""
    key = _vihokai_key()
    if not key:
        return None
    base_url = _vihokai_base_url()
    last_err = None
    for model in _vihokai_models():
        try:
            ans = await _call_groq_model(model, prompt, locale, name, system_prompt, api_key=key, base_url=base_url)
            if ans:
                return ans
        except Exception as e:
            last_err = e
            continue
    if last_err:
        print(f"❌ VihokAI error: {last_err}")
    return None


async def call_groq(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not GROQ_API_KEY:
            return None
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        )
        mem_text = f"จำไว้: ผู้ใช้ชื่อ {name}" if name else ""
        
        language_name = get_language_name(locale)
        full_prompt = f"""{mem_text}
คำถาม: {prompt}

    ตอบเป็นภาษา {language_name} เท่านั้น อย่างเป็นธรรมชาติ กระชับได้ใจความ มีรายละเอียดพอเพียง ตอบประมาณ 300-500 คำ"""
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": full_prompt})
        
        # META_AI_MODEL ไม่ใช่ model id จริง (ชื่อผลิตภัณฑ์) -> ข้าม ใช้ GROQ_MODEL > GROQ_AI_MODEL
        _gm = (os.getenv("GROQ_MODEL") or os.getenv("GROQ_AI_MODEL") or "openai/gpt-oss-120b").strip()
        if " " in _gm:
            _gm = "openai/gpt-oss-120b"
        return await _call_groq_model(_gm, prompt, locale, name, system_prompt)
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return None

async def call_qwen(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    """Qwen3 8B ผ่าน Groq — รุ่นหลัก qwen/qwen3.8-27b, fallback qwen/qwen3.6-27b (ปรับผ่าน QWEN_MODEL คั่น comma ได้)"""
    try:
        if not GROQ_API_KEY:
            return None
        raw = (os.getenv("QWEN_MODEL") or "qwen/qwen3.8-27b, qwen/qwen3.6-27b").strip()
        models = [m.strip() for m in raw.split(",") if m.strip() and " " not in m.strip()]
        if not models:
            models = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b"]
        last_err = None
        for model in models:
            try:
                ans = await _call_groq_model(model, prompt, locale, name, system_prompt)
                if ans:
                    return ans
            except Exception as e:
                last_err = e
                continue
        if last_err:
            print(f"❌ Qwen error: {last_err}")
        return None
    except Exception as e:
        print(f"❌ Qwen error: {e}")
        return None

async def call_muse(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    """Muse Spark ผ่าน api.meta.ai (OpenAI-compatible) — model ตาม MUSE_AI_MODEL (default muse-spark-1.1)
    หมายเหตุ: max_tokens ต้อง >=1500 (ขอน้อยกว่านั้น API คืน finish=length + content ว่าง)"""
    try:
        key = (os.getenv("MUSE_API_KEY") or "").strip()
        if not key:
            return None
        import httpx
        base = (os.getenv("MUSE_BASE_URL", "https://api.meta.ai/v1") or "").strip().rstrip("/")
        model = (os.getenv("MUSE_AI_MODEL", "muse-spark-1.1") or "").strip()
        if not model or " " in model:
            model = "muse-spark-1.1"
        mem_text = f"จำไว้: ผู้ใช้ชื่อ {name}. " if name else ""
        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        # Muse สับสนเมื่อมี hint ในวงเล็บต่อท้ายคำถาม (ตอบว่าง finish=length — วัดจริง bare ตอบได้, มี hint ว่าง)
        # → ไม่เติม hint ใน user message; สั่งภาษาผ่าน system message แทน (เสถียรกว่า)
        messages = [{"role": "system",
                     "content": ("You are Muse Spark, a helpful assistant. "
                                 "Always reply in the user's language. Be accurate and complete: "
                                 "cover the key points with structure and examples. No filler. "
                                 + (system_prompt or "")).strip()},
                    {"role": "user", "content": f"{mem_text}{prompt}"}]
        # กัน content ว่างแบบ finish=length: ขั้นต่ำ 1500
        budget = max(_tier_tokens(_tier), 1500)
        # Muse API ไม่เสถียร (บางครั้งคืนว่างทั้งที่ prompt เดิมตอบได้) → retry สูงสุด 3 ครั้ง
        content = ""
        async with httpx.AsyncClient(timeout=90.0) as client:
            for _try in range(3):
                r = await client.post(
                    f"{base}/chat/completions",
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                    json={"model": model, "messages": messages,
                          "max_tokens": budget, "temperature": 0.6})
                if r.status_code != 200:
                    print(f"❌ Muse error: HTTP {r.status_code} {r.text[:200]}")
                    break
                data = r.json()
                content = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
                if content:
                    break
                print(f"⚠️ Muse empty (try {_try + 1}/3) — retry...")
        return content or None
    except Exception as e:
        print(f"❌ Muse error: {e}")
        return None

async def call_gemini(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not GEMINI_API_KEY:
            return None
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gm = (os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite") or "").strip()
        if _gm.startswith("models/"):
            _gm = _gm[len("models/"):]
        model = genai.GenerativeModel(_gm)
        mem_text = f"ผู้ใช้ชื่อ {name}. " if name else ""

        language_name = get_language_name(locale)
        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        full_prompt = f"""{mem_text}
{system_prompt if system_prompt else ''}

คำถาม: {prompt}

{_tier_hint(_tier, language_name)}"""

        res = model.generate_content(full_prompt)
        return res.text
    except Exception as e:
        print(f"❌ Gemini error: {e}")
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            _gfb = (os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.1-pro-preview") or "").strip()
            if _gfb.startswith("models/"):
                _gfb = _gfb[len("models/"):]
            model = genai.GenerativeModel(_gfb)
            mem_text = f"ผู้ใช้ชื่อ {name}. " if name else ""
            full_prompt = f"""{mem_text}
{system_prompt if system_prompt else ''}

คำถาม: {prompt}

ตอบเป็นภาษา {language_name} เท่านั้น อย่างละเอียดพอควร มีตัวอย่างประกอบ"""
            res = model.generate_content(full_prompt)
            return res.text
        except Exception as e2:
            print(f"❌ Gemini fallback error: {e2}")
            return None

async def call_openai(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not OPENAI_API_KEY:
            return None
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=OPENAI_API_KEY,
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        mem_text = f"User name is {name}. " if name else ""

        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        std_system = (
            "You are VihokAI, a helpful assistant. Always reply in the user's language. "
            "Be accurate and complete: cover the key points with structure and examples. No filler."
        )
        messages = [{"role": "system", "content": f"{std_system} {system_prompt or ''}".strip()}]
        messages.append({"role": "user", "content": f"{mem_text}{prompt} {_tier_hint(_tier, get_language_name(locale))} "})

        _om = os.getenv("OPENAI_MODEL", "gpt-5-nano")
        _okwargs = (
            {"max_completion_tokens": _nano_budget(long=(_tier == "long")), "reasoning_effort": "minimal"}
            if _is_reasoning_model(_om)
            else {"max_tokens": _tier_tokens(_tier), "temperature": 0.6}
        )
        response = await client.chat.completions.create(
            model=_om,
            messages=messages,
            **_okwargs
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ OpenAI error: {e}")
        return None

async def call_deepseek(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not DEEPSEEK_API_KEY:
            return None
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1")
        mem_text = f"User name is {name}. " if name else ""
        
        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": f"{mem_text}{prompt} {_tier_hint(_tier, get_language_name(locale))} "})

        response = await client.chat.completions.create(
            model=os.getenv("DEEPSEEK_MODEL", "deepseek-flash"),
            messages=messages,
            max_tokens=_tier_tokens(_tier),
            temperature=0.6
        )
        content = (response.choices[0].message.content or "").strip()
        # deepseek-flash เป็น reasoning แบบเงียบ: บางคำถามกิน reasoning เต็มโควตา
        # (วัดจริง: ตอบว่าง finish=length reasoning=max) → retry ด้วย deepseek-chat ที่ไม่กิน reasoning
        if not content:
            try:
                fb = await client.chat.completions.create(
                    model="deepseek-chat",
                    messages=messages,
                    max_tokens=_tier_tokens(_tier),
                    temperature=0.6
                )
                content = (fb.choices[0].message.content or "").strip()
                if content:
                    print("⚠️ DeepSeek flash ว่าง → fallback deepseek-chat ตอบแทน")
            except Exception as fe:
                print(f"❌ DeepSeek fallback error: {fe}")
        return content or None
    except Exception as e:
        print(f"❌ DeepSeek error: {e}")
        return None

async def call_kimi(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not KIMI_API_KEY:
            return None
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=KIMI_API_KEY, base_url="https://api.moonshot.ai/v1")
        mem_text = f"User name is {name}. " if name else ""
        
        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": f"{mem_text}{prompt} {_tier_hint(_tier, get_language_name(locale))} "})

        # kimi-k3 เป็น reasoning model: (1) temperature ต้อง = 1 เท่านั้น (2) reasoning tokens
        # กินโควตา max_tokens ด้วย (วัดจริง: long prompt กิน reasoning ~1500) → long ต้อง 4000+1500 กันตอบว่างแบบ finish=length
        _kimi_budget = {"short": 600, "std": 2500, "long": 6000}.get(_tier, 2500)
        response = await client.chat.completions.create(
            model=os.getenv("KIMI_MODEL", "kimi-k3"),
            messages=messages,
            max_tokens=_kimi_budget,
            temperature=1
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Kimi error: {e}")
        return None

async def call_claude(prompt: str, locale: str, name: str = None, system_prompt: str = None) -> str | None:
    try:
        if not CLAUDE_API_KEY:
            return None
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=CLAUDE_API_KEY)
        mem_text = f"User name is {name}. " if name else ""

        _tier = _length_tier(prompt, (system_prompt or "").split()[0] if (system_prompt or "").startswith("/") else None)
        full_prompt = f"{mem_text}{prompt} {_tier_hint(_tier, get_language_name(locale))}"
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{full_prompt}"

        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=_tier_tokens(_tier),
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.content[0].text
    except Exception as e:
        print(f"❌ Claude error: {e}")
        return None

# ===== GET ANSWER (ตอบตัวแรกที่เร็วที่สุด) =====
async def get_ai_answer(question: str, memories: list, locale: str, selected_ai: str = "auto",
                        kola_memories: list | None = None):
    # ✅ ตรวจสอบ Cache ก่อน
    language_name = get_language_name(locale)
    cache_key = f"{question}:{language_name}:{selected_ai}"
    if cache_key in answer_cache:
        return f"📦 (จากความจำ) {answer_cache[cache_key]}"

    # Kola Memory: เติมเป็นข้อมูลอ้างอิงใน system_prompt (ไม่ใช่คำสั่งระบบ;
    # ข้อความล่าสุดของผู้ใช้สำคัญกว่า Memory เก่าเสมอ)
    kola_hint = ""
    try:
        items = kola_memories or []
        if items and kola is not None:
            lines = []
            used = 0
            for mm in items:
                line = "- [%s] %s" % (mm.get("category", "fact"), mm.get("content", ""))
                cost = kola.estimate_tokens(line)
                if used + cost > kola.MEMORY_CONTEXT_TOKEN_BUDGET:
                    continue
                lines.append(line)
                used += cost
            if lines:
                kola_hint = ("[Kola Memory — ข้อมูลอ้างอิง (ข้อความล่าสุดของผู้ใช้สำคัญกว่า)]:\n"
                             + "\n".join(lines))
    except Exception as _he:
        print(f"⚠️ Kola hint skip: {_he}")
    
    name = None
    for m in memories:
        if m.get("question") == "user_name":
            name = m.get("answer")

    if "ชื่ออะไร" in question and locale.strip().lower() == "th":
        if name:
            return f"คุณชื่อ {name} ครับ! ผมจำได้จากที่เราคุยกันไว้ ✅\n\nยินดีที่ได้คุยกันอีกครับ {name}"
        else:
            return "ผมยังไม่ทราบชื่อคุณเลยครับ บอกชื่อให้ผมจำไว้ได้ไหมครับ?"

    # ✅ ประมวลผลคำสั่ง (/command)
    system_prompt = None
    command = None
    clean_question = question

    system_prompt, clean_question, command, extra_params = process_question_with_command(question, system_prompt)

    if command == "/help":
        return format_command_help()

    # ✅ ส่ง system_prompt ไปยัง AI ด้วย
    ai_map = {
        "auto": [call_vihokai, call_groq, call_gemini, call_openai, call_deepseek, call_kimi, call_qwen, call_muse, call_claude],
        "vihokai": [call_vihokai],
        "kola_prime": [call_vihokai, call_groq, call_openai],
        "kola_swift": [call_groq],
        "spark": [call_muse, call_groq],
        "chatgpt": [call_openai],
        "gemini": [call_gemini],
        "deepseek": [call_deepseek],
        "kimi": [call_kimi],
        "qwen": [call_qwen],
        "muse": [call_muse],
        "meta_ai": [call_muse, call_groq],
        "claude": [call_claude],
    }
    
    funcs = ai_map.get(selected_ai, ai_map["auto"])
    # เติม Kola hint ต่อท้าย system_prompt ทุก provider (ถ้ามี)
    _sp = (system_prompt + "\n" + kola_hint).strip() if (system_prompt or kola_hint) else None
    tasks = [func(clean_question, locale, name, _sp) for func in funcs]
    
    # ✅ ตอบตัวแรกที่ได้ (ไม่ต้องรอทุกตัว) - เร็วขึ้น (เผื่อคำตอบยาว: 90 วิ)
    first_answer = None
    timeout = 90
    
    try:
        for task in asyncio.as_completed(tasks):
            try:
                result = await asyncio.wait_for(task, timeout=timeout)
                if result:
                    first_answer = result
                    break
            except asyncio.TimeoutError:
                continue
            except Exception:
                continue
    except Exception:
        pass
    
    if first_answer:
        answer_cache[cache_key] = first_answer
        return first_answer
    
    # Fallback
    mem_info = f" (ผมจำได้ว่าคุณชื่อ {name})" if name else ""
    return f"{question} - นี่คือคำตอบจาก Vihok AI v4{mem_info}\n\nผมพร้อมช่วยคุณแล้วครับ!"

# ===== API Endpoints =====
async def ensure_conversation(user_id: str, conversation_id: str | None, title: str):
    """สร้าง/ดึง conversation — รองรับทั้ง Supabase และ in-memory"""
    if USE_SUPABASE:
        # 1) มี conversation_id → ดึงจาก DB
        if conversation_id:
            conv = await db_get_conversation(user_id, conversation_id)
            if conv:
                return conv
        # 2) ยังไม่มี → สร้างใหม่ใน Supabase
        conv = await db_create_conversation(user_id=user_id, title=title.strip()[:40])
        return conv

    # ---- fallback: in-memory ----
    convs = conversations_db.setdefault(user_id, [])
    if conversation_id:
        for conv in convs:
            if conv["id"] == conversation_id:
                return conv

    conv = {
        "id": conversation_id or str(uuid.uuid4()),
        "title": title[:40] + ("..." if len(title) > 40 else ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "messages": [],
    }
    convs.insert(0, conv)
    return conv


async def save_chat_result(user_id: str, conversation_id: str | None, question: str, answer: str):
    """บันทึกแชท — รองรับทั้ง Supabase และ in-memory"""
    conv = await ensure_conversation(user_id, conversation_id, question)

    if USE_SUPABASE:
        # ✅ บันทึก messages ลง Supabase
        await db_append_message(user_id, conv["id"], "user", question)
        await db_append_message(user_id, conv["id"], "assistant", answer)

        # ✅ บันทึกความทรงจำลง Supabase ด้วย
        if "ชื่ออะไร" not in question:
            await db_save_memory(user_id, question[:100], answer[:200])
        return conv["id"]

    # ---- fallback: in-memory ----
    now = datetime.now(timezone.utc).isoformat()
    conv["messages"].extend([
        {"role": "user", "content": question, "timestamp": now},
        {"role": "assistant", "content": answer, "timestamp": datetime.now(timezone.utc).isoformat()},
    ])

    if "ชื่ออะไร" not in question:
        memories = memories_db.setdefault(user_id, [])
        memories.append({"question": question[:100], "answer": answer[:200], "saved_at": now})
        memories_db[user_id] = memories[-10:]
    return conv["id"]

@app.post("/api/new-chat")
async def new_chat(req: NewChatRequest, user_id: str = Depends(current_user_id)):
    req.user_id = user_id  # ✅ ใช้ id จาก token เท่านั้น (ไม่เชื่อ body)
    if USE_SUPABASE:
        conv = await db_create_conversation(user_id=req.user_id, title=req.title)
        current_conversation[req.user_id] = conv["id"]
        return {
            "status": "created",
            "conversation_id": conv["id"],
            "conversation": conv,
            "powered_by": "Vihok AI"
        }

    # ---- fallback: in-memory ----
    conv_id = str(uuid.uuid4())
    new_conv = {
        "id": conv_id,
        "title": req.title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "messages": []
    }
    
    if req.user_id not in conversations_db:
        conversations_db[req.user_id] = []
    
    conversations_db[req.user_id].insert(0, new_conv)
    current_conversation[req.user_id] = conv_id
    
    return {
        "status": "created",
        "conversation_id": conv_id,
        "conversation": new_conv,
        "powered_by": "Vihok AI"
    }

@app.get("/api/conversations")
async def get_conversations(
    user_id: str = Depends(current_user_id),
    limit: int = Query(default=50),
    offset: int = Query(default=0)
):
    if USE_SUPABASE:
        convs = await db_get_conversations(user_id=user_id, limit=limit, offset=offset)
        convs = convs or []
        return {
            "conversations": convs,
            "total": len(convs),
            "user_id": user_id,
            "powered_by": "Vihok AI",
        }

    # ---- fallback: in-memory ----
    convs = conversations_db.get(user_id, [])
    total = len(convs)
    paginated = convs[offset:offset+limit]
    
    return {
        "conversations": paginated,
        "total": total,
        "user_id": user_id,
        "powered_by": "Vihok AI"
    }

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(current_user_id)
):
    if USE_SUPABASE:
        conv = await db_get_conversation(user_id, conversation_id)
        if not conv:
            return {"error": "Conversation not found"}
        return conv

    # ---- fallback ----
    # ...existing code...


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(current_user_id)
):
    if USE_SUPABASE:
        await db_delete_conversation(user_id, conversation_id)
        return {"status": "deleted", "conversation_id": conversation_id}

    # ---- fallback ----
    # ...existing code...

# --- Chat (Single / Compare) ---
@app.post("/api/chat")
async def chat(req: ChatRequest, user_id: str = Depends(current_user_id)):
    req.user_id = user_id  # ✅ ใช้ id จาก token เท่านั้น
    mems = memories_db.get(req.user_id, [])

    # ✅ กำหนดค่าเริ่มต้นไว้ก่อนเสมอ
    all_answers = {}
    final_answer = ""

    # ถ้าเป็นโหมด compare เรียกทุก AI แล้วเปรียบเทียบ
    if req.mode == "compare":
        name = None
        for m in mems:
            if m.get("question") == "user_name":
                name = m.get("answer")
        
        tasks = [
            call_vihokai(req.question, req.locale, name),
            call_groq(req.question, req.locale, name),
            call_gemini(req.question, req.locale, name),
            call_openai(req.question, req.locale, name),
            call_deepseek(req.question, req.locale, name),
            call_kimi(req.question, req.locale, name),
            call_claude(req.question, req.locale, name),
        ]
        results = await asyncio.gather(*tasks)
        # ✅ เรียงให้ตรงกับ tasks
        ai_names = ["vihokai", "meta_ai", "gemini", "chatgpt", "deepseek", "kimi", "claude"]
        answer_text = "📊 **เปรียบเทียบคำตอบจากทุก AI:**\n\n"
        display_names = {
            "vihokai": "VihokAI 1.0",
            "chatgpt": "ChatGPT",
            "gemini": "Gemini",
            "deepseek": "DeepSeek",
            "kimi": "Kimi",
            "meta_ai": "Groq",
            "claude": "Claude"
        }
        
        for i, result in enumerate(results):
            if result:
                all_answers[ai_names[i]] = result
                name_display = display_names.get(ai_names[i], ai_names[i])
                answer_text += f"**{name_display}:**\n{result}\n\n"
        
        final_answer = ""
        if len(all_answers) >= 5:
            judge_prompt = f"""
            คุณคือผู้ตัดสิน AI ที่ดีที่สุด
            คำถาม: {req.question}
            
            คำตอบจาก AI ทั้งหมด:
            {json.dumps(all_answers, ensure_ascii=False, indent=2)}
            
            จงสรุปคำตอบที่ดีที่สุด พร้อมเหตุผลสั้นๆ (ตอบเป็นภาษา {get_language_name(req.locale)} เท่านั้น)
            """
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(
                    api_key=GROQ_API_KEY,
                    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
                )
                judge_res = await client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
                    messages=[{"role": "user", "content": judge_prompt}],
                    max_tokens=400
                )
                final_answer = judge_res.choices[0].message.content
                answer_text += f"\n📌 **สรุปโดย Judge:**\n{final_answer}"
            except Exception as e:
                print(f"❌ Judge error: {e}")
                answer_text += f"\n📌 **สรุปโดย Judge:**\n{all_answers.get('meta_ai', 'ไม่สามารถสรุปได้')}"
        
        answer = answer_text
    else:
        # Single Mode — เติม Kola Memory (best-effort: ล้มเหลวก็แชทต่อได้ปกติ)
        kola_ctx: list = []
        try:
            if kola is not None and USE_SUPABASE:
                _ks = await kola.get_memory_settings(req.user_id)
                if _ks.get("memory_enabled", True) and _ks.get("use_cross_chat_memory", True):
                    kola_ctx = await kola.retrieve_memories(req.user_id, clean_question)
        except Exception as _ke:
            print(f"⚠️ Kola retrieve skip: {_ke}")
        answer = await get_ai_answer(req.question, mems, req.locale, req.selected_ai,
                                     kola_memories=kola_ctx)

    conv_id = await save_chat_result(req.user_id, req.conversation_id, req.question, answer)

    # สกัด memory แบบ background (ไม่บล็อก response; ล้มเหลวก็เงียบ)
    try:
        if kola is not None and USE_SUPABASE and req.mode != "compare":
            asyncio.create_task(kola.extract_and_store_memory(
                req.user_id, clean_question, (answer or "")[:2000]))
    except Exception as _xe:
        print(f"⚠️ Kola extract skip: {_xe}")

    return {
        "conversation_id": conv_id,
        "answer": answer,
        "all_answers": all_answers if req.mode == "compare" else None,   # ✅ มีค่าแล้ว
        "final_answer": final_answer if req.mode == "compare" else None, # ✅ มีค่าแล้ว
        "model": "vihok-ai-v4-fast",
        "badge": "✓ ตรวจสอบแล้วโดย Vihok AI",
        "powered_by": "Vihok AI",
        "locale": req.locale,
        "mode": req.mode
    }

# --- Streaming ---
@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, user_id: str = Depends(current_user_id)):
    req.user_id = user_id  # ✅ ใช้ id จาก token เท่านั้น
    """Streaming Response - พิมพ์ทีละคำ"""
    mems = memories_db.get(req.user_id, [])
    
    async def generate():
        name = None
        for m in mems:
            if m.get("question") == "user_name":
                name = m.get("answer")
        
        # ✅ เรียก Groq ก่อน (เร็วสุด)
        result = await call_groq(req.question, req.locale, name)
        
        if not result:
            result = await call_openai(req.question, req.locale, name)
        
        if not result:
            result = await call_gemini(req.question, req.locale, name)
        
        if not result:
            result = "❌ ไม่สามารถติดต่อ AI ได้"

        await save_chat_result(req.user_id, req.conversation_id, req.question, result)
        
        # ✅ ส่งทีละคำ
        for word in result.split():
            yield f"data: {word}\n\n"
            await asyncio.sleep(0.03)
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

# --- Memory ---
@app.post("/memory/save")
async def save_memory(
    user_id: str = Depends(current_user_id),
    question: str | None = Query(default=None),
    answer: str | None = Query(default=None),
    key: str | None = Query(default=None),
    value: str | None = Query(default=None),
    body: MemorySaveRequest | None = None
):
    uid = user_id  # ✅ จาก token เท่านั้น
    q = question or (body.question if body else "") or (body.key if body and body.key else key) or ""
    a = answer or (body.answer if body else "") or (body.value if body and body.value else value) or ""

    if "???" in q or "???" in a:
        return {"status": "skipped", "message": "encoding error"}

    if USE_SUPABASE:
        await db_save_memory(uid, q, a)
        mems = await db_get_memories(uid) or []
        return {
            "status": "saved",
            "user_id": uid,
            "question": q,
            "answer": a,
            "count": len(mems),
            "powered_by": "Vihok AI",
        }

    # ---- fallback: in-memory ----
    memories = memories_db.setdefault(user_id, [])
    memories.append({"question": q, "answer": a, "saved_at": datetime.now(timezone.utc).isoformat()})
    memories_db[user_id] = memories[-10:]
    return {"status": "saved", "user_id": uid, "question": q, "answer": a, "count": len(memories_db[uid]), "powered_by": "Vihok AI"}

async def _recall_memories(user_id: str, q: str):
    """ตรรกะค้น memory ใช้ร่วมกันทั้ง GET และ POST"""
    if USE_SUPABASE:
        mems = await db_get_memories(user_id) or []
    else:
        mems = [m for m in memories_db.get(user_id, []) if "???" not in str(m)]

    if q:
        filtered = [m for m in mems if q.lower() in str(m).lower()]
        return {"user_id": user_id, "query": q, "memories": filtered, "count": len(filtered), "powered_by": "Vihok AI"}
    return {"user_id": user_id, "memories": mems, "count": len(mems), "powered_by": "Vihok AI"}


@app.get("/memory/recall")
async def recall_get(
    user_id: str = Depends(current_user_id),
    query: str = Query(default=""),
    key: str = Query(default="")
):
    return await _recall_memories(user_id, query or key)

@app.post("/memory/recall")
async def recall_post(body: MemoryRecallRequest, user_id: str = Depends(current_user_id)):
    return await _recall_memories(user_id, body.query or body.key or "")

@app.post("/memory/clear")
async def clear_memory(user_id: str = Depends(current_user_id)):
    if USE_SUPABASE:
        await db_clear_memories(user_id)
        return {"status": "cleared", "user_id": user_id}

    memories_db[user_id] = []
    return {"status": "cleared", "user_id": user_id}


@app.get("/memory/clear")
async def clear_memory_get(user_id: str = Depends(current_user_id)):
    if USE_SUPABASE:
        await db_clear_memories(user_id)
        return {"status": "cleared", "user_id": user_id}

    memories_db[user_id] = []
    return {"status": "cleared", "user_id": user_id}


# ===== Kola Memory & Context (ตาราง kola_* — ไม่กระทบ /memory/* เดิม) =====
def _kola_guard():
    if kola is None:
        raise HTTPException(status_code=503, detail="Kola Memory module ไม่พร้อม")
    if not USE_SUPABASE:
        raise HTTPException(status_code=503, detail="ต้องเชื่อม Supabase ก่อน (รัน supabase_kola_memory.sql)")


class KolaMemoryCreate(BaseModel):
    category: str = "fact"
    content: str = ""
    importance: int = 3


class KolaMemoryUpdate(BaseModel):
    category: str | None = None
    content: str | None = None
    importance: int | None = None


class KolaSettingsPatch(BaseModel):
    memory_enabled: bool | None = None
    extraction_enabled: bool | None = None
    use_cross_chat_memory: bool | None = None
    retention_days: int | None = None
    max_memories: int | None = None


@app.get("/api/kola/status")
async def kola_status(user_id: str = Depends(current_user_id)):
    """สถานะ Kola Memory (ONLINE/OFFLINE) สำหรับป้ายใน Dashboard"""
    _kola_guard()
    try:
        return await kola.kola_status(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kola status ล้มเหลว: {e}")


@app.get("/api/kola/memories")
async def kola_list_memories(user_id: str = Depends(current_user_id),
                             category: str = Query(default=""),
                             search: str = Query(default=""),
                             limit: int = Query(default=50, ge=1, le=200),
                             offset: int = Query(default=0, ge=0)):
    _kola_guard()
    items = await kola.list_memories(user_id, category, search, limit, offset)
    return {"user_id": user_id, "memories": items, "count": len(items), "powered_by": "Kola Memory"}


@app.post("/api/kola/memories", status_code=201)
async def kola_create_memory(body: KolaMemoryCreate, user_id: str = Depends(current_user_id)):
    _kola_guard()
    if not body.content.strip() or len(body.content) > 1000:
        raise HTTPException(status_code=422, detail="content ต้องมี 1–1000 ตัวอักษร")
    if body.category not in kola.CATEGORIES:
        raise HTTPException(status_code=422, detail={"valid_categories": list(kola.CATEGORIES)})
    row = await kola.create_manual_memory(user_id, body.category, body.content, body.importance)
    if not row:
        raise HTTPException(status_code=422, detail="สร้างไม่ได้ (อาจมีข้อมูลอ่อนไหว หรือ DB ล้มเหลว)")
    return row


@app.patch("/api/kola/memories/{memory_id}")
async def kola_update_memory(memory_id: str, body: KolaMemoryUpdate,
                             user_id: str = Depends(current_user_id)):
    _kola_guard()
    row = await kola.update_memory(user_id, memory_id,
                                   {"category": body.category, "content": body.content,
                                    "importance": body.importance})
    if not row:
        raise HTTPException(status_code=404, detail="ไม่พบ memory นี้ (หรือไม่ใช่ของคุณ)")
    return row


@app.delete("/api/kola/memories/{memory_id}")
async def kola_delete_memory(memory_id: str, user_id: str = Depends(current_user_id)):
    _kola_guard()
    if not await kola.delete_memory(user_id, memory_id):
        raise HTTPException(status_code=404, detail="ไม่พบ memory นี้ (หรือไม่ใช่ของคุณ)")
    return {"status": "deleted", "id": memory_id}


@app.delete("/api/kola/memories")
async def kola_clear_memories(user_id: str = Depends(current_user_id),
                              confirm: str = Query(default="")):
    """ล้างทั้งหมด — ต้องส่ง ?confirm=yes กันกดพลาด"""
    _kola_guard()
    if confirm.lower() != "yes":
        raise HTTPException(status_code=422, detail="ต้องยืนยัน ?confirm=yes")
    n = await kola.clear_memories(user_id)
    return {"status": "cleared", "count": n}


@app.post("/api/kola/memories/search")
async def kola_search_memories(body: dict, user_id: str = Depends(current_user_id)):
    _kola_guard()
    q = str((body or {}).get("query", ""))[:500]
    if not q.strip():
        raise HTTPException(status_code=422, detail="ต้องมี query")
    items = await kola.retrieve_memories(user_id, q)
    return {"user_id": user_id, "query": q, "memories": items, "count": len(items)}


@app.get("/api/kola/settings")
async def kola_get_settings(user_id: str = Depends(current_user_id)):
    _kola_guard()
    return await kola.get_memory_settings(user_id)


@app.patch("/api/kola/settings")
async def kola_patch_settings(body: KolaSettingsPatch, user_id: str = Depends(current_user_id)):
    _kola_guard()
    row = await kola.update_memory_settings(user_id, body.model_dump(exclude_none=True))
    if row is None:
        raise HTTPException(status_code=500, detail="บันทึก settings ไม่ได้")
    return row


# ===== Root =====
@app.get("/")
async def root():
    if USE_SUPABASE:
        # Production: ข้อมูลอยู่ใน Supabase ไม่ดึงทั้งหมดมาแสดง
        return {
            "status": "Vihok AI v5.0 - Fast + Commands + Translate",
            "storage": "supabase",
            "cache_size": len(answer_cache),
            "supported_languages": 100,
            "powered_by": "Vihok AI",
        }

    clean = {k: [{"question": m["question"], "answer": m["answer"][:50]} for m in v[-3:]] for k, v in memories_db.items()}
    return {
        "status": "Vihok AI v5.0 - Fast + Commands + Translate",
        "memories_count": {k: len(v) for k,v in memories_db.items()},
        "conversations_count": {k: len(v) for k,v in conversations_db.items()},

        
        "cache_size": len(answer_cache),
        "supported_languages": 100,
        "preview": clean,
        "powered_by": "Vihok AI"
    }
@app.get("/api/auth/google")
async def google_login():
    """เริ่มต้น Login ด้วย Google"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not client_id or not redirect_uri:
        return {"error": "Google OAuth configuration is missing"}

    google_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "email profile",
    })
    return RedirectResponse(url=google_url, status_code=302)

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    payload = verify_jwt(authorization[7:].strip())
    user_id = payload.get("sub")  # ใช้ user_id นี้แทน "anon"

    return {"user_id": user_id, "email": payload.get("email")}
# ===== Translation endpoints (อยู่ที่ translate.py แล้ว) =====
# /api/languages
# /api/translate

@app.get("/health")
async def health():
    return {"status": "ok", "app": "vihokai-backend"}