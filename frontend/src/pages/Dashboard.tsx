import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TagBadge from '../components/common/TagBadge';
import AddReferenceModal from '../components/modal/AddReferenceModal';
import { DASHBOARD_TEXT } from '../constants/uiText';
import type { ReferenceDraft, ReferenceItem } from '../types/reference';
import { createReference, fetchReferences } from '../lib/references';

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadReferences = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setLoadError('');
      const nextReferences = await fetchReferences();
      setReferences(nextReferences);
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
    void loadReferences();
  }, []);

  const handleCreateReference = async (draft: ReferenceDraft): Promise<void> => {
    const nextReference = await createReference(draft);
    setReferences((currentReferences) => [nextReference, ...currentReferences]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-background text-sys-text">
      {/* Sidebar */}
      <aside className="w-72 bg-surface border-r border-slate-800 p-6 flex flex-col shrink-0">
        <h2 className="text-xl font-pretendard font-bold mb-6">Refentra</h2>
        <div className="relative mb-8">
          <Input placeholder={DASHBOARD_TEXT.searchPlaceholder} className="pl-10" />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-text-muted" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-text-muted mb-4">태그 (Tags)</h3>
          <div className="flex flex-wrap gap-2">
            <TagBadge label="Frontend" />
            <TagBadge label="Backend" />
            <TagBadge label="Design" />
            <TagBadge label="Go" />
            <TagBadge label="React" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 shrink-0 bg-background/80 backdrop-blur-md">
          <h1 className="text-2xl font-pretendard font-semibold">{DASHBOARD_TEXT.title}</h1>
          <Button onClick={() => setIsModalOpen(true)}>{DASHBOARD_TEXT.addReference}</Button>
        </header>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
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
              <h3 className="text-xl font-pretendard font-bold">{DASHBOARD_TEXT.emptyTitle}</h3>
              <p className="text-body-ko text-slate-300">{DASHBOARD_TEXT.emptyDescription}</p>
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
          <div className="mt-8 flex items-center justify-center gap-2">
            <button className="px-3 py-1 rounded bg-surface border border-slate-800 text-sys-text">1</button>
            <button className="px-3 py-1 rounded hover:bg-surface border border-transparent text-text-muted">2</button>
            <button className="px-3 py-1 rounded hover:bg-surface border border-transparent text-text-muted">3</button>
          </div>
        </div>
      </main>

      {isModalOpen && <AddReferenceModal onClose={() => setIsModalOpen(false)} onSave={handleCreateReference} />}
    </div>
  );
};

export default Dashboard;
