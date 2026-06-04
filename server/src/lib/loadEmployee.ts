import { prisma } from './prisma';
import { ApiError } from './http';

/** Load an employee by id or throw a 404. */
export async function getEmployeeOr404(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new ApiError(404, 'Employee not found');
  return employee;
}
