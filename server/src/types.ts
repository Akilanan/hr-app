export type Role = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
}
