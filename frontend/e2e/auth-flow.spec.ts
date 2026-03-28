import { expect, test } from '@playwright/test';
import { createUniqueReference, loginFromPage, logoutFromPage, signupFromPage } from './utils/session';

test.describe('브라우저 핵심 인증 흐름', () => {
  test('@smoke 비로그인 사용자는 보호된 대시보드 접근 시 로그인 페이지로 이동한다', async ({ page }) => {
    await page.goto('/dashboard?search=react&page=2');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'A reference system built for recall.' })).toBeVisible();
  });

  test('@smoke 회원가입 직후 빈 상태 대시보드를 렌더링한다', async ({ page }) => {
    await page.route('**/api/v1/references**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          page: 1,
          limit: 10,
          total_count: 0,
          total_pages: 0,
          available_tags: [],
        }),
      });
    });

    await signupFromPage(page);

    await expect(page.getByRole('heading', { name: 'No references yet.' })).toBeVisible();
    await expect(page.getByText('Get started')).toBeVisible();
    await expect(page.getByText('Open Add reference from the top right.')).toBeVisible();
  });

  test('@smoke 로그인 후 저장, 새로고침 재조회, 로그아웃과 재접근 차단이 동작한다', async ({ page }) => {
    const reference = createUniqueReference();

    await loginFromPage(page);

    await page.getByRole('button', { name: 'Add reference' }).click();
    await page.getByLabel('URL').fill(reference.url);
    await page.getByLabel('Title').fill(reference.title);
    await page.getByLabel('Notes').fill(reference.description);

    const saveButton = page.getByRole('button', { name: 'Save reference' });
    await expect(saveButton).toBeEnabled();
    await saveButton.dblclick();

    await expect(page.getByRole('heading', { name: reference.title })).toBeVisible();
    await expect(page.getByText(reference.url)).toBeVisible();

    await page.reload();

    const referenceHeading = page.getByRole('heading', { name: reference.title });
    await expect(referenceHeading).toBeVisible();
    await expect(referenceHeading).toHaveCount(1);
    await expect(page.getByText(reference.url)).toBeVisible();

    await logoutFromPage(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
  });
});
