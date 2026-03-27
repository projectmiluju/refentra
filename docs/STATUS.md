# 프로젝트 현황

**최종 업데이트:** 2026-03-27
**현재 버전:** v0.8.0
**배포 URL:** 미정

## 최근 변경
- `main`에는 same-repo PR 전용 `Playwright Smoke E2E` GitHub Actions job이 추가됐습니다.
- PR에서는 full Playwright 대신 smoke 범위만 실행하고, full E2E는 `push` 경로에 남겨 PR 대기 시간을 줄였습니다.
- smoke 범위는 보호 라우트 리다이렉트, 저장/재조회/로그아웃, 대시보드 URL 쿼리 복원 3개 시나리오로 고정됐습니다.
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
| Docker DB와 앱 실행 절차가 정리됐지만, 여전히 Go 서버와 Vite 서버는 수동으로 각각 실행해야 함 | 낮음 | 유지 |
| `go mod tidy`가 현재 저장소 루트에서 `frontend/node_modules`까지 스캔하려 들어가 실패함 | 낮음 | 조사 필요 |
| mock 사용자 1명 기반이라 실제 계정/권한 도메인은 아직 없음 | 중간 | 진행 예정 |
| 온보딩 빈 상태 E2E가 실제 빈 DB 대신 API 응답 mock에 의존함 | 낮음 | 유지 |
| 검색/태그 필터/페이지네이션 전체 시나리오를 PR smoke에 넣지는 않고 핵심 흐름만 선별했다 | 낮음 | 유지 |
| GitHub Actions 워크플로우는 `actionlint` 정적 린트가 아직 없음 | 낮음 | 진행 예정 |
| rate limiting이 메모리 스토어 기반이라 다중 인스턴스 환경에서는 공유되지 않음 | 중간 | 유지 |
| CSP는 현재 앱 구조 기준의 보수적 기본값이라 외부 리소스 추가 시 재조정 필요 | 낮음 | 유지 |

## 기술 부채
| 항목 | 등록일 | 예상 작업량 |
|------|-------|-----------|
| Docker init SQL과 GORM 모델 변경을 장기적으로 마이그레이션 체계로 통합 | 2026-03-27 | 1일 |
| mock 사용자 1명 정책을 실제 계정/비밀번호 체계로 확장 | 2026-03-27 | 1~2일 |
| Go 모듈 루트와 프론트 자산 구조 충돌 없이 `go mod tidy` 가능한 정리 | 2026-03-27 | 반나절 |
| rate limiting을 Redis 등 공유 스토어 기반으로 바꿔 다중 인스턴스 대응 | 2026-03-27 | 반나절~1일 |
| CSP를 실제 외부 자산/분석 도구 도입 시 정책 단위로 재정비 | 2026-03-27 | 반나절 |
| 검색/태그 필터/페이지네이션 전체 회귀를 nightly 또는 후속 full E2E로 확장 | 2026-03-27 | 반나절 |

## 다음 계획
- [ ] mock 사용자 기반 인증을 실제 사용자 계정 체계로 확장할지 결정
- [ ] 검색/태그 필터/페이지네이션 full E2E 범위를 nightly 또는 후속 워크플로로 확장
- [ ] GitHub Actions에 `actionlint` 또는 동등한 정적 검증 추가
- [ ] 배포 자동화와 서버 시크릿 주입 절차를 실제 환경 기준으로 확정
- [ ] rate limiting을 공유 스토어 기반으로 확장할지 결정
- [ ] 실제 운영 도메인 기준으로 CSP를 재조정
