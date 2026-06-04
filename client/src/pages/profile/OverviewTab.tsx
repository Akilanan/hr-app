import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { EmployeeSummary, FinancialMetric, Review, SalaryChange } from '../../api/types';
import { StatCard, Spinner, Empty } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ChartCard } from '../../components/charts';
import { fmtMoney, fmtDate, fmtAxis } from '../../lib/format';

export default function OverviewTab({ employee }: TabProps) {
  const summary = useFetch(
    () => api.get(`/employees/${employee.id}/summary`).then((r) => r.data.data as EmployeeSummary),
    [employee.id],
  );
  const financial = useFetch(
    () => api.get(`/employees/${employee.id}/financial-growth`).then((r) => r.data.data as FinancialMetric[]),
    [employee.id],
  );
  const reviews = useFetch(
    () => api.get(`/employees/${employee.id}/reviews`).then((r) => r.data.data as Review[]),
    [employee.id],
  );
  const salary = useFetch(
    () => api.get(`/employees/${employee.id}/salary-changes`).then((r) => r.data.data as SalaryChange[]),
    [employee.id],
  );

  if (summary.loading) return <Spinner />;
  const s = summary.data;

  const compData = (financial.data ?? []).map((f) => ({
    year: String(new Date(f.periodDate).getFullYear()),
    Base: f.baseSalary,
    Bonus: f.bonus,
    Equity: f.equity,
  }));
  const ratingData = [...(reviews.data ?? [])]
    .sort((a, b) => +new Date(a.reviewDate) - +new Date(b.reviewDate))
    .map((r) => ({ date: fmtDate(r.reviewDate, 'MMM yy'), rating: r.overallRating }));
  const salaryData = [...(salary.data ?? [])]
    .sort((a, b) => +new Date(a.effectiveDate) - +new Date(b.effectiveDate))
    .map((c) => ({ date: fmtDate(c.effectiveDate, 'MMM yy'), salary: c.newSalary }));

  return (
    <div>
      <div className="grid cols-4">
        <StatCard label="Tenure" value={`${s?.tenureYears ?? 0} yrs`} sub={`${s?.tenureDays ?? 0} days`} icon={<Icon name="calendar" size={20} />} tone="blue" />
        <StatCard label="Current salary" value={fmtMoney(s?.currentSalary, employee.currency)} sub={`${s?.counts.salaryChanges ?? 0} changes`} icon={<Icon name="dollar" size={20} />} tone="green" />
        <StatCard
          label="Latest rating"
          value={s?.latestRating != null ? `${s.latestRating} / 5` : '—'}
          sub={s?.latestReviewDate ? fmtDate(s.latestReviewDate) : 'No reviews'}
          icon={<Icon name="star" size={20} />}
          tone="amber"
        />
        <StatCard
          label="Goal completion"
          value={`${s?.goalCompletionRate ?? 0}%`}
          sub={`${s?.counts.goalsCompleted ?? 0}/${s?.counts.goals ?? 0} done`}
          icon={<Icon name="target" size={20} />}
          tone="purple"
        />
      </div>

      {employee.bio && (
        <div className="card card-pad mt-2">
          <div className="section-title">About</div>
          <p style={{ margin: 0 }}>{employee.bio}</p>
        </div>
      )}

      <div className="grid cols-2 mt-2">
        <ChartCard title="Total compensation" subtitle="Base, bonus & equity by year">
          <div style={{ height: 250 }}>
            {compData.length === 0 ? (
              <Empty title="No compensation data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compData} margin={{ left: -8, right: 8, top: 8 }}>
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
            )}
          </div>
        </ChartCard>

        <ChartCard title="Salary progression" subtitle="Base salary over time">
          <div style={{ height: 250 }}>
            {salaryData.length === 0 ? (
              <Empty title="No salary history" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salaryData} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} stroke="#98a0b3" domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => fmtMoney(v, employee.currency)} />
                  <Line type="monotone" dataKey="salary" className="ser-ink" stroke="#52525b" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="card mt-2">
        <div className="card-header">
          <h3>Performance rating trend</h3>
          <span className="card-title-sub">Overall review scores</span>
        </div>
        <div className="card-pad">
          <div style={{ height: 240 }}>
            {ratingData.length === 0 ? (
              <Empty title="No performance reviews yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                  <Tooltip />
                  <Line type="monotone" dataKey="rating" className="ser-ink" stroke="#52525b" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
