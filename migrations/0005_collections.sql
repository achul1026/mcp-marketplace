-- 컬렉션 (큐레이션)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  author_id TEXT NOT NULL REFERENCES users(id),
  author_login TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_author ON collections(author_id);
CREATE INDEX IF NOT EXISTS idx_collections_created ON collections(created_at DESC);

CREATE TABLE IF NOT EXISTS collection_servers (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (collection_id, server_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_servers_server ON collection_servers(server_id);
