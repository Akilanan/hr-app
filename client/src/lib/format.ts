import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function fmtDate(d?: string | null, f = 'MMM d, yyyy'): string {
  if (!d) return '—';
  try {
    return format(parseISO(d), f);
  } catch {
    return '—';
  }
}

export const fmtMonth = (d?: string | null) => fmtDate(d, 'MMM yyyy');

export function fmtRelative(d?: string | null): string {
  if (!d) return '—';
  try {
    return formatDistanceToNowStrict(parseISO(d), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function fmtMoney(n?: number | null, currency = 'INR'): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compact Indian money: ₹1.85Cr, ₹45.5L, ₹85K. */
export function fmtMoneyShort(n?: number | null, _currency = 'INR'): string {
  if (n == null || Number.isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${n}`;
}

/** Short axis label for charts (lakh/crore). */
export function fmtAxis(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e7) return `₹${+(v / 1e7).toFixed(a % 1e7 === 0 ? 0 : 1)}Cr`;
  if (a >= 1e5) return `₹${+(v / 1e5).toFixed(a % 1e5 === 0 ? 0 : 1)}L`;
  if (a >= 1e3) return `₹${Math.round(v / 1e3)}K`;
  return `₹${v}`;
}

export function fmtNumber(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

export function fmtPercent(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

export function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// Monochrome avatar chips (neutral greys) — keeps the DOM chromatic-free; the
// .avatar CSS rule also enforces grey, so this is belt-and-suspenders.
const AVATAR_COLORS = [
  '#3f3f46', '#52525b', '#71717a', '#5b5b63', '#646469',
  '#48484f', '#5e5e66', '#6b6b73', '#42424a', '#57575f',
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function titleCase(s?: string | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
