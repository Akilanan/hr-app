import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
    res.json({ data });
  }),
);

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

router.post(
  '/',
  requireRole('ADMIN', 'HR'),
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof bodySchema>;
    const department = await prisma.department.create({
      data: { name: data.name, description: data.description ?? null },
    });
    res.status(201).json({ data: department });
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR'),
  validateBody(bodySchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Department not found');
    const data = req.body as Partial<z.infer<typeof bodySchema>>;
    const department = await prisma.department.update({ where: { id: req.params.id }, data });
    res.json({ data: department });
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR'),
  asyncHandler(async (req, res) => {
    // Check + delete share a transaction so members can't be assigned (or the
    // department deleted) between the guard and the write.
    await prisma.$transaction(async (tx) => {
      const dept = await tx.department.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { employees: true } } },
      });
      if (!dept) throw new ApiError(404, 'Department not found');
      if (dept._count.employees > 0) {
        throw new ApiError(
          400,
          `Cannot delete "${dept.name}": ${dept._count.employees} employee(s) still belong to it. Reassign them first.`,
        );
      }
      await tx.department.delete({ where: { id: dept.id } });
    });
    res.status(204).end();
  }),
);

export default router;
