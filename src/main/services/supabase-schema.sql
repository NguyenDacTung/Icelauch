-- ==============================================================================
-- ICELAUCH MULTI-USER CLOUD SYNC SCHEMA (SUPABASE POSTGRESQL)
-- Chạy đoạn mã này trong Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Bảng Hồ Sơ Người Dùng (Icelauch Profiles)
CREATE TABLE IF NOT EXISTS icelauch_profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'avatar_1',
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng Dữ Liệu Cá Nhân Hoá (Thư viện game, Tiến độ xem phim, Yêu thích)
CREATE TABLE IF NOT EXISTS icelauch_user_data (
  profile_id TEXT PRIMARY KEY REFERENCES icelauch_profiles(id) ON DELETE CASCADE,
  library JSONB DEFAULT '[]'::jsonb,
  watch_progress JSONB DEFAULT '{}'::jsonb,
  favorite_media JSONB DEFAULT '[]'::jsonb,
  game_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Kích hoạt Row Level Security (RLS) & Cho phép truy cập bảo mật qua Anon Key
ALTER TABLE icelauch_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_user_data ENABLE ROW LEVEL SECURITY;

-- Xoá policy cũ nếu đã tồn tại
DROP POLICY IF EXISTS "Icelauch Profiles Anon All" ON icelauch_profiles;
DROP POLICY IF EXISTS "Icelauch User Data Anon All" ON icelauch_user_data;

-- Tạo policy cho phép client Icelauch đọc/ghi với Anon Key
CREATE POLICY "Icelauch Profiles Anon All"
ON icelauch_profiles FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Icelauch User Data Anon All"
ON icelauch_user_data FOR ALL
TO anon
USING (true)
WITH CHECK (true);
