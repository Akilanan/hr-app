import { useEffect, useId, useRef, type ReactNode } from 'react';
import { avatarColor, initials, titleCase } from '../lib/format';
import { type Tone, toneFor } from '../lib/tone';
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
  const name = `${first ?? ''} ${last ?? ''}`.trim();
  if (url) return <img className={cls} src={url} alt={name} loading="lazy" decoding="async" />;
  const seed = `${first ?? ''}${last ?? ''}` || '?';
  return (
    <div
      className={cls}
      role="img"
      aria-label={name || 'Avatar'}
      title={name || undefined}
      style={{ background: avatarColor(seed) }}
    >
      {initials(first, last) || '?'}
    </div>
  );
}

/* --------------------------------- Badge ----------------------------------- */
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
  role = 'dialog',
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  role?: 'dialog' | 'alertdialog';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      ref.current
        ? Array.from(
            ref.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];

    (focusables()[0] ?? ref.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) {
          e.preventDefault();
          return;
        }
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
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
  // Wrapping the control in the <label> implicitly associates them (a11y) without
  // needing to thread an id into every caller.
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
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
          fill={i < full ? 'currentColor' : 'none'}
          style={{ color: i < full ? 'var(--text)' : 'var(--text-faint)' }}
        />
      ))}
      <span className="num">{value.toFixed(1)}</span>
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className ?? ''}`}>{children}</div>;
}
