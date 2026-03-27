import { expect, test } from '@playwright/test';
import { installQueryStateMock } from './utils/dashboardMocks';
import { loginWithApi } from './utils/session';

test.describe('대시보드 URL 상태 복원', () => {
  test('인증 후 쿼리 포함 대시보드에 진입하면 같은 상태를 복원하고 새로고침 후에도 유지한다', async ({ page }) => {
    await installQueryStateMock(page);

    await page.goto('/dashboard?search=react&tags=Frontend&tags=Docs&page=2');

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();

    await loginWithApi(page);
    await page.goto('/dashboard?search=react&tags=Frontend&tags=Docs&page=2');
    await expect(page.getByRole('heading', { name: '아카이브 (Archive)' })).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard\?search=react&tags=Frontend&tags=Docs&page=2$/);
    await expect(page.getByPlaceholder('레퍼런스 검색...')).toHaveValue('react');
    await expect(page.getByRole('button', { name: 'Frontend' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Docs' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'React 쿼리 상태 문서' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard\?search=react&tags=Frontend&tags=Docs&page=2$/);
    await expect(page.getByPlaceholder('레퍼런스 검색...')).toHaveValue('react');
    await expect(page.getByRole('button', { name: 'Frontend' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Docs' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  test('잘못된 페이지 쿼리로 진입하면 에러 메시지를 보여주고 1페이지로 이동한다', async ({ page }) => {
    await installQueryStateMock(page);

    await page.goto('/dashboard?search=react&page=999');

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    await loginWithApi(page);
    await page.goto('/dashboard?search=react&page=999');
    await expect(page.getByRole('heading', { name: '아카이브 (Archive)' })).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard\?search=react$/);
    await expect(page.getByRole('alert')).toContainText('요청한 페이지를 찾지 못해 이전 페이지로 이동했습니다.');
    await expect(page.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: '첫 페이지 문서' })).toBeVisible();
  });
});
