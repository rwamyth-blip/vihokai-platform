"""
VihokAI Main.py - FAST VERSION + COMMANDS + TRANSLATE
เชื่อม Groq + Gemini + OpenAI + DeepSeek + Kimi + Claude
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


async def _call_groq_model(model: str, prompt: str, locale: str, name: str = None, system_prompt: str = None, api_key: str | None = None, base_url: str | None = None) -> str | None:
    """เรียก Groq-compatible API ด้วย model ที่ระบุ — ใช้ร่วมกันระหว่าง call_groq / call_vihokai"""
    key = api_key or GROQ_API_KEY
    if not key:
        return None
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=key,
        base_url=base_url or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
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

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=600,
        temperature=0.6
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
        full_prompt = f"""{mem_text}
{system_prompt if system_prompt else ''}

คำถาม: {prompt}

ตอบเป็นภาษา {language_name} เท่านั้น อย่างละเอียดพอควร มีตัวอย่างประกอบ"""
        
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
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": f"{mem_text}{prompt} (ตอบเป็นภาษา {get_language_name(locale)} เท่านั้น กระชับ) "})
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=600,
            temperature=0.6
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
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": f"{mem_text}{prompt} (ตอบเป็นภาษา {get_language_name(locale)} เท่านั้น กระชับ) "})
        
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=600,
            temperature=0.6
        )
        return response.choices[0].message.content
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
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": f"{mem_text}{prompt} (ตอบเป็นภาษา {get_language_name(locale)} เท่านั้น กระชับ) "})
        
        response = await client.chat.completions.create(
            model=os.getenv("KIMI_MODEL", "kimi-k3"),
            messages=messages,
            max_tokens=600,
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
        
        full_prompt = f"{mem_text}{prompt} (ตอบเป็นภาษา {get_language_name(locale)} เท่านั้น กระชับ)"
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{full_prompt}"
        
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.content[0].text
    except Exception as e:
        print(f"❌ Claude error: {e}")
        return None

# ===== GET ANSWER (ตอบตัวแรกที่เร็วที่สุด) =====
async def get_ai_answer(question: str, memories: list, locale: str, selected_ai: str = "auto"):
    # ✅ ตรวจสอบ Cache ก่อน
    language_name = get_language_name(locale)
    cache_key = f"{question}:{language_name}:{selected_ai}"
    if cache_key in answer_cache:
        return f"📦 (จากความจำ) {answer_cache[cache_key]}"
    
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
        "auto": [call_vihokai, call_groq, call_gemini, call_openai, call_deepseek, call_kimi, call_claude],
        "vihokai": [call_vihokai],
        "chatgpt": [call_openai],
        "gemini": [call_gemini],
        "deepseek": [call_deepseek],
        "kimi": [call_kimi],
        "meta_ai": [call_groq],
        "claude": [call_claude],
    }
    
    funcs = ai_map.get(selected_ai, ai_map["auto"])
    tasks = [func(clean_question, locale, name, system_prompt) for func in funcs]
    
    # ✅ ตอบตัวแรกที่ได้ (ไม่ต้องรอทุกตัว) - เร็วขึ้น
    first_answer = None
    timeout = 15  # ✅ สมดุล
    
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
        # Single Mode
        answer = await get_ai_answer(req.question, mems, req.locale, req.selected_ai)

    conv_id = await save_chat_result(req.user_id, req.conversation_id, req.question, answer)

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