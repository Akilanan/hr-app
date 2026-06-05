import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError, asyncHandler } from '../lib/http';
import { comparePassword, hashPassword, DUMMY_PASSWORD_HASH } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { recordHistoryTx } from '../lib/history';
import { ROLES } from '../lib/enums';
import type { Role } from '../types';

const router = Router();

// Throttle credential endpoints against brute force / stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

// Refresh happens silently for every active session, so it gets a higher ceiling
// than the credential endpoints.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many refresh attempts. Please sign in again.',
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

    // Always run a bcrypt compare (against a dummy hash when the account is
    // missing/inactive) so response timing can't reveal which emails exist.
    const ok = await comparePassword(password, user?.isActive ? user.passwordHash : DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !ok) throw new ApiError(401, 'Invalid email or password');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      employeeId: user.employeeId,
    };
    const token = signAccessToken(authUser, user.tokenVersion);
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    res.json({
      token,
      refreshToken,
      user: { ...authUser, mustChangePassword: user.mustChangePassword, employee: user.employee },
    });
  }),
);

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

// Exchange a valid refresh token for a fresh access token (sliding session).
// The refresh token is bound to the user's current tokenVersion, so logout /
// password change / admin reset invalidate it just like access tokens.
router.post(
  '/refresh',
  refreshLimiter,
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    let decoded: { id: string; tv: number };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive || user.tokenVersion !== decoded.tv) {
      throw new ApiError(401, 'Session expired, please sign in again');
    }
    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      employeeId: user.employeeId,
    };
    const token = signAccessToken(authUser, user.tokenVersion);
    const newRefreshToken = signRefreshToken(user.id, user.tokenVersion);
    res.json({ token, refreshToken: newRefreshToken });
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
        mustChangePassword: user.mustChangePassword,
        employee: user.employee,
      },
    });
  }),
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(ROLES),
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
        // Admin-issued password is temporary — force the user to set their own at first login.
        mustChangePassword: true,
      },
    });
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mustChangePassword: user.mustChangePassword,
      },
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
    const updated = await prisma.user.update({
      where: { id: user.id },
      // Clearing mustChangePassword lifts the first-login gate once they've set their own.
      data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 }, mustChangePassword: false },
    });
    // Re-issue tokens for THIS session; any other live sessions are now revoked.
    const authUser = { id: user.id, email: user.email, role: user.role as Role, employeeId: user.employeeId };
    const token = signAccessToken(authUser, updated.tokenVersion);
    const refreshToken = signRefreshToken(user.id, updated.tokenVersion);
    res.json({ ok: true, token, refreshToken });
  }),
);

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Admin resets another user's password.
router.post(
  '/users/:userId/reset-password',
  authLimiter,
  requireAuth,
  requireRole('ADMIN'),
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body as z.infer<typeof resetPasswordSchema>;
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target) throw new ApiError(404, 'User not found');
    const passwordHash = await hashPassword(newPassword);
    // Reset + audit atomically so a privileged action never lands without its record.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        // An admin-issued reset password is temporary — require the user to set their own next login.
        data: { passwordHash, tokenVersion: { increment: 1 }, mustChangePassword: true },
      });
      if (target.employeeId) {
        await recordHistoryTx(tx, {
          employeeId: target.employeeId,
          eventType: 'NOTE',
          title: 'Password reset by an administrator',
          metadata: { resetBy: req.user!.email },
          occurredAt: new Date(),
          createdBy: req.user!.email,
        });
      }
    });
    res.json({ ok: true });
  }),
);

// Revoke every live token for the current user (logout-everywhere).
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.user!.id }, data: { tokenVersion: { increment: 1 } } });
    res.json({ ok: true });
  }),
);

export default router;
