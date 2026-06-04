/* Status/severity → visual tone mapping. Kept out of components/ui.tsx so that
 * module exports only React components — a requirement for Vite's React Fast
 * Refresh to hot-swap edits instead of forcing a full page reload. */

export type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple';

const TONE_MAP: Record<string, Tone> = {
  ACTIVE: 'green',
  ON_LEAVE: 'amber',
  TERMINATED: 'red',
  COMPLETED: 'green',
  IN_PROGRESS: 'blue',
  NOT_STARTED: 'gray',
  ON_HOLD: 'amber',
  ACKNOWLEDGED: 'green',
  SUBMITTED: 'blue',
  DRAFT: 'gray',
  HIGH: 'red',
  MEDIUM: 'amber',
  LOW: 'gray',
  PROMOTION: 'purple',
  RAISE: 'green',
  BONUS: 'blue',
  MARKET: 'blue',
  ADJUSTMENT: 'amber',
  DEMOTION: 'red',
};

export function toneFor(value: string): Tone {
  return TONE_MAP[value] ?? 'gray';
}

const TONE_VARS: Record<Tone, [string, string]> = {
  gray: ['var(--gray-soft)', 'var(--text-muted)'],
  green: ['var(--green-soft)', 'var(--green)'],
  amber: ['var(--amber-soft)', 'var(--amber)'],
  red: ['var(--red-soft)', 'var(--red)'],
  blue: ['var(--blue-soft)', 'var(--blue)'],
  purple: ['var(--purple-soft)', 'var(--purple)'],
};

/** Soft background + accent color for a tone (icon circles, timeline dots). */
export function toneStyle(tone: Tone): { background: string; color: string } {
  const [background, color] = TONE_VARS[tone];
  return { background, color };
}
