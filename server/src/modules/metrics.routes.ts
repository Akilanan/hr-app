import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManage, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';

const router = Router();
router.use(requireAuth);

const METRIC_TYPES = [
  'PRODUCTIVITY',
  'QUALITY',
  'GOAL_COMPLETION',
  'ATTENDANCE',
  'OKR',
  'ENGAGEMENT',
] as const;

router.get(
  '/employees/:employeeId/performance-metrics',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const metricType = typeof req.query.metricType === 'string' ? req.query.metricType : undefined;
    const data = await prisma.performanceMetric.findMany({
      where: { employeeId: employee.id, ...(metricType ? { metricType } : {}) },
      orderBy: { periodDate: 'asc' },
    });
    res.json({ data });
  }),
);

const createSchema = z.object({
  periodDate: z.coerce.date(),
  metricType: z.enum(METRIC_TYPES),
  value: z.number(),
  target: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
});

router.post(
  '/employees/:employeeId/performance-metrics',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof createSchema>;
    const metric = await prisma.performanceMetric.create({
      data: {
        employeeId: employee.id,
        periodDate: data.periodDate,
        metricType: data.metricType,
        value: data.value,
        target: data.target ?? null,
        unit: data.unit ?? null,
      },
    });
    res.status(201).json({ data: metric });
  }),
);

router.delete(
  '/performance-metrics/:id',
  asyncHandler(async (req, res) => {
    const metric = await prisma.performanceMetric.findUnique({ where: { id: req.params.id } });
    if (!metric) throw new ApiError(404, 'Performance metric not found');
    const employee = await getEmployeeOr404(metric.employeeId);
    assertPermission(canManage(req.user!, employee));
    await prisma.performanceMetric.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
