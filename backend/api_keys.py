"""API-key auth + per-key rate limit สำหรับปล่อยเช่า (beta).

Design:
- ออก key รูป `vk_<32 hex>` เก็บเฉพาะ SHA-256 (key_hash) ใน Supabase
- ตรวจ key: prefix lookup + sha256 compare + is_active
- Rate limit: Redis sliding window (sorted set) ต่อ key
  ถ้าไม่มี REDIS_URL / ต่อ Redis ไม่ได้ → fallback in-memory (per-process)

Env (มีค่า default ใช้งานได้ทันที):
  API_KEY_RATE_MAX    default 60   (requests ต่อ window)
  API_KEY_RATE_WINDOW default 3600 (วินาที)
  REDIS_URL           default redis://localhost:6379/0 (ลองต่อ ถ้าไม่ได้ใช้ fallback)
  FREE_QUOTA_MAX      default 55   (โควตาแผนฟรี — โปรโมท)
  FREE_QUOTA_WINDOW   default 21600 (วินาที = 6 ชม. — ครบแล้วรีเซ็ตใหม่)
"""

from __future__ import annotations

import hashlib
import os
import secrets
import time

from fastapi import Header, HTTPException

try:
    from db import supabase
except Exception:  # pragma: no cover
    supabase = None  # type: ignore

