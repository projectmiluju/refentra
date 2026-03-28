# Refentra v1.8 컴포넌트 명세서

## 0. 기준
- 이 명세서는 Stitch 산출물 3종을 바탕으로 역정리한 구현용 명세다.
- 기준 화면:
  - 랜딩 `Refentra: Editorial Precision Landing Page`
  - 대시보드 `Refentra Dashboard: Editorial Precision`
  - 모달 `Add Reference Modal - Refentra`
- 따라서 아래 명세는 선행 아이데이션보다 "실제 생성된 화면에서 재사용 가능한 패턴"을 우선한다.

## 1. Hero Showcase
**역할:** 랜딩 첫 화면에서 브랜드 톤과 제품 완성도를 동시에 전달
**사용 화면:** 랜딩 페이지

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| eyebrow | `string` | - | 상단 짧은 소개 문구 |
| title | `string` | - | 핵심 헤드라인 |
| description | `string` | - | 2줄 이내 설명 |
| primaryActionLabel | `string` | - | 주 CTA |
| secondaryActionLabel | `string` | - | 보조 CTA |
| previewVariant | `compact` \| `expanded` | `expanded` | 우측 프리뷰 밀도 조절 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `gradient-hero` | `#1B1C19` | 우측 프리뷰 패널 노출 |
| Loading | `#F5F3EE` | `#4C463E` | 프리뷰 스켈레톤 |
| Disabled | `#F5F3EE` | `#4C463E` | CTA 비활성 |

**한글 고려사항**
- 헤드라인은 최대 3줄
- 설명은 `word-break: keep-all`
- CTA 버튼 최소 너비 `120px`
- 영어 serif 카피를 쓰더라도 핵심 메시지는 한국어 우선

## 2. Section Narrative Card
**역할:** 문제 제기와 기능 설명 블록
**사용 화면:** 랜딩 Problem, Feature Highlight

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| icon | `ReactNode` | - | 시각 포인트 |
| title | `string` | - | 카드 제목 |
| body | `string` | - | 설명 본문 |
| tone | `default` \| `accent` | `default` | 강조 여부 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `#FFFFFF` | `#1B1C19` | 극약한 보더 또는 무보더 |
| Hover | `#FFFFFF` | `#1B1C19` | 그림자 증가 |

**한글 고려사항**
- 본문 4줄 이내
- 모바일에서는 1열 스택

## 3. Dashboard Metric Strip
**역할:** 포트폴리오 대시보드의 신뢰감 형성용 요약 지표
**사용 화면:** 포트폴리오 대시보드

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| label | `string` | - | 지표 이름 |
| value | `string` | - | 수치 또는 상태 |
| delta | `string` | - | 변화량 |
| tone | `neutral` \| `positive` \| `highlight` | `neutral` | 색상 분기 |

**한글 고려사항**
- 라벨은 한 줄 유지
- 숫자는 `JetBrains Mono` 사용
- 과장된 컬러 배지보다 타이포 대비와 여백으로 우선순위 표현

## 4. Search Field
**역할:** 레퍼런스 검색 입력
**사용 화면:** 포트폴리오 대시보드, 제품 모드 대시보드

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| value | `string` | `''` | 입력값 |
| placeholder | `string` | `레퍼런스 검색` | 힌트 텍스트 |
| disabled | `boolean` | `false` | 비활성 여부 |
| isLoading | `boolean` | `false` | 검색 반영 중 상태 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `#FFFFFF` | `#1B1C19` | `1px solid rgba(207,197,187,0.3)` |
| Focus | `#FFFFFF` | `#1B1C19` | terracotta 또는 navy 포커스 강조 |
| Disabled | `#F5F3EE` | `#4C463E` | 포인터 제거 |
| Error | `#FFFFFF` | `#1B1C19` | `border-color #BA1A1A` |

**한글 고려사항**
- placeholder는 짧게 유지
- 높이 최소 `48px`

## 5. Tag Filter Chip
**역할:** 태그 기반 필터 전환
**사용 화면:** 대시보드 필터 바, 랜딩 preview

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| label | `string` | - | 태그 이름 |
| active | `boolean` | `false` | 선택 여부 |
| count | `number` | - | 선택적 보조 수치 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `#F5F3EE` | `#1B1C19` | 매우 옅은 보더 |
| Active | `#5A614F` 또는 `#934934` | `#FFFFFF` | 강조 상태 |
| Disabled | `#F0EEE9` | `#4C463E` | 클릭 불가 |

