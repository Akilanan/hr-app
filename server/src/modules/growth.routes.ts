import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManage, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistoryTx } from '../lib/history';
import { CAREER_MILESTONE_TYPES } from '../lib/enums';

const router = Router();
router.use(requireAuth);

/* ----------------------------- Financial growth ---------------------------- */

router.get(
  '/employees/:employeeId/financial-growth',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const data = await prisma.financialGrowthMetric.findMany({
      where: { employeeId: employee.id },
      orderBy: { periodDate: 'asc' },
    });
    res.json({ data });
  }),
);

const financialSchema = z.object({
  periodDate: z.coerce.date(),
  baseSalary: z.number().int().nonnegative(),
  bonus: z.number().int().nonnegative().optional().default(0),
  equity: z.number().int().nonnegative().optional().default(0),
  totalCompensation: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
});

router.post(
  '/employees/:employeeId/financial-growth',
  validateBody(financialSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof financialSchema>;
    // Total comp is always derived from its components; reject an inconsistent
    // client-supplied total rather than persisting a contradictory figure.
    const total = data.baseSalary + data.bonus + data.equity;
    if (data.totalCompensation != null && data.totalCompensation !== total) {
      throw new ApiError(400, 'Total compensation must equal base + bonus + equity.');
    }

    const existing = await prisma.financialGrowthMetric.findUnique({
      where: { employeeId_periodDate: { employeeId: employee.id, periodDate: data.periodDate } },
    });

    const metric = await prisma.financialGrowthMetric.upsert({
      where: { employeeId_periodDate: { employeeId: employee.id, periodDate: data.periodDate } },
      update: {
        baseSalary: data.baseSalary,
        bonus: data.bonus,
        equity: data.equity,
        totalCompensation: total,
        currency: data.currency ?? employee.currency,
      },
      create: {
        employeeId: employee.id,
        periodDate: data.periodDate,
        baseSalary: data.baseSalary,
        bonus: data.bonus,
        equity: data.equity,
        totalCompensation: total,
        currency: data.currency ?? employee.currency,
      },
    });
    res.status(existing ? 200 : 201).json({ data: metric });
  }),
);

router.delete(
  '/financial-growth/:id',
  asyncHandler(async (req, res) => {
    const metric = await prisma.financialGrowthMetric.findUnique({ where: { id: req.params.id } });
    if (!metric) throw new ApiError(404, 'Financial metric not found');
    const employee = await getEmployeeOr404(metric.employeeId);
    assertPermission(canManage(req.user!, employee));
    await prisma.financialGrowthMetric.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

/* ------------------------------ Career growth ------------------------------ */

router.get(
  '/employees/:employeeId/career-growth',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const data = await prisma.careerGrowthMilestone.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: 'desc' },
    });
    res.json({ data });
  }),
);

const milestoneSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(CAREER_MILESTONE_TYPES),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  levelAtTime: z.string().optional().nullable(),
});

router.post(
  '/employees/:employeeId/career-growth',
  validateBody(milestoneSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof milestoneSchema>;

    const milestone = await prisma.$transaction(async (tx) => {
      const created = await tx.careerGrowthMilestone.create({
        data: {
          employeeId: employee.id,
          date: data.date,
          type: data.type,
          title: data.title,
          description: data.description ?? null,
          levelAtTime: data.levelAtTime ?? null,
        },
      });
      await recordHistoryTx(tx, {
        employeeId: employee.id,
        eventType: 'MILESTONE',
        title: data.title,
        description: data.description,
        metadata: { type: data.type },
        occurredAt: data.date,
        createdBy: req.user!.email,
      });
      return created;
    });

    res.status(201).json({ data: milestone });
  }),
);

router.delete(
  '/career-growth/:id',
  asyncHandler(async (req, res) => {
    const milestone = await prisma.careerGrowthMilestone.findUnique({ where: { id: req.params.id } });
    if (!milestone) throw new ApiError(404, 'Milestone not found');
    const employee = await getEmployeeOr404(milestone.employeeId);
    assertPermission(canManage(req.user!, employee));
    await prisma.careerGrowthMilestone.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
