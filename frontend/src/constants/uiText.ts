export const AUTH_STORAGE_KEY = 'refentra:isAuthenticated';

export const LOGIN_TEXT = {
  brand: 'Refentra',
  emailLabel: '이메일 주소',
  passwordLabel: '비밀번호',
  forgotPassword: '비밀번호를 잊으셨나요?',
  submit: '로그인',
  invalidEmail: '올바른 이메일 주소를 입력해 주세요.',
  emptyPassword: '비밀번호를 입력해 주세요.',
} as const;

export const DASHBOARD_TEXT = {
  title: '아카이브 (Archive)',
  addReference: '새 레퍼런스 추가',
  searchPlaceholder: '레퍼런스 검색...',
  loading: '레퍼런스를 불러오는 중...',
  emptyTitle: '아직 저장된 레퍼런스가 없습니다.',
  emptyDescription: '첫 레퍼런스를 추가해 아카이브를 시작해 보세요.',
  retry: '다시 시도',
  loadErrorFallback: '레퍼런스를 불러오지 못했습니다.',
} as const;

export const REFERENCE_MODAL_TEXT = {
  title: '새 레퍼런스 아카이브',
  urlLabel: 'URL 주소',
  titleLabel: '레퍼런스 제목 (Title)',
  descriptionLabel: '부연 설명 (Description)',
  tagsLabel: '태그 (Tags)',
  tagPlaceholder: '태그 입력 후 Enter',
  urlPlaceholder: 'https://...',
  titlePlaceholder: '제목을 입력하세요',
  descriptionPlaceholder: '레퍼런스에 대한 설명을 남겨주세요.',
  cancel: '취소',
  submit: '저장하기',
  submitting: '저장 중...',
  emptyUrl: 'URL 주소를 입력해 주세요.',
  invalidUrl: '올바른 URL 형식이 아닙니다.',
  emptyTitle: '레퍼런스 제목을 입력해 주세요.',
  saveErrorFallback: '저장에 실패했습니다. 다시 시도해 주세요.',
} as const;
