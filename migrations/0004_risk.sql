-- 위험도 점수 + 신호 캐싱
ALTER TABLE servers ADD COLUMN risk_score INTEGER;
ALTER TABLE servers ADD COLUMN risk_signals TEXT;
ALTER TABLE servers ADD COLUMN gh_readme_length INTEGER;
