from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import RedirectResponse
import os, time, jwt, httpx, json
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
from urllib.parse import urlencode
from typing import Optional

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
app = FastAPI(title="Google OAuth")

# ====== Config ======
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", SUPABASE_KEY)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY = int(os.getenv("JWT_EXPIRY", "604800"))
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", JWT_SECRET)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "https://vihokai-backend.onrender.com/api/auth/google/callback",
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing Supabase config. Set SUPABASE_URL and SUPABASE_KEY on Render."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ====== Helper Functions ======
def create_jwt(user_id: str, email: str, name: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=JWT_EXPIRY),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ===== ตัด session เก่าเมื่อเปลี่ยนรหัสผ่าน =====
# token ที่ออก "ก่อน" เวลาที่ผู้ใช้เปลี่ยนรหัสผ่านล่าสุด จะถูกปฏิเสธ
# ทำให้ token ที่ถูกขโมยไปใช้ไม่ได้ทันทีที่เจ้าของรีเซ็ตรหัส
#
# AUTH_PASSWORD_CHECK_TTL = จำนวนวินาทีที่ cache ค่า password_changed_at
#   0        = ตรวจกับ DB ทุกครั้ง (เข้มงวดสุด — ค่าเริ่มต้น)
#   มากกว่า 0 = cache เพื่อลด query (ยอมให้ token เก่าอยู่ได้นานสุดเท่านั้นวินาที)
#   disable  = ปิดการตรวจนี้ทั้งหมด (กลับไปพฤติกรรมเดิม)
_PW_CHANGED_TTL = os.getenv("AUTH_PASSWORD_CHECK_TTL", "0").strip().lower()
_PW_CHANGED_DISABLED = _PW_CHANGED_TTL in {"disable", "disabled", "off", "false"}
_PW_CHANGED_TTL = 0 if _PW_CHANGED_DISABLED else max(int(_PW_CHANGED_TTL or "0"), 0)
_PW_CHANGED_MAX_ENTRIES = 5000

# JWT เก็บ iat เป็น "วินาทีเต็ม" (ไม่มีทศนิยม) แต่ password_changed_at เก็บถึง
# ระดับไมโครวินาที จึงต้องเผื่อความคลาดเคลื่อนไว้ไม่กี่วินาที ไม่งั้น token ที่
# เพิ่งออกใหม่ (เช่น หลังกดรีเซ็ตรหัสผ่าน) จะถูกมองว่าเก่ากว่าและถูกรีเจ็กต์ทันที
_ISSUED_AT_TOLERANCE = max(int(os.getenv("AUTH_IAT_TOLERANCE_SECONDS", "2")), 0)

# user_id -> (fetched_at, changed_at_epoch)
_pw_changed_cache: dict = {}


def _password_changed_at(user_id: str) -> float:
    """เวลาที่เปลี่ยนรหัสผ่านล่าสุด (epoch), 0.0 = ยังไม่เคยเปลี่ยน"""
    now = time.time()
    cached = _pw_changed_cache.get(user_id)
    if cached and (now - cached[0]) < _PW_CHANGED_TTL:
        return cached[1]

    changed_at = 0.0
    try:
        rows = (
            supabase.table("users")
            .select("password_changed_at")
            .eq("id", user_id)
            .execute()
            .data
        )
        raw = rows[0].get("password_changed_at") if rows else None
        if raw:
            changed_at = datetime.fromisoformat(
                str(raw).replace("Z", "+00:00")
            ).timestamp()
    except Exception as error:
        # ล้มเหลวเชิงโครงสร้าง (DB ล่ม/ยังไม่รัน migration) -> ปล่อยผ่าน
        # เพื่อไม่ให้ทุกคนถูกล็อกออก แต่ให้ log ไว้ชัด ๆ
        print(f"password_changed_at lookup failed: {type(error).__name__}: {error}")
        return cached[1] if cached else 0.0

    if len(_pw_changed_cache) > _PW_CHANGED_MAX_ENTRIES:
        _pw_changed_cache.clear()
    _pw_changed_cache[user_id] = (now, changed_at)
    return changed_at


