# Refentra v1.8 포트폴리오 리디자인 시스템

## 0. 기준 원칙
- 이 문서는 선행 디자인 사양이 아니라, Stitch 산출물을 분석해 우리 프로젝트 기준으로 역정리한 문서다.
- 기준 화면:
  - `Refentra: Editorial Precision Landing Page`
  - `Refentra Dashboard: Editorial Precision`
  - `Add Reference Modal - Refentra`
- 따라서 실제 구현은 이 문서의 초기 초안보다 Stitch 산출물의 구조와 톤을 우선한다.
- 프론트엔드 반영 단계에서는 Stitch 결과를 그대로 복제하지 않고, 우리 코드베이스 제약과 한글 UX 규칙에 맞게 수정한다.

## 1. 디자인 입장
- 기존 디자인은 "정돈된 내부 도구"에는 가깝지만, PRD가 요구하는 "의뢰로 이어지는 포트폴리오 인상"에는 부족하다.
- 실제 Stitch 결과를 기준으로 보면, 최종 방향은 초안의 `Editorial Tech Showcase`보다 한 단계 더 인쇄물에 가까운 `Warm Editorial Product`에 가깝다.
- 즉 구현 방향은 "따뜻한 종이 질감의 배경 + 진한 잉크 텍스트 + 절제된 terracotta/sage/navy 포인트 + 넓은 여백"이다.
- 제품 대시보드도 여전히 buildable 해야 하므로, 랜딩은 감정적이고 대시보드는 구조적이어야 한다.

## 2. 화면 목록
1. 랜딩 페이지
   핵심 목적: 첫 5초 안에 브랜드 인상, 문제 정의, 제품 감각을 전달
   필요 컴포넌트 수: 8
2. 포트폴리오 대시보드
   핵심 목적: 샘플 데이터 기반 탐색 경험과 반응형 구현 역량 시연
   필요 컴포넌트 수: 10
3. 레퍼런스 추가 모달
   핵심 목적: 실제 제품처럼 보이는 입력 경험과 제출 상태 설계
   필요 컴포넌트 수: 5
4. 로그인 화면
   핵심 목적: 제품 모드 진입을 위한 보조 경로 제공
   필요 컴포넌트 수: 4
5. 셋업 가이드 화면
   핵심 목적: 개발 환경 미구성 시에도 브랜드 일관성 유지
   필요 컴포넌트 수: 3

## 3. 네비게이션 맵
- `/`
  랜딩 페이지
- `/dashboard`
  인증 사용자: 제품 모드 대시보드
  비로그인 + portfolio mode: 랜딩으로 리다이렉트
- 랜딩 내부 CTA
  `대시보드 미리보기` 섹션으로 스크롤
  `작업 문의하기` 또는 `프로젝트 보기` CTA로 외부 액션 유도
- 포트폴리오 데모 CTA
  샘플 대시보드 진입 또는 모달 열기

## 4. 기존 디자인 자산 스캔
재사용 가능:
- Tailwind 기반 토큰 확장 구조
- `Pretendard`, `JetBrains Mono`, `Noto Sans KR` 폰트 조합
- 검색, 태그 필터, 페이지네이션, 모달이라는 제품 구조
- `word-break: keep-all`, `text-nowrap` 한글 정책

새로 만들어야 함:
- 랜딩 정보 구조 전체
- 브랜드형 히어로 비주얼과 섹션 리듬
- 포트폴리오 모드 전용 대시보드 카드 레이아웃
- 기존 `bg-surface / border-slate-800` 중심의 단조로운 패널 스타일
- 상태별 시각 언어(Default, Loading, Empty, Error, Disabled)의 명확한 분리

## 5. 리셋 원칙
- 기존 `배경 어두움 + 카드 어두움 + 파란 CTA` 반복 패턴은 걷어낸다.
- 랜딩과 대시보드는 같은 브랜드 안에 있어야 하지만, 랜딩은 감정적이고 대시보드는 기능적으로 보이게 톤 차이를 둔다.
- 하드코딩 색상(`bg-[#060E20]` 같은 예외)은 금지한다.
- 섹션마다 배경색을 바꾸는 대신, 배경은 크게 2계층만 쓰고 타이포그래피, 구분선, 밀도 차이로 리듬을 만든다.

## 6. Stitch 기준 디자인 토큰

### Color Palette
- `--color-background: #FBF9F4`
  전체 캔버스, 종이 질감의 기본 배경
- `--color-surface: #FFFFFF`
  카드, 모달, 주요 입력 영역
- `--color-surface-soft: #F5F3EE`
  보조 섹션, 카드 군집 배경
- `--color-surface-muted: #F0EEE9`
  필터 패널, 중간 단계 표면
- `--color-text: #1B1C19`
  본문과 기본 헤드라인
- `--color-text-muted: #4C463E`
  설명, 보조 메타
- `--color-border-soft: #CFC5BB`
  매우 옅은 경계
- `--color-accent-terracotta: #934934`
  메인 CTA, 시선 유도, 경고성 강조
- `--color-accent-sage: #5A614F`
  보조 포인트, 차분한 상태 구분
- `--color-accent-navy: #112743`
  모달 저장 버튼, 강한 인터랙션 강조
- `--color-error: #BA1A1A`
  에러 상태

### 프로젝트 반영 규칙
- 기존 초안의 `#C84C2C / #2F6B5F / #F5F1E8 / #FFFDF8`는 "의도"로 유지하되, 실제 구현 토큰은 우선 Stitch 결과에 맞춘다.
- 즉 v1.8 프론트엔드 반영 시에는 초안 토큰을 고집하지 않고, 위 Stitch 기준 토큰을 1차 채택한다.
- 단, 코드 반영 중 접근성이나 기존 브랜드 연결성이 약해지면 terracotta와 sage 채도를 미세 조정할 수 있다.

