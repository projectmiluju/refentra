import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const createListResponse = (items: unknown[]) => ({
  items,
  page: 1,
  limit: 10,
  total_count: items.length,
  total_pages: items.length > 0 ? 1 : 0,
  available_tags: ['Go'],
});

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.history.pushState({}, '', '/login');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('유효한 이메일과 비밀번호로 로그인하면 대시보드로 이동해야 한다', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1234', name: '김개발', email: 'dev@refentra.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createListResponse([]),
      });

    render(<App />);

    await user.type(await screen.findByLabelText('이메일 주소'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('heading', { name: '아카이브 (Archive)' })).toBeInTheDocument();
  });

  it('쿼리가 포함된 보호 URL 접근 후 로그인하면 같은 대시보드 상태로 복귀해야 한다', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/dashboard?search=react&tags=Go&page=2');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready', message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1234', name: '김개발', email: 'dev@refentra.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            id: 'ref-2',
            title: 'React 문서',
            url: 'https://example.com/react',
            description: '설명',
            tags: ['Go'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          }],
          page: 2,
          limit: 10,
          total_count: 11,
          total_pages: 2,
          available_tags: ['Go'],
        }),
      });

    render(<App />);

    await user.type(await screen.findByLabelText('이메일 주소'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('heading', { name: 'React 문서' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(window.location.search).toBe('?search=react&tags=Go&page=2');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('search=react');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('tags=Go');
    expect(fetchMock.mock.calls[4]?.[0]).toContain('page=2');
  });

  it('잘못된 이메일로 로그인하면 에러 메시지를 보여주고 이동하지 않아야 한다', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ready', message: 'ok' }),
    }).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Authentication required' }),
    }).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ code: 'AUTH_REQUIRED', error: 'Authentication required' }),
    });

    render(<App />);

    await user.type(await screen.findByLabelText('이메일 주소'), 'invalid-email');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByRole('alert')).toHaveTextContent('올바른 이메일 주소를 입력해 주세요.');
    expect(screen.queryByRole('heading', { name: '아카이브 (Archive)' })).not.toBeInTheDocument();
  });

  it('DB가 준비되지 않았으면 설정 안내 페이지를 보여줘야 한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        status: 'unavailable',
        message: '데이터베이스가 준비되지 않았습니다.',
        setup_steps: ['docker compose up -d postgres'],
      }),
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: '데이터베이스 설정이 필요합니다.' })).toBeInTheDocument();
    expect(screen.getByText('데이터베이스가 준비되지 않았습니다.')).toBeInTheDocument();
    expect(screen.getByText('docker compose up -d postgres')).toBeInTheDocument();
  });
});
