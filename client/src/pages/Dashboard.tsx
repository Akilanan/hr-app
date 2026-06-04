import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { useFetch } from '../lib/useFetch';
import type { DashboardOverview } from '../api/types';
import { PageHeader, Spinner, Empty, StatCard, Avatar, toneStyle } from '../components/ui';
import { Icon } from '../components/Icon';
import { ChartCard, CHART_COLORS } from '../components/charts';
import { fmtMoney, fmtMoneyShort, fmtNumber, fmtRelative, titleCase } from '../lib/format';
import { eventIcon, eventTone } from '../lib/events';

export default function Dashboard() {
  const { data, loading, error } = useFetch(
    () => api.get('/dashboard/overview').then((r) => r.data.data as DashboardOverview),
    [],
  );

  if (loading) return <Spinner />;
  if (error) return <Empty icon="alert-triangle" title="Could not load dashboard" hint={error} />;
  if (!data) return null;

  const employmentData = data.byEmploymentType.map((t) => ({ name: titleCase(t.type), value: t.count }));
  const learningData = [
    { name: 'Completed', value: data.learning.completed, color: 'var(--green)' },
    { name: 'In progress', value: data.learning.inProgress, color: 'var(--blue)' },
    { name: 'Not started', value: data.learning.notStarted, color: '#cbd2e0' },
    { name: 'On hold', value: data.learning.onHold, color: 'var(--amber)' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Company-wide people overview" />

      <div className="grid cols-4">
        <StatCard
          label="Active headcount"
          value={fmtNumber(data.headcount.active)}
          sub={`${data.headcount.total} total · ${data.headcount.onLeave} on leave`}
          icon={<Icon name="users" size={20} />}
          tone="blue"
        />
        <StatCard
          label="Avg. salary"
          value={fmtMoney(data.compensation.avgSalary)}
          sub={`${fmtMoneyShort(data.compensation.totalSpend)} total payroll`}
          icon={<Icon name="dollar" size={20} />}
          tone="green"
        />
        <StatCard
          label="Promotions YTD"
          value={fmtNumber(data.promotionsThisYear)}
          sub={`${data.salaryChangesThisYear} comp changes`}
          icon={<Icon name="arrow-up-circle" size={20} />}
          tone="purple"
        />
        <StatCard
          label="Avg. review rating"
          value={data.reviews.avgRating != null ? `${data.reviews.avgRating} / 5` : '—'}
          sub={`${data.reviews.pendingAcknowledgement} awaiting sign-off`}
          icon={<Icon name="star" size={20} />}
          tone="amber"
        />
      </div>

      <div className="grid cols-2 mt-2">
        <ChartCard title="Hiring trend" subtitle="New hires over the last 12 months">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hireTrend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <Tooltip />
                <Area type="monotone" dataKey="hires" stroke="#4f46e5" strokeWidth={2} fill="url(#hireGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Headcount by department" subtitle="Active employees">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDepartment}
                layout="vertical"
                margin={{ left: 30, right: 12, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <YAxis type="category" dataKey="department" width={92} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <Tooltip />
                <Bar dataKey="headcount" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid cols-3 mt-2">
        <ChartCard title="Employment type">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={employmentData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {employmentData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Learning goals" subtitle={`${data.learning.completionRate}% completion rate`}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={learningData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {learningData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="card">
          <div className="card-header">
            <h3>Recent hires</h3>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recentHires.length === 0 && <Empty title="No recent hires" />}
            {data.recentHires.map((h) => (
              <Link key={h.id} to={`/employees/${h.id}`} className="row" style={{ gap: 11 }}>
                <Avatar first={h.firstName} last={h.lastName} url={h.avatarUrl} size="sm" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {h.firstName} {h.lastName}
                  </div>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {h.jobTitle} · {fmtRelative(h.hireDate)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="card-header">
          <h3>Recent activity</h3>
        </div>
        <div className="card-pad">
          {data.recentActivity.length === 0 ? (
            <Empty title="No activity yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.recentActivity.map((a) => (
                <div key={a.id} className="row" style={{ gap: 12 }}>
                  <div className="icon-circle" style={toneStyle(eventTone(a.eventType))}>
                    <Icon name={eventIcon(a.eventType)} size={16} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13.5 }}>
                      <Link to={`/employees/${a.employeeId}`} style={{ fontWeight: 600 }}>
                        {a.employeeName}
                      </Link>{' '}
                      <span className="muted">— {a.title}</span>
                    </div>
                  </div>
                  <div className="faint nowrap" style={{ fontSize: 12 }}>
                    {fmtRelative(a.occurredAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