### Gradient / Accent
- `--gradient-hero: linear-gradient(135deg, #FBF9F4 0%, #F5F3EE 50%, #EAE8E3 100%)`
- `--gradient-primary-soft: linear-gradient(45deg, #934934 0%, #FFA186 100%)`
- `--gradient-primary-strong: linear-gradient(135deg, #112743 0%, #293D5A 100%)`

### Spacing
- `xs: 4px`
- `sm: 8px`
- `md: 16px`
- `lg: 24px`
- `xl: 32px`
- `2xl: 48px`
- `3xl: 72px`

### Radius
- `sm: 6px`
- `md: 12px`
- `lg: 16px`
- `xl: 24px`
- `full: 9999px`

### Shadow
- `shadow-soft: 0 20px 40px rgba(27, 28, 25, 0.05)`
- `shadow-float: 0 24px 48px rgba(27, 28, 25, 0.08)`

## 7. Stitch 기준 타이포그래피
| 역할 | 한글 폰트 | 영문/숫자 폰트 | 용도 |
|------|----------|---------------|------|
| Heading | Noto Serif KR 또는 유사 serif | Noto Serif / Fraunces 계열 | 랜딩 헤드라인, 섹션 제목 |
| Body | Pretendard 또는 Manrope 대체 | Manrope | 본문, 설명, 입력값 |
| Accent | Pretendard SemiBold | JetBrains Mono | 날짜, 페이지 수, URL 메타 |
| Caption | Noto Sans KR | Manrope | 캡션, 보조 설명 |

- Stitch 결과는 serif 헤드라인 + sans body 조합이 더 강하게 나왔다.
- 따라서 구현 단계에서는 한국어 본문은 `Pretendard`, 헤드라인은 `Noto Serif KR` 또는 유사 serif를 우선 검토한다.
- `h1: 56px / 1.05 / -0.02em`
- `h2: 36px / 1.15 / -0.02em`
- `h3: 24px / 1.3 / -0.01em`
- `body-lg: 18px / 1.65 / 0`
- `body: 16px / 1.6 / 0`
- `caption: 14px / 1.5 / 0`
- 모바일에서는 `h1`을 `40px`까지 축소한다.

## 8. 섹션 구조
### 랜딩
1. Hero
   대형 카피, 짧은 설명, 2개 CTA, 우측 대시보드 프리뷰
2. Problem
   북마크 난립, 맥락 손실, 재탐색 비용을 3열 카드로 제시
3. Feature Highlight
   검색, 태그, 메모, 빠른 회수성을 보여주는 3개 하이라이트
4. Dashboard Preview
   실제 앱처럼 보이는 카드 그리드와 태그 필터 바
5. CTA
   포트폴리오 문의 또는 프로젝트 탐색 유도

### 대시보드
- 상단 브랜드 바
- 좌측 필터 패널
- 우측 요약 메트릭 + 검색 + 카드 리스트
- 모바일에서는 패널을 상단 접이식 필터 시트로 전환
- Stitch 결과 기준으로 카드 자체보다 섹션 여백과 타이포그래피 대비가 더 중요한 인상 요소다.
- 즉 구현 시에는 카드 장식보다 "정리된 덩어리감"을 우선한다.

## 9. 상태 설계
### Default
- 카드와 패널은 `surface`, 강조 버튼은 terracotta 또는 navy
- 콘텐츠 밀도를 높이되 구분선 대신 표면 차와 여백으로 분리

### Loading
- 회색 스켈레톤 대신 `surface-soft` 기반 블록과 미세한 shimmer
- 버튼은 비활성화, 텍스트는 유지

### Empty
- 포트폴리오 모드 기본 경로에서는 사용하지 않음
- 제품 모드에서는 일러스트 대신 체크리스트 카드 중심

### Error
- 전체 붉은 박스 대신 인라인 메시지 + 재시도 버튼
- 중요한 폼 오류만 필드 아래 노출

### Disabled
- 배경은 `surface-soft`
- 텍스트는 `text-muted`
- 대비는 유지하되 클릭 의도는 제거

## 10. 한글 정책
```css
.text-body-ko {
  word-break: keep-all;
  overflow-wrap: break-word;
}

.text-nowrap {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- 버튼 최소 너비: `96px`
- 터치 타겟 최소 크기: `44x44px`
- 태그, 탭, 세그먼트 컨트롤은 `min-height: 44px`
- 긴 에러 메시지는 2줄까지 허용하고 버튼 라벨은 줄바꿈 금지

## 11. 구현 메모
- 먼저 Stitch 산출물에서 색상, 표면 계층, 타이포 배합, 카드 밀도 규칙을 코드 토큰으로 추출한다.
- 그 다음 Tailwind 확장 토큰을 Stitch 기준 팔레트로 교체한다.
- 랜딩과 대시보드는 동일 토큰을 쓰되, 랜딩은 serif 비중과 여백을 더 키우고 대시보드는 sans 비중과 정보 밀도를 높인다.
- 포트폴리오 모드에서는 샘플 데이터가 기본 채워진 대시보드 상태를 첫 인상으로 사용한다.

## 12. 디자인 부채
- Stitch가 랜딩, 대시보드, 모달에서 포인트 색을 완전히 동일하게 고정하지는 않았다.
- 따라서 코드 반영 시 `terracotta 중심 + sage 보조 + navy 액션` 3축으로 정규화가 필요하다.
- 한국어 헤드라인용 실제 serif 폰트 선택은 구현 단계에서 다시 확인해야 한다.
