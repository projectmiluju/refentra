# Refentra
팀 레퍼런스를 한곳에 모아 검색하고 공유하는 협업형 지식 아카이브 MVP입니다.

## 시작하기 (Getting Started)

### 사전 요구사항
- Go `1.26.1`
- Node.js `20` 이상
- npm
- PostgreSQL

### 설치
```bash
git clone https://github.com/projectmiluju/refentra.git
cd refentra
go mod download
cd frontend
npm install
```

### 환경변수 설정
현재 `.env.example`은 없습니다.

현 시점 서버 실행에 필요한 DB 연결 정보는 [main.go](/Users/wonyong/Desktop/myproject/refentra/main.go)에 하드코딩되어 있습니다.
- host: `localhost`
- user: `postgres`
- password: `postgres`
- dbname: `refentra`
- port: `5432`

문서 기준으로는 환경변수화가 필요하지만, 아직 구현되지 않았습니다.

### 실행
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
```

백엔드 실행:
```bash
cd /path/to/refentra
go run .
```

주의:
- Go 서버는 `frontend/dist`를 `go:embed`로 서빙하므로, 정적 파일 포함 상태를 확인하려면 먼저 `frontend`에서 `npm run build`가 필요합니다.
- DB 연결이 실패해도 서버는 현재 mock/비연결 모드로 기동됩니다.

## 프로젝트 구조
```text
.
├── docs/
│   ├── design/
│   └── prd/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── test/
│   │   └── types/
│   └── package.json
├── internal/
│   ├── handlers/
│   ├── models/
│   └── server/
├── CHANGELOG.md
├── go.mod
└── main.go
```

## 기술 스택
- 프론트엔드: React 18, Vite 8, TypeScript, Tailwind CSS
- 테스트: Vitest, jsdom, Testing Library
- 백엔드: Go 1.26, Echo, GORM
- 데이터베이스: PostgreSQL

관련 배경은 [PRD](/Users/wonyong/Desktop/myproject/refentra/docs/prd/refentra-v1.md)를 기준으로 합니다.

## 스크립트
`frontend/package.json` 기준:
- `npm run dev`: Vite 개발 서버 실행
- `npm run build`: TypeScript 컴파일 후 프로덕션 번들 생성
- `npm run preview`: 빌드 결과 미리보기
- `npm run typecheck`: 프론트엔드 타입 검사
- `npm test`: Vitest 테스트 실행

Go 기준:
- `go test ./...`: 백엔드 테스트 실행
- `go run .`: Echo 서버 실행
