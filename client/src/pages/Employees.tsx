import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError, downloadFile } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../auth/AuthContext';
import type { Department, EmployeeBasic, Paginated } from '../api/types';
import { PageHeader, Spinner, Empty, Avatar, StatusBadge, Modal, Field } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmtDate } from '../lib/format';

const PAGE_SIZE = 12;

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'HR';

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadFile('/employees/export', 'employees.csv');
    } catch (e) {
      alert(apiError(e));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [debounced, departmentId, status]);

  const deptsQuery = useFetch(() => api.get('/departments').then((r) => r.data.data as Department[]), []);
  const { data, loading, error, reload } = useFetch(
    () =>
      api
        .get('/employees', { params: { search: debounced, departmentId, status, page, pageSize: PAGE_SIZE } })
        .then((r) => r.data as Paginated<EmployeeBasic>),
    [debounced, departmentId, status, page],
  );

  return (
    <div>
      <PageHeader
        title="Directory"
        subtitle={data ? `${data.pagination.total} people` : 'People directory'}
        actions={
          canCreate ? (
            <>
              <button className="btn" onClick={onExport} disabled={exporting}>
                <Icon name="file-text" size={15} /> {exporting ? 'Exporting…' : 'Export'}
              </button>
              <button className="btn" onClick={() => setShowImport(true)}>
                <Icon name="file-text" size={15} /> Import
              </button>
              <button className="btn primary" onClick={() => setShowCreate(true)}>
                <Icon name="plus" size={15} /> Add employee
              </button>
            </>
          ) : undefined
        }
      />

      <div className="card card-pad mb-2">
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="input-with-icon" style={{ maxWidth: 300, flex: 1 }}>
            <span className="lead-icon">
              <Icon name="search" size={16} />
            </span>
            <input
              className="input"
              aria-label="Search employees"
              placeholder="Search name, email, title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select" aria-label="Filter by department" style={{ maxWidth: 200 }} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All departments</option>
            {deptsQuery.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select className="select" aria-label="Filter by status" style={{ maxWidth: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <Empty icon="alert-triangle" title="Could not load directory" hint={error} />
        ) : !data || data.data.length === 0 ? (
          <Empty icon="search" title="No employees found" hint="Try adjusting your filters." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Title</th>
                <th>Department</th>
                <th>Status</th>
                <th>Location</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr
                  key={e.id}
                  className="clickable"
                  tabIndex={0}
                  role="link"
                  aria-label={`View ${e.firstName} ${e.lastName}`}
                  onClick={() => navigate(`/employees/${e.id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      navigate(`/employees/${e.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="row" style={{ gap: 11 }}>
                      <Avatar first={e.firstName} last={e.lastName} url={e.avatarUrl} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {e.firstName} {e.lastName}
                        </div>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {e.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {e.jobTitle}
                    {e.level && <span className="faint"> · {e.level}</span>}
                  </td>
                  <td>{e.department?.name ?? '—'}</td>
                  <td>
                    <StatusBadge value={e.status} />
                  </td>
                  <td className="muted">{e.location ?? '—'}</td>
                  <td className="muted nowrap">{fmtDate(e.hireDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="row between card-pad" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="muted" style={{ fontSize: 13 }}>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="row">
              <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <Icon name="chevron-left" size={15} /> Prev
              </button>
              <button
                className="btn sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <Icon name="chevron-right" size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateEmployeeModal
          departments={deptsQuery.data ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            reload();
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; error: string }[];
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post('/employees/import', { csv });
      setResult(r.data.data as ImportResult);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Import employees from CSV"
      onClose={onClose}
      footer={
        result ? (
          <button className="btn primary" onClick={onDone}>
            Done
          </button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy || !csv.trim()} onClick={submit}>
              {busy ? 'Importing…' : 'Import'}
            </button>
          </>
        )
      }
    >
      {error && <div className="error-banner">{error}</div>}
      {result ? (
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            <span className="badge green">{result.created} created</span>
            {result.failed > 0 && <span className="badge red">{result.failed} failed</span>}
          </div>
          {result.errors.length > 0 && (
            <div style={{ maxHeight: 220, overflow: 'auto', fontSize: 12.5 }}>
              {result.errors.map((er, i) => (
                <div key={i} className="muted" style={{ padding: '3px 0' }}>
                  Row {er.row}: {er.error}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Header row required. Columns:{' '}
            <code>employeeCode, firstName, lastName, email, jobTitle</code> (required) plus optional{' '}
            <code>level, department, status, employmentType, location, hireDate, currentSalary, currency</code>.
          </p>
          <Field label="Upload a .csv file">
            <input className="input" type="file" accept=".csv,text/csv" onChange={onFile} />
          </Field>
          <Field label="…or paste CSV">
            <textarea
              className="textarea"
              style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 12.5 }}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="employeeCode,firstName,lastName,email,jobTitle,department,currentSalary,hireDate"
            />
          </Field>
        </>
      )}
    </Modal>
  );
}

function CreateEmployeeModal({
  departments,
  onClose,
  onCreated,
}: {
  departments: Department[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const managers = useFetch(
    () => api.get('/employees', { params: { pageSize: 100, sort: 'name' } }).then((r) => (r.data as Paginated<EmployeeBasic>).data),
    [],
  );
  const [form, setForm] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    level: '',
    departmentId: '',
    managerId: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    hireDate: new Date().toISOString().slice(0, 10),
    currentSalary: '',
    location: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/employees', {
        employeeCode: form.employeeCode,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        jobTitle: form.jobTitle,
        level: form.level || undefined,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId || undefined,
        employmentType: form.employmentType,
        status: form.status,
        hireDate: form.hireDate,
        currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
        location: form.location || undefined,
      });
      onCreated();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Add employee"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="create-emp" disabled={busy}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="create-emp" onSubmit={submit}>
        <div className="form-row">
          <Field label="First name">
            <input className="input" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className="input" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Employee code">
            <input className="input" required value={form.employeeCode} onChange={(e) => set('employeeCode', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Job title">
            <input className="input" required value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </Field>
          <Field label="Level">
            <input className="input" value={form.level} onChange={(e) => set('level', e.target.value)} placeholder="e.g. IC4, M2" />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Department">
            <select className="select" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Manager">
            <select className="select" value={form.managerId} onChange={(e) => set('managerId', e.target.value)}>
              <option value="">— None —</option>
              {managers.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Employment type">
            <select className="select" value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Hire date">
            <input className="input" type="date" required value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
          </Field>
          <Field label="Annual salary (₹)">
            <input className="input" type="number" min="0" value={form.currentSalary} onChange={(e) => set('currentSalary', e.target.value)} />
          </Field>
        </div>
        <Field label="Location">
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Remote" />
        </Field>
      </form>
    </Modal>
  );
}
