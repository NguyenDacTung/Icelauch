-- ==============================================================================
-- ICELAUCH ICEDROP CLOUD SHARES DEDICATED TABLE (SUPABASE POSTGRESQL)
-- Chạy đoạn mã này trong Supabase Dashboard > SQL Editor > New query > Run
-- (Lưu ý: Ứng dụng đã hỗ trợ sẵn chế độ Zero-Setup hoạt động ngay không cần chạy)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS icelauch_icedrop (
  id TEXT PRIMARY KEY,
  sender_profile_id TEXT,
  sender_name TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  pin_code VARCHAR(4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes')
);

-- Kích hoạt Row Level Security & Policy mở cho Anon Key
ALTER TABLE icelauch_icedrop ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "IceDrop Anon All" ON icelauch_icedrop;
CREATE POLICY "IceDrop Anon All" ON icelauch_icedrop FOR ALL TO anon USING (true) WITH CHECK (true);
