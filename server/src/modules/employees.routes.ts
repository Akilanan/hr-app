import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler, getPagination, paginated } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { canView, canManage, assertPermission, isFullAccess } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistoryTx } from '../lib/history';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '../lib/enums';
import { toCsv, parseCsv } from '../lib/csv';

const router = Router();
router.use(requireAuth);

// Throttle the directory to deter automated enumeration of employee PII.
const directoryLimiter = rateLimit({ windowMs: 60_000, max: 240, message: 'Too many requests, please slow down.' });

// Non-sensitive fields exposed in the directory listing (no salary).
const DIRECTORY_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  jobTitle: true,
  level: true,
  status: true,
  employmentType: true,
  location: true,
  avatarUrl: true,
  hireDate: true,
  managerId: true,
  department: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeSelect;

const SORTABLE: Record<string, Prisma.EmployeeOrderByWithRelationInput> = {
  name: { lastName: 'asc' },
  '-name': { lastName: 'desc' },
  hireDate: { hireDate: 'asc' },
  '-hireDate': { hireDate: 'desc' },
  jobTitle: { jobTitle: 'asc' },
  '-jobTitle': { jobTitle: 'desc' },
};

/** GET /employees — paginated, searchable directory (basic fields only). */
router.get(
  '/',
  directoryLimiter,
  asyncHandler(async (req, res) => {
    const page = getPagination(req.query as Record<string, unknown>);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const managerId = typeof req.query.managerId === 'string' ? req.query.managerId : undefined;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'name';

    const where: Prisma.EmployeeWhereInput = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeCode: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: DIRECTORY_SELECT,
        orderBy: SORTABLE[sort] ?? SORTABLE.name,
        skip: page.skip,
        take: page.take,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json(paginated(data, total, page));
  }),
);

// Length caps on every free-text field guard against oversized payloads / DB bloat.
const employeeBodySchema = z.object({
  employeeCode: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  hireDate: z.coerce.date(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  jobTitle: z.string().min(1).max(120),
  level: z.string().max(40).optional().nullable(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  location: z.string().max(120).optional().nullable(),
  currentSalary: z.number().int().nonnegative().max(1_000_000_000).optional(),
  currency: z.string().max(8).optional(),
  departmentId: z.string().max(40).optional().nullable(),
  managerId: z.string().max(40).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  // Must be a valid http(s) URL (prevents javascript:/data: URIs in <img src>).
  avatarUrl: z.union([z.string().url().max(2048), z.literal('')]).optional().nullable(),
});

/** POST /employees — create (HR/Admin only). */
router.post(
  '/',
  requireRole('ADMIN', 'HR'),
  validateBody(employeeBodySchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof employeeBodySchema>;
    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({ data: { ...data, terminationDate: null } });
      await recordHistoryTx(tx, {
        employeeId: emp.id,
        eventType: 'HIRED',
        title: `Joined as ${emp.jobTitle}`,
        occurredAt: emp.hireDate,
        createdBy: req.user!.email,
      });
      return emp;
    });
    res.status(201).json({ data: employee });
  }),
);

/** GET /employees/export — download all employees as CSV (HR/Admin). */
router.get(
  '/export',
  requireRole('ADMIN', 'HR'),
  asyncHandler(async (_req, res) => {
    const employees = await prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        department: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });
    const headers = [
      'employeeCode', 'firstName', 'lastName', 'email', 'jobTitle', 'level', 'department',
      'manager', 'status', 'employmentType', 'location', 'hireDate', 'currentSalary', 'currency',
    ];
    const rows = employees.map((e) => [
      e.employeeCode, e.firstName, e.lastName, e.email, e.jobTitle, e.level ?? '',
      e.department?.name ?? '', e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : '',
      e.status, e.employmentType, e.location ?? '', e.hireDate.toISOString().slice(0, 10),
      e.currentSalary, e.currency,
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.send(toCsv(headers, rows));
  }),
);

