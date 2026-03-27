import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TagBadge from '../components/common/TagBadge';
import AddReferenceModal from '../components/modal/AddReferenceModal';
import { DASHBOARD_TEXT } from '../constants/uiText';
import type { ReferenceDraft, ReferenceItem, ReferenceListQuery } from '../types/reference';
import { createReference, fetchReferences } from '../lib/references';
import { createDashboardSearchParams, parseDashboardSearchParams } from '../lib/dashboardQuery';

interface DashboardProps {
  onLoggedOut: () => Promise<void>;
}

const REFERENCE_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const Dashboard: React.FC<DashboardProps> = ({ onLoggedOut }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pageNotice, setPageNotice] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [lastValidPage, setLastValidPage] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { search: searchQuery, tags: selectedTags, page: currentPage, invalidPage } = parseDashboardSearchParams(searchParams);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;

  const updateDashboardQuery = (
    overrides: Partial<ReferenceListQuery> = {},
    options: { replace?: boolean } = {},
  ): void => {
    const nextParams = createDashboardSearchParams({
      search: overrides.search ?? searchQuery,
      tags: overrides.tags ?? selectedTags,
      page: overrides.page ?? currentPage,
    });
    const nextSerialized = nextParams.toString();
    const currentSerialized = searchParams.toString();

    if (nextSerialized === currentSerialized) {
      return;
    }

    setSearchParams(nextParams, { replace: options.replace ?? false });
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
      const response = await fetchReferences(nextQuery);

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
  }, [invalidPage, lastValidPage, searchQuery, selectedTags]);

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
  }, [searchInput, searchQuery, selectedTags, currentPage]);

  useEffect(() => {
    if (invalidPage) {
      return;
    }

    void loadReferences();
  }, [searchQuery, currentPage, selectedTags.join('|'), invalidPage]);

  const handleCreateReference = async (draft: ReferenceDraft): Promise<void> => {
    await createReference(draft);
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

  return (
    <div className="flex h-screen w-full bg-background text-sys-text">
      {/* Sidebar */}
      <aside className="w-72 bg-surface border-r border-slate-800 p-6 flex flex-col shrink-0">
        <h2 className="text-xl font-pretendard font-bold mb-6">Refentra</h2>
        <div className="relative mb-8">
          <Input
            placeholder={DASHBOARD_TEXT.searchPlaceholder}
            className="pl-10"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-text-muted" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-text-muted mb-4">{DASHBOARD_TEXT.tagSectionTitle}</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.length > 0 ? availableTags.map((tag) => (
              <TagBadge
                key={tag}
                label={tag}
                isActive={selectedTags.includes(tag)}
                onClick={() => handleToggleTag(tag)}
              />
            )) : (
              <p className="text-sm text-text-muted text-body-ko">{DASHBOARD_TEXT.noTags}</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 bg-background/80 backdrop-blur-md">
          <h1 className="text-2xl font-pretendard font-semibold">{DASHBOARD_TEXT.title}</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { void handleLogout(); }} isLoading={isLoggingOut}>
              {DASHBOARD_TEXT.logout}
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>{DASHBOARD_TEXT.addReference}</Button>
          </div>
        </header>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
          {!isLoading && !loadError && pageNotice ? (
            <div className="bg-surface p-4 rounded-xl border border-error/60">
              <p className="text-sm text-error text-body-ko" role="alert">
                {pageNotice}
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="bg-surface p-6 rounded-xl border border-slate-800 text-body-ko text-slate-300">
              {DASHBOARD_TEXT.loading}
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="bg-surface p-6 rounded-xl border border-error flex flex-col items-start gap-4">
              <p className="text-body-ko text-error">{loadError}</p>
              <Button type="button" onClick={() => { void loadReferences(); }}>
                {DASHBOARD_TEXT.retry}
              </Button>
            </div>
          ) : null}

          {!isLoading && !loadError && references.length === 0 ? (
            <div className="bg-surface p-6 rounded-xl border border-slate-800 flex flex-col gap-2">
              {hasActiveFilters ? (
                <>
                  <h3 className="text-xl font-pretendard font-bold">{DASHBOARD_TEXT.noResultsTitle}</h3>
                  <p className="text-body-ko text-slate-300">{DASHBOARD_TEXT.noResultsDescription}</p>
                  <div className="mt-3">
                    <Button type="button" onClick={handleClearFilters}>
                      {DASHBOARD_TEXT.clearFilters}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-pretendard font-bold">{DASHBOARD_TEXT.emptyTitle}</h3>
                  <p className="text-body-ko text-slate-300">{DASHBOARD_TEXT.emptyDescription}</p>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-text-muted mb-2">{DASHBOARD_TEXT.onboardingChecklistTitle}</h4>
                    <ul className="flex flex-col gap-2 text-body-ko text-slate-300 list-disc pl-5">
                      {DASHBOARD_TEXT.onboardingSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {!isLoading && !loadError ? references.map((ref) => (
            <div key={ref.id} className="bg-surface p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <h3 className="text-xl font-pretendard font-bold mb-1">{ref.title}</h3>
              <a href={ref.url} target="_blank" rel="noreferrer" className="text-text-muted text-sm text-nowrap hover:text-primary transition-colors block mb-3">
                {ref.url}
              </a>
              <p className="text-body-ko text-slate-300 mb-4 line-clamp-2">
                {ref.description || '-'}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  {ref.tags.map((tag) => <TagBadge key={tag} label={tag} />)}
                </div>
                <div className="text-sm text-text-muted font-jetbrains space-x-3">
                  <span>{ref.uploader}</span>
                  <span>{ref.date}</span>
                </div>
              </div>
            </div>
          )) : null}

          {/* Pagination (Visual) */}
          {!isLoading && !loadError && totalPages > 1 ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-3" aria-label={DASHBOARD_TEXT.paginationLabel}>
              <p className="text-sm text-text-muted">{`${totalCount}${DASHBOARD_TEXT.totalCountSuffix}`}</p>
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => {
                      setPageNotice('');
                      updateDashboardQuery({ page: pageNumber });
                    }}
                    className={pageNumber === currentPage
                      ? 'px-3 py-1 rounded bg-surface border border-slate-800 text-sys-text'
                      : 'px-3 py-1 rounded hover:bg-surface border border-transparent text-text-muted'}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {isModalOpen && <AddReferenceModal onClose={() => setIsModalOpen(false)} onSave={handleCreateReference} />}
    </div>
  );
};

export default Dashboard;
