-- ============================================================
-- VihokAI — Direct email + password authentication
-- รันใน Supabase SQL Editor (project: gbaosopdockdqsxkwga)
-- ปลอดภัยที่จะรันซ้ำ (idempotent)
-- ============================================================

-- 1) เพิ่มคอลัมน์เก็บ password hash
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 1b) คอลัมน์สำหรับ flow "ลืมรหัสผ่าน"
--     เก็บเฉพาะ SHA-256 ของ token (ไม่เก็บ token ดิบ) + เวลาหมดอายุ
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- 1c) ค้นหา user จาก reset token ให้เร็ว และกัน token ซ้ำ
CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_hash_key
  ON public.users (reset_token_hash)
  WHERE reset_token_hash IS NOT NULL;

-- 2) ห้าม email ซ้ำ (จำเป็นสำหรับ login)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key
  ON public.users (lower(email));

-- 3) เร่งการค้นหาด้วย email
CREATE INDEX IF NOT EXISTS users_email_idx
  ON public.users (email);

-- 4) ตรวจผลลัพธ์
--    ต้องเห็นคอลัมน์ password_hash และ provider = 'password' ได้
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'users'
ORDER BY ordinal_position;

-- ============================================================
-- หมายเหตุด้านความปลอดภัย
-- ============================================================
-- * password_hash เก็บเป็น bcrypt ($2b$12$...) — ห้าม log หรือส่งออก API
--   โมดูล api/auth/password.py กรองคอลัมน์นี้ออกด้วย _public_user() แล้ว
-- * ถ้าต้องการปิดการ login ด้วยรหัสผ่านทั้งระบบชั่วคราว:
--     UPDATE public.users SET password_hash = NULL WHERE provider = 'password';
-- * flow "ลืมรหัสผ่าน" ใช้คอลัมน์ reset_token_hash / reset_token_expires_at
--   ดู backend/api/auth/password_reset.py
--   - เก็บ token เป็น SHA-256 เท่านั้น, ใช้ได้ครั้งเดียว, หมดอายุ 30 นาที
--   - ต้องตั้ง RESEND_API_KEY (หรือ SMTP_*) บน Render จึงจะส่งอีเมลจริง
--   - ถ้าไม่มี key ระบบจะ log ลิงก์ reset แทน (โหมด fallback)
-- * ล้าง reset token ที่ค้างทั้งหมด (กรณีฉุกเฉิน):
--     UPDATE public.users SET reset_token_hash = NULL, reset_token_expires_at = NULL
--     WHERE reset_token_hash IS NOT NULL;
