import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManage, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistoryTx } from '../lib/history';

const router = Router();
router.use(requireAuth);

router.get(
  '/employees/:employeeId/promotions',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const data = await prisma.promotion.findMany({
      where: { employeeId: employee.id },
      orderBy: { effectiveDate: 'desc' },
    });
    res.json({ data });
  }),
);

const createSchema = z.object({
  toTitle: z.string().min(1),
  fromTitle: z.string().optional().nullable(),
  fromLevel: z.string().optional().nullable(),
  toLevel: z.string().optional().nullable(),
  effectiveDate: z.coerce.date(),
  reason: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  applyToEmployee: z.boolean().optional().default(true),
});

router.post(
  '/employees/:employeeId/promotions',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof createSchema>;

    const fromTitle = data.fromTitle ?? employee.jobTitle;
    const fromLevel = data.fromLevel ?? employee.level;

    const promotion = await prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          employeeId: employee.id,
          fromTitle,
          toTitle: data.toTitle,
          fromLevel,
          toLevel: data.toLevel ?? null,
          effectiveDate: data.effectiveDate,
          reason: data.reason ?? null,
          approvedBy: data.approvedBy ?? req.user!.email,
        },
      });

      if (data.applyToEmployee) {
        await tx.employee.update({
          where: { id: employee.id },
          data: { jobTitle: data.toTitle, level: data.toLevel ?? employee.level },
        });
      }

      await tx.careerGrowthMilestone.create({
        data: {
          employeeId: employee.id,
          date: data.effectiveDate,
          type: 'PROMOTION',
          title: `Promoted to ${data.toTitle}`,
          description: data.reason ?? null,
          levelAtTime: data.toLevel ?? null,
        },
      });

      await recordHistoryTx(tx, {
        employeeId: employee.id,
        eventType: 'PROMOTION',
        title: `Promoted to ${data.toTitle}`,
        description: data.reason,
        metadata: { fromTitle, toTitle: data.toTitle, fromLevel, toLevel: data.toLevel },
        occurredAt: data.effectiveDate,
        createdBy: req.user!.email,
      });

      return created;
    });

    res.status(201).json({ data: promotion });
  }),
);

router.delete(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promotion) throw new ApiError(404, 'Promotion not found');
    const employee = await getEmployeeOr404(promotion.employeeId);
    assertPermission(canManage(req.user!, employee));

    await prisma.$transaction(async (tx) => {
      await tx.promotion.delete({ where: { id: promotion.id } });
      // Revert title/level only if THIS promotion is what set the current title,
      // so we don't clobber a title changed through other means.
      if (employee.jobTitle === promotion.toTitle) {
        const latest = await tx.promotion.findFirst({
          where: { employeeId: employee.id },
          orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
        });
        await tx.employee.update({
          where: { id: employee.id },
          data: latest
            ? { jobTitle: latest.toTitle, level: latest.toLevel ?? employee.level }
            : { jobTitle: promotion.fromTitle ?? employee.jobTitle, level: promotion.fromLevel ?? employee.level },
        });
      }
    });
    res.status(204).end();
  }),
);

export default router;
