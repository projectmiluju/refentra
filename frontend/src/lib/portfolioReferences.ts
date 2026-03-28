import type {
  ReferenceDraft,
  ReferenceItem,
  ReferenceListQuery,
  ReferenceListResult,
} from '../types/reference';

const PORTFOLIO_STORAGE_KEY = 'refentra:portfolio-references';
const PORTFOLIO_PAGE_LIMIT = 10;
const PORTFOLIO_UPLOADER = 'Refentra Demo';

const PORTFOLIO_REFERENCE_SEED: ReferenceItem[] = [
  {
    id: 'portfolio-ref-01',
    title: 'Search systems for high-density product teams',
    url: 'https://example.com/search-systems',
    description: 'Reference for search placement, row hierarchy, and low-noise filtering.',
    tags: ['Research', 'Archive'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-27',
  },
  {
    id: 'portfolio-ref-02',
    title: 'Dashboard patterns for high-clarity product teams',
    url: 'https://example.com/dashboard-patterns',
    description: 'Useful for side rail density, calm metrics, and restrained action states.',
    tags: ['UI', 'Archive'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-27',
  },
  {
    id: 'portfolio-ref-03',
    title: 'Reference capture flow with submit protection',
    url: 'https://example.com/capture-flow',
    description: 'Modal structure that keeps fields visible and prevents accidental double saves.',
    tags: ['Workflow', 'UI'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-26',
  },
  {
    id: 'portfolio-ref-04',
    title: 'Tag taxonomy for cross-functional product libraries',
    url: 'https://example.com/tag-taxonomy',
    description: 'Shows how teams keep research, interface, and delivery tags legible at scale.',
    tags: ['Research', 'Docs'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-25',
  },
  {
    id: 'portfolio-ref-05',
    title: 'Pagination that preserves context under filter changes',
    url: 'https://example.com/pagination-context',
    description: 'Reference for keeping page transitions calm while the query state changes.',
    tags: ['Archive', 'Docs'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-24',
  },
  {
    id: 'portfolio-ref-06',
    title: 'Editorial layout audit for desktop SaaS landing pages',
    url: 'https://example.com/editorial-layout',
    description: 'Breakdown of asymmetry, whitespace, and visual restraint in B2B surfaces.',
    tags: ['Research', 'UI'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-23',
  },
  {
    id: 'portfolio-ref-07',
    title: 'Design system notes for cold minimal interfaces',
    url: 'https://example.com/design-system-notes',
    description: 'Token examples for neutral surfaces, tight borders, and clear call-to-action weight.',
    tags: ['Design System', 'UI'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-22',
  },
  {
    id: 'portfolio-ref-08',
    title: 'Product writing patterns for concise dashboard states',
    url: 'https://example.com/product-writing',
    description: 'Examples of short helper copy for search, modal submission, and loading behavior.',
    tags: ['Docs', 'Workflow'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-21',
  },
  {
    id: 'portfolio-ref-09',
    title: 'Research repository examples for PM and design teams',
    url: 'https://example.com/research-repository',
    description: 'How product teams cluster references by theme instead of by tool origin.',
    tags: ['Research', 'Workflow'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-20',
  },
  {
    id: 'portfolio-ref-10',
    title: 'Interface density examples for data-heavy archive pages',
    url: 'https://example.com/interface-density',
    description: 'Useful for balancing meta information without turning the list into a table.',
    tags: ['UI', 'Archive'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-19',
  },
  {
    id: 'portfolio-ref-11',
    title: 'Interaction references for tokenized button systems',
    url: 'https://example.com/button-systems',
    description: 'Reference for button icon alignment, hover weight, and focus visibility.',
    tags: ['Design System', 'UI'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-18',
  },
  {
    id: 'portfolio-ref-12',
    title: 'Archive UX checklist for searchable reference libraries',
    url: 'https://example.com/archive-checklist',
    description: 'Checklist covering search, tags, pagination, and save flows in one surface.',
    tags: ['Archive', 'Docs'],
    uploader: PORTFOLIO_UPLOADER,
    date: '2026-03-17',
  },
];

const normalizeString = (value: string): string => value.trim().toLowerCase();

const readPortfolioReferences = (): ReferenceItem[] => {
  if (typeof window === 'undefined') {
    return [...PORTFOLIO_REFERENCE_SEED];
  }

  const stored = window.sessionStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (!stored) {
    return [...PORTFOLIO_REFERENCE_SEED];
  }

  try {
    const parsed = JSON.parse(stored) as ReferenceItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...PORTFOLIO_REFERENCE_SEED];
  } catch {
    return [...PORTFOLIO_REFERENCE_SEED];
  }
};

const writePortfolioReferences = (items: ReferenceItem[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(items));
};

const getAvailableTags = (items: ReferenceItem[]): string[] => Array.from(
  new Set(items.flatMap((item) => item.tags)),
).sort((left, right) => left.localeCompare(right));

export const queryPortfolioReferences = (query: ReferenceListQuery = {}): ReferenceListResult => {
  const allItems = readPortfolioReferences();
  const search = normalizeString(query.search ?? '');
  const tags = query.tags ?? [];
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : PORTFOLIO_PAGE_LIMIT;

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = search.length === 0 || [item.title, item.description, item.url]
      .some((field) => normalizeString(field).includes(search));
    const matchesTags = tags.length === 0 || tags.every((tag) => item.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const totalCount = filteredItems.length;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
  const safePage = totalPages > 0 && page > totalPages ? 1 : page;
  const offset = (safePage - 1) * limit;

  return {
    items: filteredItems.slice(offset, offset + limit),
    page: safePage,
    limit,
    totalCount,
    totalPages,
    availableTags: getAvailableTags(allItems),
  };
};

export const createPortfolioReference = (draft: ReferenceDraft): ReferenceItem => {
  const items = readPortfolioReferences();
  const normalizedUrl = normalizeString(draft.url);
  const normalizedTitle = normalizeString(draft.title);
  const duplicateItem = items.find((item) => (
    normalizeString(item.url) === normalizedUrl && normalizeString(item.title) === normalizedTitle
  ));

  if (duplicateItem) {
    throw new Error('This reference already exists in the demo library.');
  }

  const nextItem: ReferenceItem = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    title: draft.title.trim(),
    url: draft.url.trim(),
    description: draft.description.trim(),
    tags: draft.tags,
    uploader: PORTFOLIO_UPLOADER,
    date: new Date().toISOString().slice(0, 10),
  };

  writePortfolioReferences([nextItem, ...items]);
  return nextItem;
};
