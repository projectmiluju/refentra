# Refentra v1 - 디자인 시스템 및 화면 정의

## 1. 화면 목록
1. **로그인 화면 (Login Screen)**
   - 핵심 목적: 인증 및 워크스페이스 진입
   - 필요 컴포넌트: Auth Form, Input, Button, Error Prompt (약 4개)
2. **레퍼런스 목록 화면 (Dashboard/List Screen)**
   - 핵심 목적: 레퍼런스 열람 및 검색/필터링
   - 필요 컴포넌트: Navbar, Sidebar(태그/검색), List Item, Pagination (약 6개)
3. **새 레퍼런스 추가 모달 (Add Reference Modal)**
   - 핵심 목적: URL 및 메타데이터 업로드
   - 필요 컴포넌트: Modal, Form, Tags Input, Button (약 4개)

## 2. 디자인 토큰 (Design Tokens)

**🎨 Color Palette (Dark Mode Base, Professional & Sleek)**
- `--color-primary`: `#3B82F6` (파란색, 주요 CTA 버튼 및 강조)
- `--color-secondary`: `#64748B` (보조 액션, 태그 배경)
- `--color-background`: `#0F172A` (앱 전체 대배경)
- `--color-surface`: `#1E293B` (카드, 모달, 사이드바 등 구분 영역)
- `--color-border`: `#334155` (구분선, 인풋 테두리)
- `--color-text`: `#F8FAFC` (일반 텍스트)
- `--color-text-muted`: `#94A3B8` (보조 설명 텍스트, 업로더/시간표기)
- `--color-error`: `#EF4444` (에러 상태 메시지)
- `--color-success`: `#10B981` (저장 성공 상태)

**📏 Spacing & Sizing**
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px
- 최소 터치 타겟(Touch Target): 44x44px 준수
- Border Radius (모서리): `sm: 4px`, `md: 8px`, `lg: 16px`, `full: 9999px`

**📝 Typography Pairing**
- **Heading**: `Pretendard Bold` (h1: 32px / h2: 24px / h3: 20px, line-height 1.4) — 타이틀, 모달 제목
- **Body**: `Pretendard Regular` (16px, line-height 1.6, letter-spacing -0.01em) — 기본 본문, 입력창 텍스트
- **Date/Meta**: `JetBrains Mono` (14px) — 생성 일시 및 태그 데이터
- **Caption**: `Noto Sans KR Light` (14px) — 부가 설명 및 캡션

## 3. 한글 로컬라이제이션 정책
- **단어 단위 줄바꿈 방지**:
  ```css
  .text-body-ko {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  ```
- **텍스트 오버플로우 처리**: (긴 URL이나 제목 처리용)
  ```css
  .text-nowrap {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  ```
- **버튼 UI 제약**: 한글 텍스트의 길이가 짧더라도 균형감을 잃지 않도록 모든 기본 버튼의 `min-width`를 최소 `80px` 이상 확보할 것.