def verify_jwt(token: str) -> dict:
    """ตรวจสอบ access token ที่ออกโดยแอปเราเอง (JWT_SECRET)"""
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing sub claim")

    # -------- เปลี่ยนรหัสผ่านแล้วหรือยัง --------
    if not _PW_CHANGED_DISABLED:
        issued_at = payload.get("iat")
        if issued_at is not None:
            changed_at = _password_changed_at(str(user_id))
            if changed_at and float(issued_at) < (changed_at - _ISSUED_AT_TOLERANCE):
                raise HTTPException(
                    status_code=401,
                    detail={
                        "code": "password_changed",
                        "message": "รหัสผ่านถูกเปลี่ยน กรุณาเข้าสู่ระบบใหม่",
                    },
                )

    return payload


def current_user_id(authorization: str = Header(default="")) -> str:
    """FastAPI dependency: บังคับ Bearer token แล้วคืน user id **จาก token เท่านั้น**

    ห้ามเชื่อ user_id ที่ client ส่งมาใน body/query เด็ดขาด ไม่งั้นใครก็ยึด
    บัญชีคนอื่นได้แค่ส่ง UUID ของเขามา
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"code": "missing_token", "message": "กรุณาเข้าสู่ระบบก่อนใช้งาน"},
        )
    payload = verify_jwt(authorization[7:].strip())
    return str(payload["sub"])


async def exchange_code_for_token(code: str) -> dict:
    if not code:
        raise HTTPException(status_code=400, detail="Google authorization code is missing")
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google OAuth configuration is incomplete")

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    token_data = token_res.json()
    if token_res.is_error:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Google token exchange failed",
                "google_error": token_data,
            },
        )
    if not token_data.get("access_token"):
        raise HTTPException(status_code=502, detail="Google did not return an access token")
    return token_data

async def get_user_info(access_token: str) -> dict:
    if not access_token:
        raise HTTPException(status_code=401, detail="Google access token is missing")

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    user_data = response.json()
    if response.is_error:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Google user info request failed",
                "google_error": user_data,
            },
        )
    if not user_data.get("email"):
        raise HTTPException(status_code=502, detail="Google user info has no email")
    return user_data

async def get_google_user(code: str) -> dict:
    token_data = await exchange_code_for_token(code)
    return await get_user_info(token_data["access_token"])

def save_or_get_user(user_data: dict) -> dict:
    email = user_data["email"]
    result = supabase.table("users").select("*").eq("email", email).execute()
    if result.data:
        return result.data[0]
    
    new_user = {
        "email": email,
        "name": user_data.get("name", email.split("@")[0]),
        "avatar": user_data.get("picture"),
        "provider": "google",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = supabase.table("users").insert(new_user).execute()
    return result.data[0]

# ====== Endpoints ======
@app.get("/api/auth/google")
async def google_login():
    """เริ่มต้น Login ด้วย Google"""
    return {
        "url": "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": "email profile",
        })
    }

@app.get("/api/auth/google/callback")
async def google_callback(code: str):
    """Callback URL หลังจาก Login เสร็จ"""
    user_data = await get_google_user(code)
    user = save_or_get_user(user_data)
    token = create_jwt(str(user["id"]), user["email"], user["name"])
    # เปลี่ยนเส้นทางไป Frontend พร้อมส่ง token
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback?token={token}&user={json.dumps(user)}",
    )

async def get_supabase_user(token: str) -> Optional[dict]:
    """ยืนยัน token และดึง user ปัจจุบันจาก Supabase Auth (fresh data)"""
    verify_jwt(token)  # ถ้าไม่ผ่าน จะ throw 401

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}",
                },
            )
            if res.status_code == 200:
                return res.json()
    except Exception as e:
        print(f"❌ Supabase user fetch error: {e}")

    return None