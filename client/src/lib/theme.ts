export type Theme = 'light' | 'dark';

const KEY = 'pms_theme';

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // Immersive dark is the default for first-time visitors, but honor an explicit
  // system "light" preference for accessibility. A saved/toggled choice always wins.
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

/** Set the initial theme as early as possible to avoid a flash. */
export function initTheme(): void {
  applyTheme(getTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
