import type { ReactNode } from 'react';
import { avatarColor, initials, titleCase } from '../lib/format';
import { Icon } from './Icon';

/* --------------------------------- Avatar ---------------------------------- */
export function Avatar({
  first,
  last,
  url,
  size,
}: {
  first?: string;
  last?: string;
  url?: string | null;
  size?: 'sm' | 'lg';
}) {
  const cls = `avatar${size ? ' ' + size : ''}`;
  if (url) return <img className={cls} src={url} alt="" />;
  const seed = `${first ?? ''}${last ?? ''}` || '?';
  return (
    <div className={cls} style={{ background: avatarColor(seed) }}>
      {initials(first, last) || '?'}
    </div>
  );
}

/* --------------------------------- Badge ----------------------------------- */
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

export function Badge({ children, tone, dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return <span className={`badge ${tone ?? 'gray'}${dot ? ' dot' : ''}`}>{children}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge tone={toneFor(value)} dot>
      {titleCase(value)}
    </Badge>
  );
}

/* --------------------------------- StatCard -------------------------------- */
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const bg: Record<Tone, string> = {
    gray: 'var(--gray-soft)',
    green: 'var(--green-soft)',
    amber: 'var(--amber-soft)',
    red: 'var(--red-soft)',
    blue: 'var(--blue-soft)',
    purple: 'var(--purple-soft)',
  };
  const fg: Record<Tone, string> = {
    gray: 'var(--text-muted)',
    green: 'var(--green)',
    amber: 'var(--amber)',
    red: 'var(--red)',
    blue: 'var(--blue)',
    purple: 'var(--purple)',
  };
  return (
    <div className="card card-pad">
      <div className="row between">
        <div className="stat">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
        {icon && (
          <div className="stat-icon" style={{ background: bg[tone], color: fg[tone] }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Spinner --------------------------------- */
export function Spinner() {
  return <div className="spinner" />;
}

/* ---------------------------------- Empty ---------------------------------- */
export function Empty({ icon, title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      {icon && (
        <div className="empty-icon">
          <Icon name={icon} size={24} />
        </div>
      )}
      <div className="empty-title">{title}</div>
      {hint && <div style={{ fontSize: 13, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

/* -------------------------------- PageHeader ------------------------------- */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="row between mb-2" style={{ alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ fontSize: 22 }}>{title}</h1>
        {subtitle && <div className="muted" style={{ marginTop: 3 }}>{subtitle}</div>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------- Field ---------------------------------- */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

/* ------------------------------- ProgressBar ------------------------------- */
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

/* ---------------------------------- Stars ---------------------------------- */
export function Rating({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="faint">—</span>;
  const full = Math.round(value);
  return (
    <span className="stars" title={`${value}/5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon
          key={i}
          name="star"
          size={15}
          fill={i < full ? '#f5a524' : 'transparent'}
          style={{ color: i < full ? '#f5a524' : '#d6dae3' }}
        />
      ))}
      <span className="num">{value.toFixed(1)}</span>
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className ?? ''}`}>{children}</div>;
}
