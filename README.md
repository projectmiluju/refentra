# Refentra
팀 레퍼런스를 한곳에 모아 검색하고 공유하는 협업형 지식 아카이브 MVP입니다.

## 시작하기 (Getting Started)

### 사전 요구사항
- Go `1.26.1`
- Node.js `20` 이상
- npm
- Docker
- Docker Compose

### 설치
```bash
git clone https://github.com/projectmiluju/refentra.git
cd refentra
cp .env.example .env
go mod download
cd frontend
npm install
```

### 환경변수 설정
기본 환경변수는 [.env.example](/Users/wonyong/Desktop/myproject/refentra/.env.example)에 있습니다.

로컬 개발용 기본 DB 연결 정보:
- host: `localhost`
- user: `postgres`
- password: `postgres`
- dbname: `refentra`
- port: `5433`

로컬 개발용 기본 Redis 연결 정보:
- host: `localhost`
- port: `6380`
- db: `0`

인증 기본값:
- mock 로그인 이메일: `dev@refentra.com`
- mock 로그인 비밀번호: `password123`
- Access Token: `httpOnly` 쿠키, 기본 `15분`
- Refresh Token: Redis 저장, 기본 `24시간`

보안 기본값:
- 개발 환경 CORS 허용 오리진: `localhost/127.0.0.1`의 `4173`, `5173`, `8080`
- 기본 rate limiting: `60 requests / 60 seconds`
- 개발 환경 HSTS: 비활성화
- CSP(Content-Security-Policy): same-origin 중심 기본 정책 적용

`.env`에서 비밀번호와 포트를 바꾸면 앱과 Docker DB가 같은 값을 보도록 맞춰야 합니다.

### 실행
DB/Redis 컨테이너 실행:
```bash
docker compose up -d postgres redis
```

프론트엔드 개발 서버:
```bash
cd frontend
npm run dev
```

프론트엔드 검증:
```bash
cd frontend
npm test
npm run typecheck
npm run build
npm run test:e2e
```

백엔드 실행:
```bash
cd /Users/wonyong/Desktop/myproject/refentra
go run .
```

주의:
- Go 서버는 `frontend/dist`를 `go:embed`로 서빙하므로, 정적 파일 포함 상태를 확인하려면 먼저 `frontend`에서 `npm run build`가 필요합니다.
- DB 또는 Redis가 준비되지 않으면 앱은 정상 화면 대신 설정 안내 페이지를 보여줍니다.
- 프론트엔드 개발 서버(`npm run dev`)는 `/api` 요청을 `http://127.0.0.1:8080`으로 프록시합니다.

### 데모 데이터
- PostgreSQL 컨테이너 첫 생성 시 mock 사용자 `user-1234`와 데모 레퍼런스 3개가 1회만 주입됩니다.
- 컨테이너를 껐다 켜도 기존 volume이 유지되면 데이터는 다시 주입되지 않습니다.
- 현재 로그인은 mock 사용자 1명을 기준으로 하지만, 세션 자체는 서버가 발급하고 검증합니다.
- 로그인 성공 시 Access Token은 `httpOnly` 쿠키로 내려가고, Refresh Token은 Redis에 저장됩니다.
- 로그아웃 시 Redis Refresh Token과 브라우저 쿠키가 함께 폐기됩니다.
- 대시보드에서는 제목/설명/URL 기준 검색, 태그 필터, 번호 기반 페이지네이션이 실제 서버 조회로 동작합니다.

### 재초기화
데모 데이터를 처음 상태로 되돌리려면 volume까지 삭제해야 합니다.
```bash
docker compose down -v
docker compose up -d postgres redis
```

## 프로젝트 구조
```text
.
├── docker/
│   └── postgres/
│       └── init/
├── docs/
│   ├── design/
│   ├── devlog/
│   └── prd/
├── frontend/
│   ├── e2e/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── test/
│   │   └── types/
│   └── package.json
├── internal/
│   ├── auth/
│   ├── handlers/
│   ├── models/
│   └── server/
├── CHANGELOG.md
├── go.mod
└── main.go
```

## 기술 스택
- 프론트엔드: React 18, Vite 8, TypeScript, Tailwind CSS
- 테스트: Vitest, jsdom, Testing Library, Playwright
- 백엔드: Go 1.26, Echo, GORM, JWT
- 데이터베이스: PostgreSQL 16 (Docker Compose)
- 세션 저장소: Redis 7 (Docker Compose)

관련 배경:
- [제품 기본 PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.md)
- [저장/조회 연동 PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.1-reference-persistence.md)
- [로컬 Docker Postgres PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.2-local-dev-docker-postgres.md)
- [Redis 세션 인증 PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.3-redis-session-auth.md)
- [브라우저 E2E PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.4-browser-e2e.md)
- [검색/필터/페이지네이션 PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.5-search-filter-pagination.md)

## 스크립트
`frontend/package.json` 기준:
- `npm run dev`: Vite 개발 서버 실행
- `npm run build`: TypeScript 컴파일 후 프로덕션 번들 생성
- `npm run preview`: 빌드 결과 미리보기
- `npm run typecheck`: 프론트엔드 타입 검사
- `npm test`: Vitest 테스트 실행
- `npm run test:e2e`: Playwright 기반 브라우저 E2E 실행
- `npm run test:e2e:headed`: Playwright E2E를 headed 모드로 실행

Go 기준:
- `go test ./...`: 백엔드 테스트 실행
- `go run .`: Echo 서버 실행

Docker 기준:
- `docker compose up -d postgres redis`: 개발용 PostgreSQL/Redis 실행
- `docker compose down`: 컨테이너 중지
- `docker compose down -v`: volume까지 삭제하고 초기 상태로 재생성 준비

## 배포 스캐폴드
- 운영 배포 자산은 아래 파일로 분리되어 있습니다.
  - [Dockerfile](/Users/wonyong/Desktop/myproject/refentra/Dockerfile)
  - [docker-compose.prod.yml](/Users/wonyong/Desktop/myproject/refentra/docker-compose.prod.yml)
  - [Caddyfile](/Users/wonyong/Desktop/myproject/refentra/Caddyfile)
  - [.env.production.example](/Users/wonyong/Desktop/myproject/refentra/.env.production.example)
  - [ci.yml](/Users/wonyong/Desktop/myproject/refentra/.github/workflows/ci.yml)
  - [deploy.yml](/Users/wonyong/Desktop/myproject/refentra/.github/workflows/deploy.yml)
- 권장 운영 토폴로지는 `Hetzner VPS + Docker Compose + Caddy + 내부 PostgreSQL/Redis`입니다.
- 실제 배포 절차와 롤백 방식은 [tier2-vps-deployment.md](/Users/wonyong/Desktop/myproject/refentra/docs/ops/tier2-vps-deployment.md)에 정리했습니다.
- 프로덕션에서는 반드시 아래 조건을 만족해야 합니다.
  - `AUTH_COOKIE_SECURE=true`
  - 강한 `AUTH_JWT_SECRET`, `DB_PASSWORD`, `REDIS_PASSWORD`
  - 실제 도메인과 ACME 이메일 설정
  - `CORS_ALLOW_ORIGINS`를 실제 배포 도메인만 포함하도록 제한
  - `SECURITY_ENABLE_HSTS=true`
  - DB/Redis 외부 포트 미노출
