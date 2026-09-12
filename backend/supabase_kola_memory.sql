-- ============================================================
-- VihokAI — Kola Memory & Context (001)
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งหมด → RUN
-- รันซ้ำได้อย่างปลอดภัย (idempotent)
-- ต้องเปิด Extensions > vector (pgvector) ก่อน
-- หมายเหตุ: ตารางเดิม (conversations/messages แบบ JSONB) ยังใช้ต่อได้
-- ตาราง kola_* ชุดนี้แยกต่างหาก ไม่กระทบของเดิม
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE kola_memory_category AS ENUM (
    'preference', 'profile', 'goal', 'project', 'instruction', 'fact'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kola_memory_status AS ENUM ('active', 'expired', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== ตั้งค่าหน่วยความจำรายผู้ใช้ =====
CREATE TABLE IF NOT EXISTS public.kola_memory_settings (
  user_id TEXT PRIMARY KEY,
  memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  extraction_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  use_cross_chat_memory BOOLEAN NOT NULL DEFAULT TRUE,
  retention_days INTEGER,
  max_memories INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ห้องแชท (แยกจาก conversations เดิม — เก็บ summary ลด token) =====
CREATE TABLE IF NOT EXISTS public.kola_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title VARCHAR(200),
  summary TEXT,
  summary_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS kola_conversations_user_updated_idx
  ON public.kola_conversations (user_id, updated_at DESC);

-- ===== ข้อความในห้อง =====
CREATE TABLE IF NOT EXISTS public.kola_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conversation_id UUID NOT NULL
    REFERENCES public.kola_conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kola_messages_conversation_created_idx
  ON public.kola_messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kola_messages_user_idx
  ON public.kola_messages (user_id);

-- ===== หน่วยความจำระยะยาว =====
CREATE TABLE IF NOT EXISTS public.kola_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  category kola_memory_category NOT NULL,
  content TEXT NOT NULL,
  normalized_content TEXT NOT NULL,
  embedding vector(1536),
  importance SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  confidence REAL NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  source_conversation_id UUID
    REFERENCES public.kola_conversations (id) ON DELETE SET NULL,
  source_message_id UUID
    REFERENCES public.kola_messages (id) ON DELETE SET NULL,
  status kola_memory_status NOT NULL DEFAULT 'active',
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kola_memories_user_status_idx
  ON public.kola_memories (user_id, status);
CREATE INDEX IF NOT EXISTS kola_memories_expiration_idx
  ON public.kola_memories (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS kola_memories_embedding_hnsw_idx
  ON public.kola_memories USING hnsw (embedding vector_cosine_ops);

-- ===== ประวัติการจัดการ memory (audit) =====
CREATE TABLE IF NOT EXISTS public.kola_memory_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_id UUID,
  action VARCHAR(30) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kola_memory_audit_user_created_idx
  ON public.kola_memory_audit_logs (user_id, created_at DESC);
