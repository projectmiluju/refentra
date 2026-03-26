# [PRD] Refentra v1.3 Redis 기반 실제 세션 인증

**Status:** Approved
**Date:** 2026-03-27
**Branch:** main

## 1. 개요 (Overview)
- **배경 및 목적:** `v0.4.0` 기준 Refentra는 레퍼런스 저장/조회와 로컬 Docker 개발 환경까지는 정리됐지만, 인증은 여전히 프론트엔드 `localStorage` 플래그에 의존하는 mock 상태입니다. 이 구조에서는 서버가 요청 사용자를 검증하지 못하고, 로그인 상태도 브라우저 임의 조작에 취약합니다. 이번 사이클의 목표는 mock 사용자 1명을 유지하되, 실제 세션 발급과 검증을 서버 중심으로 전환해 보호된 화면과 API가 서버가 인정한 로그인 상태에서만 동작하게 만드는 것입니다.
- **타겟 워크플로우:** 사용자는 로그인 페이지에서 mock 계정으로 로그인하고, 서버는 Access Token을 `httpOnly` 쿠키로 내려주며 Refresh Token은 Redis에 저장합니다. 보호된 화면 접근 시 프론트는 세션 확인 API로 현재 로그인 상태를 검증하고, Access Token 만료 시 리이슈 정책으로 세션을 갱신합니다. Refresh Token이 만료되거나 Redis에 없으면 사용자는 로그인 페이지로 이동하고 `세션이 만료되었습니다` 메시지를 보게 됩니다.

## 2. 핵심 요구사항 (Core Requirements)
- [ ] 로그인은 더 이상 `localStorage` 플래그에 의존하지 않고, 서버가 발급한 실제 세션으로 동작해야 한다.
- [ ] 현재 사이클에서는 별도 회원가입 없이 mock 사용자 1명을 유지하고, 이 사용자로 실제 세션 발급/검증만 구현해야 한다.
- [ ] 로그인 성공 시 Access Token은 `httpOnly` 쿠키로 내려가야 한다.
- [ ] Refresh Token은 Redis에 저장되어야 하며, 브라우저에는 직접 노출되지 않아야 한다.
- [ ] 보호된 URL(`/dashboard` 등)에 비로그인 사용자가 접근하면 로그인 페이지로 리다이렉트해야 한다.
- [ ] Access Token 만료 시 리이슈 정책을 사용해야 하며, Refresh Token은 rotating refresh token 방식으로 회전해야 한다.
- [ ] 새로운 Refresh Token이 발급되면 이전 Refresh Token은 즉시 무효화해야 한다.
- [ ] 로그아웃 시 Refresh Token은 Redis에서 즉시 폐기되어야 하고, 인증 쿠키도 함께 삭제되어야 한다.
- [ ] 브라우저를 종료했다가 다시 열어도 1일 이내라면 로그인 상태를 유지해야 한다.
- [ ] Refresh Token이 만료됐거나 Redis에 없으면 로그인 페이지로 이동시키고 `세션이 만료되었습니다` 메시지를 보여줘야 한다.
- [ ] 로그인 버튼은 첫 요청만 유효하도록 중복 제출이 방지되어야 한다.
- [ ] 첫 로그인 후 레퍼런스가 0건이면 단순 빈 목록 대신 온보딩 가이드를 보여줘야 한다.
- [ ] 인증 관련 Redis는 Docker 기반 로컬 개발 환경으로 실행 가능해야 한다.

## 3. 데이터 및 상태 정의 (Data & State Models)
- **상태 전이도:**
  - 앱 부팅: `Unknown -> AuthChecking -> Authenticated | Unauthenticated`
  - 로그인 제출: `Idle -> Submitting -> Authenticated | Error`
  - Access Token 만료: `Authenticated -> Reissuing -> Authenticated | SessionExpired`
  - 로그아웃: `Authenticated -> LoggingOut -> Unauthenticated`
  - 첫 로그인 후 데이터 0건: `Authenticated + EmptyReferences -> OnboardingGuide`
- **핵심 데이터 필드:**
  - Mock 사용자
    - `id`
    - `email`
    - `name`
  - Access Token payload
    - `sub` (user id)
    - `email`
    - `exp`
    - `iat`
  - Refresh Token session record in Redis
    - `token_id`
    - `user_id`
    - `expires_at`
    - `rotated_from` (선택)
    - `user_agent` 또는 최소 감사 정보
  - 프론트 인증 상태
    - `authenticated`
    - `checking`
    - `expired_message`
    - `onboarding_required`
