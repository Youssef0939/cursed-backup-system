-- ============================================================
-- SummonFighter — Supabase SQL Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       UUID UNIQUE,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  discord       TEXT,
  wins          INT  DEFAULT 0,
  losses        INT  DEFAULT 0,
  total_rating  NUMERIC DEFAULT 0,
  rating_count  INT  DEFAULT 0,
  is_online     BOOLEAN DEFAULT false,
  accept_1v1    BOOLEAN DEFAULT true,
  accept_team   BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- REQUESTS TABLE
CREATE TABLE IF NOT EXISTS requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  fight_type     TEXT NOT NULL CHECK (fight_type IN ('1v1','Team Fight')),
  description    TEXT NOT NULL,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','done','ignored')),
  fighter_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  fighter_name   TEXT,
  result         TEXT CHECK (result IN ('win','loss') OR result IS NULL),
  rating         INT  CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
  rating_comment TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;

-- ROW LEVEL SECURITY
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policies (open for now — tighten in production)
CREATE POLICY "users_all"    ON users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "requests_all" ON requests FOR ALL USING (true) WITH CHECK (true);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id    ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_is_online  ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_requests_status  ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
