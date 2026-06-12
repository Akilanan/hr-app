import type { ReactNode } from 'react';
import { Link } from 'react-router';
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
  LabelList,
} from 'recharts';
import { api } from '../api/client';
import { useFetch } from '../lib/useFetch';
import type { DashboardOverview } from '../api/types';
import { Avatar } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmtMoney, fmtMoneyShort, fmtNumber, fmtRelative, titleCase } from '../lib/format';
import { eventIcon } from '../lib/events';
import '../styles/dashboard.css';

/* Earth-tone tokens for chart swatches. var() refs (not literals) so tooltip /
   legend swatches recharts derives from these follow the theme into dark mode,
   matching the CSS-recolored on-screen series (`--g0..--g5`, `--d-ink`). */
const SLICE = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
const INK = 'var(--chart-ink)';

export default function Dashboard() {
  const { data, loading, error } = useFetch(
    () => api.get('/dashboard/overview').then((r) => r.data.data as DashboardOverview),
    [],
  );

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="dash">
        <DashHeader />
        <div className="dash-error">
          <div className="dash-empty">
            <div className="ei">
              <Icon name="alert-triangle" size={20} />
            </div>
            <div className="et">Could not load dashboard</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>{error}</div>
          </div>
        </div>
      </div>
    );
  if (!data) return null;

  const totalEmployment = data.byEmploymentType.reduce((a, t) => a + t.count, 0);
  const employmentData = data.byEmploymentType.map((t) => ({ name: titleCase(t.type), value: t.count }));
  const learningData = [
    { name: 'Completed', value: data.learning.completed },
    { name: 'In progress', value: data.learning.inProgress },
    { name: 'Not started', value: data.learning.notStarted },
    { name: 'On hold', value: data.learning.onHold },
  ].filter((d) => d.value > 0);

  return (
    <div className="dash">
      <DashHeader />

      {/* KPI band — editorial columns divided by hairlines */}
      <div className="kpi-band dash-stagger">
        <KpiCol
          label="Active headcount"
          value={fmtNumber(data.headcount.active)}
          sub={`${fmtNumber(data.headcount.total)} total · ${data.headcount.onLeave} on leave`}
        />
        <KpiCol
          label="Avg. salary"
          value={fmtMoney(data.compensation.avgSalary, data.compensation.currency)}
          sub={`${fmtMoneyShort(data.compensation.totalSpend, data.compensation.currency)} total payroll${
            data.compensation.mixedCurrencies ? ' · mixed currencies' : ''
          }`}
        />
        <KpiCol
          label="Promotions YTD"
          value={fmtNumber(data.promotionsThisYear)}
          sub={`${fmtNumber(data.salaryChangesThisYear)} comp changes`}
        />
        <KpiCol
          label="Avg. review rating"
          value={data.reviews.avgRating != null ? `${data.reviews.avgRating}` : '—'}
          suffix={data.reviews.avgRating != null ? '/ 5' : undefined}
          sub={`${data.reviews.pendingAcknowledgement} awaiting sign-off`}
        />
      </div>

      {/* Trend + department */}
      <div className="dash-row r-32">
        <Panel title="Hiring trend" sub="New hires over the last 12 months">
          <div
            className="panel-body"
            style={{ height: 250 }}
            role="img"
            aria-label={`Hiring trend: ${data.hireTrend.reduce((s, h) => s + h.hires, 0)} new hires over the last 12 months`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hireTrend} margin={{ left: -22, right: 10, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} />
                <XAxis dataKey="period" tickLine={false} tickMargin={10} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} width={34} />
                <Tooltip cursor={{ stroke: INK, strokeOpacity: 0.3 }} />
                <Area
                  type="monotone"
                  dataKey="hires"
                  name="New hires"
                  stroke={INK}
                  strokeWidth={2.25}
                  fill={INK}
                  fillOpacity={0.08}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Headcount by department" sub="Active employees">
          <div
            className="panel-body"
            style={{ height: 250 }}
            role="img"
            aria-label={`Headcount by department: ${data.byDepartment.map((d) => `${d.department} ${d.headcount}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDepartment}
                layout="vertical"
                margin={{ left: 6, right: 28, top: 6, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="department" width={96} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,0.08)' }} />
                <Bar dataKey="headcount" name="Headcount" fill={INK} radius={[0, 5, 5, 0]} barSize={14}>
                  <LabelList
                    dataKey="headcount"
                    position="right"
                    style={{ fill: 'var(--d-muted)', fontSize: 11, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Donuts + recent hires */}
      <div className="dash-row r-3">
        <Panel title="Employment type">
          <Donut data={employmentData} centerBig={fmtNumber(totalEmployment)} centerSmall="people" label="Employment type" />
        </Panel>

        <Panel title="Learning goals" sub={`${data.learning.completionRate}% completion rate`}>
          <Donut data={learningData} centerBig={`${data.learning.completionRate}%`} centerSmall="complete" label="Learning goals" />
        </Panel>

        <Panel title="Recent hires">
          <div className="lite-list">
            {data.recentHires.length === 0 ? (
              <DashEmpty icon="user-plus" title="No recent hires" />
            ) : (
              data.recentHires.map((h) => (
                <Link key={h.id} to={`/employees/${h.id}`} className="lite-row">
                  <Avatar first={h.firstName} last={h.lastName} url={h.avatarUrl} size="sm" />
                  <div className="lite-main">
                    <div className="lite-name">
                      {h.firstName} {h.lastName}
                    </div>
                    <div className="lite-sub">{h.jobTitle}</div>
                  </div>
                  <span className="lite-time">{fmtRelative(h.hireDate)}</span>
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Activity */}
      <div className="dash-row" style={{ marginTop: 18 }}>
        <Panel title="Recent activity" sub="Latest changes across the organization">
          {data.recentActivity.length === 0 ? (
            <DashEmpty icon="inbox" title="No activity yet" />
          ) : (
            <div className="act-grid">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="lite-row">
                  <div className="act-icon">
                    <Icon name={eventIcon(a.eventType)} size={15} />
                  </div>
                  <div className="lite-main">
                    <div className="lite-name">
                      <Link to={`/employees/${a.employeeId}`} style={{ color: 'var(--d-text)' }}>
                        {a.employeeName}
                      </Link>
                    </div>
                    <div className="lite-sub">{a.title}</div>
                  </div>
                  <span className="lite-time">{fmtRelative(a.occurredAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------- Sub-components ----------------------------- */

function DashHeader() {
  return (
    <div className="dash-head">
      <div>
        <h1>Dashboard</h1>
        <div className="sub">Company-wide people overview</div>
      </div>
      <span className="dash-stamp">
        <span className="dot" /> Updated just now
      </span>
    </div>
  );
}

function KpiCol({
  label,
  value,
  suffix,
  sub,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="kpi-col">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {sub && <div className="ph-sub">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Donut({
  data,
  centerBig,
  centerSmall,
  label,
}: {
  data: { name: string; value: number }[];
  centerBig: string;
  centerSmall: string;
  label: string;
}) {
  if (data.length === 0) return <DashEmpty icon="inbox" title="No data yet" />;
  return (
    <div className="donut-row">
      <div
        className="donut-wrap"
        style={{ height: 170 }}
        role="img"
        aria-label={`${label}: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} className={`slice-${i}`} fill={SLICE[i % SLICE.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <div>
            <div className="big">{centerBig}</div>
            <div className="small">{centerSmall}</div>
          </div>
        </div>
      </div>
      <div className="legend">
        {data.map((d, i) => (
          <div key={d.name} className="legend-item">
            <span className="legend-dot" style={{ background: `var(--g${i % 6})` }} />
            {d.name}
            <span className="legend-val">{fmtNumber(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashEmpty({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="dash-empty">
      <div className="ei">
        <Icon name={icon} size={19} />
      </div>
      <div className="et">{title}</div>
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */
function DashboardSkeleton() {
  return (
    <div className="dash">
      <DashHeader />
      <div className="sk-band">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="sk" style={{ width: '60%', height: 11 }} />
            <div className="sk" style={{ width: '72%', height: 30 }} />
            <div className="sk" style={{ width: '64%', height: 11 }} />
          </div>
        ))}
      </div>
      <div className="dash-row r-32">
        <div className="sk-panel" style={{ height: 300 }}>
          <div className="sk" style={{ width: 150, height: 12 }} />
          <div className="sk" style={{ marginTop: 20, width: '100%', height: 222 }} />
        </div>
        <div className="sk-panel" style={{ height: 300 }}>
          <div className="sk" style={{ width: 170, height: 12 }} />
          <div className="sk" style={{ marginTop: 20, width: '100%', height: 222 }} />
        </div>
      </div>
      <div className="dash-row r-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sk-panel" style={{ height: 232 }}>
            <div className="sk" style={{ width: 120, height: 12 }} />
            <div className="sk" style={{ marginTop: 20, width: '100%', height: 162 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
