from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
import os, jwt, httpx, json
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

    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token missing sub claim")

    return payload

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