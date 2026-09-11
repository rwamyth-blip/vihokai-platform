-- ============================================================
-- VihokAI — API keys สำหรับปล่อยเช่า (beta)
-- รันใน Supabase SQL Editor (idempotent: รันซ้ำได้)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'default',
  key_prefix  TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free',
  quota_per_hour INTEGER NOT NULL DEFAULT 60,
  -- โควตาแผนฟรี (โปรโมท): 55 ครั้ง / 6 ชม. (21600 วิ) — Pro รอ Kola/Wari ติดตั้งค่อยเพิ่มคอลัมน์ plan จริง
  quota_window INTEGER NOT NULL DEFAULT 21600,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys (user_id);
CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON public.api_keys (key_prefix);

-- อัปเกรดตารางเก่าที่ไม่มี quota_window (idempotent)
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS quota_window INTEGER NOT NULL DEFAULT 21600;
-- ค่า default ของแผนฟรี = 55 ครั้ง / 6 ชม.
ALTER TABLE public.api_keys ALTER COLUMN quota_per_hour SET DEFAULT 55;

-- ตรวจผลลัพธ์
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'api_keys'
ORDER BY ordinal_position;
