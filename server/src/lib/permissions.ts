import type { AuthUser } from '../types';
import { ApiError } from './http';

export const FULL_ACCESS_ROLES = ['ADMIN', 'HR'];

type TargetEmployee = { id: string; managerId?: string | null };

export function isFullAccess(user: AuthUser): boolean {
  return FULL_ACCESS_ROLES.includes(user.role);
}

/** Can the user read this employee's record and sub-resources? */
export function canView(user: AuthUser, target: TargetEmployee): boolean {
  if (isFullAccess(user)) return true;
  if (user.employeeId && user.employeeId === target.id) return true; // self
  if (user.role === 'MANAGER' && user.employeeId && target.managerId === user.employeeId) {
    return true; // a manager sees their direct reports
  }
  return false;
}

/** Can the user write HR data (salary, promotions, reviews, metrics) for this employee? */
export function canManage(user: AuthUser, target: TargetEmployee): boolean {
  if (isFullAccess(user)) return true;
  if (user.role === 'MANAGER' && user.employeeId && target.managerId === user.employeeId) {
    return true;
  }
  return false;
}

/** Learning goals are self-service: an employee may manage their own. */
export function canManageGoals(user: AuthUser, target: TargetEmployee): boolean {
  if (canManage(user, target)) return true;
  return user.employeeId === target.id;
}

export function assertPermission(allowed: boolean, message = 'Insufficient permissions'): void {
  if (!allowed) throw new ApiError(403, message);
}
