# Changelog

## [Unreleased]

### 추가
- Playwright로 `search + tags + page` URL 상태 복원과 로그인 후 같은 대시보드 상태 복귀를 검증하는 E2E를 추가
- 잘못된 `page` 쿼리 진입 시 안내 메시지와 `1페이지` 보정을 검증하는 브라우저 시나리오를 추가

### 수정
- `GET /api/v1/references`의 태그 목록 조회 SQL에서 PostgreSQL 예약어 충돌로 발생하던 500 오류를 수정
- Playwright가 기존 `8080` 서버를 재사용하지 않고 현재 코드 기준 `go run .` 서버를 직접 띄우도록 변경
- 기존 인증 E2E 기대값을 현재 로그인 리다이렉트 쿼리 정책과 references 응답 계약에 맞게 갱신

### 테스트
- 브라우저 E2E가 URL, 검색 입력값, 선택 태그 활성화, 현재 페이지 활성화, 새로고침 후 유지까지 검증
- 전체 Playwright 회귀 5개 시나리오 통과

## [v0.7.0] - 2026-03-27

### 추가
- 대시보드의 검색어, 선택 태그, 현재 페이지를 URL 쿼리와 동기화하는 기능 추가
- `/dashboard?search=...&tags=...&page=...` 직접 진입 시 같은 조회 상태를 복원하도록 지원
- 반복 쿼리 파라미터(`tags=A&tags=B`) 기반 태그 필터 직렬화와 서버 파싱 지원 추가

### 수정
- 잘못된 페이지 번호로 진입하면 안내 메시지를 보여준 뒤 마지막 유효 페이지 또는 `1페이지`로 보정하도록 변경
- 로그인 후 대시보드 복귀 시 기존 쿼리 상태를 유지하도록 라우팅 정합성 보강

### 테스트
- Vitest로 URL 초기화, URL 갱신, 잘못된 페이지 보정, 로그인 후 쿼리 복귀 테스트 추가
- Go 테스트에 반복 태그 파라미터 파싱 검증 추가
- 기존 Playwright 핵심 인증/저장 플로우 회귀 통과
- 알려진 이슈: URL 쿼리 복원 자체를 검증하는 Playwright E2E는 아직 없음

## [v0.6.1] - 2026-03-27

### 추가
- `Dockerfile`, `docker-compose.prod.yml`, `Caddyfile` 기반 Tier 2 배포 스캐폴드 추가
- GitHub Actions `ci.yml`, `deploy.yml` 초안 추가
- VPS 기준 배포 절차와 롤백 전략을 `docs/ops/tier2-vps-deployment.md`로 문서화
- 서버 보안 설정을 환경변수 기반으로 제어하는 `SecurityConfig`와 관련 테스트 추가

### 수정
- `README`에 프로덕션 배포 자산과 보안 전제 조건을 정리
- `.gitignore`에 `.env.production`을 추가해 운영 시크릿 파일이 추적되지 않도록 보강
- CORS 허용 오리진, HSTS, CSP, rate limiting이 환경별로 조정 가능하도록 서버 미들웨어 하드닝
- `.env.example`, `.env.production.example`, 운영 가이드에 보안 관련 변수와 프로덕션 기본값 반영

### 테스트
- `docker compose --env-file .env.production.example -f docker-compose.prod.yml config` 통과
- `docker build -t refentra:qa .` 통과
- `go test ./...`, `npm test`, `npm run typecheck`, `npm run build` 통과
- 알려진 이슈: `actionlint` 부재로 GitHub Actions 정적 린트는 아직 미실행

## [v0.6.0] - 2026-03-27

### 추가
- 레퍼런스 검색, 태그 필터, 페이지네이션 기능 추가
- `GET /api/v1/references`가 `search`, `tags`, `page`, `limit`와 페이지 메타데이터를 처리하도록 확장
- 검색/필터/페이지네이션 범위와 예외 처리 정책을 `v1.5` PRD로 문서화

### 수정
- 대시보드 검색 입력, 태그 선택, 페이지 번호가 실제 서버 조회와 연결되도록 변경
- 일반 빈 상태와 검색 결과 없음 상태를 분리
- 태그 배지를 토글 가능한 필터 UI로 확장

### 테스트
- 대시보드 검색, 태그 필터, 페이지 이동, 검색 결과 없음 테스트 추가
- 잘못된 `page`/`limit` 쿼리 파라미터 검증 추가
- 기존 Playwright 브라우저 핵심 플로우 회귀 통과 확인

## [v0.5.1] - 2026-03-27

