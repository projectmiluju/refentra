import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TagBadge from '../components/common/TagBadge';
import AddReferenceModal from '../components/modal/AddReferenceModal';
import { DASHBOARD_TEXT } from '../constants/uiText';
import type { DashboardMode, ReferenceDraft, ReferenceItem, ReferenceListQuery } from '../types/reference';
import { createReference, fetchReferences } from '../lib/references';
import {
  DEFAULT_DASHBOARD_MODE,
  PORTFOLIO_DASHBOARD_MODE,
  getDashboardLocation,
  parseDashboardSearchParams,
} from '../lib/dashboardQuery';
import { createPortfolioReference, queryPortfolioReferences } from '../lib/portfolioReferences';

interface DashboardProps {
  onLoggedOut: () => Promise<void>;
}

const REFERENCE_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const Dashboard: React.FC<DashboardProps> = ({ onLoggedOut }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pageNotice, setPageNotice] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastValidPage, setLastValidPage] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { search: searchQuery, tags: selectedTags, page: currentPage, invalidPage, mode } = parseDashboardSearchParams(
    new URLSearchParams(location.search),
  );
  const [searchInput, setSearchInput] = useState(searchQuery);
  const isPortfolioMode = mode === PORTFOLIO_DASHBOARD_MODE;

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;

  const updateDashboardQuery = (
    overrides: Partial<ReferenceListQuery> & { mode?: DashboardMode } = {},
    options: { replace?: boolean } = {},
  ): void => {
    const nextLocation = getDashboardLocation({
      search: overrides.search ?? searchQuery,
      tags: overrides.tags ?? selectedTags,
      page: overrides.page ?? currentPage,
      mode: overrides.mode ?? mode,
    });
    const currentLocation = `${location.pathname}${location.search}`;

    if (nextLocation === currentLocation) {
      return;
    }

    navigate(nextLocation, { replace: options.replace ?? false });
  };

  const buildReferenceQuery = (overrides: Partial<ReferenceListQuery> = {}): ReferenceListQuery => ({
    search: overrides.search ?? searchQuery,
    tags: overrides.tags ?? selectedTags,
    page: overrides.page ?? currentPage,
    limit: overrides.limit ?? REFERENCE_PAGE_SIZE,
  });

  const loadReferences = async (overrides: Partial<ReferenceListQuery> = {}): Promise<void> => {
    const nextQuery = buildReferenceQuery(overrides);
    const requestedPage = nextQuery.page ?? 1;

    try {
      setIsLoading(true);
      setLoadError('');
      const response = isPortfolioMode
        ? queryPortfolioReferences(nextQuery)
        : await fetchReferences(nextQuery);

      const shouldCorrectPage = (response.totalPages === 0 && requestedPage > 1)
        || (response.totalPages > 0 && requestedPage > response.totalPages);

      if (shouldCorrectPage) {
        const fallbackPage = lastValidPage ?? 1;
        setPageNotice(DASHBOARD_TEXT.invalidPageFallback);
        updateDashboardQuery({ ...nextQuery, page: fallbackPage }, { replace: true });
        return;
      }

      setReferences(response.items);
      setAvailableTags(response.availableTags);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      setLastValidPage(response.totalPages > 0 ? response.page : 1);
    } catch (error) {
      if (error instanceof Error) {
        setLoadError(error.message);
        return;
      }

      setLoadError(DASHBOARD_TEXT.loadErrorFallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!invalidPage) {
      return;
    }

    setPageNotice(DASHBOARD_TEXT.invalidPageFallback);
    updateDashboardQuery({ page: lastValidPage ?? 1 }, { replace: true });
  }, [invalidPage, lastValidPage, mode, searchQuery, selectedTags, navigate, location.pathname, location.search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedSearch = searchInput.trim();

      if (trimmedSearch === searchQuery) {
        return;
      }

      setPageNotice('');
      updateDashboardQuery({ search: trimmedSearch, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput, searchQuery, selectedTags, currentPage, mode, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (invalidPage) {
      return;
    }

    void loadReferences();
  }, [searchQuery, currentPage, selectedTags.join('|'), invalidPage, mode]);

  const handleCreateReference = async (draft: ReferenceDraft): Promise<void> => {
    if (isPortfolioMode) {
      createPortfolioReference(draft);
    } else {
      await createReference(draft);
    }
    setIsModalOpen(false);
    setPageNotice('');

    if (currentPage !== 1) {
      updateDashboardQuery({ page: 1 });
      return;
    }

    await loadReferences({ page: 1 });
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      await onLoggedOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
    setPageNotice('');
  };

  const handleToggleTag = (tag: string): void => {
    setPageNotice('');
    const hasTag = selectedTags.includes(tag);
    const nextTags = hasTag
      ? selectedTags.filter((currentTag) => currentTag !== tag)
      : [...selectedTags, tag];
    updateDashboardQuery({ tags: nextTags, page: 1 });
  };

  const handleClearFilters = (): void => {
    setPageNotice('');
    setSearchInput('');
    updateDashboardQuery({ search: '', tags: [], page: 1 });
  };

  const handleSwitchMode = (nextMode: DashboardMode): void => {
    setPageNotice('');
    setSearchInput('');
    updateDashboardQuery({ search: '', tags: [], page: 1, mode: nextMode });
  };

  const renderContent = (): React.ReactNode => {
    if (isLoading) {
      return (
        <div className="rounded-xl border border-border/70 bg-surface px-5 py-5 text-sm text-text-muted">
          {DASHBOARD_TEXT.loading}
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-error/40 bg-surface px-5 py-5">
          <p className="text-sm text-error">{loadError}</p>
          <Button type="button" onClick={() => { void loadReferences(); }}>
            {DASHBOARD_TEXT.retry}
          </Button>
        </div>
      );
    }

    if (references.length === 0) {
      return (
        <div className="rounded-xl border border-border/70 bg-surface px-5 py-5">
          {hasActiveFilters ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">{DASHBOARD_TEXT.noResultsTitle}</h3>
              <p className="text-sm leading-7 text-text-muted">{DASHBOARD_TEXT.noResultsDescription}</p>
              <div>
                <Button type="button" onClick={handleClearFilters}>
                  {DASHBOARD_TEXT.clearFilters}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-semibold">{DASHBOARD_TEXT.emptyTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-text-muted">{DASHBOARD_TEXT.emptyDescription}</p>
              </div>
              <div>
                <p className="ui-label">{DASHBOARD_TEXT.onboardingChecklistTitle}</p>
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-7 text-text-muted">
                  {DASHBOARD_TEXT.onboardingSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_180px] gap-4 border-b border-border/70 px-5 py-3 lg:grid">
            <p className="ui-label">Reference</p>
            <p className="ui-label">Tags</p>
            <p className="ui-label">Meta</p>
          </div>
          <div className="divide-y divide-border/70">
            {references.map((ref) => (
              <article key={ref.id} className="px-5 py-4 transition-colors hover:bg-surface-soft/60">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_180px] lg:items-center">
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold leading-6">{ref.title}</h3>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block font-jetbrains text-[11px] uppercase tracking-[0.12em] text-text-muted hover:text-primary"
                    >
                      {ref.url}
                    </a>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{ref.description || '-'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ref.tags.map((tag) => <TagBadge key={tag} label={tag} />)}
                  </div>
                  <div className="font-jetbrains text-[11px] uppercase tracking-[0.12em] text-text-muted lg:text-right">
                    <p>{ref.uploader}</p>
                    <p className="mt-2">{ref.date}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-col items-center gap-3" aria-label={DASHBOARD_TEXT.paginationLabel}>
            <p className="text-sm text-text-muted">{`${totalCount}${DASHBOARD_TEXT.totalCountSuffix}`}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => {
                    setPageNotice('');
                    updateDashboardQuery({ page: pageNumber });
                  }}
                  className={pageNumber === currentPage
                    ? 'min-h-[44px] min-w-[44px] rounded-md border border-primary bg-primary px-3 text-sm text-white'
                    : 'min-h-[44px] min-w-[44px] rounded-md border border-border/70 bg-surface px-3 text-sm text-sys-text hover:bg-surface-soft'}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-sys-text">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="ui-label">{DASHBOARD_TEXT.brandMeta}</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{DASHBOARD_TEXT.title}</h1>
              <p className="mt-4 text-base leading-8 text-text-muted">
                {isPortfolioMode ? DASHBOARD_TEXT.portfolioSubtitle : DASHBOARD_TEXT.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => { void handleLogout(); }} isLoading={isLoggingOut}>
                {DASHBOARD_TEXT.logout}
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {DASHBOARD_TEXT.addReference}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="ui-label mr-1">{DASHBOARD_TEXT.modeLabel}</p>
            <button
              type="button"
              onClick={() => handleSwitchMode(PORTFOLIO_DASHBOARD_MODE)}
              className={isPortfolioMode
                ? 'min-h-[40px] rounded-md border border-primary bg-primary px-3 text-sm text-white'
                : 'min-h-[40px] rounded-md border border-border/70 bg-surface px-3 text-sm text-sys-text hover:bg-surface-soft'}
            >
              {DASHBOARD_TEXT.portfolioMode}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode(DEFAULT_DASHBOARD_MODE)}
              className={!isPortfolioMode
                ? 'min-h-[40px] rounded-md border border-primary bg-primary px-3 text-sm text-white'
                : 'min-h-[40px] rounded-md border border-border/70 bg-surface px-3 text-sm text-sys-text hover:bg-surface-soft'}
            >
              {DASHBOARD_TEXT.productMode}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface px-4 py-3">
            <Search className="h-4 w-4 text-text-muted" />
            <Input
              aria-label={DASHBOARD_TEXT.searchPlaceholder}
              placeholder={DASHBOARD_TEXT.searchPlaceholder}
              className="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:ring-0"
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr] lg:px-10">
        <aside className="space-y-4 rounded-xl border border-border/70 bg-surface-soft p-5">
          <div>
            <p className="ui-label">{DASHBOARD_TEXT.tagSectionTitle}</p>
            <p className="mt-3 text-sm leading-7 text-text-muted">{DASHBOARD_TEXT.filterDescription}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
              <p className="ui-label">{DASHBOARD_TEXT.metricSaved}</p>
              <p className="mt-3 font-jetbrains text-3xl text-sys-text">{totalCount}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
              <p className="ui-label">{DASHBOARD_TEXT.metricFiltered}</p>
              <p className="mt-3 font-jetbrains text-3xl text-sys-text">{references.length}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface px-4 py-4">
              <p className="ui-label">{DASHBOARD_TEXT.metricTags}</p>
              <p className="mt-3 font-jetbrains text-3xl text-sys-text">{availableTags.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableTags.length > 0 ? availableTags.map((tag) => (
              <TagBadge
                key={tag}
                label={tag}
                isActive={selectedTags.includes(tag)}
                onClick={() => handleToggleTag(tag)}
              />
            )) : (
              <p className="text-sm text-text-muted">{DASHBOARD_TEXT.noTags}</p>
            )}
          </div>
        </aside>

        <main className="space-y-4">
          {pageNotice ? (
            <div className="rounded-xl border border-error/40 bg-surface px-4 py-4">
              <p className="text-sm text-error" role="alert">
                {pageNotice}
              </p>
            </div>
          ) : null}

          {renderContent()}
        </main>
      </div>

      {isModalOpen ? <AddReferenceModal onClose={() => setIsModalOpen(false)} onSave={handleCreateReference} /> : null}
    </div>
  );
};

export default Dashboard;
