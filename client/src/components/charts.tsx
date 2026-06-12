import type { ReactNode } from 'react';

// Warm categorical ramp. Mirrors the `ser-1..5` CSS classes (styles.css) so the
// legend/tooltip swatches recharts derives from these props always match the
// on-screen series — and theme-switch with the tokens.
export const CHART_COLORS = [
  'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)',
];

export function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <div className="card-title-sub">{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="card-pad">{children}</div>
    </div>
  );
}