### 추가
- Playwright 기반 브라우저 E2E 테스트 환경 추가
- 보호 URL 리다이렉트, 로그인, 온보딩 빈 상태, 저장/재조회, 로그아웃 핵심 흐름 E2E 추가
- 브라우저 E2E 범위와 예외 처리 정책을 `v1.4` PRD로 문서화

### 수정
- `npm test`가 `e2e` 디렉토리와 `node_modules` 테스트 파일을 수집하지 않도록 Vitest 범위를 명시적으로 제한
- README에 Playwright 실행 절차와 스크립트 설명 추가

### 테스트
- 실제 Chromium 브라우저에서 3개 핵심 시나리오 통과 확인
- 알려진 이슈: 온보딩 빈 상태는 실제 빈 DB 대신 API 응답 mock으로 검증

## [v0.5.0] - 2026-03-27

### 추가
- Redis 기반 실제 세션 인증 추가
- `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` 추가
- `internal/auth` 패키지로 JWT 쿠키, Refresh Token 저장소, 인증 미들웨어 분리
- 첫 로그인 후 0건일 때 온보딩 가이드 표시 추가

### 수정
- 프론트 인증 상태를 `localStorage` 플래그에서 서버 세션 확인 방식으로 전환
- 보호된 `references` API가 인증 사용자 기준으로만 동작하도록 정리
- `health` 체크에 Redis 준비 상태를 포함
- Docker Compose가 PostgreSQL과 Redis를 함께 띄우도록 변경

### 테스트
- 쿠키 기반 로그인, 보호 라우트, 보호 API, Refresh Token 회전, 로그아웃 무효화 검증 추가
- 잘못된 비밀번호 로그인 거부와 라이브 인증 플로우 QA 확인
- 알려진 이슈: 브라우저 E2E 자동화는 아직 없음

## [v0.4.0] - 2026-03-27

### 추가
- Docker Compose 기반 로컬 PostgreSQL 개발 환경 추가
- `GET /api/v1/health` 헬스체크 API와 프론트엔드 설정 안내 페이지 추가
- PostgreSQL 첫 생성 시 mock 사용자와 데모 레퍼런스를 주입하는 init script 추가
- `.env.example` 기반 DB 설정 문서화

### 수정
- 기본 로컬 DB 포트를 `5433`으로 조정해 다른 프로젝트의 기본 `5432` 사용과 충돌 가능성을 낮춤
- 앱 시작 시 DB 준비 상태를 먼저 확인하고, 미연결 상태를 빈 화면이나 빈 목록처럼 숨기지 않도록 변경
- 레퍼런스 저장/조회 API가 DB 미연결 시 `503 Service Unavailable`를 반환하도록 정리
- UUID 생성을 DB 함수 의존에서 애플리케이션 레벨 생성으로 변경

### 테스트
- 앱 부팅 시 헬스체크와 설정 안내 페이지 표시 테스트 추가
- DB 미연결 상태의 레퍼런스 API 오류 시나리오 테스트 추가
- Docker DB `5433` 포트 리스닝, 헬스 응답, 실제 저장/재조회 라이브 QA 확인

## [v0.3.0] - 2026-03-26

### 추가
- 대시보드가 `GET /api/v1/references`로 실제 레퍼런스 목록을 조회하도록 연동
- 레퍼런스 추가 모달이 `POST /api/v1/references`를 호출해 실제 저장하도록 연동
- 레퍼런스 저장/조회 연동 범위와 예외 처리 정책을 `v1.1` PRD로 문서화

### 수정
- 대시보드에 `Loading / Empty / Error / Success` 상태 표시 추가
- 저장 실패 시 입력값 유지와 에러 메시지 표시 지원
- 저장 중 중복 제출 방지 처리 추가

### 테스트
- 대시보드 조회 성공, 빈 상태, 조회 실패 재시도 테스트 추가
- 저장 성공, 저장 실패, 중복 제출 방지 테스트 추가
- 알려진 이슈: 로그인 후 실제 브라우저에서 대시보드 저장/재조회 E2E 자동화는 아직 없음

## [v0.2.0] - 2026-03-26

### 추가
- 로그인 검증, 인증 상태 저장, 보호된 대시보드 라우팅 추가
- 대시보드에서 새 레퍼런스를 등록하는 모달 제출 흐름 추가
- 레퍼런스 입력값 정제와 필수값 검증을 서버 핸들러에 추가

### 수정
- 로그인 화면 버튼 대비를 WCAG AA 기준에 맞게 조정
- 한글 `word-break: keep-all`, 루트 폰트 스택, 링크 터치 타겟 기준 보강

### 테스트
- Vitest, jsdom, Testing Library 기반 프론트엔드 테스트 환경 추가
- 로그인 흐름과 레퍼런스 등록 모달 테스트 추가
- 인증/레퍼런스 핸들러 Go 테스트 추가
