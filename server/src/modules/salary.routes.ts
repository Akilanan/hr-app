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
  '/employees/:employeeId/salary-changes',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const data = await prisma.salaryChange.findMany({
      where: { employeeId: employee.id },
      orderBy: { effectiveDate: 'desc' },
    });
    res.json({ data });
  }),
);

const createSchema = z.object({
  newSalary: z.number().int().positive(),
  previousSalary: z.number().int().nonnegative().optional(),
  changeType: z.enum(['RAISE', 'ADJUSTMENT', 'PROMOTION', 'BONUS', 'MARKET', 'DEMOTION']),
  effectiveDate: z.coerce.date(),
  reason: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  currency: z.string().optional(),
  applyToEmployee: z.boolean().optional().default(true),
});

router.post(
  '/employees/:employeeId/salary-changes',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof createSchema>;

    const previousSalary = data.previousSalary ?? employee.currentSalary;
    const percentChange =
      previousSalary > 0
        ? Math.round(((data.newSalary - previousSalary) / previousSalary) * 10000) / 100
        : 0;

    const change = await prisma.$transaction(async (tx) => {
      const created = await tx.salaryChange.create({
        data: {
          employeeId: employee.id,
          previousSalary,
          newSalary: data.newSalary,
          currency: data.currency ?? employee.currency,
          changeType: data.changeType,
          percentChange,
          effectiveDate: data.effectiveDate,
          reason: data.reason ?? null,
          approvedBy: data.approvedBy ?? req.user!.email,
        },
      });

      // BONUS is one-off and does not change base salary.
      if (data.applyToEmployee && data.changeType !== 'BONUS') {
        await tx.employee.update({
          where: { id: employee.id },
          data: { currentSalary: data.newSalary },
        });
      }

      await recordHistoryTx(tx, {
        employeeId: employee.id,
        eventType: 'SALARY_CHANGE',
        title:
          data.changeType === 'BONUS'
            ? `Bonus awarded`
            : `Salary ${data.newSalary >= previousSalary ? 'increased' : 'decreased'} to ₹${data.newSalary.toLocaleString('en-IN')}`,
        description: data.reason,
        metadata: {
          previousSalary,
          newSalary: data.newSalary,
          percentChange,
          changeType: data.changeType,
        },
        occurredAt: data.effectiveDate,
        createdBy: req.user!.email,
      });

      return created;
    });

    res.status(201).json({ data: change });
  }),
);

router.delete(
  '/salary-changes/:id',
  asyncHandler(async (req, res) => {
    const change = await prisma.salaryChange.findUnique({ where: { id: req.params.id } });
    if (!change) throw new ApiError(404, 'Salary change not found');
    const employee = await getEmployeeOr404(change.employeeId);
    assertPermission(canManage(req.user!, employee));
    await prisma.salaryChange.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
