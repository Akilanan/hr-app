import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, apiError } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { useAuth, canManage, canManageGoals } from '../auth/AuthContext';
import type { Department, Employee, EmployeeBasic, Paginated } from '../api/types';
import { Spinner, Empty, Avatar, StatusBadge, Modal, Field } from '../components/ui';
import { Icon } from '../components/Icon';
import { useConfirm } from '../components/useConfirm';
import { AccountAdminModal } from '../components/AccountAdminModal';
import { fmtDate, fmtMoney, titleCase } from '../lib/format';

// Lazy-loaded so the heavy chart tabs (recharts) only download when opened —
// keeps the employee's default profile landing light.
const OverviewTab = lazy(() => import('./profile/OverviewTab'));
const HistoryTab = lazy(() => import('./profile/HistoryTab'));
const PromotionsTab = lazy(() => import('./profile/PromotionsTab'));
const SalaryTab = lazy(() => import('./profile/SalaryTab'));
const ReviewsTab = lazy(() => import('./profile/ReviewsTab'));
const FinancialTab = lazy(() => import('./profile/FinancialTab'));
const CareerTab = lazy(() => import('./profile/CareerTab'));
const GoalsTab = lazy(() => import('./profile/GoalsTab'));
const MetricsTab = lazy(() => import('./profile/MetricsTab'));

export interface TabProps {
  employee: Employee;
  manage: boolean;
  manageGoals: boolean;
  isSelf: boolean;
  onChanged: () => void;
}

