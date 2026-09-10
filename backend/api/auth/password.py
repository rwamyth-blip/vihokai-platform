"""
Direct email + password authentication for VihokAI.

Product decision (2026-09-10):
  * Login is DIRECT — email + password, one step.
  * NO two-factor authentication (no TOTP, no SMS, no phone push prompt).
  * NO passkeys / WebAuthn prompts.
  * NO reCAPTCHA / hCaptcha / Turnstile challenge.

Because there is no user-facing challenge, brute-force protection is handled
server-side by the in-memory rate limiter below (sliding window, counted on
FAILED attempts only, so real users are never blocked by their own success).
"""

import os
import re
import time
from collections import defaultdict, deque

import bcrypt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth import create_jwt, supabase

router = APIRouter()

# ---------------------------------------------------------------- config ----
MIN_PASSWORD_LEN = int(os.getenv("AUTH_MIN_PASSWORD_LEN", "8"))
MAX_PASSWORD_BYTES = 72  # bcrypt hard limit
RATE_LIMIT_MAX = int(os.getenv("AUTH_RATE_LIMIT_MAX", "5"))
RATE_LIMIT_WINDOW = int(os.getenv("AUTH_RATE_LIMIT_WINDOW", "900"))  # 15 minutes
MAX_TRACKED_IPS = int(os.getenv("AUTH_MAX_TRACKED_IPS", "10000"))

# Deliberately simple: full match, no catastrophic backtracking.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$")

# bcrypt is truncated at 72 BYTES, so this dummy has the right length.
_DUMMY_HASH = "$2b$12$" + "x" * 53

# Columns that must never appear in an API response.
_SENSITIVE_COLUMNS = (
    "password_hash",
    "reset_token_hash",
    "reset_token_expires_at",
    "password_changed_at",
)

# ip -> deque[monotonic timestamps]
_failed_attempts: "defaultdict[str, deque]" = defaultdict(deque)


class Credentials(BaseModel):
    email: str
    password: str


class RegisterPayload(Credentials):
    name: str | None = None


# --------------------------------------------------------------- helpers ----
def _client_ip(request: Request) -> str:
    """Behind Render's proxy the real IP is in X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _prune(ip: str, now: float) -> None:
    queue = _failed_attempts[ip]
    while queue and now - queue[0] > RATE_LIMIT_WINDOW:
        queue.popleft()
    if not queue:
        _failed_attempts.pop(ip, None)


def _raise_if_rate_limited(ip: str) -> None:
    now = time.time()
    _prune(ip, now)
    queue = _failed_attempts.get(ip)
    if not queue:
        return
    if len(queue) >= RATE_LIMIT_MAX:
        retry_after = max(int(RATE_LIMIT_WINDOW - (now - queue[0])), 1)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Too many failed attempts. Please wait and try again.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )


def _record_failure(ip: str) -> None:
    # Keep the dict bounded so a scan can't exhaust memory.
    if len(_failed_attempts) > MAX_TRACKED_IPS:
        _failed_attempts.clear()
    _failed_attempts[ip].append(time.time())


def _normalise_email(raw: str) -> str:
    return (raw or "").strip().lower()


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _password_matches(password: str, stored_hash: str) -> bool:
    """Constant-ish time: always run bcrypt, even when there is no user."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _public_user(row: dict) -> dict:
    """Never let credential material or pending-reset state leave the server."""
    return {key: value for key, value in row.items() if key not in _SENSITIVE_COLUMNS}


def _validate_password(password: str) -> None:
    if len(password) < MIN_PASSWORD_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LEN} characters.",
        )
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at most {MAX_PASSWORD_BYTES} bytes long.",
        )


def _issue_token(row: dict) -> dict:
    token = create_jwt(str(row["id"]), row["email"], row.get("name") or "")
    return {"token": token, "user": _public_user(row)}


# ------------------------------------------------------------- endpoints ----
@router.post("/api/auth/register")
async def register(body: RegisterPayload, request: Request):
    """Create an email + password account and return a token immediately."""
    ip = _client_ip(request)
    _raise_if_rate_limited(ip)

    email = _normalise_email(body.email)
    password = body.password or ""

    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    _validate_password(password)

    existing = supabase.table("users").select("id,provider").eq("email", email).execute()
    if existing.data:
        provider = existing.data[0].get("provider")
        if provider == "google":
            raise HTTPException(
                status_code=409,
                detail="This email already signs in with Google. Please use the Google button.",
            )
        raise HTTPException(status_code=409, detail="This email is already registered. Please sign in.")

    new_user = {
        "email": email,
        "name": (body.name or "").strip() or email.split("@")[0],
        "provider": "password",
        "password_hash": _hash_password(password),
    }

    try:
        result = supabase.table("users").insert(new_user).execute()
    except Exception as error:
        message = str(error)
        # 42703 = undefined_column → the supabase_password_auth.sql migration
        # has not been applied to this Supabase project yet.
        if "password_hash" in message or "42703" in message:
            print("register failed: run backend/supabase_password_auth.sql in Supabase")
            raise HTTPException(
                status_code=503,
                detail="Sign-up is not available yet. Please try again later.",
            ) from error
        print(f"register failed: {type(error).__name__}: {message[:200]}")
        raise HTTPException(
            status_code=502,
            detail="Could not create the account. Please try again.",
        ) from error

    if not result.data:
        raise HTTPException(status_code=502, detail="Could not create the account. Please try again.")

    return _issue_token(result.data[0])

@router.post("/api/auth/login")
async def login(body: Credentials, request: Request):
    """Direct one-step login: email + password straight to a token."""
    ip = _client_ip(request)
    _raise_if_rate_limited(ip)

    email = _normalise_email(body.email)
    password = body.password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    result = supabase.table("users").select("*").eq("email", email).execute()
    row = result.data[0] if result.data else None

    # Always run bcrypt so a missing account and a wrong password cost the same.
    stored_hash = (row or {}).get("password_hash") or _DUMMY_HASH
    matched = _password_matches(password, stored_hash)

    if not row or not matched:
        _record_failure(ip)
        provider = (row or {}).get("provider")
        if row and provider == "google":
            raise HTTPException(
                status_code=401,
                detail="This account signs in with Google. Please use the Google button.",
            )
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return _issue_token(row)
