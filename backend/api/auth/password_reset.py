"""
"Forgot password" flow for VihokAI — direct email + password accounts.

Two endpoints:
  POST /api/auth/forgot-password   -> email a single-use reset link
  POST /api/auth/reset-password    -> set a new password using that link

Design notes
------------
* No user enumeration: /forgot-password ALWAYS returns the same generic reply,
  whether or not the address exists.
* The raw token is never stored. We keep sha256(token) and look up by hash.
* Tokens are single-use and expire (default 30 minutes).
* Google-only accounts can't use this flow — they have no password to reset.
  We still return the generic reply so the account type stays private.
* Shares hashing / validation / rate-limit helpers with api/auth/password.py
  so the two modules can never drift apart.
"""

import hashlib
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth import FRONTEND_URL, supabase
from email_sender import active_backend, password_reset_email, send_email

from api.auth.password import (
    EMAIL_RE,
    _client_ip,
    _hash_password,
    _issue_token,
    _normalise_email,
    _validate_password,
)

router = APIRouter()

# ---------------------------------------------------------------- config ----
RESET_TOKEN_TTL_MINUTES = int(os.getenv("AUTH_RESET_TOKEN_TTL_MINUTES", "30"))
FORGOT_RATE_MAX = int(os.getenv("AUTH_FORGOT_RATE_MAX", "3"))
FORGOT_RATE_WINDOW = int(os.getenv("AUTH_FORGOT_RATE_WINDOW", "900"))  # 15 minutes
RESET_TOKEN_BYTES = 32

_GENERIC_REPLY = (
    "ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว "
    "กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์สแปม"
)

_request_log: "defaultdict[str, deque]" = defaultdict(deque)

_MIGRATION_HINT = "run backend/supabase_password_auth.sql in Supabase"


class ForgotPayload(BaseModel):
    email: str


class ResetPayload(BaseModel):
    token: str
    password: str


# --------------------------------------------------------------- helpers ----
def _throttle(ip: str) -> None:
    """Limit how often one IP can request reset mails (their own budget)."""
    now = time.time()
    queue = _request_log[ip]
    while queue and now - queue[0] > FORGOT_RATE_WINDOW:
        queue.popleft()
    if not queue:
        _request_log.pop(ip, None)
        queue = _request_log[ip]
    if len(queue) >= FORGOT_RATE_MAX:
        retry_after = max(int(FORGOT_RATE_WINDOW - (now - queue[0])), 1)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Too many reset requests. Please wait and try again.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )
    queue.append(now)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _missing_column(error: Exception) -> bool:
    message = str(error)
    return "42703" in message or "does not exist" in message


# ------------------------------------------------------------- endpoints ----
@router.post("/api/auth/forgot-password")
async def forgot_password(body: ForgotPayload, request: Request):
    """Email a reset link. Always answers the same way."""
    ip = _client_ip(request)
    _throttle(ip)

    email = _normalise_email(body.email)
    if not EMAIL_RE.match(email):
        # Same generic reply even for a malformed address.
        return {"message": _GENERIC_REPLY}

    try:
        result = supabase.table("users").select("id,email,name,provider").eq("email", email).execute()
    except Exception as error:
        if _missing_column(error):
            print(f"forgot-password failed: {_MIGRATION_HINT}")
            raise HTTPException(
                status_code=503,
                detail="Password reset is not available yet. Please try again later.",
            ) from error
        print(f"forgot-password lookup failed: {type(error).__name__}: {error}")
        return {"message": _GENERIC_REPLY}

    user = result.data[0] if result.data else None

    # Only email accounts can reset. Google accounts silently get nothing.
    if not user or user.get("provider") == "google":
        if user:
            print(f"forgot-password: {email} is a google account, no reset link sent")
        return {"message": _GENERIC_REPLY}

    token = secrets.token_urlsafe(RESET_TOKEN_BYTES)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

    try:
        supabase.table("users").update(
            {
                "reset_token_hash": _hash_token(token),
                "reset_token_expires_at": expires_at.isoformat(),
            }
        ).eq("id", user["id"]).execute()
    except Exception as error:
        if _missing_column(error):
            print(f"forgot-password store failed: {_MIGRATION_HINT}")
            raise HTTPException(
                status_code=503,
                detail="Password reset is not available yet. Please try again later.",
            ) from error
        print(f"forgot-password store failed: {type(error).__name__}: {error}")
        raise HTTPException(
            status_code=502,
            detail="Could not start the password reset. Please try again.",
        ) from error

    reset_url = f"{FRONTEND_URL.rstrip('/')}/auth/reset?token={token}"
    subject, html = password_reset_email(reset_url, RESET_TOKEN_TTL_MINUTES)
    delivered = await send_email(email, subject, html)

    if not delivered:
        # Console fallback (unconfigured keys) or a transport failure — make the
        # link discoverable in the logs so support can still help the user.
        print(f"forgot-password: reset link for {email} -> {reset_url}")

    return {"message": _GENERIC_REPLY, "email_backend": active_backend()}