- **쿠키/TTL 정책:**
  - Access Token 쿠키
    - `httpOnly`
    - `Secure`는 환경별 설정
    - `SameSite` 정책 명시 필요
    - 수명은 1일 세션 범위 안에서 설정
  - Refresh Token
    - Redis TTL: 1일
    - 회전 시 기존 토큰 즉시 폐기
- **API 엔드포인트 (예상):**
  - `POST /api/v1/auth/login`
    - mock 사용자 검증 후 Access Token 쿠키 발급 + Redis Refresh Token 저장
  - `POST /api/v1/auth/refresh`
    - 유효한 Refresh Token 기준 Access Token 재발급 + Refresh Token 회전
  - `POST /api/v1/auth/logout`
    - Redis Refresh Token 폐기 + 쿠키 삭제
  - `GET /api/v1/auth/me`
    - 현재 Access Token 기준 사용자 정보 반환
  - `GET /api/v1/references`
    - 인증 필요
  - `POST /api/v1/references`
    - 인증 필요, `uploader_id`는 인증 사용자 기준으로 결정

## 4. 예외 처리 정책 (Exception Handling)
| 상황 | 대응 방안 | 우선순위 |
|------|---------|---------|
| 비로그인 사용자가 `/dashboard`에 직접 접근 | 로그인 페이지로 리다이렉트 | P0 |
| 로그인 버튼을 짧게 두 번 누름 | 프론트에서 첫 요청 직후 버튼 비활성화, 중복 요청 차단 | P0 |
| 로그인 API가 실패 | 로그인 페이지에 오류 메시지 표시, 입력값 유지 | P0 |
| Access Token 만료 | 프론트 또는 서버 정책에 따라 `POST /api/v1/auth/refresh`로 리이슈 시도 | P0 |
| Refresh Token이 Redis에 없음 | 로그인 페이지로 이동, `세션이 만료되었습니다` 메시지 표시 | P0 |
| Refresh Token TTL 만료 | 로그인 페이지로 이동, `세션이 만료되었습니다` 메시지 표시 | P0 |
| 같은 Refresh Token으로 동시 리이슈 요청 2회 발생 | 첫 성공 요청만 유효, 이후 요청은 무효 처리 | P0 |
| 로그아웃 요청 후 뒤로 가기로 보호 화면 접근 시도 | `GET /api/v1/auth/me` 또는 보호 API에서 인증 실패 후 로그인 페이지로 리다이렉트 | P0 |
| Redis 장애 | 로그인/리이슈/로그아웃 API는 실패 처리하고 사용자에게 인증 불가 메시지 표시 | P0 |
| 첫 로그인 후 레퍼런스가 0건 | 일반 빈 상태 대신 온보딩 가이드 표시 | P1 |
| 쿠키가 차단되거나 누락됨 | 비로그인 상태로 간주하고 로그인 페이지 유지 | P1 |
| 장기적으로 사용자 수가 늘어 mock 사용자 1명 정책이 한계에 도달 | 실제 계정 테이블과 비밀번호 인증 도입 PRD로 분리 | P2 |

## 5. 기술 스택 (Technology Stack)
- **선택한 접근법:** 접근법 A, mock 사용자 유지 + Redis 기반 실제 세션 인증
- **핵심 기술:**
  - **프론트엔드:** React/Vite 유지
    - 근거: 현재 라우팅과 API 호출 구조 위에 인증 상태 확인과 만료 처리만 추가하면 됨
  - **백엔드:** Go/Echo 유지
    - 근거: 쿠키 발급, 미들웨어, 보호 API 검증을 현재 서버 구조에 자연스럽게 얹을 수 있음
  - **세션 저장소:** Redis (Docker)
    - 근거: Refresh Token TTL과 회전 정책을 관리하기 적합하고, 이미 Docker 개발 환경이 있음
  - **영속 데이터:** PostgreSQL 유지
    - 근거: 사용자 계정 도메인을 이번 사이클에 확장하지 않으므로 레퍼런스 데이터 저장소 역할만 유지
  - **인증 전달 방식:** Access Token `httpOnly` 쿠키
    - 근거: `localStorage`보다 XSS 대응이 낫고, 현재 요구인 브라우저 재시작 후 유지에도 적합