const TABS: { key: string; label: string; render: (p: TabProps) => JSX.Element }[] = [
  { key: 'overview', label: 'Overview', render: (p) => <OverviewTab {...p} /> },
  { key: 'history', label: 'History Card', render: (p) => <HistoryTab {...p} /> },
  { key: 'promotions', label: 'Promotions', render: (p) => <PromotionsTab {...p} /> },
  { key: 'salary', label: 'Salary', render: (p) => <SalaryTab {...p} /> },
  { key: 'performance', label: 'Performance', render: (p) => <ReviewsTab {...p} /> },
  { key: 'financial', label: 'Financial Growth', render: (p) => <FinancialTab {...p} /> },
  { key: 'career', label: 'Career Growth', render: (p) => <CareerTab {...p} /> },
  { key: 'learning', label: 'Learning Goals', render: (p) => <GoalsTab {...p} /> },
  { key: 'monitoring', label: 'Monitoring', render: (p) => <MetricsTab {...p} /> },
];

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const { data: employee, loading, error, reload } = useFetch(
    () => api.get(`/employees/${id}`).then((r) => r.data.data as Employee),
    [id],
  );

  // Reset to Overview when navigating between employees (same route instance).
  useEffect(() => {
    setTab('overview');
  }, [id]);

  if (loading && !employee) return <Spinner />;
  if (error)
    return (
      <Empty
        icon="lock"
        title="Unable to view this profile"
        hint={error.includes('permission') ? "You don't have access to this employee." : error}
      />
    );
  if (!employee) return null;

  const manage = canManage(user, employee);
  const manageGoals = canManageGoals(user, employee);
  const isSelf = user?.employeeId === employee.id;
  const tabProps: TabProps = { employee, manage, manageGoals, isSelf, onChanged: reload };

  return (
    <div>
      <Link
        to="/employees"
        className="muted"
        style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        <Icon name="arrow-left" size={15} /> Back to directory
      </Link>

      <div className="card card-pad mt-1 mb-2">
        <div className="row between wrap" style={{ gap: 16 }}>
          <div className="profile-header">
            <Avatar first={employee.firstName} last={employee.lastName} url={employee.avatarUrl} size="lg" />
            <div>
              <div className="row" style={{ gap: 10 }}>
                <h1 style={{ fontSize: 23 }}>
                  {employee.firstName} {employee.lastName}
                </h1>
                <StatusBadge value={employee.status} />
              </div>
              <div className="muted" style={{ marginTop: 2 }}>
                {employee.jobTitle}
                {employee.level && ` · ${employee.level}`}
                {employee.department && ` · ${employee.department.name}`}
              </div>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>
                {employee.employeeCode} · {employee.email}
                {employee.location && ` · ${employee.location}`}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {manage && (
              <button type="button" className="btn" onClick={() => setShowEdit(true)}>
                <Icon name="edit" size={15} /> Edit profile
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button type="button" className="btn" onClick={() => setShowAccount(true)}>
                <Icon name="user-plus" size={15} /> {employee.user ? 'Login account' : 'Create login'}
              </button>
            )}
          </div>
        </div>

        <div className="grid cols-4 mt-3" style={{ gap: 14 }}>
          <Fact k="Manager" v={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—'} />
          <Fact k="Employment" v={titleCase(employee.employmentType)} />
          <Fact k="Joined" v={fmtDate(employee.hireDate)} />
          <Fact k="Current salary" v={fmtMoney(employee.currentSalary, employee.currency)} />
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Employee details">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`tabpanel-${t.key}`}
              tabIndex={active ? 0 : -1}
              className={`tab${active ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => {
                const keys = TABS.map((x) => x.key);
                const i = keys.indexOf(tab);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setTab(keys[(i + 1) % keys.length]);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  setTab(keys[(i - 1 + keys.length) % keys.length]);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  setTab(keys[0]);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  setTab(keys[keys.length - 1]);
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <Suspense fallback={<Spinner />}>{TABS.find((t) => t.key === tab)?.render(tabProps)}</Suspense>
      </div>

      {showEdit && (
        <EditProfileModal
          employee={employee}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            reload();
          }}
        />
      )}

      {showAccount && (
        <AccountAdminModal employee={employee} onClose={() => setShowAccount(false)} onChanged={reload} />
      )}
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function EditProfileModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const depts = useFetch(() => api.get('/departments').then((r) => r.data.data as Department[]), []);
  const managers = useFetch(
    () => api.get('/employees', { params: { pageSize: 100 } }).then((r) => (r.data as Paginated<EmployeeBasic>).data),
    [],
  );
  const [form, setForm] = useState({
    jobTitle: employee.jobTitle,
    level: employee.level ?? '',
    status: employee.status,
    location: employee.location ?? '',
    phone: employee.phone ?? '',
    departmentId: employee.departmentId ?? employee.department?.id ?? '',
    managerId: employee.managerId ?? '',
    bio: employee.bio ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Guard a high-impact, audited change behind an explicit confirmation.
    if (
      form.status === 'TERMINATED' &&
      employee.status !== 'TERMINATED' &&
      !(await confirm({
        title: 'Terminate employee',
        message: `Mark ${employee.firstName} ${employee.lastName} as TERMINATED? This is logged and affects payroll reporting.`,
        confirmLabel: 'Terminate',
        danger: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/employees/${employee.id}`, {
        jobTitle: form.jobTitle,
        level: form.level || null,
        status: form.status,
        location: form.location || null,
        phone: form.phone || null,
        departmentId: form.departmentId || null,
        managerId: form.managerId || null,
        bio: form.bio || null,
      });
      onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Edit profile"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" form="edit-emp" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="edit-emp" onSubmit={submit}>
        <div className="form-row">
          <Field label="Job title">
            <input className="input" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </Field>
          <Field label="Level">
            <input className="input" value={form.level} onChange={(e) => set('level', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </Field>
          <Field label="Location">
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Department">
            <select className="select" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— None —</option>
              {depts.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Manager">
            <select className="select" value={form.managerId} onChange={(e) => set('managerId', e.target.value)}>
              <option value="">— None —</option>
              {managers.data
                ?.filter((m) => m.id !== employee.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <Field label="Phone">
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Bio">
          <textarea className="textarea" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
