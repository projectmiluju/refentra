# 프로젝트 현황

**최종 업데이트:** 2026-03-29
**현재 버전:** main (미태깅)
**배포 URL:** 미정

## 최근 변경
- `main`에는 fresh DB 기준 `users.email` unique 제약 마이그레이션 충돌 수정이 반영됐습니다.
- 원인은 Docker init SQL의 `users_email_key`와 GORM `AutoMigrate`가 기대하는 unique 제약 이름이 달랐던 것이고, 현재는 앱 시작 시 legacy 제약 이름을 정리한 뒤 마이그레이션을 수행합니다.
- 이 수정으로 GitHub Actions `Playwright Smoke E2E`의 health check 단계에서 fresh DB가 `503`으로 멈추던 문제가 해소됐습니다.
- `main`에는 최소 회원가입 기반 실제 사용자 인증 전환이 반영됐습니다.
- 백엔드에는 `users` 저장 구조, 이메일 unique 제약, `POST /api/v1/auth/signup`, 비밀번호 해시 검증이 추가됐습니다.
- 프론트는 `/signup` 진입, `name/email/password` 가입 폼, 가입 성공 직후 자동 로그인, 제품 모드 빈 상태 대시보드 진입 흐름을 지원합니다.
- 랜딩에서는 포트폴리오 데모 CTA와 제품 모드 `Create account` / `Sign in` 진입이 분리됐습니다.
- Vitest, Go 테스트, Playwright smoke는 회원가입 자동 로그인, 중복 이메일, 보호 라우트 리다이렉트, 제품 모드/포트폴리오 모드 공존까지 검증하도록 확장됐습니다.
- `main`에는 포트폴리오 제출용 cold minimal 랜딩, 영어 기반 대시보드, 레퍼런스 추가 모달 리디자인이 반영됐습니다.
- 랜딩은 `히어로 → 문제 제기 → 기능 하이라이트 → 대시보드 미리보기 → CTA` 구조로 재구성됐고, 포트폴리오 데모 CTA는 `/dashboard?mode=portfolio`로 연결됩니다.
- 대시보드에는 `portfolio` / `product` 모드가 명시적으로 분리됐습니다.
- 포트폴리오 모드에서는 샘플 데이터, 검색, 태그 필터, 페이지네이션, 모달 저장 흐름이 브라우저 내 데모 레이어로 동작합니다.
- 제품 모드는 기존 API 조회/저장 계약을 유지합니다.
- `POST /api/v1/references`는 동일 사용자 기준 `url + title` 중복 저장을 서버에서 거절하도록 보강됐습니다.
- Vitest, Go 테스트, Playwright smoke가 포트폴리오 모드와 저장 보호 정책까지 검증하도록 확장됐습니다.
- GitHub 이슈 `#6`, `#7`은 기존 `main` 직행 커밋 기준으로 수동 정리됐고, `#5`, `#8`은 브랜치/PR 흐름으로 다시 닫았습니다.
- `main`에는 same-repo PR 전용 `Playwright Smoke E2E` GitHub Actions job이 추가됐습니다.
- PR에서는 full Playwright 대신 smoke 범위만 실행하고, full E2E는 `push` 경로에 남겨 PR 대기 시간을 줄였습니다.
- smoke 범위는 회원가입 후 자동 로그인, 보호 라우트 리다이렉트, 저장/재조회/로그아웃, 대시보드 URL 쿼리 복원 4개 시나리오로 고정됐습니다.
- PostgreSQL/Redis readiness, 앱 health check, HTML report, test-results, 서버 로그 아티팩트 업로드 규칙이 워크플로에 반영됐습니다.
- QA 과정에서 Playwright HTML report 환경변수 충돌로 산출물 경로가 어긋나는 문제가 드러났고, `REFENTRA_PLAYWRIGHT_*` 접두사로 수정됐습니다.
- 깨끗한 GitHub Actions 체크아웃에서 `go test ./...`가 `frontend/dist` 부재로 실패하던 문제를 `frontend/dist/.gitkeep` 추적으로 해결했습니다.
- `main`에는 Playwright 기반 대시보드 URL 쿼리 복원 E2E가 추가됐습니다.
- 쿼리 포함 `/dashboard` 직접 진입, 로그인 후 같은 상태 복귀, 새로고침 후 유지, 잘못된 `page`의 `1페이지` 보정까지 브라우저에서 검증합니다.
- Playwright는 더 이상 기존 `8080` 서버를 재사용하지 않고, 현재 코드 기준 `go run .` 서버를 직접 띄웁니다.
- `GET /api/v1/references`의 태그 목록 조회 SQL에서 발생하던 PostgreSQL 예약어 충돌 500 오류를 수정했습니다.
- `main`에는 대시보드 검색어, 선택 태그, 현재 페이지를 URL 쿼리와 동기화하는 변경이 반영됐습니다.
- `/dashboard?search=...&tags=...&page=...` 형태의 직접 진입과 새로고침 시 같은 조회 상태를 복원합니다.
- 잘못된 페이지 번호는 안내 후 마지막 유효 페이지 또는 `1페이지`로 자동 보정됩니다.
- 로그인 후에도 원래 대시보드 쿼리 상태로 복귀하도록 라우팅 정합성이 보강됐습니다.
- `GET /api/v1/references`는 반복 `tags` 쿼리 파라미터와 기존 콤마 구분 형식을 모두 처리합니다.
- `main`에는 프로덕션 배포용 `Dockerfile`, `docker-compose.prod.yml`, `Caddyfile`, GitHub Actions 초안이 추가됐습니다.
- 권장 운영 토폴로지는 `Hetzner VPS + Docker Compose + Caddy + 내부 PostgreSQL/Redis`로 정리됐습니다.
- 운영 배포 절차와 롤백 방식은 `docs/ops/tier2-vps-deployment.md`에 문서화됐습니다.
- 서버가 CORS 허용 오리진, HSTS, CSP, API rate limiting을 환경변수로 제어할 수 있도록 하드닝됐습니다.
- 보안 헤더와 rate limiting 동작은 Go 테스트로 자동 검증됩니다.
- `v0.6.0`에서 검색/태그 필터/페이지네이션이 실제 데이터와 연결됐습니다.
- `GET /api/v1/references`가 페이지 메타데이터와 사용 가능한 태그 목록을 함께 반환합니다.
- 대시보드는 검색 입력, 태그 토글, 페이지 번호를 실제 서버 조회에 연결하고, 검색 결과 없음 상태를 별도로 보여줍니다.
- 기존 로그인/저장/재조회/로그아웃 Playwright 핵심 플로우는 이번 변경 후에도 회귀 없이 통과했습니다.

