import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AUTH_STORAGE_KEY } from './constants/uiText';

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
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
        ok: true,
        json: async () => [],
      });

    render(<App />);

    await user.type(await screen.findByLabelText('이메일 주소'), 'dev@refentra.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('heading', { name: '아카이브 (Archive)' })).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBe('true');
  });

  it('잘못된 이메일로 로그인하면 에러 메시지를 보여주고 이동하지 않아야 한다', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ready', message: 'ok' }),
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
