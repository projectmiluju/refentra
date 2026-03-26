import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

const fetchMock = vi.fn();

describe('Dashboard', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('대시보드 진입 시 서버에서 레퍼런스를 조회해 렌더링해야 한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: 'ref-1',
          title: '서버 문서',
          url: 'https://example.com',
          description: '서버에서 불러온 설명',
          tags: ['Go'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T00:00:00Z',
        },
      ]),
    });

    render(<Dashboard />);

    expect(screen.getByText('레퍼런스를 불러오는 중...')).toBeInTheDocument();
    expect(await screen.findByText('서버 문서')).toBeInTheDocument();
    expect(screen.getByText('user-1234')).toBeInTheDocument();
  });

  it('조회 결과가 비어 있으면 빈 상태 문구를 표시해야 한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<Dashboard />);

    expect(await screen.findByText('아직 저장된 레퍼런스가 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('첫 레퍼런스를 추가해 아카이브를 시작해 보세요.')).toBeInTheDocument();
  });

  it('조회 실패 시 에러 메시지와 다시 시도 버튼을 표시해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'DB 연결 실패' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    const user = userEvent.setup();

    render(<Dashboard />);

    expect(await screen.findByText('DB 연결 실패')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('아직 저장된 레퍼런스가 없습니다.')).toBeInTheDocument();
  });

  it('저장 성공 시 서버 응답 기준으로 목록 상단에 레퍼런스를 추가해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ref-2',
          title: '새 문서',
          url: 'https://example.com/new',
          description: '새 설명',
          tags: ['Frontend', 'Design'],
          uploader_id: 'user-1234',
          created_at: '2026-03-26T10:00:00Z',
        }),
      });

    const user = userEvent.setup();

    render(<Dashboard />);

    await screen.findByText('아직 저장된 레퍼런스가 없습니다.');
    await user.click(screen.getByRole('button', { name: '새 레퍼런스 추가' }));
    await user.type(screen.getByLabelText('URL 주소'), 'https://example.com/new');
    await user.type(screen.getByLabelText('레퍼런스 제목 (Title)'), '새 문서');
    await user.type(screen.getByLabelText('부연 설명 (Description)'), '새 설명');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(await screen.findByText('새 문서')).toBeInTheDocument();
    expect(screen.getByText('user-1234')).toBeInTheDocument();
  });

  it('저장 실패 시 모달을 유지하고 에러 메시지를 표시해야 한다', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to save reference' }),
      });

    const user = userEvent.setup();

    render(<Dashboard />);

    await screen.findByText('아직 저장된 레퍼런스가 없습니다.');
    await user.click(screen.getByRole('button', { name: '새 레퍼런스 추가' }));
    await user.type(screen.getByLabelText('URL 주소'), 'https://example.com/new');
    await user.type(screen.getByLabelText('레퍼런스 제목 (Title)'), '새 문서');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save reference');
    expect(screen.getByLabelText('URL 주소')).toHaveValue('https://example.com/new');
  });

  it('저장 중에는 중복 제출을 막아야 한다', async () => {
    let resolveSave: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | undefined;

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSave = resolve as (value: { ok: boolean; json: () => Promise<unknown> }) => void;
      }));

    const user = userEvent.setup();

    render(<Dashboard />);

    await screen.findByText('아직 저장된 레퍼런스가 없습니다.');
    await user.click(screen.getByRole('button', { name: '새 레퍼런스 추가' }));
    await user.type(screen.getByLabelText('URL 주소'), 'https://example.com/new');
    await user.type(screen.getByLabelText('레퍼런스 제목 (Title)'), '새 문서');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
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
});
