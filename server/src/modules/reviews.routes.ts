import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { parseJson } from '../lib/json';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { canView, canManage, assertPermission } from '../lib/permissions';
import { getEmployeeOr404 } from '../lib/loadEmployee';
import { recordHistoryTx } from '../lib/history';

const router = Router();
router.use(requireAuth);

const competencySchema = z.object({ name: z.string(), rating: z.number().min(0).max(5) });

function serializeReview(review: {
  competencies: string | null;
  [k: string]: unknown;
}) {
  return { ...review, competencies: parseJson(review.competencies, [] as unknown[]) };
}

router.get(
  '/employees/:employeeId/reviews',
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canView(req.user!, employee));
    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId: employee.id },
      orderBy: { reviewDate: 'desc' },
      include: { reviewer: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json({ data: reviews.map(serializeReview) });
  }),
);

const createSchema = z.object({
  reviewerId: z.string().optional().nullable(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  reviewDate: z.coerce.date().optional(),
  overallRating: z.number().min(1).max(5),
  competencies: z.array(competencySchema).optional(),
  strengths: z.string().optional().nullable(),
  areasForImprovement: z.string().optional().nullable(),
  goalsForNextPeriod: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED']).optional(),
});

router.post(
  '/employees/:employeeId/reviews',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const employee = await getEmployeeOr404(req.params.employeeId);
    assertPermission(canManage(req.user!, employee));
    const data = req.body as z.infer<typeof createSchema>;

    // Validate the reviewer is a real employee (prevents orphaned reviews).
    if (data.reviewerId) {
      const reviewer = await prisma.employee.findUnique({ where: { id: data.reviewerId }, select: { id: true } });
      if (!reviewer) throw new ApiError(400, 'Reviewer not found');
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.performanceReview.create({
        data: {
          employeeId: employee.id,
          reviewerId: data.reviewerId ?? req.user!.employeeId ?? null,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          reviewDate: data.reviewDate ?? new Date(),
          overallRating: data.overallRating,
          competencies: data.competencies ? JSON.stringify(data.competencies) : null,
          strengths: data.strengths ?? null,
          areasForImprovement: data.areasForImprovement ?? null,
          goalsForNextPeriod: data.goalsForNextPeriod ?? null,
          status: data.status ?? 'SUBMITTED',
        },
      });
      await recordHistoryTx(tx, {
        employeeId: employee.id,
        eventType: 'REVIEW',
        title: `Performance review — ${data.overallRating.toFixed(1)}/5`,
        description: data.strengths,
        metadata: { rating: data.overallRating, status: created.status },
        occurredAt: created.reviewDate,
        createdBy: req.user!.email,
      });
      return created;
    });

    res.status(201).json({ data: serializeReview(review) });
  }),
);

const updateSchema = z.object({
  overallRating: z.number().min(1).max(5).optional(),
  competencies: z.array(competencySchema).optional(),
  strengths: z.string().optional().nullable(),
  areasForImprovement: z.string().optional().nullable(),
  goalsForNextPeriod: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED']).optional(),
});

router.patch(
  '/reviews/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const review = await prisma.performanceReview.findUnique({ where: { id: req.params.id } });
    if (!review) throw new ApiError(404, 'Review not found');
    const employee = await getEmployeeOr404(review.employeeId);
    const data = req.body as z.infer<typeof updateSchema>;

    const manages = canManage(req.user!, employee);
    const isOwnReview = req.user!.employeeId === employee.id;

    // Employees may only acknowledge their own review; managers/HR can edit fully.
    if (!manages) {
      const onlyAcknowledging =
        isOwnReview &&
        data.status === 'ACKNOWLEDGED' &&
        Object.keys(data).every((k) => k === 'status');
      assertPermission(onlyAcknowledging, 'You can only acknowledge your own review');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.performanceReview.update({
        where: { id: review.id },
        data: {
          overallRating: data.overallRating,
          competencies: data.competencies ? JSON.stringify(data.competencies) : undefined,
          strengths: data.strengths,
          areasForImprovement: data.areasForImprovement,
          goalsForNextPeriod: data.goalsForNextPeriod,
          status: data.status,
        },
      });
      // Audit status transitions (e.g. SUBMITTED → ACKNOWLEDGED) on the timeline.
      if (data.status && data.status !== review.status) {
        await recordHistoryTx(tx, {
          employeeId: employee.id,
          eventType: 'REVIEW',
          title: data.status === 'ACKNOWLEDGED' ? 'Review acknowledged' : `Review ${data.status.toLowerCase()}`,
          metadata: { reviewId: review.id, from: review.status, to: data.status },
          createdBy: req.user!.email,
        });
      }
      return u;
    });

    res.json({ data: serializeReview(updated) });
  }),
);

router.delete(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const review = await prisma.performanceReview.findUnique({ where: { id: req.params.id } });
    if (!review) throw new ApiError(404, 'Review not found');
    const employee = await getEmployeeOr404(review.employeeId);
    assertPermission(canManage(req.user!, employee));
    await prisma.performanceReview.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
