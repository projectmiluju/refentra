const DEFAULT_DASHBOARD_PAGE = 1;

export interface DashboardQueryState {
  search: string;
  tags: string[];
  page: number;
  invalidPage: boolean;
}

const normalizeSearch = (search: string | null): string => search?.trim() ?? '';

const normalizeTags = (tags: string[]): string[] => {
  const nextTags = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return Array.from(new Set(nextTags));
};

export const parseDashboardSearchParams = (searchParams: URLSearchParams): DashboardQueryState => {
  const pageValue = searchParams.get('page');
  const page = Number(pageValue);
  const invalidPage = pageValue !== null && (!Number.isInteger(page) || page < 1);

  return {
    search: normalizeSearch(searchParams.get('search')),
    tags: normalizeTags(searchParams.getAll('tags')),
    page: invalidPage || pageValue === null ? DEFAULT_DASHBOARD_PAGE : page,
    invalidPage,
  };
};

export const createDashboardSearchParams = ({
  search,
  tags,
  page,
}: {
  search?: string;
  tags?: string[];
  page?: number;
}): URLSearchParams => {
  const params = new URLSearchParams();
  const normalizedSearch = normalizeSearch(search ?? null);
  const normalizedTags = normalizeTags(tags ?? []);
  const normalizedPage = page && page > 0 ? page : DEFAULT_DASHBOARD_PAGE;

  if (normalizedSearch.length > 0) {
    params.set('search', normalizedSearch);
  }

  normalizedTags.forEach((tag) => {
    params.append('tags', tag);
  });

  if (normalizedPage > DEFAULT_DASHBOARD_PAGE) {
    params.set('page', String(normalizedPage));
  }

  return params;
};

export const getDashboardLocation = ({
  search,
  tags,
  page,
}: {
  search?: string;
  tags?: string[];
  page?: number;
}): string => {
  const serialized = createDashboardSearchParams({ search, tags, page }).toString();
  return serialized.length > 0 ? `/dashboard?${serialized}` : '/dashboard';
};

