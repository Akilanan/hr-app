// The single enum source lives in lib/enums.ts. Import it locally so the
// interfaces below can use it, and re-export so other client code can keep
// importing `Role` from '../api/types'.
import type { Role } from '../lib/enums';
export type { Role };

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { employees: number };
}

export interface EmployeeBasic {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  level?: string | null;
  status: string;
  employmentType: string;
  location?: string | null;
  avatarUrl?: string | null;
  hireDate: string;
  managerId?: string | null;
  department?: { id: string; name: string } | null;
}

export interface Employee extends EmployeeBasic {
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  terminationDate?: string | null;
  currentSalary: number;
  currency: string;
  bio?: string | null;
  departmentId?: string | null;
  manager?: { id: string; firstName: string; lastName: string; jobTitle: string } | null;
  user?: { id: string; email: string; role: Role } | null;
  _count?: { reports: number };
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  // True for admin-created accounts that haven't set their own password yet —
  // the app forces a password change before anything else is accessible.
  mustChangePassword?: boolean;
  employee?: Employee | null;
}

export interface Promotion {
  id: string;
  employeeId: string;
  fromTitle?: string | null;
  toTitle: string;
  fromLevel?: string | null;
  toLevel?: string | null;
  effectiveDate: string;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
}

export interface SalaryChange {
  id: string;
  employeeId: string;
  previousSalary: number;
  newSalary: number;
  currency: string;
  changeType: string;
  percentChange: number;
  effectiveDate: string;
  reason?: string | null;
  approvedBy?: string | null;
}

export interface Competency {
  name: string;
  rating: number;
}

export interface Review {
  id: string;
  employeeId: string;
  reviewerId?: string | null;
  reviewer?: { id: string; firstName: string; lastName: string } | null;
  periodStart: string;
  periodEnd: string;
  reviewDate: string;
  overallRating: number;
  competencies: Competency[];
  strengths?: string | null;
  areasForImprovement?: string | null;
  goalsForNextPeriod?: string | null;
  status: string;
}

export interface FinancialMetric {
  id: string;
  employeeId: string;
  periodDate: string;
  baseSalary: number;
  bonus: number;
  equity: number;
  totalCompensation: number;
  currency: string;
}

export interface Milestone {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  title: string;
  description?: string | null;
  levelAtTime?: string | null;
}

export interface LearningGoal {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  priority: string;
  progress: number;
  targetDate?: string | null;
  completedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  id: string;
  employeeId: string;
  periodDate: string;
  metricType: string;
  value: number;
  target?: number | null;
  unit?: string | null;
}

export interface HistoryEvent {
  id: string;
  employeeId: string;
  eventType: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
  createdBy?: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface EmployeeSummary {
  currentSalary: number;
  currency: string;
  jobTitle: string;
  level?: string | null;
  status: string;
  tenureDays: number;
  tenureYears: number;
  counts: {
    promotions: number;
    salaryChanges: number;
    reviews: number;
    milestones: number;
    goals: number;
    goalsCompleted: number;
  };
  goalCompletionRate: number;
  latestRating: number | null;
  latestReviewDate: string | null;
  latestPromotionDate: string | null;
  latestTotalComp: number;
}

export interface DashboardOverview {
  headcount: { total: number; active: number; onLeave: number; terminated: number };
  compensation: { totalSpend: number; avgSalary: number; currency: string; mixedCurrencies: boolean };
  byDepartment: { departmentId: string | null; department: string; headcount: number; avgSalary: number }[];
  byEmploymentType: { type: string; count: number }[];
  promotionsThisYear: number;
  salaryChangesThisYear: number;
  reviews: { total: number; avgRating: number | null; pendingAcknowledgement: number };
  learning: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    onHold: number;
    completionRate: number;
  };
  hireTrend: { period: string; hires: number }[];
  recentHires: { id: string; firstName: string; lastName: string; jobTitle: string; hireDate: string; avatarUrl?: string | null }[];
  recentActivity: { id: string; employeeId: string; employeeName: string; eventType: string; title: string; occurredAt: string }[];
}

export interface DashboardPerformance {
  metricAverages: { metricType: string; avg: number; samples: number }[];
  metricTrend: Record<string, number | string>[];
  metricTypes: string[];
  ratingDistribution: { band: string; count: number }[];
  topPerformers: { id: string; name: string; jobTitle: string; avgRating: number; reviewCount: number }[];
  goals: { total: number; completed: number; inProgress: number; completionRate: number };
}