- **기존 프로젝트 스택과의 호환성:** 호환

### 접근법 A: 최소 생존 버전
- **요약:** mock 사용자 1명을 유지하고, 로그인 시 Access Token 쿠키와 Redis Refresh Token을 발급한다. 프론트는 `/auth/me`와 리이슈 흐름을 통해 로그인 상태를 검증한다.
- **난이도:** M
- **리스크:** 낮음
- **장점:**
  - 현재 가장 큰 리스크인 `localStorage` 기반 가짜 인증을 제거할 수 있음
  - 구현 범위를 계정 시스템 없이 세션 검증으로 제한할 수 있음
  - Docker Redis만 추가하면 로컬 검증 경로를 바로 만들 수 있음
- **단점:**
  - 실제 사용자 계정/비밀번호 체계는 여전히 없음
  - 쿠키, Redis, 회전 정책을 함께 넣어야 하므로 mock보다 복잡함
  - 프론트에서 인증 만료 UX를 새로 설계해야 함

### 접근법 B: 이상적 아키텍처
- **요약:** 사용자 테이블, 비밀번호 인증, Access/Refresh Token, Redis 세션, 권한 정책까지 한 번에 실제 인증 체계로 전환한다.
- **난이도:** L
- **리스크:** 중간
- **장점:**
  - 이후 외부 사용자 확장까지 바로 연결 가능
  - 업로더와 사용자 식별을 완전히 실제 데이터로 바꿀 수 있음
  - 권한 체계 설계까지 같은 사이클에서 다룰 수 있음
- **단점:**
  - 이번 사이클 범위가 너무 큼
  - 회원가입/암호화/비밀번호 정책/마이그레이션을 모두 설계해야 함
  - 현재 제품의 가장 급한 문제를 닫는 속도가 느려짐

### 추천
- **추천 접근법:** 접근법 A
- **이유:** 지금 가장 시급한 문제는 “서버가 사용자를 검증하지 못한다”는 점이지, 계정 도메인이 없는 것이 아닙니다. 1인 개발 기준에서는 mock 사용자를 유지한 채 세션 발급/검증과 Redis 리이슈만 먼저 넣는 것이 가장 빠르고 안전합니다.

## 6. 아웃 오브 스코프 (Out of Scope)
| 제외 기능 | 제외 이유 | 예상 도입 시기 |
|----------|----------|-------------|
| 실제 회원가입/비밀번호 저장 | 이번 사이클은 mock 사용자 유지가 전제 | v1.4+ |
| 소셜 로그인 (카카오/네이버/구글) | 현재 내부 도구 단계에서 우선순위가 아님 | v1.4+ |
| 역할/권한 분리 (admin/editor/viewer) | 현재 사용자 도메인이 없음 | v1.4+ |
| 검색/태그 필터/페이지네이션 | 인증 사이클과 별도 범위 | 별도 PRD |
| 전체 앱 컨테이너화 | 현재는 Redis만 Docker 추가해도 충분함 | v1.4+ |
| 모바일/앱 전용 인증 UX | 웹 기준 흐름만 우선 | v1.4+ |

## 7. 다음 액션 플랜 (Next Actions)
- `$build`는 Docker Compose에 Redis 서비스를 추가하고 로컬 실행 절차를 업데이트한다.
- `$build`는 mock 로그인 플래그를 제거하고 `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`를 구현한다.
- `$build`는 Access Token `httpOnly` 쿠키 발급과 Redis Refresh Token 저장/회전/폐기 로직을 구현한다.
- `$build`는 보호된 프론트 라우트가 서버 기반 세션 확인 결과에 따라 로그인 페이지로 리다이렉트되도록 정리한다.
- `$build`는 세션 만료 시 `세션이 만료되었습니다` 메시지와 재로그인 흐름을 구현한다.
- `$build`는 첫 로그인 후 레퍼런스 0건이면 온보딩 가이드를 표시하는 상태를 추가한다.
- `$qa`는 로그인 성공, 보호 라우트 리다이렉트, 쿠키 기반 세션 유지, Refresh Token 회전, 로그아웃 무효화, 만료 후 재로그인, 온보딩 빈 상태를 검증한다.
