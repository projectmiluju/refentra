import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';

const fetchMock = vi.fn();
const createFetchResponse = (body: unknown, overrides: Partial<{ ok: boolean; status: number }> = {}) => ({
  ok: overrides.ok ?? true,
  status: overrides.status ?? 200,
  json: async () => body,
});

const createListResponse = (items: unknown[], overrides: Partial<{
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  available_tags: string[];
}> = {}) => ({
  items,
  page: overrides.page ?? 1,
  limit: overrides.limit ?? 10,
  total_count: overrides.total_count ?? items.length,
  total_pages: overrides.total_pages ?? (items.length > 0 ? 1 : 0),
  available_tags: overrides.available_tags ?? ['Go', 'React', 'Frontend'],
});

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{`${location.pathname}${location.search}`}</div>;
};

const renderDashboard = (route = '/dashboard') => render(
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route
        path="/dashboard"
        element={(
          <>
            <Dashboard onLoggedOut={vi.fn().mockResolvedValue(undefined)} />
            <LocationDisplay />
          </>
        )}
      />
    </Routes>
  </MemoryRouter>,
);

describe('Dashboard', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useRealTimers();
  });

  it('대시보드 진입 시 서버에서 레퍼런스를 조회해 렌더링해야 한다', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-1',
          title: '서버 문서',
          url: 'https://example.com',
          description: '서버에서 불러온 설명',
          tags: ['Go'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['Go'],
      })));

    renderDashboard();

    expect(screen.getByText('Loading references...')).toBeInTheDocument();
    expect(await screen.findByText('서버 문서')).toBeInTheDocument();
    expect(screen.getByText('user-1234')).toBeInTheDocument();
  });

  it('조회 결과가 비어 있으면 빈 상태 문구를 표시해야 한다', async () => {
    fetchMock.mockResolvedValueOnce(createFetchResponse(createListResponse([], {
      total_count: 0,
      total_pages: 0,
      available_tags: [],
    })));

    renderDashboard();

    expect(await screen.findByText('No references yet.')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('조회 실패 시 에러 메시지와 다시 시도 버튼을 표시해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'DB 연결 실패' }),
      })
      .mockResolvedValueOnce(createFetchResponse(createListResponse([], {
        total_count: 0,
        total_pages: 0,
        available_tags: [],
      })));

    const user = userEvent.setup();

    renderDashboard();

    expect(await screen.findByText('DB 연결 실패')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No references yet.')).toBeInTheDocument();
  });

  it('저장 성공 시 서버 응답 기준으로 목록 상단에 레퍼런스를 추가해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([], {
        total_count: 0,
        total_pages: 0,
        available_tags: ['Frontend', 'Design'],
      })))
      .mockResolvedValueOnce(createFetchResponse({
          id: 'ref-2',
          title: '새 문서',
          url: 'https://example.com/new',
          description: '새 설명',
          tags: ['Frontend', 'Design'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T10:00:00Z',
        }))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-2',
          title: '새 문서',
          url: 'https://example.com/new',
          description: '새 설명',
          tags: ['Frontend', 'Design'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T10:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['Frontend', 'Design'],
      })));

    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText('No references yet.');
    await user.click(screen.getByRole('button', { name: 'Add reference' }));
    await user.type(screen.getByLabelText('URL'), 'https://example.com/new');
    await user.type(screen.getByLabelText('Title'), '새 문서');
    await user.type(screen.getByLabelText('Notes'), '새 설명');
    await user.click(screen.getByRole('button', { name: 'Save reference' }));

    expect(await screen.findByText('새 문서')).toBeInTheDocument();
    expect(screen.getByText('user-1234')).toBeInTheDocument();
  });

  it('저장 실패 시 모달을 유지하고 에러 메시지를 표시해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([], {
        total_count: 0,
        total_pages: 0,
        available_tags: ['Frontend', 'Design'],
      })))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to save reference' }),
      });

    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText('No references yet.');
    await user.click(screen.getByRole('button', { name: 'Add reference' }));
    await user.type(screen.getByLabelText('URL'), 'https://example.com/new');
    await user.type(screen.getByLabelText('Title'), '새 문서');
    await user.click(screen.getByRole('button', { name: 'Save reference' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save reference');
    expect(screen.getByLabelText('URL')).toHaveValue('https://example.com/new');
  });

  it('저장 중에는 중복 제출을 막아야 한다', async () => {
    let resolveSave: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | undefined;

    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([], {
        total_count: 0,
        total_pages: 0,
        available_tags: ['Frontend', 'Design'],
      })))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSave = resolve as (value: { ok: boolean; json: () => Promise<unknown> }) => void;
      }))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-3',
          title: '새 문서',
          url: 'https://example.com/new',
          description: '',
          tags: ['Frontend', 'Design'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T10:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['Frontend', 'Design'],
      })));

    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText('No references yet.');
    await user.click(screen.getByRole('button', { name: 'Add reference' }));
    await user.type(screen.getByLabelText('URL'), 'https://example.com/new');
    await user.type(screen.getByLabelText('Title'), '새 문서');
    await user.click(screen.getByRole('button', { name: 'Save reference' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveSave?.({
      ok: true,
      json: async () => ({
        id: 'ref-3',
        title: '새 문서',
        url: 'https://example.com/new',
        description: '',
        tags: ['Frontend', 'Design'],
        uploader_id: 'user-1234',
        created_at: '2026-03-26T10:00:00Z',
      }),
    });

    expect(await screen.findByText('새 문서')).toBeInTheDocument();
  });

  it('DB 미연결이면 설정 가이드용 메시지를 표시해야 한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Database connection is unavailable' }),
    });

    renderDashboard();

    expect(await screen.findByText('Database connection is unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('검색어를 입력하면 서버 조회를 다시 호출하고 결과 없음 상태를 표시해야 한다', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
          {
            id: 'ref-1',
            title: 'React 패턴',
            url: 'https://example.com/react',
            description: '설명',
            tags: ['React'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          },
        ], {
          total_count: 1,
          total_pages: 1,
          available_tags: ['React'],
        })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([], {
        total_count: 0,
        total_pages: 0,
        available_tags: ['React'],
      })));

    renderDashboard();

    await screen.findByText('React 패턴');
    await user.type(screen.getByPlaceholderText('Search references'), 'golang');

    expect(await screen.findByText('No results found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('태그를 선택하면 필터링된 결과를 다시 조회해야 한다', async () => {
    const user = userEvent.setup();

    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
          {
            id: 'ref-1',
            title: 'React 패턴',
            url: 'https://example.com/react',
            description: '설명',
            tags: ['React'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          },
        ], {
          total_count: 1,
          total_pages: 1,
          available_tags: ['React', 'Go'],
        })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
          {
            id: 'ref-2',
            title: 'Go 문서',
            url: 'https://example.com/go',
            description: 'Go 설명',
            tags: ['Go'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          },
        ], {
          total_count: 1,
          total_pages: 1,
          available_tags: ['React', 'Go'],
        })));

    renderDashboard();

    await screen.findByText('React 패턴');
    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(await screen.findByText('Go 문서')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[0]).toContain('tags=Go');
  });

  it('페이지 번호를 누르면 해당 페이지를 다시 조회해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
          {
            id: 'ref-1',
            title: 'React 검색 결과',
            url: 'https://example.com/react',
            description: '설명',
            tags: ['Go', 'Frontend'],
            uploader_id: 'user-1234',
            created_at: '2026-03-26T00:00:00Z',
          },
        ], {
          page: 2,
          total_count: 1,
          total_pages: 2,
          available_tags: ['Go', 'Frontend'],
        })));

    renderDashboard('/dashboard?search=react&tags=Go&tags=Frontend&page=2');

    await screen.findByText('React 검색 결과');

    expect(fetchMock.mock.calls[0]?.[0]).toContain('search=react');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('tags=Go');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('tags=Frontend');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('page=2');
    expect(screen.getByPlaceholderText('Search references')).toHaveValue('react');
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard?search=react&tags=Go&tags=Frontend&page=2');
  });

  it('페이지 번호를 누르면 URL과 함께 해당 페이지를 다시 조회해야 한다', async () => {
    const user = userEvent.setup();

    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-1',
          title: '첫 페이지 문서',
          url: 'https://example.com/page-1',
          description: '설명',
          tags: ['React'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 12,
        total_pages: 2,
        available_tags: ['React'],
      })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-2',
          title: '두 번째 페이지 문서',
          url: 'https://example.com/page-2',
          description: '설명',
          tags: ['React'],
          uploader_id: 'user-1234',
          created_at: '2026-03-25T00:00:00Z',
        },
      ], {
        page: 2,
        total_count: 12,
        total_pages: 2,
        available_tags: ['React'],
      })));

    renderDashboard();

    await screen.findByText('첫 페이지 문서');
    await user.click(screen.getByRole('button', { name: '2' }));

    expect(await screen.findByText('두 번째 페이지 문서')).toBeInTheDocument();
    expect(screen.getByText('12 references')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[0]).toContain('page=2');
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard?page=2');
  });

  it('검색어와 태그를 바꾸면 URL 쿼리를 함께 갱신해야 한다', async () => {
    const user = userEvent.setup();

    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-1',
          title: 'React 패턴',
          url: 'https://example.com/react',
          description: '설명',
          tags: ['React'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['React', 'Go'],
      })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-2',
          title: 'Go 문서',
          url: 'https://example.com/go',
          description: '설명',
          tags: ['Go'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['React', 'Go'],
      })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-2',
          title: 'Go 문서',
          url: 'https://example.com/go',
          description: '설명',
          tags: ['Go'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['React', 'Go'],
      })));

    renderDashboard();

    await screen.findByText('React 패턴');
    await user.type(screen.getByPlaceholderText('Search references'), 'go');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard?search=go');

    await user.click(screen.getByRole('button', { name: 'Go' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard?search=go&tags=Go');
  });

  it('유효하지 않은 페이지 쿼리면 에러를 보여주고 1페이지로 보정해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-1',
          title: '첫 페이지 문서',
          url: 'https://example.com/page-1',
          description: '설명',
          tags: ['React'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['React'],
      })))
      .mockResolvedValueOnce(createFetchResponse(createListResponse([
        {
          id: 'ref-1',
          title: '첫 페이지 문서',
          url: 'https://example.com/page-1',
          description: '설명',
          tags: ['React'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ], {
        total_count: 1,
        total_pages: 1,
        available_tags: ['React'],
      })));

    renderDashboard('/dashboard?page=999');

    expect(await screen.findByText('첫 페이지 문서')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The requested page was not available, so the list returned to the previous page.');
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard');
  });
});
