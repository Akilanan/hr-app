import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { comparePassword, hashPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import type { Role } from '../types';

const router = Router();

// Throttle credential endpoints against brute force / stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { employee: { include: { department: true } } },
    });
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid email or password');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'Invalid email or password');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      employeeId: user.employeeId,
    };
    const token = signToken(authUser);
    res.json({ token, user: { ...authUser, employee: user.employee } });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { employee: { include: { department: true } } },
    });
    if (!user) throw new ApiError(404, 'User not found');
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
      },
    });
  }),
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
  employeeId: z.string().optional().nullable(),
});

// Admin-only account provisioning.
router.post(
  '/register',
  authLimiter,
  requireAuth,
  requireRole('ADMIN'),
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof registerSchema>;
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        employeeId: data.employeeId ?? null,
      },
    });
    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId },
    });
  }),
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Authenticated user changes their own password.
router.post(
  '/change-password',
  authLimiter,
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new ApiError(404, 'User not found');
    const ok = await comparePassword(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, 'Current password is incorrect');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    res.json({ ok: true });
  }),
);

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Admin resets another user's password.
router.post(
  '/users/:userId/reset-password',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body as z.infer<typeof resetPasswordSchema>;
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target) throw new ApiError(404, 'User not found');
    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    res.json({ ok: true });
  }),
);

export default router;