## 알려진 이슈
| 이슈 | 심각도 | 상태 |
|------|-------|------|
| 리디자인 작업 초기에 일부 변경이 `main`에 직접 반영돼 이슈/PR 이력을 사후 정리했다 | 낮음 | 정리 완료, 프로세스 주의 |
| Docker DB와 앱 실행 절차가 정리됐지만, 여전히 Go 서버와 Vite 서버는 수동으로 각각 실행해야 함 | 낮음 | 유지 |
| `go mod tidy`가 현재 저장소 루트에서 `frontend/node_modules`까지 스캔하려 들어가 실패함 | 낮음 | 조사 필요 |
| 온보딩 빈 상태 E2E가 실제 빈 DB 대신 API 응답 mock에 의존함 | 낮음 | 유지 |
| 검색/태그 필터/페이지네이션 전체 시나리오를 PR smoke에 넣지는 않고 핵심 흐름만 선별했다 | 낮음 | 유지 |
| GitHub Actions 워크플로우는 `actionlint` 정적 린트가 아직 없음 | 낮음 | 진행 예정 |
| rate limiting이 메모리 스토어 기반이라 다중 인스턴스 환경에서는 공유되지 않음 | 중간 | 유지 |
| CSP는 현재 앱 구조 기준의 보수적 기본값이라 외부 리소스 추가 시 재조정 필요 | 낮음 | 유지 |
| `.env.example`, `docker-compose.prod.yml`에 `AUTH_MOCK_*` 레거시 환경변수가 남아 있음 | 낮음 | 정리 필요 |
| Docker init SQL과 GORM `AutoMigrate`를 병행하는 구조라 future schema 변경 시 fresh volume 재검증이 필수임 | 낮음 | 운영 주의 |

## 기술 부채
| 항목 | 등록일 | 예상 작업량 |
|------|-------|-----------|
| 포트폴리오 모드 샘플 데이터 레이어를 장기적으로 실제 시드/프레젠테이션 계층과 어떻게 통합할지 결정 | 2026-03-29 | 반나절~1일 |
| 리디자인/실험성 작업도 이슈 브랜치에서 시작하도록 workflow 체크리스트 강화 | 2026-03-29 | 반나절 |
| Docker init SQL과 GORM 모델 변경을 장기적으로 마이그레이션 체계로 통합 | 2026-03-27 | 1일 |
| Go 모듈 루트와 프론트 자산 구조 충돌 없이 `go mod tidy` 가능한 정리 | 2026-03-27 | 반나절 |
| rate limiting을 Redis 등 공유 스토어 기반으로 바꿔 다중 인스턴스 대응 | 2026-03-27 | 반나절~1일 |
| CSP를 실제 외부 자산/분석 도구 도입 시 정책 단위로 재정비 | 2026-03-27 | 반나절 |
| 검색/태그 필터/페이지네이션 전체 회귀를 nightly 또는 후속 full E2E로 확장 | 2026-03-27 | 반나절 |
| 레거시 `AUTH_MOCK_*` 환경변수와 운영 compose 예시를 실제 사용자 인증 기준으로 정리 | 2026-03-29 | 반나절 |
| 비밀번호 재설정, 계정 삭제 같은 계정 관리 기능이 아직 없음 | 2026-03-29 | 1일~2일 |
| Docker init SQL과 앱 마이그레이션의 역할 분리를 명시한 정식 migration 체계 도입 | 2026-03-29 | 1일 |

## 다음 계획
- [ ] 포트폴리오 모드 샘플 데이터 레이어를 장기적으로 유지할지, 별도 프레젠테이션 계층으로 분리할지 결정
- [ ] 이슈 생성 후 브랜치 생성, PR 생성까지 강제하는 작업 체크리스트를 정리
- [ ] 레거시 `AUTH_MOCK_*` 환경변수와 운영 compose 예시를 정리
- [ ] 비밀번호 재설정, 계정 삭제를 포함한 계정 관리 범위를 다음 PRD로 분리
- [ ] 검색/태그 필터/페이지네이션 full E2E 범위를 nightly 또는 후속 워크플로로 확장
- [ ] GitHub Actions에 `actionlint` 또는 동등한 정적 검증 추가
- [ ] 배포 자동화와 서버 시크릿 주입 절차를 실제 환경 기준으로 확정
- [ ] rate limiting을 공유 스토어 기반으로 확장할지 결정
- [ ] 실제 운영 도메인 기준으로 CSP를 재조정
