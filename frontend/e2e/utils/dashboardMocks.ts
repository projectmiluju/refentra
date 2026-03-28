import type { Page, Route } from '@playwright/test';

interface MockReferenceResponseOptions {
  page?: number;
  totalCount?: number;
  totalPages?: number;
  availableTags?: string[];
}

interface MockReferenceItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  uploader_id: string;
  created_at: string;
}

const DEFAULT_CREATED_AT = '2026-03-27T00:00:00Z';

const createReferenceItem = (overrides: Partial<MockReferenceItem>): MockReferenceItem => ({
  id: overrides.id ?? 'ref-1',
  title: overrides.title ?? 'React routing reference',
  url: overrides.url ?? 'https://example.com/react-router',
  description: overrides.description ?? 'Reference covering React Router and URL state.',
  tags: overrides.tags ?? ['Frontend'],
  uploader_id: overrides.uploader_id ?? 'user-1234',
  created_at: overrides.created_at ?? DEFAULT_CREATED_AT,
});

export const mockDashboardReferences = async (
  route: Route,
  items: MockReferenceItem[],
  options: MockReferenceResponseOptions = {},
): Promise<void> => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      items,
      page: options.page ?? 1,
      limit: 10,
      total_count: options.totalCount ?? items.length,
      total_pages: options.totalPages ?? (items.length > 0 ? 1 : 0),
      available_tags: options.availableTags ?? ['Docs', 'Frontend', 'React'],
    }),
  });
};

export const installQueryStateMock = async (page: Page): Promise<void> => {
  const queryItems = [
    createReferenceItem({
      id: 'ref-query',
      title: 'React query state reference',
      url: 'https://example.com/react-query-state',
      tags: ['Frontend', 'Docs'],
    }),
  ];

  const firstPageItems = [
    createReferenceItem({
      id: 'ref-page-1',
      title: 'First page reference',
      url: 'https://example.com/page-one',
      tags: ['Frontend'],
    }),
  ];

  await page.route('**/api/v1/references**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const search = requestUrl.searchParams.get('search');
    const tags = requestUrl.searchParams.getAll('tags');
    const pageValue = requestUrl.searchParams.get('page');

    if (search === 'react' && tags.includes('Frontend') && tags.includes('Docs') && pageValue === '2') {
      await mockDashboardReferences(route, queryItems, {
        page: 2,
        totalCount: 11,
        totalPages: 3,
        availableTags: ['Frontend', 'Docs', 'React'],
      });
      return;
    }

    if (search === 'react' && pageValue === '1') {
      await mockDashboardReferences(route, firstPageItems, {
        page: 1,
        totalCount: 12,
        totalPages: 2,
        availableTags: ['Frontend', 'Docs', 'React'],
      });
      return;
    }

    await mockDashboardReferences(route, firstPageItems, {
      page: 1,
      totalCount: 12,
      totalPages: 2,
      availableTags: ['Frontend', 'Docs', 'React'],
    });
  });
};
