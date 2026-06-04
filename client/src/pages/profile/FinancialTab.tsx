import { useState, type FormEvent } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { FinancialMetric } from '../../api/types';
import { Spinner, Empty, Modal, Field } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { fmtDate, fmtMoney, fmtAxis } from '../../lib/format';

export default function FinancialTab({ employee, manage }: TabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/financial-growth`).then((r) => r.data.data as FinancialMetric[]),
    [employee.id],
  );

  const remove = async (m: FinancialMetric) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(`/financial-growth/${m.id}`);
      reload();
    } catch (e) {
      alert(apiError(e));
    }
  };

  const chart = (data ?? []).map((m) => ({
    year: String(new Date(m.periodDate).getFullYear()),
    Base: m.baseSalary,
    Bonus: m.bonus,
    Equity: m.equity,
  }));

  const first = data?.[0];
  const last = data?.[data.length - 1];
  const growth =
    first && last && first.totalCompensation > 0
      ? Math.round(((last.totalCompensation - first.totalCompensation) / first.totalCompensation) * 100)
      : null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Financial growth</h3>
          <span className="card-title-sub">
            Total compensation over time
            {growth != null && first && ` · +${growth}% since ${new Date(first.periodDate).getFullYear()}`}
          </span>
        </div>
        {manage && (
          <button className="btn primary sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={15} /> Add entry
          </button>
        )}
      </div>

      <div className="card-pad">
        {loading ? (
          <Spinner />
        ) : error ? (
          <Empty icon="alert-triangle" title="Could not load financial data" hint={error} />
        ) : !data || data.length === 0 ? (
          <Empty icon="bar-chart" title="No financial growth data" />
        ) : (
          <>
            <div style={{ height: 260, marginBottom: 14 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: -4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <Tooltip formatter={(v: number) => fmtMoney(v, employee.currency)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Base" stackId="c" className="ser-1" fill="#3f3f46" />
                  <Bar dataKey="Bonus" stackId="c" className="ser-2" fill="#71717a" />
                  <Bar dataKey="Equity" stackId="c" className="ser-3" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="text-right">Base</th>
                  <th className="text-right">Bonus</th>
                  <th className="text-right">Equity</th>
                  <th className="text-right">Total comp</th>
                  {manage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {[...data].reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{fmtDate(m.periodDate, 'yyyy')}</td>
                    <td className="text-right tabular">{fmtMoney(m.baseSalary, m.currency)}</td>
                    <td className="text-right tabular">{fmtMoney(m.bonus, m.currency)}</td>
                    <td className="text-right tabular">{fmtMoney(m.equity, m.currency)}</td>
                    <td className="text-right tabular" style={{ fontWeight: 600 }}>
                      {fmtMoney(m.totalCompensation, m.currency)}
                    </td>
                    {manage && (
                      <td>
                        <button type="button" className="btn danger icon-btn" onClick={() => remove(m)} aria-label="Delete entry" title="Delete">
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

      {showAdd && (
        <AddFinancialModal
          employeeId={employee.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AddFinancialModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    periodDate: `${new Date().getFullYear()}-01-01`,
    baseSalary: '',
    bonus: '0',
    equity: '0',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employeeId}/financial-growth`, {
        periodDate: form.periodDate,
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus || 0),
        equity: Number(form.equity || 0),
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
      title="Add financial entry"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="fin-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="fin-form" onSubmit={submit}>
        <Field label="Period date">
          <input className="input" type="date" required value={form.periodDate} onChange={(e) => setForm((f) => ({ ...f, periodDate: e.target.value }))} />
        </Field>
        <Field label="Base salary">
          <input className="input" type="number" min="0" required value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} />
        </Field>
        <div className="form-row">
          <Field label="Bonus">
            <input className="input" type="number" min="0" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
          </Field>
          <Field label="Equity">
            <input className="input" type="number" min="0" value={form.equity} onChange={(e) => setForm((f) => ({ ...f, equity: e.target.value }))} />
          </Field>
        </div>
        <div className="faint" style={{ fontSize: 12 }}>
          Entries with the same period date are updated in place.
        </div>
      </form>
    </Modal>
  );
}
