# [PRD] Playwright Smoke E2E CI 자동화

**Status:** Draft
**Date:** 2026-03-27
**Branch:** main

## 1. 개요 (Overview)
- **배경 및 목적:** 현재 Refentra는 Playwright 기반 브라우저 E2E를 로컬에서 수동 실행할 수 있지만, PR 단계에서 자동으로 회귀를 차단하지는 못합니다. 이 상태는 로그인, 보호 라우트, 저장/재조회, URL 복원 같은 핵심 사용자 흐름이 깨져도 코드 리뷰 단계에서 늦게 발견될 가능성을 남깁니다. 이번 기능의 목적은 PR 생성/업데이트마다 GitHub Actions가 핵심 smoke E2E를 자동 실행해, 수동 확인 단계를 제거하고 브라우저 회귀를 merge 전에 차단하는 것입니다.
- **타겟 워크플로우:** 개발자가 PR을 생성하거나 업데이트하면 GitHub Actions가 PostgreSQL/Redis, Go 서버, 프론트 빌드를 준비한 뒤 Playwright smoke E2E를 실행한다. 통과하면 merge 가능한 상태가 되고, 실패하면 trace/screenshot/report 아티팩트를 확인해 수정 후 다시 push한다.

## 2. 핵심 요구사항 (Core Requirements)
- [ ] PR 생성/업데이트마다 GitHub Actions에서 Playwright smoke E2E를 자동 실행해야 한다.
- [ ] smoke E2E 범위는 최소 `보호 라우트 리다이렉트`, `로그인`, `레퍼런스 저장 후 재조회`, `로그아웃`, `대시보드 URL 쿼리 복원`을 포함해야 한다.
- [ ] CI는 PostgreSQL과 Redis를 함께 준비한 뒤 현재 앱 코드 기준으로 테스트를 실행해야 한다.
- [ ] Playwright 실행 전 Go 서버와 필요한 프론트 자산이 정상 준비됐는지 확인해야 한다.
- [ ] smoke E2E 실패 시 자동 재시도 없이 PR 체크를 실패 처리해야 한다.
- [ ] 실패 시 trace, screenshot, report 등 디버깅 아티팩트를 업로드해야 한다.
- [ ] 같은 PR에 여러 번 push가 들어오면 최신 커밋 기준 실행만 유지하고 이전 실행은 취소해야 한다.
- [ ] 같은 저장소 브랜치 PR은 자동 실행해야 한다.
- [ ] 외부 포크 PR은 기본 자동 실행 대상에서 제외하고, 수동 승인 후 실행 가능한 정책을 가져야 한다.

## 3. 데이터 및 상태 정의 (Data & State Models)
- **상태 전이도:**
  - PR CI: `Queued -> Bootstrapping -> Services Ready -> App Ready -> Playwright Running -> Passed | Failed | Cancelled`
  - 동시성: `Older Run -> Cancelled`, `Latest Run -> Continues`
  - 포크 PR: `Waiting Approval -> Running | Not Approved`
- **핵심 데이터 필드:**
  - GitHub 이벤트: `pull_request`, 필요 시 `workflow_dispatch`
  - 실행 대상 브랜치: PR head SHA
  - 실행 범위: `smoke`
  - 서비스 상태: PostgreSQL readiness, Redis readiness, app health
  - 실패 산출물: Playwright trace, screenshot, HTML report, job logs
- **예상 워크플로우 자산:**
  - GitHub Actions workflow 파일 1개 또는 기존 CI 파일 확장
  - Playwright smoke 프로젝트 또는 smoke 태그 기준 실행 분기
  - CI 아티팩트 업로드 규칙

## 4. 예외 처리 정책 (Exception Handling)
| 상황 | 대응 방안 | 우선순위 |
|------|---------|---------|
| PostgreSQL 또는 Redis가 준비되지 않음 | 지정 시간 내 readiness 실패 시 즉시 job 실패, 원인 로그를 남긴다 | P0 |
| Go 서버 또는 앱 health check 실패 | Playwright 실행 전에 job 실패 처리하고 서버 로그를 남긴다 | P0 |
| smoke E2E 실패 | 자동 재시도 없이 PR 체크 실패, trace/screenshot/report 업로드 | P0 |
| 같은 PR에 새 push가 들어옴 | 이전 실행을 취소하고 최신 SHA 실행만 유지 | P0 |
| 외부 포크 PR | 자동 실행하지 않고 수동 승인 후에만 실행 | P0 |
| 아티팩트 업로드 자체 실패 | 테스트 실패를 우선 보고하고, 아티팩트 업로드 실패는 로그에 명시 | P1 |
| Playwright 일부 시나리오가 flaky | 이번 사이클에서는 재시도 대신 테스트 자체 안정화로 해결한다 | P1 |
| GitHub Actions 권한 부족 또는 시크릿 접근 이슈 | 외부 포크 정책을 분리하고 최소 권한으로 실행한다 | P0 |

