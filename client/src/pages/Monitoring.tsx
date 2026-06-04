import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { api } from '../api/client';
import { useFetch } from '../lib/useFetch';
import type { DashboardPerformance } from '../api/types';
import { PageHeader, Spinner, Empty, StatCard, Avatar, Rating } from '../components/ui';
import { Icon } from '../components/Icon';
import { ChartCard, CHART_COLORS } from '../components/charts';
import { titleCase } from '../lib/format';

const BAND_COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

export default function Monitoring() {
  const { data, loading, error } = useFetch(
    () => api.get('/dashboard/performance').then((r) => r.data.data as DashboardPerformance),
    [],
  );

  if (loading) return <Spinner />;
  if (error) return <Empty icon="alert-triangle" title="Could not load performance data" hint={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Performance Monitoring" subtitle="Organization-wide KPI & OKR tracking" />

      <div className="grid cols-4">
        {data.metricAverages.slice(0, 3).map((m) => (
          <StatCard
            key={m.metricType}
            label={titleCase(m.metricType)}
            value={`${m.avg}%`}
            sub={`${m.samples} samples`}
            icon={<Icon name="bar-chart" size={20} />}
            tone="blue"
          />
        ))}
        <StatCard
          label="Goal completion"
          value={`${data.goals.completionRate}%`}
          sub={`${data.goals.completed}/${data.goals.total} goals done`}
          icon={<Icon name="target" size={20} />}
          tone="green"
        />
      </div>

      <div className="grid cols-2 mt-2">
        <ChartCard title="KPI trend" subtitle="Average score by metric over 12 months">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.metricTrend} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.metricTypes.map((t, i) => (
                  <Line
                    key={t}
                    type="monotone"
                    dataKey={t}
                    name={titleCase(t)}
                    className={`ser-${(i % 4) + 1}`}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Rating distribution" subtitle="Performance reviews (last 2 years)">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ratingDistribution} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 10 }} stroke="#98a0b3" interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#98a0b3" />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={42}>
                  {data.ratingDistribution.map((_, i) => (
                    <Cell key={i} className={`slice-${i % 6}`} fill={BAND_COLORS[i % BAND_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid cols-2 mt-2">
        <div className="card">
          <div className="card-header">
            <h3>Top performers</h3>
            <span className="card-title-sub">By average review rating</span>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.topPerformers.length === 0 && <Empty title="No reviews yet" />}
            {data.topPerformers.map((p, i) => (
              <div key={p.id} className="row" style={{ gap: 12 }}>
                <div className="faint" style={{ width: 18, fontWeight: 700 }}>
                  {i + 1}
                </div>
                <Avatar first={p.name.split(' ')[0]} last={p.name.split(' ').slice(1).join(' ')} size="sm" />
                <div className="flex-1" style={{ overflow: 'hidden' }}>
                  <Link to={`/employees/${p.id}`} style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {p.name}
                  </Link>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {p.jobTitle}
                  </div>
                </div>
                <Rating value={p.avgRating} />
              </div>
            ))}
          </div>
        </div>

        <ChartCard title="Metric averages" subtitle="Current org-wide KPI snapshot">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 6 }}>
            {data.metricAverages.map((m) => (
              <div key={m.metricType}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{titleCase(m.metricType)}</span>
                  <span className="tabular muted" style={{ fontSize: 13 }}>
                    {m.avg}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${m.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
