# Refentra v1.8 Stitch 프롬프트 패키지

## 전제
- 목적: 기존 MVP 다크 SaaS 느낌을 제거하고, 포트폴리오 제출용 브랜드 경험으로 재설계
- 스타일 키워드: `editorial`, `warm neutral`, `productized`, `mobile-first`, `high contrast typography`
- 한글 프로젝트이므로 생성 후 텍스트는 반드시 한국어로 교체하고 `word-break: keep-all` 기준으로 재검토한다.
- 이 문서는 "문서 토큰을 Stitch에 강제 주입"하는 용도가 아니라, Stitch 산출물을 안정적으로 재생성하거나 변형하기 위한 운영 프롬프트다.

## 현재 기준 산출물
- 랜딩: `Refentra: Editorial Precision Landing Page`
- 대시보드: `Refentra Dashboard: Editorial Precision`
- 모달: `Add Reference Modal - Refentra`
- 현재 v1.8의 기준 시각 언어는 위 3개 Stitch 화면이다.

## 공통 프롬프트 규칙
- Stitch가 더 안정적으로 수용한 기준 색은 아래 계열이다.
- 배경색 `#FBF9F4`, 표면색 `#FFFFFF`, 보조 표면 `#F5F3EE`, 중간 표면 `#F0EEE9`
- 본문 텍스트 `#1B1C19`, 보조 텍스트 `#4C463E`, 옅은 경계선 `#CFC5BB`
- 주요 포인트는 `terracotta #934934`, 보조 포인트는 `sage #5A614F`, 강한 액션은 `navy #112743`
- 폰트는 헤드라인 serif, 본문 sans, 메타는 mono 조합으로 요청하는 편이 결과가 안정적이다.
- 모서리 반경은 12~24px, 섹션 간격은 32px 이상, 주요 카드 그림자는 부드럽고 넓게
- UI는 flat dark dashboard가 아니라, 따뜻한 배경 위에 정제된 product showcase 느낌으로 생성

## 1. 랜딩 페이지
```text
Design a mobile-first landing page for a product called Refentra.
This is a portfolio-quality product showcase, not a generic SaaS template.
Use a warm neutral paper-like background (#FBF9F4), white surface cards, a terracotta accent (#934934), a soft sage accent (#5A614F), and deep charcoal text (#1B1C19).
Typography should feel editorial and premium: serif headlines, clean sans-serif body text, and mono metadata.

Required sections in this order:
1. Hero with bold headline, short subcopy, two CTA buttons, and a dashboard preview panel
2. Problem statement section with three pain-point cards
3. Feature highlight section with search, tag filtering, and context recall
4. Dashboard preview section showing realistic cards, tags, and pagination
5. Final CTA section for contact / portfolio inquiry

Visual direction:
- Avoid dark-mode SaaS look
- Avoid purple tones
- Use large typography, asymmetric composition, generous whitespace
- Use soft gradients and subtle panel layering
- Make it look buildable in React + Tailwind
- Keep the product name Refentra, not a generic archive brand
- Prefer Korean-first copy with selective English accent only where it improves editorial tone
```

## 2. 포트폴리오 대시보드
```text
Design a responsive dashboard screen for Refentra in portfolio demo mode.
Use sample reference data as the default state, never an empty state.
The dashboard should feel like a polished product, with a left filter panel on desktop and a stacked mobile layout.

Use:
- background #FBF9F4
- surface #FFFFFF
- soft surface #F5F3EE
- mid surface #F0EEE9
- terracotta accent #934934
- sage accent #5A614F
- text #1B1C19
- muted text #4C463E
- border #CFC5BB

Required UI:
- brand header
- search field
- tag filter chips
- metric summary cards
- reference cards with title, URL, description, tags, and date
- pagination controls
- add reference button

Make cards tactile and editorial, with strong hierarchy and readable spacing.
The screen should look impressive in both desktop and mobile screenshots.
- Make it feel buildable in a real product, not like abstract concept art.
```

## 3. 레퍼런스 추가 모달
```text
Design a modal form for adding a new reference in Refentra.
This is part of a polished product demo, so the form should feel calm, premium, and easy to scan.

Fields:
- URL
- title
- description
- tags

States to consider:
- default
- submitting
- success
- error
- disabled save button

Use the same warm neutral palette and premium editorial product style.
The modal should have strong spacing, clear field grouping, and visible submit protection behavior.
- Prefer Korean labels and show `저장 중...` state explicitly when submitting.
```

## 4. 로그인 화면
```text
Design a minimal login screen for Refentra that matches the new brand system.
This should not overpower the landing page, but it must still feel premium and consistent.
Use one centered authentication card on a warm neutral background with subtle branded texture.
Include email field, password field, error message area, primary submit button, and secondary help link.
```

## 5. 한글 치환 테이블
| English | Korean |
|--------|--------|
| Save | 저장하기 |
| Cancel | 취소 |
| Add Reference | 레퍼런스 추가 |
| Search references | 레퍼런스 검색 |
| Filter by tag | 태그로 필터링 |
| Portfolio Dashboard | 포트폴리오 대시보드 |
| Contact | 작업 문의 |
| Explore Project | 프로젝트 보기 |

## 6. Stitch 결과 검수 체크리스트
- 색상 토큰이 문서와 일치하는가
- Hero와 dashboard preview가 첫 인상을 주도하는가
- 모바일 375px 기준으로 카드와 CTA가 무너지지 않는가
- 버튼과 태그의 터치 타겟이 44px 이상인가
- 한글 치환 후 버튼 폭, 줄바꿈, 탭 정렬이 자연스러운가
- `word-break: keep-all` 기준으로 한글 단어가 부자연스럽게 끊기지 않는가

## 상태
`DONE_WITH_DEBT`

사유:
- 이 세션에서는 Stitch 연결과 실제 화면 생성이 모두 성공했다.
- 다만 Stitch가 화면별로 약간 다른 디자인 시스템을 섞어 생성했기 때문에, 코드 반영 단계에서는 색상과 타이포 계층을 다시 정규화해야 한다.
