import { expect, test } from '@playwright/test';
import { createUniqueReference, loginFromPage, logoutFromPage } from './utils/session';

test.describe('브라우저 핵심 인증 흐름', () => {
  test('비로그인 사용자는 보호된 대시보드 접근 시 로그인 페이지로 이동한다', async ({ page }) => {
    await page.goto('/dashboard?search=react&page=2');

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('로그인 후 온보딩 빈 상태를 렌더링한다', async ({ page }) => {
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

    await loginFromPage(page);

    await expect(page.getByRole('heading', { name: '첫 아카이브를 시작해 보세요.' })).toBeVisible();
    await expect(page.getByText('처음 시작할 때 추천하는 순서')).toBeVisible();
    await expect(page.getByText('오른쪽 상단의 새 레퍼런스 추가 버튼을 누릅니다.')).toBeVisible();
  });

  test('로그인 후 저장, 새로고침 재조회, 로그아웃과 재접근 차단이 동작한다', async ({ page }) => {
    const reference = createUniqueReference();

    await loginFromPage(page);

    await page.getByRole('button', { name: '새 레퍼런스 추가' }).click();
    await page.getByLabel('URL 주소').fill(reference.url);
    await page.getByLabel('레퍼런스 제목 (Title)').fill(reference.title);
    await page.getByLabel('부연 설명 (Description)').fill(reference.description);

    const saveButton = page.getByRole('button', { name: '저장하기' });
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

    await page.goBack();
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  });
});
