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

_MEM: dict[str, list[float]] = {}


def _sha256(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issue_api_key(user_id: str, name: str = "default", plan: str = "free",
                  quota_per_hour: int = 60) -> dict:
    """สร้าง key ใหม่ + บันทึก hash ลง Supabase. คืน dict ที่มี `api_key` ครั้งเดียว."""
    raw = "vk_" + secrets.token_hex(16)
    row = {
        "user_id": str(user_id),
        "name": name or "default",
        "key_prefix": raw[:10],
        "key_hash": _sha256(raw),
        "plan": plan,
        "quota_per_hour": int(quota_per_hour or 60),
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


def require_api_key(x_api_key: str = Header(default="")) -> dict:
    """FastAPI dependency: ตรวจ X-API-Key + rate limit (quota ของ key ชนะค่า default)."""
    row = verify_api_key_value(x_api_key)
    limit = int(row.get("quota_per_hour") or RATE_MAX)
    rkey = f"vihokai:ratelimit:{row.get('id')}"
    client = _redis_client()
    if client is not None:
        try:
            _check_rate_limit_redis(client, rkey, limit, RATE_WINDOW)
        except HTTPException:
            raise
        except Exception:
            _check_rate_limit_mem(rkey, limit, RATE_WINDOW)
    else:
        _check_rate_limit_mem(rkey, limit, RATE_WINDOW)
    _touch_last_used(row.get("id"))
    return row
