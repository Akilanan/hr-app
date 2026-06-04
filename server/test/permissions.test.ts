/**
 * Dependency-free unit tests for the RBAC permission logic — the most
 * security-critical pure functions. Run with: npm test
 */
import assert from 'node:assert/strict';
import { isFullAccess, canView, canManage, canManageGoals } from '../src/lib/permissions';
import type { AuthUser } from '../src/types';

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed++;
    console.error('  ✗ ' + name + '\n     ' + (e as Error).message);
  }
}

const admin: AuthUser = { id: 'u1', email: 'a@x', role: 'ADMIN', employeeId: 'EA' };
const hr: AuthUser = { id: 'u2', email: 'h@x', role: 'HR', employeeId: 'EH' };
const manager: AuthUser = { id: 'u3', email: 'm@x', role: 'MANAGER', employeeId: 'M1' };
const employee: AuthUser = { id: 'u4', email: 'e@x', role: 'EMPLOYEE', employeeId: 'E1' };

const report = { id: 'E1', managerId: 'M1' }; // managed by M1 (also "self" for employee)
const other = { id: 'E2', managerId: 'M9' }; // not managed by M1

test('ADMIN and HR have full access; MANAGER/EMPLOYEE do not', () => {
  assert.equal(isFullAccess(admin), true);
  assert.equal(isFullAccess(hr), true);
  assert.equal(isFullAccess(manager), false);
  assert.equal(isFullAccess(employee), false);
});

test('Admin can view and manage anyone', () => {
  assert.equal(canView(admin, other), true);
  assert.equal(canManage(admin, other), true);
});

test('Manager can view+manage ONLY direct reports', () => {
  assert.equal(canView(manager, report), true);
  assert.equal(canManage(manager, report), true);
  assert.equal(canView(manager, other), false);
  assert.equal(canManage(manager, other), false);
});

test('Employee can view only self and cannot manage HR data', () => {
  assert.equal(canView(employee, report), true); // report.id === employee.employeeId
  assert.equal(canView(employee, other), false);
  assert.equal(canManage(employee, report), false);
});

test('Goals are self-service: employee manages own, not others', () => {
  assert.equal(canManageGoals(employee, report), true);
  assert.equal(canManageGoals(employee, other), false);
  assert.equal(canManageGoals(manager, report), true);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