const importSchema = z.object({ csv: z.string().min(1).max(5_000_000) });
const importRowSchema = z.object({
  employeeCode: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  jobTitle: z.string().min(1).max(120),
  level: z.string().max(40).optional(),
  department: z.string().max(120).optional(),
  status: z.string().max(30).optional(),
  employmentType: z.string().max(30).optional(),
  location: z.string().max(120).optional(),
  hireDate: z.string().max(40).optional(),
  currentSalary: z.string().max(20).optional(),
  currency: z.string().max(8).optional(),
});

/** POST /employees/import — bulk-create from CSV text (HR/Admin). */
router.post(
  '/import',
  requireRole('ADMIN', 'HR'),
  validateBody(importSchema),
  asyncHandler(async (req, res) => {
    const { csv } = req.body as z.infer<typeof importSchema>;
    const rows = parseCsv(csv);
    if (rows.length === 0) throw new ApiError(400, 'No data rows found in the CSV');

    const depts = await prisma.department.findMany({ select: { id: true, name: true } });
    const deptByName = new Map(depts.map((d) => [d.name.toLowerCase(), d.id]));

    let created = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parsed = importRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({ row: i + 2, error: parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') });
        continue;
      }
      const r = parsed.data;
      try {
        const hireDate = r.hireDate ? new Date(r.hireDate) : new Date();
        if (Number.isNaN(hireDate.getTime())) throw new Error('invalid hireDate (use YYYY-MM-DD)');
        const salary = r.currentSalary ? Math.round(Number(r.currentSalary.replace(/[^0-9.]/g, ''))) : 0;
        const status = (EMPLOYEE_STATUSES as readonly string[]).includes((r.status ?? '').toUpperCase())
          ? r.status!.toUpperCase()
          : 'ACTIVE';
        const employmentType = (EMPLOYMENT_TYPES as readonly string[]).includes((r.employmentType ?? '').toUpperCase())
          ? r.employmentType!.toUpperCase()
          : 'FULL_TIME';

        await prisma.$transaction(async (tx) => {
          const emp = await tx.employee.create({
            data: {
              employeeCode: r.employeeCode,
              firstName: r.firstName,
              lastName: r.lastName,
              email: r.email.toLowerCase(),
              jobTitle: r.jobTitle,
              level: r.level || null,
              status,
              employmentType,
              location: r.location || null,
              hireDate,
              currentSalary: Number.isFinite(salary) ? salary : 0,
              currency: r.currency || 'INR',
              departmentId: r.department ? deptByName.get(r.department.toLowerCase()) ?? null : null,
            },
          });
          await recordHistoryTx(tx, {
            employeeId: emp.id,
            eventType: 'HIRED',
            title: `Joined as ${emp.jobTitle}`,
            occurredAt: emp.hireDate,
            createdBy: req.user!.email,
          });
        });
        created += 1;
      } catch (e) {
        let msg = e instanceof Error ? e.message : 'failed';
        if (msg.includes('Unique constraint')) msg = 'duplicate employeeCode or email';
        errors.push({ row: i + 2, error: msg });
      }
    }

    res.status(201).json({ data: { created, failed: errors.length, errors: errors.slice(0, 50) } });
  }),
);

/** GET /employees/:id — full record (salary included; access controlled). */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        user: { select: { id: true, email: true, role: true } },
        _count: { select: { reports: true } },
      },
    });
    if (!employee) throw new ApiError(404, 'Employee not found');
    assertPermission(canView(req.user!, employee));
    res.json({ data: employee });
  }),
);

const updateSchema = employeeBodySchema.partial().omit({ currentSalary: true });

/** PATCH /employees/:id — update profile (not salary; use salary endpoint). */
router.patch(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.id);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof updateSchema>;

    // Only HR/Admin may reassign manager/department or change employment status.
    // (TERMINATED has payroll + audit implications — it is not a manager action.)
    if (!isFullAccess(req.user!)) {
      delete (data as Record<string, unknown>).managerId;
      delete (data as Record<string, unknown>).departmentId;
      delete (data as Record<string, unknown>).status;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.employee.update({ where: { id: employee.id }, data });
      if (data.status && data.status !== employee.status) {
        await recordHistoryTx(tx, {
          employeeId: employee.id,
          eventType: 'STATUS_CHANGE',
          title: `Status changed to ${data.status}`,
          metadata: { from: employee.status, to: data.status },
          createdBy: req.user!.email,
        });
      }
      return u;
    });

    res.json({ data: updated });
  }),
);