RATE_MAX = int(os.getenv("API_KEY_RATE_MAX", "60"))
RATE_WINDOW = int(os.getenv("API_KEY_RATE_WINDOW", "3600"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# แผนฟรี (โปรโมท): 55 ครั้ง / 6 ชม. — ครบแล้วรีเซ็ตอัตโนมัติ (sliding window หมดอายุเอง)
FREE_QUOTA_MAX = int(os.getenv("FREE_QUOTA_MAX", "55"))
FREE_QUOTA_WINDOW = int(os.getenv("FREE_QUOTA_WINDOW", "21600"))  # 6 ชม. = 21600 วิ

_MEM: dict[str, list[float]] = {}


def _sha256(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issue_api_key(user_id: str, name: str = "default", plan: str = "free",
                  quota_per_hour: int | None = None, quota_window: int | None = None) -> dict:
    """สร้าง key ใหม่ + บันทึก hash ลง Supabase. คืน dict ที่มี `api_key` ครั้งเดียว.
    plan=free → โควตา FREE_QUOTA_MAX / FREE_QUOTA_WINDOW (55 ครั้ง/6 ชม.)
    plan อื่น → quota_per_hour ที่ส่งมา (default 60/ชม.)
    """
    raw = "vk_" + secrets.token_hex(16)
    if (plan or "free") == "free":
        quota = FREE_QUOTA_MAX
        window = quota_window or FREE_QUOTA_WINDOW
    else:
        quota = int(quota_per_hour or 60)
        window = quota_window or RATE_WINDOW
    row = {
        "user_id": str(user_id),
        "name": name or "default",
        "key_prefix": raw[:10],
        "key_hash": _sha256(raw),
        "plan": plan,
        "quota_per_hour": quota,
        "quota_window": window,
        "is_active": True,
    }
    if supabase is None:
        raise HTTPException(status_code=503, detail="API key store is not configured")
    res = supabase.table("api_keys").insert(row).execute()
    saved = (res.data or [row])[0]
    saved["api_key"] = raw
    return saved


def _lookup_key(raw: str) -> dict | None:
    """คืนแถว api_keys ถ้า key ถูกต้องและ active."""
    if not raw or not raw.startswith("vk_"):
        return None
    if supabase is None:
        return None
    try:
        res = (
            supabase.table("api_keys")
            .select("*")
            .eq("key_prefix", raw[:10])
            .eq("is_active", True)
            .execute()
        )
    except Exception:
        return None
    want = _sha256(raw)
    for row in res.data or []:
        if row.get("key_hash") == want:
            return row
    return None


def _redis_client():
    try:
        import redis  # type: ignore

        client = redis.from_url(REDIS_URL, socket_timeout=2)
        client.ping()
        return client
    except Exception:
        return None


def _check_rate_limit_redis(client, key: str, limit: int, window: int) -> None:
    now = time.time()
    member = f"{now}:{secrets.token_hex(4)}"
    pipe = client.pipeline()
    pipe.zadd(key, {member: now})
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zcard(key)
    pipe.expire(key, int(window) + 5)
    _, _, count, _ = pipe.execute()
    if int(count or 0) > limit:
        pipe.zrem(key, member).execute()
        raise HTTPException(
            status_code=429,
            detail={"code": "rate_limited", "message": "API rate limit exceeded, try again later."},
        )


def _check_rate_limit_mem(key: str, limit: int, window: int) -> None:
    now = time.time()
    bucket = _MEM.setdefault(key, [])
    cutoff = now - window
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= limit:
        raise HTTPException(
            status_code=429,
            detail={"code": "rate_limited", "message": "API rate limit exceeded, try again later."},
        )
    bucket.append(now)


def _touch_last_used(row_id: str) -> None:
    try:
        from datetime import datetime, timezone

        supabase.table("api_keys").update(
            {"last_used_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", row_id).execute()
    except Exception:
        pass


def verify_api_key_value(raw: str) -> dict:
    """ตรวจ key ล้วนๆ (ไม่แตะ rate limit) — ใช้ในเทส/สคริปต์."""
    row = _lookup_key((raw or "").strip())
    if not row:
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_api_key", "message": "Invalid API key"},
        )
    return row


def _quota_for_row(row: dict) -> tuple[int, int, str]:
    """คืน (limit, window, plan) — แผน free ใช้ FREE_* (55/6ชม.), แผนอื่นใช้ quota ของ key."""
    plan = (row.get("plan") or "free").lower()
    if plan == "free":
        return FREE_QUOTA_MAX, FREE_QUOTA_WINDOW, plan
    limit = int(row.get("quota_per_hour") or RATE_MAX)
    window = int(row.get("quota_window") or RATE_WINDOW)
    return limit, window, plan


def quota_status(row_id: str, limit: int, window: int) -> dict:
    """โควตาคงเหลือของ key (ใช้นับ sliding window ปัจจุบัน) — ไม่ตัดโควตา."""
    now = time.time()
    client = _redis_client()
    if client is not None:
        try:
            rkey = f"vihokai:ratelimit:{row_id}"
            count = client.zcount(rkey, now - window, now)
            return {"limit": limit, "used": int(count or 0), "remaining": max(0, limit - int(count or 0)), "window_sec": window}
        except Exception:
            pass
    bucket = _MEM.get(f"vihokai:ratelimit:{row_id}", [])
    used = sum(1 for t in bucket if t >= now - window)
    return {"limit": limit, "used": used, "remaining": max(0, limit - used), "window_sec": window}


def require_api_key(x_api_key: str = Header(default="")) -> dict:
    """FastAPI dependency: ตรวจ X-API-Key + rate limit (quota ของ key ชนะค่า default).
    แผน free: 55 ครั้ง / 6 ชม. ครบแล้ว 429 — รอ window หมดอายุแล้วใช้ต่อได้ (รีเซ็ตอัตโนมัติ).
    """
    row = verify_api_key_value(x_api_key)
    limit, window, plan = _quota_for_row(row)
    rkey = f"vihokai:ratelimit:{row.get('id')}"
    client = _redis_client()
    try:
        if client is not None:
            try:
                _check_rate_limit_redis(client, rkey, limit, window)
            except HTTPException:
                raise
            except Exception:
                _check_rate_limit_mem(rkey, limit, window)
        else:
            _check_rate_limit_mem(rkey, limit, window)
    except HTTPException as e:
        # แนบข้อมูลโควตาให้ client รู้ว่าต้องรอเท่าไหร่ (โปรโมท: บอกชัดว่ารีเซ็ตทุก 6 ชม.)
        detail = e.detail if isinstance(e.detail, dict) else {"message": str(e.detail)}
        detail.update({"quota": {"plan": plan, "limit": limit, "window_sec": window, "reset_note": "free plan resets every 6 hours"}})
        raise HTTPException(status_code=e.status_code, detail=detail)
    _touch_last_used(row.get("id"))
    row["quota"] = {"plan": plan, "limit": limit, "window_sec": window}
    return row
