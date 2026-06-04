import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, getPagination, paginated } from '../lib/http';
import { parseJson } from '../lib/json';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManage, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistory } from '../lib/history';

const router = Router();
router.use(requireAuth);

/** GET /employees/:employeeId/history — the unified timeline (paginated). */
router.get(
  '/employees/:employeeId/history',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const page = getPagination(req.query as Record<string, unknown>, 25);
    const eventType = typeof req.query.eventType === 'string' ? req.query.eventType : undefined;

    const where = { employeeId: employee.id, ...(eventType ? { eventType } : {}) };
    const [events, total] = await Promise.all([
      prisma.historyEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      prisma.historyEvent.count({ where }),
    ]);

    const data = events.map((e) => ({ ...e, metadata: parseJson(e.metadata, null) }));
    res.json(paginated(data, total, page));
  }),
);

const noteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  occurredAt: z.coerce.date().optional(),
});

/** POST /employees/:employeeId/history — add a manual note to the timeline. */
router.post(
  '/employees/:employeeId/history',
  validateBody(noteSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof noteSchema>;
    const event = await recordHistory({
      employeeId: employee.id,
      eventType: 'NOTE',
      title: data.title,
      description: data.description,
      occurredAt: data.occurredAt ?? new Date(),
      createdBy: req.user!.email,
    });
    res.status(201).json({ data: { ...event, metadata: null } });
  }),
);

export default router;
