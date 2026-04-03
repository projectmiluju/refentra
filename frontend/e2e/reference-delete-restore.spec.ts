import { expect, test, type Locator, type Page } from '@playwright/test';
import { createReferenceWithApi, createUniqueReference, loginWithApi } from './utils/session';

const getReferenceCard = (page: Page, title: string): Locator =>
  page.locator('article').filter({
    has: page.getByRole('heading', { name: title }),
  });

test.describe('레퍼런스 삭제/복구 브라우저 회귀', () => {
  test('제품 모드에서 레퍼런스를 삭제한 뒤 undo로 복구할 수 있다', async ({ page }) => {
    const reference = createUniqueReference();

    await loginWithApi(page);
    await createReferenceWithApi(page, {
      title: reference.title,
      url: reference.url,
      description: reference.description,
      tags: ['DeleteRestore'],
    });

    await page.goto('/dashboard');

    const referenceCard = getReferenceCard(page, reference.title);
    await expect(referenceCard.getByRole('heading', { name: reference.title })).toBeVisible();

    await referenceCard.getByRole('button', { name: 'Delete' }).click();
    await expect(referenceCard.getByText('The item will leave the list now, but you can restore it within 24 hours.')).toBeVisible();
    await referenceCard.getByRole('button', { name: 'Delete now' }).click();

    await expect(page.getByText(`Removed "${reference.title}" from the list. You can restore it within 24 hours.`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo delete' })).toBeVisible();
    await expect(page.getByRole('heading', { name: reference.title })).toHaveCount(0);

    await page.getByRole('button', { name: 'Undo delete' }).click();

    await expect(page.getByRole('alert')).toContainText('The reference returned to the product library.');
    await expect(page.getByRole('heading', { name: reference.title })).toBeVisible();
  });

  test('페이지 2의 마지막 항목을 삭제하면 대시보드가 이전 유효 페이지로 보정된다', async ({ page }) => {
    const searchToken = `page-fix-${Date.now()}`;

    await loginWithApi(page);

    for (let index = 1; index <= 11; index += 1) {
      await createReferenceWithApi(page, {
        title: `${searchToken}-${index.toString().padStart(2, '0')}`,
        url: `https://example.com/${searchToken}-${index}`,
        description: `Page correction reference ${index}`,
        tags: ['PageFix'],
      });
    }

    await page.goto(`/dashboard?search=${encodeURIComponent(searchToken)}&page=2`);

    const currentPageCard = page.locator('main article');
    await expect(currentPageCard).toHaveCount(1);

    const deletedTitle = await currentPageCard.getByRole('heading').innerText();

    await currentPageCard.getByRole('button', { name: 'Delete' }).click();
    await currentPageCard.getByRole('button', { name: 'Delete now' }).click();

    await expect(page).toHaveURL(new RegExp(`/dashboard\\?search=${searchToken}$`));
    await expect(page.locator('main article')).toHaveCount(10);
    await expect(page.getByRole('heading', { name: deletedTitle })).toHaveCount(0);
  });
});
