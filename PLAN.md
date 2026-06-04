# MCP 서버 마켓플레이스

## 개요
Claude Desktop, Cursor 등 MCP 지원 AI 도구의 MCP 서버를 공유·판매하는 마켓플레이스.

**핵심 가치:** 개발자는 MCP 서버로 수익을 얻고, 사용자는 검증된 MCP 서버를 쉽게 찾는다.
**타겟:** MCP 서버 개발자 (공급자) + Claude/Cursor 헤비유저 (수요자)

## 시장 분석

(상세: `_workspace/01-mcp-marketplace_research.md` 참조. 본 항목 수치는 1차 검증 필요)

- MCP는 2024년 11월 Anthropic이 공개한 후 사실상 AI 도구 연결의 표준으로 자리잡음. Claude Desktop, Cursor, Cline, Windsurf 등 다수 클라이언트가 채택.
- 디렉토리·카탈로그 서비스(Smithery.ai, mcp.so, Pulse MCP, Glama.ai)는 다수 존재하나 **결제·수익 배분이 결합된 마켓플레이스는 사실상 공백**.
- Anthropic 공식 Registry가 등장했으나 큐레이션·결제 기능은 제한적 → 차별화 여지 존재.
- 가장 큰 리스크는 Anthropic 공식의 기능 확장. 대응 전략은 "오픈소스 친화 + 결제·수익화 + 보안 검증" 포지셔닝.

## 기술 스택 및 아키텍처

### 선택 기술 및 이유
- **Runtime:** Bun — Node.js 대비 빠른 시작, 네이티브 SQLite 내장 (로컬 dev/빌드 용도. Workers 런타임은 V8 isolate)
- **DB:** Cloudflare D1 (SQLite) — 무료 5GB, 글로벌 분산, Workers와 통합 단순
- **배포:** Cloudflare Pages + Workers — 무료 티어 충분
- **UI:** TypeScript + Hono (경량 웹 프레임워크)

### 아키텍처
```
Cloudflare Pages (정적 UI)
      ↓
Cloudflare Workers (API)
      ↓
D1 SQLite (DB) + R2 (파일 스토리지)
```

### 핵심 DB 스키마
- `servers` (id, name, description, category, price, author_id, download_count)
- `users` (id, github_id, email, stripe_account_id)
- `purchases` (id, user_id, server_id, amount, created_at)
- `reviews` (id, user_id, server_id, rating, comment)

## 개발 로드맵

### MVP (목표: 6주)
**완료 기준:** 실제 MCP 서버 등록·다운로드 가능, 무료 서버 5개 이상 등록

기능:
- [ ] MCP 서버 목록 조회 + 검색 + 카테고리 필터
- [ ] GitHub OAuth 로그인
- [ ] 무료 MCP 서버 등록 (GitHub 링크 + 설명)
- [ ] MCP 서버 다운로드 (install 명령어 제공)
- [ ] 기본 README 렌더링

기술 작업:
- [ ] Cloudflare Workers + D1 세팅
- [ ] Hono 라우터 구성
- [ ] GitHub OAuth 연동
- [ ] 기본 UI (Vanilla HTML + Tailwind CDN)

### Phase 1: 수익화 (MVP 후 6주)
**완료 기준:** 첫 유료 거래 발생

기능:
- [ ] Stripe Connect 연동 (개발자 페이아웃)
- [ ] 유료 MCP 서버 구매 플로우
- [ ] 서버 버전 관리
- [ ] 평점/리뷰 시스템
- [ ] 개발자 대시보드 (다운로드 수, 수익)

### Phase 2: 성장 (Phase 1 후 2개월)
- [ ] MCP 서버 자동 검증 (보안 스캔)
- [ ] 컬렉션/번들 기능
- [ ] API for MCP 클라이언트 직접 통합
- [ ] 커뮤니티 기능 (포럼, Q&A)

## 수익화 전략
- **수수료 모델:** 유료 서버 판매액의 20% 수수료
- **프리미엄 노출:** 검색 상단 노출 광고 (월정액)
- **엔터프라이즈:** 사설 마켓플레이스 화이트레이블

**가격 전략:**
- 무료 서버: 수수료 없음 (생태계 확장)
- 유료 서버: $5~50 일회성 or 월정액

## 초기 비용 분석
| 항목 | 무료 한도 | 비고 |
|------|---------|------|
| Cloudflare Pages | 무제한 | 정적 배포 |
| Cloudflare Workers | 100K req/일 | API |
| Cloudflare D1 | 5GB, 5M rows/월 | DB |
| GitHub OAuth | 무료 | 인증 |
| Stripe | 거래당 2.9%+$0.30 | 수익 발생 시만 |

**초기 월 비용: $0** (MVP 단계)

## 경쟁 우위
1. **선점 효과:** MCP 마켓플레이스 시장이 이제 막 형성 중
2. **Cloudflare 엣지:** 글로벌 빠른 응답
3. **개발자 친화:** GitHub 로그인, CLI 설치 명령어

## 리스크 및 대응
| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| Anthropic이 공식 마켓플레이스 출시 | 중 | 커뮤니티/오픈소스 포지셔닝으로 차별화 |
| 보안 악성 MCP 서버 | 고 | 코드 리뷰 요구, 커뮤니티 신고 시스템 |
| 낮은 수요 | 중 | MVP에서 무료 서버 중심으로 생태계 먼저 구축 |

## 참고 자료
- MCP 공식 문서: https://modelcontextprotocol.io
- Cloudflare D1 한도: https://developers.cloudflare.com/d1/platform/limits
