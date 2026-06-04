# MCP 서버 마켓플레이스

**현재 단계:** MVP 준비 (미시작)
**기술 스택:** TypeScript + Bun + Hono + Cloudflare Workers + D1

**개발 컨텍스트:**
- 로컬 개발: `bun dev`
- 배포: Wrangler CLI (`wrangler deploy`)
- DB 마이그레이션: `wrangler d1 migrations apply`

**주요 파일 구조 (예정):**
```
src/
├── index.ts          # Hono 앱 진입점
├── routes/           # API 라우터
├── db/               # D1 쿼리
└── middleware/       # 인증 등
```

**개발 원칙:**
- Cloudflare Workers 환경 제약 준수 (Node.js API 사용 불가)
- D1은 SQLite 방언 사용
- 환경변수는 Wrangler secrets로 관리

**주요 외부 링크:**
- MCP 공식 문서: https://modelcontextprotocol.io
- Hono 문서: https://hono.dev
- Cloudflare D1: https://developers.cloudflare.com/d1