/** DELETE /employees/:id — remove employee and cascade history (Admin/HR). */
router.delete(
  '/:id',
  requireRole('ADMIN', 'HR'),
  asyncHandler(async (req, res) => {
    await getEmployeeOr404(req.params.id);
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

/** Shared builder for the overview-tab summary (reused by /summary and /overview). */
type SummaryEmployee = {
  id: string;
  currentSalary: number;
  currency: string;
  jobTitle: string;
  level: string | null;
  status: string;
  hireDate: Date;
};
async function buildSummary(employee: SummaryEmployee) {
  const id = employee.id;
  const [
    promotionCount,
    salaryChangeCount,
    reviewCount,
    milestoneCount,
    latestReview,
    latestPromotion,
    goalsByStatus,
    latestFinancial,
  ] = await Promise.all([
    prisma.promotion.count({ where: { employeeId: id } }),
    prisma.salaryChange.count({ where: { employeeId: id } }),
    prisma.performanceReview.count({ where: { employeeId: id } }),
    prisma.careerGrowthMilestone.count({ where: { employeeId: id } }),
    prisma.performanceReview.findFirst({ where: { employeeId: id }, orderBy: { reviewDate: 'desc' } }),
    prisma.promotion.findFirst({ where: { employeeId: id }, orderBy: { effectiveDate: 'desc' } }),
    prisma.learningGoal.groupBy({ by: ['status'], where: { employeeId: id }, _count: true }),
    prisma.financialGrowthMetric.findFirst({ where: { employeeId: id }, orderBy: { periodDate: 'desc' } }),
  ]);

  const goalCounts = goalsByStatus.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count;
    return acc;
  }, {});
  const totalGoals = Object.values(goalCounts).reduce((a, b) => a + b, 0);
  const completedGoals = goalCounts.COMPLETED ?? 0;
  const tenureDays = Math.floor((Date.now() - employee.hireDate.getTime()) / 86_400_000);

  return {
    currentSalary: employee.currentSalary,
    currency: employee.currency,
    jobTitle: employee.jobTitle,
    level: employee.level,
    status: employee.status,
    tenureDays,
    tenureYears: Math.round((tenureDays / 365.25) * 10) / 10,
    counts: {
      promotions: promotionCount,
      salaryChanges: salaryChangeCount,
      reviews: reviewCount,
      milestones: milestoneCount,
      goals: totalGoals,
      goalsCompleted: completedGoals,
    },
    goalCompletionRate: totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0,
    latestRating: latestReview?.overallRating ?? null,
    latestReviewDate: latestReview?.reviewDate ?? null,
    latestPromotionDate: latestPromotion?.effectiveDate ?? null,
    latestTotalComp: latestFinancial?.totalCompensation ?? employee.currentSalary,
  };
}

/** GET /employees/:id/summary — aggregate stats for the overview tab. */
router.get(
  '/:id/summary',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.id);
    assertPermission(canView(req.user!, employee));
    res.json({ data: await buildSummary(employee) });
  }),
);

/** GET /employees/:id/overview — summary + financial-growth + reviews + salary in ONE round-trip. */
router.get(
  '/:id/overview',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.id);
    assertPermission(canView(req.user!, employee));
    const id = employee.id;
    const [summary, financialGrowth, reviews, salaryChanges] = await Promise.all([
      buildSummary(employee),
      prisma.financialGrowthMetric.findMany({ where: { employeeId: id }, orderBy: { periodDate: 'asc' } }),
      prisma.performanceReview.findMany({
        where: { employeeId: id },
        orderBy: { reviewDate: 'desc' },
        include: { reviewer: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.salaryChange.findMany({ where: { employeeId: id }, orderBy: { effectiveDate: 'desc' } }),
    ]);
    res.json({ data: { summary, financialGrowth, reviews, salaryChanges } });
  }),
);

export default router;