**한글 고려사항**
- `min-width: 88px`
- 줄바꿈 금지

## 6. Reference Card
**역할:** 개별 레퍼런스의 핵심 정보와 탐색 가능성 제시
**사용 화면:** 대시보드 카드 리스트, 랜딩 preview

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| title | `string` | - | 레퍼런스 제목 |
| url | `string` | - | 원본 링크 |
| description | `string` | - | 메모 또는 요약 |
| tags | `string[]` | `[]` | 태그 리스트 |
| createdAt | `string` | - | 메타 정보 |
| imageTone | `string` | - | 썸네일 또는 색조 힌트 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `#FFFFFF` | `#1B1C19` | `shadow-soft` |
| Hover | `#FFFFFF` | `#1B1C19` | 위로 2px 부양 |
| Selected | `#FFFFFF` | `#1B1C19` | terracotta 또는 navy 포인트 |

**한글 고려사항**
- 제목은 최대 2줄
- 설명은 최대 3줄
- URL만 `text-nowrap`
- 카드 내부 메타는 `JetBrains Mono`를 제한적으로 사용

## 7. Pagination Rail
**역할:** 카드 리스트 페이지 이동
**사용 화면:** 대시보드

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| currentPage | `number` | `1` | 현재 페이지 |
| totalPages | `number` | `1` | 전체 페이지 |
| disabled | `boolean` | `false` | 전체 비활성 |

**한글 고려사항**
- `이전`, `다음` 버튼 최소 너비 `96px`
- 현재 페이지 숫자는 `JetBrains Mono`
- 숫자 강조보다 현재 위치 인지성이 우선

## 8. Add Reference Modal
**역할:** 새 레퍼런스 추가
**사용 화면:** 대시보드

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| open | `boolean` | `false` | 모달 열림 상태 |
| submitState | `idle` \| `submitting` \| `submitted` \| `error` | `idle` | 제출 상태 |
| onSubmit | `function` | - | 제출 핸들러 |
| onClose | `function` | - | 닫기 핸들러 |

**상태별 스타일**
| 상태 | 배경색 | 텍스트 색 | 기타 |
|------|-------|---------|------|
| Default | `#FFFFFF` | `#1B1C19` | `shadow-float` |
| Submitting | `#FFFFFF` | `#1B1C19` | 저장 버튼 비활성, `저장 중...` |
| Error | `#FFFFFF` | `#1B1C19` | 인라인 에러 문구 |
| Success | `#FFFFFF` | `#1B1C19` | 성공 토스트 또는 상태 배너 |

**한글 고려사항**
- 라벨과 에러 문구는 `text-body-ko`
- 저장 버튼 최소 너비 `112px`
- 설명 텍스트는 줄바꿈 허용, 버튼은 줄바꿈 금지
- 저장 버튼은 중복 제출 방지가 시각적으로 명확해야 함

## 9. 상태별 공통 정책
- Default: 포트폴리오 모드는 샘플 데이터가 채워진 상태를 기본으로 사용
- Loading: 전체 화면 스피너 대신 스켈레톤 블록과 버튼 잠금 사용
- Empty: 포트폴리오 모드에서는 기본 진입 상태로 사용하지 않음
- Error: 인라인 배너와 재시도 버튼 조합
- Disabled: 배경은 `surface-soft`, 텍스트는 `text-muted`

## 10. Stitch 추출 패턴
- 랜딩은 "큰 서체와 긴 여백"이 핵심이다. 카드 장식보다 레이아웃 리듬이 중요하다.
- 대시보드는 "좌측 필터 패널 + 우측 정보 밀도" 구조가 가장 설득력 있다.
- 모달은 "조용한 표면 + 뚜렷한 저장 액션" 조합이 안정적이다.
- 세 화면 모두 굵은 테두리보다 표면층 차이와 그림자 밀도로 관계를 표현한다.

## 11. build 핸드오프 요약
- 랜딩을 새로 만들고, 현재 다크 SaaS 팔레트는 교체한다.
- 대시보드는 기존 검색/태그/페이지네이션 계약을 유지하되, Stitch 결과의 좌측 패널 + 우측 카드 구조로 리디자인한다.
- 모달은 현재 기능 계약을 유지하되, 저장 중 상태를 더 명확하게 드러내는 방향으로 반영한다.
- 한글 정책은 유지하되 버튼 최소 너비를 기존 80px에서 96px 이상으로 상향한다.
