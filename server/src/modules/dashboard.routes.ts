import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'HR', 'MANAGER'));

// All date bucketing is done in UTC so months don't shift by a day at boundaries
// depending on the server timezone (DB timestamps are UTC).
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Build a continuous list of the last `count` months (oldest first). */
function lastMonths(count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      key: monthKey(d),
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    });
  }
  return out;
}

/** GET /dashboard/overview — org-wide headline stats for the dashboard. */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    const [
      total,
      active,
      onLeave,
      terminated,
      byCurrency,
      byDeptRaw,
      byType,
      departments,
      promotionsThisYear,
      salaryChangesThisYear,
      reviewAgg,
      pendingAck,
      goalAgg,
      recentHires,
      recentActivity,
      hires,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { status: 'TERMINATED' } }),
      // Aggregate per currency so totals never sum mixed currencies into a nonsense number.
      prisma.employee.groupBy({
        by: ['currency'],
        where: { status: 'ACTIVE' },
        _sum: { currentSalary: true },
        _avg: { currentSalary: true },
        _count: { _all: true },
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
        _avg: { currentSalary: true },
      }),
      prisma.employee.groupBy({ by: ['employmentType'], _count: { _all: true } }),
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.promotion.count({ where: { effectiveDate: { gte: yearStart } } }),
      prisma.salaryChange.count({ where: { effectiveDate: { gte: yearStart } } }),
      prisma.performanceReview.aggregate({ _avg: { overallRating: true }, _count: { _all: true } }),
      prisma.performanceReview.count({ where: { status: 'SUBMITTED' } }),
      prisma.learningGoal.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.employee.findMany({
        orderBy: { hireDate: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, jobTitle: true, hireDate: true, avatarUrl: true },
      }),
      prisma.historyEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 12,
        include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.employee.findMany({
        where: { hireDate: { gte: twelveMonthsAgo } },
        select: { hireDate: true },
      }),
    ]);

    const deptName = new Map(departments.map((d) => [d.id, d.name]));
    const byDepartment = byDeptRaw.map((d) => ({
      departmentId: d.departmentId,
      department: d.departmentId ? deptName.get(d.departmentId) ?? 'Unknown' : 'Unassigned',
      headcount: d._count._all,
      avgSalary: Math.round(d._avg.currentSalary ?? 0),
    }));

    const goalCounts = goalAgg.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});
    const totalGoals = Object.values(goalCounts).reduce((a, b) => a + b, 0);

    // Compensation totals are reported for the org's primary (most common) currency
    // only; a `mixedCurrencies` flag tells the client when other currencies exist.
    const primaryCcy = [...byCurrency].sort((a, b) => b._count._all - a._count._all)[0];

    // hires per month (continuous 12-month window)
    const hireBuckets = new Map<string, number>();
    for (const h of hires) hireBuckets.set(monthKey(h.hireDate), (hireBuckets.get(monthKey(h.hireDate)) ?? 0) + 1);
    const hireTrend = lastMonths(12).map((m) => ({ period: m.label, hires: hireBuckets.get(m.key) ?? 0 }));

    res.json({
      data: {
        headcount: { total, active, onLeave, terminated },
        compensation: {
          currency: primaryCcy?.currency ?? 'INR',
          totalSpend: primaryCcy?._sum.currentSalary ?? 0,
          avgSalary: Math.round(primaryCcy?._avg.currentSalary ?? 0),
          mixedCurrencies: byCurrency.length > 1,
        },
        byDepartment,
        byEmploymentType: byType.map((t) => ({ type: t.employmentType, count: t._count._all })),
        promotionsThisYear,
        salaryChangesThisYear,
        reviews: {
          total: reviewAgg._count._all,
          avgRating: reviewAgg._avg.overallRating
            ? Math.round(reviewAgg._avg.overallRating * 100) / 100
            : null,
          pendingAcknowledgement: pendingAck,
        },
        learning: {
          total: totalGoals,
          completed: goalCounts.COMPLETED ?? 0,
          inProgress: goalCounts.IN_PROGRESS ?? 0,
          notStarted: goalCounts.NOT_STARTED ?? 0,
          onHold: goalCounts.ON_HOLD ?? 0,
          completionRate: totalGoals ? Math.round(((goalCounts.COMPLETED ?? 0) / totalGoals) * 100) : 0,
        },
        hireTrend,
        recentHires,
        recentActivity: recentActivity.map((e) => ({
          id: e.id,
          employeeId: e.employeeId,
          employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
          eventType: e.eventType,
          title: e.title,
          occurredAt: e.occurredAt,
        })),
      },
    });
  }),
);

