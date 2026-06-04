-- 평점/리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  server_id TEXT NOT NULL REFERENCES servers(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, server_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_server ON reviews(server_id);

-- 서버 버전 컬럼 추가
ALTER TABLE servers ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
