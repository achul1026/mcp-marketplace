-- GitHub 메타 검증 결과 캐싱
ALTER TABLE servers ADD COLUMN last_verified_at TEXT;
ALTER TABLE servers ADD COLUMN verify_status TEXT;
ALTER TABLE servers ADD COLUMN gh_stars INTEGER;
ALTER TABLE servers ADD COLUMN gh_license TEXT;
ALTER TABLE servers ADD COLUMN gh_last_commit TEXT;
ALTER TABLE servers ADD COLUMN gh_has_readme INTEGER;
