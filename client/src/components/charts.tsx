import type { ReactNode } from 'react';

// Greyscale ramp (monochrome editorial). On-screen series are recolored via the
// `ser-*` / `slice-*` CSS classes in styles.css so they stay theme-aware; these
// literals are the fallback / tooltip-swatch values.
export const CHART_COLORS = [
  '#3f3f46', '#71717a', '#a1a1aa', '#52525b', '#d4d4d8', '#18181b', '#9a9aa2', '#27272a',
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
