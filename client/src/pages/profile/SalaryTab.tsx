import { useState, type FormEvent } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { SalaryChange } from '../../api/types';
import { Spinner, Empty, Modal, Field, Badge, toneFor } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { fmtDate, fmtMoney, fmtPercent, titleCase, fmtAxis } from '../../lib/format';

const CHANGE_TYPES = ['RAISE', 'PROMOTION', 'MARKET', 'ADJUSTMENT', 'BONUS', 'DEMOTION'];

export default function SalaryTab({ employee, manage, onChanged }: TabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/salary-changes`).then((r) => r.data.data as SalaryChange[]),
    [employee.id],
  );

  const remove = async (c: SalaryChange) => {
    if (!confirm('Delete this salary change?')) return;
    try {
      await api.delete(`/salary-changes/${c.id}`);
      reload();
    } catch (e) {
      alert(apiError(e));
    }
  };

  const chart = [...(data ?? [])]
    .sort((a, b) => +new Date(a.effectiveDate) - +new Date(b.effectiveDate))
    .map((c) => ({ date: fmtDate(c.effectiveDate, 'MMM yy'), salary: c.newSalary }));

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Salary changes</h3>
            <span className="card-title-sub">Compensation change log</span>
          </div>
          {manage && (
            <button className="btn primary sm" onClick={() => setShowAdd(true)}>
              <Icon name="plus" size={15} /> Add change
            </button>
          )}
        </div>
        <div className="card-pad">
          {loading ? (
            <Spinner />
          ) : error ? (
            <Empty icon="alert-triangle" title="Could not load salary history" hint={error} />
          ) : !data || data.length === 0 ? (
            <Empty icon="dollar" title="No salary changes recorded" />
          ) : (
            <>
              {chart.length > 1 && (
                <div style={{ height: 220, marginBottom: 12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart} margin={{ left: -8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                      <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} stroke="#98a0b3" domain={['auto', 'auto']} />
                      <Tooltip formatter={(v: number) => fmtMoney(v, employee.currency)} />
                      <Line type="monotone" dataKey="salary" className="ser-ink" stroke="#52525b" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th className="text-right">Previous</th>
                    <th className="text-right">New</th>
                    <th className="text-right">Change</th>
                    <th>Reason</th>
                    {manage && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => (
                    <tr key={c.id}>
                      <td className="nowrap">{fmtDate(c.effectiveDate)}</td>
                      <td>
                        <Badge tone={toneFor(c.changeType)}>{titleCase(c.changeType)}</Badge>
                      </td>
                      <td className="text-right tabular">{fmtMoney(c.previousSalary, c.currency)}</td>
                      <td className="text-right tabular">{fmtMoney(c.newSalary, c.currency)}</td>
                      <td className="text-right tabular" style={{ color: c.percentChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {fmtPercent(c.percentChange)}
                      </td>
                      <td className="muted">{c.reason ?? '—'}</td>
                      {manage && (
                        <td>
                          <button className="btn danger icon-btn" onClick={() => remove(c)} title="Delete">
                            <Icon name="trash" size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {showAdd && (
        <AddSalaryModal
          employee={employee}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function AddSalaryModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: TabProps['employee'];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    newSalary: String(employee.currentSalary || ''),
    changeType: 'RAISE',
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employee.id}/salary-changes`, {
        newSalary: Number(form.newSalary),
        changeType: form.changeType,
        effectiveDate: form.effectiveDate,
        reason: form.reason || undefined,
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
      title="Add salary change"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="salary-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="salary-form" onSubmit={submit}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Current salary: <strong>{fmtMoney(employee.currentSalary, employee.currency)}</strong>
        </div>
        <div className="form-row">
          <Field label="New salary">
            <input className="input" type="number" min="0" required value={form.newSalary} onChange={(e) => setForm((f) => ({ ...f, newSalary: e.target.value }))} />
          </Field>
          <Field label="Type">
            <select className="select" value={form.changeType} onChange={(e) => setForm((f) => ({ ...f, changeType: e.target.value }))}>
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Effective date">
          <input className="input" type="date" required value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
        </Field>
        <Field label="Reason">
          <textarea className="textarea" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </Field>
        <div className="faint" style={{ fontSize: 12 }}>
          Bonuses are recorded without changing base salary.
        </div>
      </form>
    </Modal>
  );
}