@router.post("/api/auth/reset-password")
async def reset_password(body: ResetPayload, request: Request):
    """Consume a reset token and set the new password."""
    ip = _client_ip(request)
    _throttle(ip)

    token = (body.token or "").strip()
    password = body.password or ""

    if not token:
        raise HTTPException(status_code=400, detail="Reset link is missing its token.")
    _validate_password(password)

    token_hash = _hash_token(token)

    try:
        result = (
            supabase.table("users")
            .select("id,email,name,provider,reset_token_expires_at")
            .eq("reset_token_hash", token_hash)
            .execute()
        )
    except Exception as error:
        if _missing_column(error):
            print(f"reset-password failed: {_MIGRATION_HINT}")
            raise HTTPException(
                status_code=503,
                detail="Password reset is not available yet. Please try again later.",
            ) from error
        print(f"reset-password lookup failed: {type(error).__name__}: {error}")
        raise HTTPException(status_code=502, detail="Could not reset the password. Please try again.") from error

    user = result.data[0] if result.data else None
    if not user:
        raise HTTPException(
            status_code=400,
            detail="ลิงก์นี้ไม่ถูกต้องหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่",
        )

    expires_raw = user.get("reset_token_expires_at")
    if expires_raw:
        try:
            expires_at = datetime.fromisoformat(str(expires_raw).replace("Z", "+00:00"))
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                # Clear the stale token so it can never be replayed.
                supabase.table("users").update(
                    {"reset_token_hash": None, "reset_token_expires_at": None}
                ).eq("id", user["id"]).execute()
                raise HTTPException(
                    status_code=400,
                    detail="ลิงก์นี้หมดอายุแล้ว กรุณาขอลิงก์ใหม่",
                )
        except HTTPException:
            raise
        except Exception as error:
            print(f"reset-password expiry parse failed: {type(error).__name__}: {error}")

    try:
        supabase.table("users").update(
            {
                "password_hash": _hash_password(password),
                "reset_token_hash": None,
                "reset_token_expires_at": None,
                # ตัดไมโครวินาทีทิ้ง: JWT เก็บ iat เป็นวินาทีเต็ม ถ้าเก็บทศนิยมไว้
                # token ที่เพิ่งออกจะดูเก่ากว่าและถูกรีเจ็กต์ทันที
                "password_changed_at": datetime.now(timezone.utc)
                .replace(microsecond=0)
                .isoformat(),
                # provider stays 'password' — a google user can never reach here.
                "provider": user.get("provider") or "password",
            }
        ).eq("id", user["id"]).execute()
    except Exception as error:
        if _missing_column(error):
            print(f"reset-password update failed: {_MIGRATION_HINT}")
            raise HTTPException(
                status_code=503,
                detail="Password reset is not available yet. Please try again later.",
            ) from error
        print(f"reset-password update failed: {type(error).__name__}: {error}")
        raise HTTPException(status_code=502, detail="Could not reset the password. Please try again.") from error

    # Log them straight in — no second step.
    payload = _issue_token(
        {"id": user["id"], "email": user["email"], "name": user.get("name") or ""}
    )
    payload["message"] = "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว"
    return payload
