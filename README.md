# ⚡ MCP Marketplace

MCP(Model Context Protocol) 서버를 공유하고 판매하는 마켓플레이스.  
Claude Desktop, Cursor 등 MCP 지원 AI 도구에서 바로 쓸 수 있는 서버를 찾고 등록하세요.

## 주요 기능

- MCP 서버 목록 조회 · 검색 · 카테고리 필터
- GitHub OAuth 로그인
- MCP 서버 등록 (GitHub 링크 + 설치 명령어)
- 서버 상세 페이지 + 설치 명령어 원클릭 복사

## Tech Stack

| 레이어 | 기술 |
|--------|------|
| Runtime | Cloudflare Workers |
| Framework | [Hono](https://hono.dev) |
| Database | Cloudflare D1 (SQLite) |
| Auth | GitHub OAuth 2.0 + JWT |
| UI | Server-rendered HTML + Tailwind CSS CDN |
| 로컬 개발 | Node.js + Wrangler |

## 로컬 개발 시작

### 사전 조건

- Node.js 18+
- [GitHub OAuth App](https://github.com/settings/developers) 등록 필요

### 설치

```bash
git clone https://github.com/achul1026/mcp-marketplace
cd mcp-marketplace
npm install
```

### 환경변수 설정

`.dev.vars` 파일 생성 (`.gitignore`에 포함됨):

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
JWT_SECRET=your-random-secret
APP_URL=http://localhost:8787
```

GitHub OAuth App 설정:
- Homepage URL: `http://localhost:8787`
- Callback URL: `http://localhost:8787/auth/callback`

### DB 마이그레이션

```bash
npm run db:migrate:local
```

### 개발 서버 실행

```bash
npm run dev
# → http://localhost:8787
```

## 배포 (Cloudflare)

### 1. D1 데이터베이스 생성

```bash
npx wrangler d1 create mcp-marketplace-db
```

출력된 `database_id`를 `wrangler.toml`에 붙여넣기.

### 2. 마이그레이션 적용

```bash
npm run db:migrate
```

### 3. 시크릿 등록

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

### 4. 배포

```bash
npm run deploy
```

## 프로젝트 구조

```
src/
├── index.ts              # 앱 진입점
├── types.ts              # 타입 정의 + Env 바인딩
├── routes/
│   ├── servers.ts        # 서버 목록 · 등록 · 상세
│   └── auth.ts           # GitHub OAuth 플로우
├── lib/
│   ├── auth.ts           # JWT 생성 · 검증
│   └── github.ts         # GitHub API 호출
└── ui/
    ├── layout.ts          # HTML 레이아웃 + 헤더
    └── pages/
        ├── home.ts        # 서버 목록 페이지
        ├── detail.ts      # 서버 상세 페이지
        └── submit.ts      # 서버 등록 폼
migrations/
└── 0001_init.sql         # D1 스키마 (users, servers, FTS)
```

## 로드맵

- [x] MVP: 서버 목록 · 등록 · 상세 · GitHub 로그인
- [x] Phase 1: 평점/리뷰 · 개발자 대시보드 · 서버 버전 관리 (결제 보류)
- [ ] Phase 2: 자동 검증 (GitHub 메타 완료, 코드 스캔 예정) · 클라이언트 통합 · 컬렉션

## License

MIT
