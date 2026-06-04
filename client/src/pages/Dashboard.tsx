import type { ReactNode } from 'react';
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
  LabelList,
} from 'recharts';
import { api } from '../api/client';
import { useFetch } from '../lib/useFetch';
import type { DashboardOverview } from '../api/types';
import { Avatar, toneStyle } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmtMoney, fmtMoneyShort, fmtNumber, fmtRelative, titleCase } from '../lib/format';
import { eventIcon, eventTone } from '../lib/events';
import '../styles/dashboard.css';

/* Refined categorical palette — one indigo anchor + calm, distinct hues. */
const DONUT_COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#64748b'];
const ACCENT = '#6366f1';

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
              <Icon name="alert-triangle" size={22} />
            </div>
            <div className="et">Could not load dashboard</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>{error}</div>
          </div>
        </div>
      </div>
    );
  if (!data) return null;

  const totalEmployment = data.byEmploymentType.reduce((a, t) => a + t.count, 0);
  const employmentData = data.byEmploymentType.map((t, i) => ({
    name: titleCase(t.type),
    value: t.count,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const learningData = [
    { name: 'Completed', value: data.learning.completed, color: '#10b981' },
    { name: 'In progress', value: data.learning.inProgress, color: '#6366f1' },
    { name: 'Not started', value: data.learning.notStarted, color: '#cbd5e1' },
    { name: 'On hold', value: data.learning.onHold, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="dash">
      <DashHeader />

      {/* KPI band */}
      <div className="kpi-grid dash-stagger">
        <Kpi
          tone="indigo"
          feature
          label="Active headcount"
          value={fmtNumber(data.headcount.active)}
          sub={`${fmtNumber(data.headcount.total)} total · ${data.headcount.onLeave} on leave`}
          icon="users"
        />
        <Kpi
          tone="emerald"
          label="Avg. salary"
          value={fmtMoney(data.compensation.avgSalary)}
          sub={`${fmtMoneyShort(data.compensation.totalSpend)} total payroll`}
          icon="dollar"
        />
        <Kpi
          tone="violet"
          label="Promotions YTD"
          value={fmtNumber(data.promotionsThisYear)}
          sub={`${fmtNumber(data.salaryChangesThisYear)} comp changes`}
          icon="arrow-up-circle"
        />
        <Kpi
          tone="amber"
          label="Avg. review rating"
          value={data.reviews.avgRating != null ? `${data.reviews.avgRating}` : '—'}
          valueSuffix={data.reviews.avgRating != null ? '/ 5' : undefined}
          sub={`${data.reviews.pendingAcknowledgement} awaiting sign-off`}
          icon="star"
        />
      </div>

      {/* Trend + department */}
      <div className="dash-row r-32">
        <Panel title="Hiring trend" sub="New hires over the last 12 months">
          <div className="panel-body" style={{ height: 248 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hireTrend} margin={{ left: -22, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} />
                <XAxis dataKey="period" tickLine={false} tickMargin={10} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} width={34} />
                <Tooltip cursor={{ stroke: ACCENT, strokeOpacity: 0.25 }} />
                <Area
                  type="monotone"
                  dataKey="hires"
                  name="New hires"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  fill="url(#hireGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Headcount by department" sub="Active employees">
          <div className="panel-body" style={{ height: 248 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDepartment}
                layout="vertical"
                margin={{ left: 6, right: 26, top: 6, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} hide />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={94}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="headcount" name="Headcount" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={15}>
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
          <Donut
            data={employmentData}
            centerBig={fmtNumber(totalEmployment)}
            centerSmall="people"
          />
        </Panel>

        <Panel title="Learning goals" sub={`${data.learning.completionRate}% completion rate`}>
          <Donut
            data={learningData}
            centerBig={`${data.learning.completionRate}%`}
            centerSmall="complete"
          />
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
      <div className="dash-row" style={{ marginTop: 16 }}>
        <Panel title="Recent activity" sub="Latest changes across the organization">
          {data.recentActivity.length === 0 ? (
            <DashEmpty icon="inbox" title="No activity yet" />
          ) : (
            <div className="act-grid">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="lite-row" style={{ cursor: 'default' }}>
                  <div className="act-icon" style={toneStyle(eventTone(a.eventType))}>
                    <Icon name={eventIcon(a.eventType)} size={16} />
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
        <span className="pulse" /> Live · updated just now
      </span>
    </div>
  );
}

function Kpi({
  label,
  value,
  valueSuffix,
  sub,
  icon,
  tone,
  feature,
}: {
  label: string;
  value: ReactNode;
  valueSuffix?: string;
  sub?: ReactNode;
  icon: string;
  tone: 'indigo' | 'emerald' | 'violet' | 'amber';
  feature?: boolean;
}) {
  return (
    <div className={`kpi t-${tone}${feature ? ' feature' : ''}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-chip">
          <Icon name={icon} size={19} />
        </span>
      </div>
      <div className="kpi-value">
        {value}
        {valueSuffix && (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--d-faint)', marginLeft: 5 }}>
            {valueSuffix}
          </span>
        )}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {sub && <div className="ph-sub">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Donut({
  data,
  centerBig,
  centerSmall,
}: {
  data: { name: string; value: number; color: string }[];
  centerBig: string;
  centerSmall: string;
}) {
  if (data.length === 0) return <DashEmpty icon="inbox" title="No data yet" />;
  return (
    <div className="donut-row">
      <div className="donut-wrap" style={{ height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
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
        {data.map((d) => (
          <div key={d.name} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
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
        <Icon name={icon} size={20} />
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
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk-kpi">
            <div className="sk" style={{ width: '55%', height: 12 }} />
            <div className="sk" style={{ width: '70%', height: 26 }} />
            <div className="sk" style={{ width: '60%', height: 11 }} />
          </div>
        ))}
      </div>
      <div className="dash-row r-32">
        <div className="sk-panel" style={{ height: 296 }}>
          <div className="sk" style={{ width: 160, height: 14 }} />
          <div className="sk" style={{ marginTop: 18, width: '100%', height: 220 }} />
        </div>
        <div className="sk-panel" style={{ height: 296 }}>
          <div className="sk" style={{ width: 180, height: 14 }} />
          <div className="sk" style={{ marginTop: 18, width: '100%', height: 220 }} />
        </div>
      </div>
      <div className="dash-row r-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sk-panel" style={{ height: 230 }}>
            <div className="sk" style={{ width: 130, height: 14 }} />
            <div className="sk" style={{ marginTop: 18, width: '100%', height: 160 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
