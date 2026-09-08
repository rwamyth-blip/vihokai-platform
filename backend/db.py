"""
Supabase Database Layer - สำหรับ Vihok AI Production
ใช้แทน in-memory dict ใน main.py
"""
import os
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv


def utc_now_iso() -> str:
    """เวลาปัจจุบัน UTC แบบ ISO8601 พร้อม timezone (+00:00)"""
    return datetime.now(timezone.utc).isoformat()

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("🗄️ Supabase: ✅ Connected")
else:
    print("🗄️ Supabase: ❌ Missing URL/KEY - ใช้ in-memory fallback")


# ===== Conversations =====
async def db_get_conversations(user_id: str, limit: int = 50, offset: int = 0):
    """ดึงรายการแชท เรียงใหม่ล่าสุดก่อน"""
    if not supabase:
        return []
    res = (supabase.table("conversations")
           .select("*")
           .eq("user_id", user_id)
           .order("created_at", desc=True)
           .range(offset, offset + limit - 1)
           .execute())
    return res.data or []


async def db_get_conversation(user_id: str, conversation_id: str):
    if not supabase:
        return None
    res = (supabase.table("conversations")
           .select("*")
           .eq("user_id", user_id)
           .eq("id", conversation_id)
           .execute())
    return res.data[0] if res.data else None


async def db_create_conversation(user_id: str, title: str):
    """สร้างแชทใหม่"""
    if not supabase:
        return None
    conv_id = str(uuid.uuid4())
    now = utc_now_iso()
    res = (supabase.table("conversations")
           .insert({
               "id": conv_id,
               "user_id": user_id,
               "title": title[:40] + ("..." if len(title) > 40 else ""),
               "created_at": now,
           })
           .execute())
    return res.data[0] if res.data else None


async def db_append_message(user_id: str, conversation_id: str, role: str, content: str):
    """เพิ่ม message เข้า conversation"""
    if not supabase:
        return False
    conv = await db_get_conversation(user_id, conversation_id)
    if not conv:
        return False

    existing = conv.get("messages", []) or []
    existing.append({
        "role": role,
        "content": content,
        "timestamp": utc_now_iso(),
    })

    (supabase.table("conversations")
     .update({"messages": existing})
     .eq("id", conversation_id)
     .eq("user_id", user_id)
     .execute())
    return True


async def db_delete_conversation(user_id: str, conversation_id: str):
    if not supabase:
        return False
    supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
    return True


# ===== Memories =====
async def db_get_memories(user_id: str, limit: int = 10):
    if not supabase:
        return []
    res = (supabase.table("memories")
           .select("*")
           .eq("user_id", user_id)
           .order("saved_at", desc=True)
           .limit(limit)
           .execute())
    return res.data or []


async def db_save_memory(user_id: str, question: str, answer: str):
    if not supabase:
        return False
    now = utc_now_iso()
    # ลบของเก่าที่คำถามซ้ำ
    supabase.table("memories").delete().eq("user_id", user_id).eq("question", question).execute()
    res = (supabase.table("memories")
           .insert({
               "user_id": user_id,
               "question": question[:100],
               "answer": answer[:200],
               "saved_at": now,
           })
           .execute())
    return True


async def db_clear_memories(user_id: str):
    if not supabase:
        return False
    supabase.table("memories").delete().eq("user_id", user_id).execute()
    return True


import uuid