/** GET /dashboard/performance — performance-monitoring aggregates & trends. */
router.get(
  '/performance',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const trendSince = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const ratingsSince = new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth(), 1));

    const [metricAvgRaw, metrics, ratings, topAggRaw, goalAgg] = await Promise.all([
      prisma.performanceMetric.groupBy({
        by: ['metricType'],
        _avg: { value: true },
        _count: { _all: true },
      }),
      prisma.performanceMetric.findMany({
        where: { periodDate: { gte: trendSince } },
        select: { periodDate: true, metricType: true, value: true },
      }),
      prisma.performanceReview.findMany({
        where: { reviewDate: { gte: ratingsSince } },
        select: { overallRating: true },
      }),
      // NOTE: order/slice in JS below — groupBy orderBy on aggregates isn't supported on SQLite.
      prisma.performanceReview.groupBy({
        by: ['employeeId'],
        _avg: { overallRating: true },
        _count: { _all: true },
      }),
      prisma.learningGoal.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    // Performance metric trend by month & type
    const buckets = new Map<string, Map<string, { sum: number; n: number }>>();
    const typesSeen = new Set<string>();
    for (const m of metrics) {
      const k = monthKey(m.periodDate);
      typesSeen.add(m.metricType);
      if (!buckets.has(k)) buckets.set(k, new Map());
      const inner = buckets.get(k)!;
      const cur = inner.get(m.metricType) ?? { sum: 0, n: 0 };
      cur.sum += m.value;
      cur.n += 1;
      inner.set(m.metricType, cur);
    }
    const trend = lastMonths(12).map((mo) => {
      const row: Record<string, number | string> = { period: mo.label };
      const inner = buckets.get(mo.key);
      for (const type of typesSeen) {
        const cell = inner?.get(type);
        if (cell) row[type] = Math.round((cell.sum / cell.n) * 10) / 10;
      }
      return row;
    });

    // Rating distribution
    // Half-open bands [min, max) so each rating lands in exactly one bucket that
    // matches its label (a 4.5 is "Outstanding", a 3.5 is "Exceeds", etc.).
    const dist = [
      { band: 'Outstanding (4.5–5)', min: 4.5, max: Infinity, count: 0 },
      { band: 'Exceeds (3.5–4.4)', min: 3.5, max: 4.5, count: 0 },
      { band: 'Meets (2.5–3.4)', min: 2.5, max: 3.5, count: 0 },
      { band: 'Below (1.5–2.4)', min: 1.5, max: 2.5, count: 0 },
      { band: 'Poor (1–1.4)', min: 0, max: 1.5, count: 0 },
    ];
    for (const r of ratings) {
      const band = dist.find((b) => r.overallRating >= b.min && r.overallRating < b.max);
      if (band) band.count += 1;
    }

    // Top performers (sorted in JS for SQLite compatibility)
    const topAgg = [...topAggRaw]
      .sort((a, b) => (b._avg.overallRating ?? 0) - (a._avg.overallRating ?? 0))
      .slice(0, 5);
    const topIds = topAgg.map((t) => t.employeeId);
    const topEmployees = await prisma.employee.findMany({
      where: { id: { in: topIds } },
      select: { id: true, firstName: true, lastName: true, jobTitle: true, avatarUrl: true },
    });
    const topMap = new Map(topEmployees.map((e) => [e.id, e]));
    const topPerformers = topAgg
      .map((t) => {
        const emp = topMap.get(t.employeeId);
        if (!emp) return null;
        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          jobTitle: emp.jobTitle,
          avgRating: Math.round((t._avg.overallRating ?? 0) * 100) / 100,
          reviewCount: t._count._all,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const goalCounts = goalAgg.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});
    const totalGoals = Object.values(goalCounts).reduce((a, b) => a + b, 0);

    res.json({
      data: {
        metricAverages: metricAvgRaw.map((m) => ({
          metricType: m.metricType,
          avg: Math.round((m._avg.value ?? 0) * 10) / 10,
          samples: m._count._all,
        })),
        metricTrend: trend,
        metricTypes: Array.from(typesSeen),
        ratingDistribution: dist.map(({ band, count }) => ({ band, count })),
        topPerformers,
        goals: {
          total: totalGoals,
          completed: goalCounts.COMPLETED ?? 0,
          inProgress: goalCounts.IN_PROGRESS ?? 0,
          completionRate: totalGoals ? Math.round(((goalCounts.COMPLETED ?? 0) / totalGoals) * 100) : 0,
        },
      },
    });
  }),
);

export default router;
