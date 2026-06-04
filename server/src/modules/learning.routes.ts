import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManageGoals, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistory } from '../lib/history';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['TECHNICAL', 'LEADERSHIP', 'COMMUNICATION', 'DOMAIN', 'CERTIFICATION'] as const;
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

router.get(
  '/employees/:employeeId/learning-goals',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const data = await prisma.learningGoal.findMany({
      where: { employeeId: employee.id, ...(status ? { status } : {}) },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ data });
  }),
);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  targetDate: z.coerce.date().optional().nullable(),
});

router.post(
  '/employees/:employeeId/learning-goals',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManageGoals(req.user!, employee));
    const data = req.body as z.infer<typeof createSchema>;

    const goal = await prisma.learningGoal.create({
      data: {
        employeeId: employee.id,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? 'TECHNICAL',
        status: data.status ?? 'NOT_STARTED',
        priority: data.priority ?? 'MEDIUM',
        progress: data.progress ?? 0,
        targetDate: data.targetDate ?? null,
      },
    });

    await recordHistory({
      employeeId: employee.id,
      eventType: 'GOAL_CREATED',
      title: `Learning goal: ${data.title}`,
      metadata: { category: goal.category, priority: goal.priority },
      createdBy: req.user!.email,
    });

    res.status(201).json({ data: goal });
  }),
);

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  targetDate: z.coerce.date().optional().nullable(),
});

router.patch(
  '/learning-goals/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const goal = await prisma.learningGoal.findUnique({ where: { id: req.params.id } });
    if (!goal) throw new ApiError(404, 'Learning goal not found');
    const employee = await getEmployeeOr404(goal.employeeId);
    assertPermission(canManageGoals(req.user!, employee));
    const data = req.body as z.infer<typeof updateSchema>;

    const becomingCompleted = data.status === 'COMPLETED' && goal.status !== 'COMPLETED';

    const updated = await prisma.learningGoal.update({
      where: { id: goal.id },
      data: {
        ...data,
        progress: becomingCompleted ? (data.progress ?? 100) : data.progress,
        completedDate: becomingCompleted ? new Date() : data.status && data.status !== 'COMPLETED' ? null : undefined,
      },
    });

    if (becomingCompleted) {
      await recordHistory({
        employeeId: employee.id,
        eventType: 'GOAL_COMPLETED',
        title: `Completed goal: ${updated.title}`,
        metadata: { category: updated.category },
        createdBy: req.user!.email,
      });
    }

    res.json({ data: updated });
  }),
);

router.delete(
  '/learning-goals/:id',
  asyncHandler(async (req, res) => {
    const goal = await prisma.learningGoal.findUnique({ where: { id: req.params.id } });
    if (!goal) throw new ApiError(404, 'Learning goal not found');
    const employee = await getEmployeeOr404(goal.employeeId);
    assertPermission(canManageGoals(req.user!, employee));
    await prisma.learningGoal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
