import type { DashboardMode } from '../types/reference';

const DEFAULT_DASHBOARD_PAGE = 1;
export const DEFAULT_DASHBOARD_MODE: DashboardMode = 'product';
export const PORTFOLIO_DASHBOARD_MODE: DashboardMode = 'portfolio';

export interface DashboardQueryState {
  search: string;
  tags: string[];
  page: number;
  invalidPage: boolean;
  mode: DashboardMode;
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
  const requestedMode = searchParams.get('mode');
  const mode = requestedMode === PORTFOLIO_DASHBOARD_MODE
    ? PORTFOLIO_DASHBOARD_MODE
    : DEFAULT_DASHBOARD_MODE;

  return {
    search: normalizeSearch(searchParams.get('search')),
    tags: normalizeTags(searchParams.getAll('tags')),
    page: invalidPage || pageValue === null ? DEFAULT_DASHBOARD_PAGE : page,
    invalidPage,
    mode,
  };
};

export const createDashboardSearchParams = ({
  search,
  tags,
  page,
  mode,
}: {
  search?: string;
  tags?: string[];
  page?: number;
  mode?: DashboardMode;
}): URLSearchParams => {
  const params = new URLSearchParams();
  const normalizedSearch = normalizeSearch(search ?? null);
  const normalizedTags = normalizeTags(tags ?? []);
  const normalizedPage = page && page > 0 ? page : DEFAULT_DASHBOARD_PAGE;
  const normalizedMode = mode ?? DEFAULT_DASHBOARD_MODE;

  if (normalizedSearch.length > 0) {
    params.set('search', normalizedSearch);
  }

  if (normalizedMode === PORTFOLIO_DASHBOARD_MODE) {
    params.set('mode', PORTFOLIO_DASHBOARD_MODE);
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
  mode,
}: {
  search?: string;
  tags?: string[];
  page?: number;
  mode?: DashboardMode;
}): string => {
  const serialized = createDashboardSearchParams({ search, tags, page, mode }).toString();
  return serialized.length > 0 ? `/dashboard?${serialized}` : '/dashboard';
};
