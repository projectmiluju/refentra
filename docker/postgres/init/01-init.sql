CREATE TABLE IF NOT EXISTS mock_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS references (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploader_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_references_deleted_at ON references (deleted_at);
CREATE INDEX IF NOT EXISTS idx_references_created_at ON references (created_at DESC);

INSERT INTO mock_users (id, name, email)
VALUES ('user-1234', '김개발', 'dev@refentra.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO references (id, url, title, description, tags, uploader_id, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'https://react.dev/reference',
    'React 19 Hooks Guide',
    '공식 문서에 추가된 새로운 훅 기능들 요약 및 예제 모음.',
    '["React", "Frontend"]'::jsonb,
    'user-1234',
    NOW() - INTERVAL '2 day',
    NOW() - INTERVAL '2 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'https://echo.labstack.com/guide',
    'Go Echo Architecture',
    '프로덕션 레벨의 Echo 라우팅 및 미들웨어 설정 방식.',
    '["Go", "Backend"]'::jsonb,
    'user-1234',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'https://tailwindcss.com/docs/utility-first',
    'Tailwind Utility Patterns',
    '유틸리티 우선 스타일링을 실제 컴포넌트 설계에 적용하는 패턴 정리.',
    '["Design", "Frontend"]'::jsonb,
    'user-1234',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
