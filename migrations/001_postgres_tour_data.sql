-- PostgreSQL schema for the records previously stored in MongoDB.
-- TEXT ids preserve existing Mongo ObjectId strings during data import.
CREATE TABLE IF NOT EXISTS tours (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan VARCHAR(255),
  description TEXT,
  plan_start_date TIMESTAMPTZ,
  plan_end_date TIMESTAMPTZ,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tours_user_status_idx ON tours(user_id, status);

CREATE TABLE IF NOT EXISTS tour_members (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tour_id VARCHAR(64) NOT NULL REFERENCES tours(id),
  name VARCHAR(255) NOT NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tour_members_owner_idx ON tour_members(user_id, tour_id, status);

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tour_id VARCHAR(64) NOT NULL REFERENCES tours(id),
  type VARCHAR(100),
  date TIMESTAMPTZ,
  collected_from VARCHAR(255),
  amount NUMERIC(14,2),
  reason TEXT,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  file VARCHAR(1024),
  status BOOLEAN NOT NULL DEFAULT TRUE,
  "fileName" VARCHAR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS accounts_owner_tour_status_idx ON accounts(user_id, tour_id, status);
CREATE INDEX IF NOT EXISTS accounts_date_type_idx ON accounts(date, type);
