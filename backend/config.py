# เพิ่มไฟล์นี้ แล้วให้ทุกไฟล์ import จากตรงกลาง
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabase: ❌ Missing URL/KEY - ใช้ in-memory fallback")
else:
    print("Supabase: ✅ Connected")