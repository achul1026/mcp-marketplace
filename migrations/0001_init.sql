-- MCP Marketplace 초기 스키마

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  github_login TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('productivity', 'data', 'developer', 'ai', 'communication', 'other')),
  github_url TEXT NOT NULL,
  install_command TEXT NOT NULL,
  readme_url TEXT,
  author_id TEXT NOT NULL REFERENCES users(id),
  author_login TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 1,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_author ON servers(author_id);
CREATE INDEX IF NOT EXISTS idx_servers_approved ON servers(is_approved);
CREATE INDEX IF NOT EXISTS idx_servers_created ON servers(created_at DESC);

-- 검색용 FTS (Full Text Search)
CREATE VIRTUAL TABLE IF NOT EXISTS servers_fts USING fts5(
  id UNINDEXED,
  name,
  description,
  content='servers',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS servers_ai AFTER INSERT ON servers BEGIN
  INSERT INTO servers_fts(id, name, description) VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS servers_au AFTER UPDATE ON servers BEGIN
  DELETE FROM servers_fts WHERE id = old.id;
  INSERT INTO servers_fts(id, name, description) VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS servers_ad AFTER DELETE ON servers BEGIN
  DELETE FROM servers_fts WHERE id = old.id;
END;