## 5. 기술 스택 (Technology Stack)
- **선택한 접근법:** 접근법 A
- **핵심 기술:**
  - GitHub Actions
    - 근거: 현재 저장소의 CI/CD 흐름과 직접 연결되며 PR 차단 기준을 만들기 가장 쉽다.
  - Playwright
    - 근거: 이미 도입된 브라우저 E2E 스택을 그대로 재사용할 수 있다.
  - Go + Echo 서버
    - 근거: smoke E2E는 실제 로그인/저장/조회 흐름을 현재 서버 기준으로 검증해야 한다.
  - PostgreSQL + Redis
    - 근거: 인증과 저장 흐름이 실제 서비스 의존성을 갖고 있으므로 CI도 동일 조건을 따라야 한다.
  - 기존 프로젝트 스택과의 호환성: `호환`

### 접근법 A: 최소 생존 버전
- **요약:** PR마다 GitHub Actions에서 앱 의존 서비스를 준비하고 현재 Playwright 테스트 중 핵심 smoke 시나리오만 실행한다.
- **난이도:** M
- **리스크:** 낮음
- **장점:**
  - PR 회귀 차단을 가장 빠르게 도입할 수 있다.
  - 현재 로컬 실행 방식과 유사해 디버깅이 쉽다.
  - 1인 개발 기준으로 유지 비용이 상대적으로 낮다.
- **단점:**
  - 전체 브라우저 시나리오를 모두 커버하지는 못한다.
  - CI 실행 시간이 단위 테스트보다 길다.
  - smoke와 full 범위를 명시적으로 구분하는 후속 정리가 필요할 수 있다.

### 접근법 B: 이상적 아키텍처
- **요약:** PR에서는 smoke E2E만, `main` 머지 후 또는 스케줄 실행에서는 full E2E까지 분리한 다층 테스트 파이프라인을 설계한다.
- **난이도:** L
- **리스크:** 중간
- **장점:**
  - 장기적으로 테스트 전략이 더 명확하다.
  - PR 속도와 전체 회귀선을 분리할 수 있다.
  - 향후 검색/필터/에러 시나리오 확대에 유리하다.
- **단점:**
  - 현재 단계에서는 설계 복잡도가 높다.
  - 초기 세팅과 운영 규칙이 늘어난다.
  - 지금 당장 필요한 PR 차단 목적을 넘는 범위가 섞인다.

### 추천
- **접근법 A**를 추천한다.
- 이유: 지금 필요한 것은 “브라우저 핵심 회귀를 PR 단계에서 자동 차단하는 최소 신뢰선”이다. 1인 개발 기준에서는 테스트 플랫폼을 과설계하기보다, 핵심 흐름을 빠르게 CI에 올리고 이후 full E2E 전략을 확장하는 편이 비용 대비 효과가 크다.

## 6. 아웃 오브 스코프 (Out of Scope)
| 제외 기능 | 제외 이유 | 예상 도입 시기 |
|----------|----------|-------------|
| 전체 Playwright 시나리오를 PR마다 모두 실행 | PR 대기 시간을 늘리고 flaky 리스크를 키운다 | `main` 후속 또는 nightly |
| 검색/태그/페이지네이션 full E2E 확장 | 이번 목표는 CI 연결이지 신규 시나리오 확장이 아니다 | 후속 QA 사이클 |
| 온보딩 빈 상태를 실제 빈 DB로 재현하는 인프라 고도화 | smoke 회귀선 확보보다 우선순위가 낮다 | 후속 QA 사이클 |
| `actionlint` 도입과 GitHub Actions 전면 정적 검증 | 가치가 있지만 이번 목표의 핵심 경로는 아니다 | CI 하드닝 후속 |
| 실제 배포 파이프라인과 연동된 배포 게이트 설계 | 테스트 자동화와 배포 정책은 분리하는 편이 안전하다 | 배포 자동화 사이클 |
| Redis 기반 분산 rate limiting 검증 | 이번 smoke E2E의 목적과 무관하다 | 인프라 후속 |

## 7. 다음 액션 플랜 (Next Actions)
- GitHub Actions에서 PR 이벤트 기준으로 실행되는 smoke E2E workflow를 설계한다.
- PostgreSQL/Redis 준비, Go 서버 부팅, 프론트 빌드/자산 준비, health check 순서를 고정한다.
- 현재 Playwright 시나리오 중 smoke 범위를 식별하고 실행 대상을 분리한다.
- workflow concurrency를 PR 단위 최신 SHA 우선 정책으로 설정한다.
- 외부 포크 PR 수동 승인 정책과 최소 권한 실행 정책을 문서화한다.
- trace, screenshot, report 아티팩트 업로드 규칙을 추가한다.
- `$qa` 단계에서 로컬 실행과 CI 실행 결과가 일치하는지 검증한다.

## 8. 가정 (Assumptions)
- ⚠️ 현재 저장소의 Playwright 시나리오 중 `보호 라우트`, `로그인`, `저장/재조회`, `로그아웃`, `URL 복원`은 smoke 세트로 분리 가능하다고 가정한다.
- ⚠️ GitHub Actions 러너에서 PostgreSQL/Redis 서비스 컨테이너와 Playwright 브라우저 실행이 허용된다고 가정한다.
- ⚠️ 외부 포크 PR 수동 승인은 GitHub 기본 승인 모델 또는 저장소 운영 정책으로 해결 가능하다고 가정한다.
- ⚠️ PR 단계에서는 smoke E2E만 필수 차단선으로 두고, full E2E 전략은 후속으로 분리한다.
