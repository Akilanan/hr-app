// Single source of truth for the domain enums used by route validators.
// (SQLite/Prisma store these as String columns — see schema.prisma — so the app
//  layer is where they're enforced, via these arrays + Zod.)
export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
export const REVIEW_STATUSES = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'] as const;
export const SALARY_CHANGE_TYPES = ['RAISE', 'ADJUSTMENT', 'PROMOTION', 'BONUS', 'MARKET', 'DEMOTION'] as const;
export const ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const;
export const LEARNING_CATEGORIES = ['TECHNICAL', 'LEADERSHIP', 'COMMUNICATION', 'DOMAIN', 'CERTIFICATION'] as const;
export const LEARNING_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const METRIC_TYPES = ['PRODUCTIVITY', 'QUALITY', 'GOAL_COMPLETION', 'ATTENDANCE', 'OKR', 'ENGAGEMENT'] as const;
export const CAREER_MILESTONE_TYPES = ['PROMOTION', 'ROLE_CHANGE', 'CERTIFICATION', 'PROJECT', 'AWARD', 'SKILL', 'TRAINING'] as const;
