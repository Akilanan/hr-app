// Single source of truth for the domain enums used across the client UI
// (filter dropdowns, create/edit forms, badges). Mirrors server/src/lib/enums.ts,
// which in turn mirrors the String columns documented in schema.prisma. SQLite
// stores these as plain strings, so the values here must stay in sync with the
// server. Human-readable labels are derived at render time via titleCase().
export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
export const REVIEW_STATUSES = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'] as const;
export const SALARY_CHANGE_TYPES = ['RAISE', 'ADJUSTMENT', 'PROMOTION', 'BONUS', 'MARKET', 'DEMOTION'] as const;
export const ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const;
export const LEARNING_CATEGORIES = ['TECHNICAL', 'LEADERSHIP', 'COMMUNICATION', 'DOMAIN', 'CERTIFICATION'] as const;
export const LEARNING_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const METRIC_TYPES = ['PRODUCTIVITY', 'QUALITY', 'GOAL_COMPLETION', 'ATTENDANCE', 'OKR', 'ENGAGEMENT'] as const;

export type Role = (typeof ROLES)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
