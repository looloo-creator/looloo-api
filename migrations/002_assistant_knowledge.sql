-- Requires the pgvector extension to be installed by the PostgreSQL provider.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS assistant_knowledge (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assistant_knowledge_owner_idx ON assistant_knowledge(owner_user_id);
CREATE INDEX IF NOT EXISTS assistant_knowledge_embedding_idx
  ON assistant_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
