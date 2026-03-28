export const LOGIN_TEXT = {
  brand: 'Refentra',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  forgotPassword: 'Forgot password?',
  submit: 'Sign in',
  submitting: 'Signing in...',
  invalidEmail: 'Enter a valid email address.',
  emptyPassword: 'Enter your password.',
  invalidCredentials: 'The email or password is incorrect.',
} as const;

export const LANDING_TEXT = {
  eyebrow: 'Reference workflow for product teams',
  title: 'A reference system built for recall.',
  description: 'Refentra keeps search, tags, notes, and retrieval in one controlled workspace so saved references stay useful later.',
  primaryAction: 'Sign in',
  secondaryAction: 'View dashboard',
  problemTitle: 'The stack gets noisy long before the work gets clear.',
  problemItems: [
    {
      title: 'Context gets lost',
      body: 'A saved URL without a note or tag is hard to trust when the team returns to it later.',
    },
    {
      title: 'Search turns into recovery work',
      body: 'Tabs, folders, and screenshots multiply faster than a team can reliably revisit them.',
    },
    {
      title: 'Shared judgment breaks down',
      body: 'Without a common tag and note system, the same reference means different things to different people.',
    },
  ],
  featureTitle: 'Enough structure to feel like a real product.',
  featureItems: [
    {
      title: 'Search that narrows fast',
      body: 'Query by keyword, then scan title, source, and notes without opening another layer first.',
    },
    {
      title: 'Tag logic that stays visible',
      body: 'Filters are always close to the list, so structure stays legible while the result set changes.',
    },
    {
      title: 'Input flow with restraint',
      body: 'The add flow stays focused, protects against double submit, and keeps the interface calm.',
    },
  ],
  dashboardPreviewTitle: 'The handoff to the dashboard should feel immediate.',
  dashboardPreviewDescription: 'Search, filters, metrics, and pagination stay on the same system so the product flow reads as one piece.',
  ctaTitle: 'A portfolio piece still has to read like product.',
  ctaDescription: 'The goal is control, clarity, and a surface that looks buildable.',
  finalPrimaryAction: 'Open dashboard',
  finalSecondaryAction: 'Go to sign in',
} as const;

export const DASHBOARD_TEXT = {
  title: 'Reference Library',
  subtitle: 'Search, filter, and revisit references without noise.',
  brandMeta: 'Reference Archive Demo',
  addReference: 'Add reference',
  logout: 'Log out',
  searchPlaceholder: 'Search references',
  tagSectionTitle: 'Filters',
  filterDescription: 'Reduce the list with tags and a single search field.',
  metricSaved: 'Total references',
  metricFiltered: 'Visible now',
  metricTags: 'Available tags',
  loading: 'Loading references...',
  emptyTitle: 'No references yet.',
  emptyDescription: 'Add the first reference to turn this surface into a usable working archive.',
  noResultsTitle: 'No results found.',
  noResultsDescription: 'Try another keyword or remove a few filters.',
  clearFilters: 'Clear filters',
  onboardingChecklistTitle: 'Get started',
  onboardingSteps: [
    'Open Add reference from the top right.',
    'Save a title and URL, then leave a short note for later context.',
    'Add a few tags so the list stays searchable as it grows.',
  ],
  noTags: 'No tags available yet.',
  totalCountSuffix: ' references',
  retry: 'Retry',
  loadErrorFallback: 'Failed to load references.',
  paginationLabel: 'Pagination',
  invalidPageFallback: 'The requested page was not available, so the list returned to the previous page.',
} as const;

export const REFERENCE_MODAL_TEXT = {
  title: 'Add reference',
  subtitle: 'Save the link with enough context to use it later.',
  urlLabel: 'URL',
  titleLabel: 'Title',
  descriptionLabel: 'Notes',
  tagsLabel: 'Tags',
  tagPlaceholder: 'Type a tag and press Enter',
  urlPlaceholder: 'https://...',
  titlePlaceholder: 'Name the reference',
  descriptionPlaceholder: 'Leave a short note about why this matters.',
  helper: 'A short note makes later retrieval easier.',
  cancel: 'Cancel',
  submit: 'Save reference',
  submitting: 'Saving...',
  emptyUrl: 'Enter a URL.',
  invalidUrl: 'Enter a valid URL.',
  emptyTitle: 'Enter a title.',
  saveErrorFallback: 'Failed to save the reference.',
} as const;

export const APP_TEXT = {
  booting: 'Checking the local environment...',
  authChecking: 'Checking your session...',
} as const;

export const SETUP_GUIDE_TEXT = {
  kicker: 'Local Development Setup',
  title: 'Database setup is required.',
  stepsTitle: 'Run sequence',
  hint: 'Start PostgreSQL with Docker first, then restart the Go server to load the app normally.',
  resetHint: 'To reset demo data, remove the Docker volume and recreate the container.',
  defaultSteps: [
    'cp .env.example .env',
    'docker compose up -d postgres',
    'cd frontend && npm run build',
    'go run .',
  ],
} as const;
