-- Supabase 数据库建表 SQL
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 照片表
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  month_key VARCHAR(7) NOT NULL, -- e.g. "2026-06"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 照片索引
CREATE INDEX idx_photos_month ON photos(month_key);
CREATE INDEX idx_photos_created ON photos(created_at DESC);

-- 2. 音乐表
CREATE TABLE music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '未知艺术家',
  url TEXT NOT NULL,
  is_builtin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_music_created ON music(created_at DESC);

-- 3. 皮肤展示表
CREATE TABLE skins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  champion TEXT NOT NULL,
  skin_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skins_created ON skins(created_at DESC);

-- 4. 启用 Row Level Security（公开访问，允许所有操作）
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;

-- 允许公开读写（因为网站无登录）
CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public insert photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete photos" ON photos FOR DELETE USING (true);

CREATE POLICY "Public read music" ON music FOR SELECT USING (true);
CREATE POLICY "Public insert music" ON music FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete music" ON music FOR DELETE USING (true);

CREATE POLICY "Public read skins" ON skins FOR SELECT USING (true);
CREATE POLICY "Public insert skins" ON skins FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete skins" ON skins FOR DELETE USING (true);

-- 5. 创建存储桶（在 Supabase Dashboard > Storage 中手动创建）
-- 需要创建两个 public 存储桶：
--   - photos (允许 image/*)
--   - music  (允许 audio/*)
--
-- 存储桶 Policy（在 Storage > Policies 中设置）：
--   - SELECT (public read): 允许
--   - INSERT (public upload): 允许
--   - DELETE (public delete): 允许
