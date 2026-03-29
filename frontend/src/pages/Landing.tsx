import React from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import TagBadge from '../components/common/TagBadge';
import { LANDING_TEXT } from '../constants/uiText';
import { getLoginRedirectSearch } from '../lib/loginRedirect';

const PREVIEW_TAGS = ['Research', 'UI', 'Archive'];
const PREVIEW_ROWS = [
  {
    title: 'Search systems for high-density product teams',
    source: 'notion.so / 2h ago',
    note: 'Reference for search placement, row hierarchy, and low-noise filtering.',
  },
  {
    title: 'Dashboard patterns for high-clarity product teams',
    source: 'figma.com / 1d ago',
    note: 'Useful for side rail density, calm metrics, and restrained action states.',
  },
  {
    title: 'Reference capture flow with submit protection',
    source: 'internal note / 3d ago',
    note: 'Modal structure that keeps fields visible and prevents accidental double saves.',
  },
];

const TRUST_METRICS = [
  { value: '47,280+', label: 'saved references reviewed' },
  { value: '4.86/5', label: 'internal demo rating' },
  { value: '12m', label: 'average retrieval window' },
];

const DEMO_LOGIN_PATH = `/login${getLoginRedirectSearch('/dashboard?mode=portfolio')}`;

const Landing: React.FC = () => (
  <div className="min-h-screen bg-background text-sys-text">
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <div>
          <p className="ui-label">Refentra</p>
          <p className="mt-2 text-sm text-text-muted">{LANDING_TEXT.eyebrow}</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="#preview">
            <Button variant="ghost">Preview</Button>
          </a>
          <Link to="/login">
            <Button variant="ghost">{LANDING_TEXT.headerSecondaryAction}</Button>
          </Link>
          <Link to="/signup">
            <Button>{LANDING_TEXT.headerAction}</Button>
          </Link>
        </div>
      </div>
    </header>

    <main>
      <section className="border-b border-border/60 bg-hero-glow min-h-[100dvh]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div className="max-w-3xl lg:pt-10">
            <p className="ui-label">{LANDING_TEXT.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-6xl">
              {LANDING_TEXT.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
              {LANDING_TEXT.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={DEMO_LOGIN_PATH}>
                <Button size="lg">{LANDING_TEXT.primaryAction}</Button>
              </Link>
              <Link to="/signup">
                <Button variant="ghost" size="lg">
                  {LANDING_TEXT.secondaryAction}
                </Button>
              </Link>
            </div>
          </div>

          <div className="surface-card overflow-hidden rounded-2xl lg:translate-y-10">
            <div className="border-b border-border/60 bg-surface-soft px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="ui-label">Library preview</p>
                  <h2 className="mt-2 text-xl font-semibold">Reference Library</h2>
                </div>
                <span className="rounded-md border border-border/70 bg-surface px-3 py-2 font-jetbrains text-xs uppercase tracking-[0.12em] text-text-muted">
                  128 refs
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-md border border-border/70 bg-surface px-4 py-3">
                <Search className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-muted">Search references</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {PREVIEW_TAGS.map((tag) => (
                  <TagBadge key={tag} label={tag} isActive={tag === 'Archive'} />
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {PREVIEW_ROWS.map((row) => (
                  <article key={row.title} className="rounded-xl border border-border/70 bg-surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-semibold leading-6">{row.title}</h3>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
                    </div>
                    <p className="mt-2 font-jetbrains text-[11px] uppercase tracking-[0.12em] text-text-muted">
                      {row.source}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-text-muted">{row.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-3 lg:px-10">
          {TRUST_METRICS.map((item) => (
            <div key={item.label} className="rounded-xl border border-border/70 bg-surface-soft px-4 py-4">
              <p className="font-jetbrains text-2xl text-sys-text">{item.value}</p>
              <p className="mt-2 text-sm text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="max-w-3xl">
          <p className="ui-label">Problem</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{LANDING_TEXT.problemTitle}</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card rounded-2xl p-6 lg:min-h-[320px]">
            <p className="ui-label">Issue 01</p>
            <h3 className="mt-4 text-2xl font-semibold">{LANDING_TEXT.problemItems[0]?.title}</h3>
            <p className="mt-5 max-w-xl text-sm leading-7 text-text-muted">{LANDING_TEXT.problemItems[0]?.body}</p>
          </article>
          <div className="grid gap-4">
            {LANDING_TEXT.problemItems.slice(1).map((item, index) => (
              <article key={item.title} className="surface-card rounded-2xl p-6">
                <p className="ui-label">Issue 0{index + 2}</p>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface-soft/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:px-10">
          <div>
            <p className="ui-label">Features</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{LANDING_TEXT.featureTitle}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-surface p-6 md:row-span-2">
              <p className="ui-label">01</p>
              <h3 className="mt-4 text-2xl font-semibold">{LANDING_TEXT.featureItems[0]?.title}</h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-text-muted">{LANDING_TEXT.featureItems[0]?.body}</p>
              <div className="mt-8 rounded-xl border border-border/70 bg-surface-soft p-4">
                <p className="ui-label">Live query</p>
                <p className="mt-3 text-sm text-text-muted">search=interaction-system&tags=Research</p>
              </div>
            </article>
            {LANDING_TEXT.featureItems.slice(1).map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-border/70 bg-surface p-6">
                <p className="ui-label">0{index + 2}</p>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="max-w-2xl">
            <p className="ui-label">Dashboard handoff</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{LANDING_TEXT.dashboardPreviewTitle}</h2>
            <p className="mt-5 text-base leading-8 text-text-muted">{LANDING_TEXT.dashboardPreviewDescription}</p>
          </div>

          <div className="surface-card rounded-2xl p-5">
            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <aside className="rounded-xl border border-border/70 bg-surface-soft p-4">
                <p className="ui-label">Left rail</p>
                <div className="mt-4 space-y-2">
                  {['All references', 'Interface', 'Research', 'System'].map((item) => (
                    <div key={item} className="rounded-md border border-border/70 bg-surface px-3 py-3 text-sm text-sys-text">
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ['128', 'Total references'],
                    ['24', 'Visible now'],
                    ['18', 'Filterable tags'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl border border-border/70 bg-surface px-4 py-5">
                      <p className="font-jetbrains text-2xl text-sys-text">{value}</p>
                      <p className="mt-2 text-sm text-text-muted">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {PREVIEW_ROWS.slice(0, 2).map((row) => (
                    <article key={row.title} className="rounded-xl border border-border/70 bg-surface px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h3 className="text-base font-semibold">{row.title}</h3>
                        <p className="font-jetbrains text-[11px] uppercase tracking-[0.12em] text-text-muted">
                          {row.source}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-text-muted">{row.note}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-accent text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-14 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-2xl">
            <p className="ui-label text-slate-300">Next step</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{LANDING_TEXT.ctaTitle}</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">{LANDING_TEXT.ctaDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={DEMO_LOGIN_PATH}>
              <Button className="!border-white !bg-white !text-accent hover:!border-slate-100 hover:!bg-slate-100">
                {LANDING_TEXT.finalPrimaryAction}
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="!border-white/20 !bg-transparent !text-white hover:!bg-white/10">
                {LANDING_TEXT.finalSecondaryAction}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default Landing;
