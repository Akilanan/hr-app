import { useState, type FormEvent } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { PerformanceMetric } from '../../api/types';
import { Spinner, Empty, Modal, Field, ProgressBar } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ChartCard, CHART_COLORS } from '../../components/charts';
import { fmtDate, titleCase } from '../../lib/format';

const METRIC_TYPES = ['PRODUCTIVITY', 'QUALITY', 'GOAL_COMPLETION', 'ATTENDANCE', 'OKR', 'ENGAGEMENT'];

export default function MetricsTab({ employee, manage }: TabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/performance-metrics`).then((r) => r.data.data as PerformanceMetric[]),
    [employee.id],
  );

  if (loading) return <Spinner />;
  if (error) return <Empty icon="alert-triangle" title="Could not load metrics" hint={error} />;

  const rows = data ?? [];
  const types = Array.from(new Set(rows.map((m) => m.metricType)));

  // pivot by period
  const byPeriod = new Map<string, Record<string, number | string>>();
  for (const m of rows) {
    const key = m.periodDate;
    if (!byPeriod.has(key)) byPeriod.set(key, { period: fmtDate(m.periodDate, 'MMM yy'), _t: +new Date(m.periodDate) });
    byPeriod.get(key)![m.metricType] = m.value;
  }
  const chartData = Array.from(byPeriod.values()).sort((a, b) => (a._t as number) - (b._t as number));

  // latest snapshot per type
  const latest = types.map((t) => {
    const ms = rows.filter((m) => m.metricType === t).sort((a, b) => +new Date(b.periodDate) - +new Date(a.periodDate));
    return { type: t, metric: ms[0] };
  });

  return (
    <div>
      <div className="row between mb-2">
        <div>
          <h3 style={{ fontSize: 16 }}>Performance monitoring</h3>
          <span className="muted" style={{ fontSize: 13 }}>
            KPI & OKR tracking over time
          </span>
        </div>
        {manage && (
          <button className="btn primary sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={15} /> Add data point
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <Empty icon="bar-chart" title="No metrics recorded yet" />
        </div>
      ) : (
        <>
          <div className="grid cols-3 mb-2">
            {latest.map((l) =>
              l.metric ? (
                <div className="card card-pad" key={l.type}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{titleCase(l.type)}</span>
                    <span className="tabular" style={{ fontWeight: 700 }}>
                      {l.metric.value}
                      {l.metric.unit ?? ''}
                    </span>
                  </div>
                  <ProgressBar
                    value={l.metric.target ? Math.min(100, (l.metric.value / l.metric.target) * 100) : l.metric.value}
                  />
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>
                    {l.metric.target != null ? `Target ${l.metric.target}${l.metric.unit ?? ''} · ` : ''}
                    {fmtDate(l.metric.periodDate, 'MMM yyyy')}
                  </div>
                </div>
              ) : null,
            )}
          </div>

          <ChartCard title="KPI trend" subtitle="Monthly performance metrics">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {types.map((t, i) => (
                    <Line
                      key={t}
                      type="monotone"
                      dataKey={t}
                      name={titleCase(t)}
                      className={`ser-${(i % 4) + 1}`}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      )}

      {showAdd && (
        <AddMetricModal
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

function AddMetricModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    periodDate: `${new Date().toISOString().slice(0, 7)}-01`,
    metricType: 'PRODUCTIVITY',
    value: '',
    target: '',
    unit: '%',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employeeId}/performance-metrics`, {
        periodDate: form.periodDate,
        metricType: form.metricType,
        value: Number(form.value),
        target: form.target ? Number(form.target) : undefined,
        unit: form.unit || undefined,
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
      title="Add performance data point"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="metric-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="metric-form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Metric">
            <select className="select" value={form.metricType} onChange={(e) => set('metricType', e.target.value)}>
              {METRIC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <input className="input" type="date" required value={form.periodDate} onChange={(e) => set('periodDate', e.target.value)} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Value">
            <input className="input" type="number" step="0.1" required value={form.value} onChange={(e) => set('value', e.target.value)} />
          </Field>
          <Field label="Target">
            <input className="input" type="number" step="0.1" value={form.target} onChange={(e) => set('target', e.target.value)} />
          </Field>
        </div>
        <Field label="Unit">
          <input className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="%" />
        </Field>
      </form>
    </Modal>
  );
}
