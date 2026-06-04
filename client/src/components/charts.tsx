import type { ReactNode } from 'react';

export const CHART_COLORS = [
  '#4f46e5', '#0891b2', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#2563eb', '#dc2626',
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
