-- ============================================================
-- SummonFighter v2 — Full Schema
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         UUID UNIQUE,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'client'
                  CHECK (role IN ('client', 'fighter', 'owner')),
  fighter_status  TEXT DEFAULT 'pending'
                  CHECK (fighter_status IN ('pending','approved','rejected')),
  roblox_username TEXT,
  roblox_avatar   TEXT,
  discord         TEXT,
  wins            INT     DEFAULT 0,
  losses          INT     DEFAULT 0,
  total_rating    NUMERIC DEFAULT 0,
  rating_count    INT     DEFAULT 0,
  is_online       BOOLEAN DEFAULT false,
  accept_1v1      BOOLEAN DEFAULT true,
  accept_team     BOOLEAN DEFAULT true,
  bio             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── REQUESTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_name  TEXT NOT NULL,
  roblox_username TEXT,
  fight_type      TEXT NOT NULL CHECK (fight_type IN ('1v1','Team Fight','Ranked Help','Anti-Toxic')),
  game            TEXT DEFAULT 'Roblox',
  description     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','in_progress','done','ignored')),
  fighter_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  fighter_name    TEXT,
  result          TEXT CHECK (result IN ('win','loss') OR result IS NULL),
  rating          INT  CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
  rating_comment  TEXT,
  priority        INT  DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- ── CHAT MESSAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'client',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── FIGHTER APPLICATIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS fighter_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  reason      TEXT NOT NULL,
  roblox_username TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── REALTIME ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE fighter_applications;

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighter_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all"    ON users                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "req_all"      ON requests             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chat_all"     ON chat_messages        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "apps_all"     ON fighter_applications FOR ALL USING (true) WITH CHECK (true);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_auth      ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_online    ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_req_status      ON requests(status);
CREATE INDEX IF NOT EXISTS idx_req_created     ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_request    ON chat_messages(request_id, created_at);
