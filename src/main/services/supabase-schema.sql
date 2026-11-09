-- ==============================================================================
-- ICELAUCH MULTI-USER & FULL CATALOG CLOUD SYNC SCHEMA (SUPABASE POSTGRESQL)
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

-- 3. Bảng Danh Mục Game Chung (Icelauch Games Catalog)
CREATE TABLE IF NOT EXISTS icelauch_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  drive_url TEXT,
  trailer_url TEXT,
  banner_url TEXT,
  cover_url TEXT,
  description TEXT,
  category TEXT,
  genre TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  action_buttons JSONB DEFAULT '[]'::jsonb,
  featured BOOLEAN DEFAULT false,
  release_year INT,
  developer TEXT,
  file_size BIGINT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng Phim & Media Chung (Icelauch Media Catalog)
CREATE TABLE IF NOT EXISTS icelauch_media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  link TEXT NOT NULL,
  cover_path TEXT,
  banner_path TEXT,
  description TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  duration INT DEFAULT 0,
  is_banner_pinned BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bảng Danh Sách Phát (Playlists) & Cấu hình Banner
CREATE TABLE IF NOT EXISTS icelauch_playlists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  item_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Kích hoạt Row Level Security (RLS) & Cho phép truy cập bảo mật qua Anon Key
ALTER TABLE icelauch_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_playlists ENABLE ROW LEVEL SECURITY;

-- Xoá policy cũ nếu đã tồn tại
DROP POLICY IF EXISTS "Icelauch Profiles Anon All" ON icelauch_profiles;
DROP POLICY IF EXISTS "Icelauch User Data Anon All" ON icelauch_user_data;
DROP POLICY IF EXISTS "Icelauch Games Anon All" ON icelauch_games;
DROP POLICY IF EXISTS "Icelauch Media Anon All" ON icelauch_media;
DROP POLICY IF EXISTS "Icelauch Playlists Anon All" ON icelauch_playlists;

-- Tạo policy cho phép client Icelauch đọc/ghi với Anon Key
CREATE POLICY "Icelauch Profiles Anon All" ON icelauch_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch User Data Anon All" ON icelauch_user_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Games Anon All" ON icelauch_games FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Media Anon All" ON icelauch_media FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Playlists Anon All" ON icelauch_playlists FOR ALL TO anon USING (true) WITH CHECK (true);

