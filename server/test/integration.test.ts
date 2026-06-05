/**
 * Route-level integration tests — exercise the real Express app + a throwaway
 * SQLite database over HTTP. Dependency-free (Node's built-in fetch + a tiny
 * runner), so no vitest/supertest needed.
 *
 * Run with: npm test   (from /server)
 *
 * It spins up a dedicated test DB (test-integration.db), applies the schema with
 * `prisma db push --force-reset`, seeds a small fixture, starts the app on an
 * ephemeral port, runs the cases, then tears everything down.
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';

const SERVER_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DB_FILE = join(SERVER_DIR, 'prisma', 'test-integration.db');

// Point the app at the throwaway DB BEFORE anything imports prisma/config.
// (dotenv does not override already-set vars, so server/.env is ignored here.)
process.env.DATABASE_URL = 'file:./test-integration.db';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret-please-ignore-1234567890';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

/* --------------------------------- runner --------------------------------- */
let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed++;
    console.error('  ✗ ' + name + '\n     ' + (e as Error).message);
  }
}

function cleanupDbFiles() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(TEST_DB_FILE + suffix, { force: true });
  }
}

async function main() {
  // Delete any stale test DB first, so `db push` creates a fresh schema on an
  // empty file — non-destructive (no --force-reset needed, nothing to lose).
  cleanupDbFiles();
  execSync('npx prisma db push --skip-generate', {
    cwd: SERVER_DIR,
    env: { ...process.env, DATABASE_URL: 'file:./test-integration.db' },
    stdio: 'pipe',
  });

  // Import app/prisma only AFTER env + schema are ready.
  const { prisma } = await import('../src/lib/prisma');
  const { createApp } = await import('../src/app');
  const { hashPassword } = await import('../src/lib/password');

  /* ------------------------------- fixtures ------------------------------- */
  const pw = await hashPassword('testpass123');
  const dept = await prisma.department.create({ data: { name: 'Engineering' } });
  const manager = await prisma.employee.create({
    data: { employeeCode: 'M1', firstName: 'Mary', lastName: 'Manager', email: 'mary@test.com', hireDate: new Date('2020-01-01'), jobTitle: 'Engineering Manager', departmentId: dept.id },
  });
  const report = await prisma.employee.create({
    data: { employeeCode: 'R1', firstName: 'Rita', lastName: 'Report', email: 'rita@test.com', hireDate: new Date('2021-06-01'), jobTitle: 'Software Engineer', departmentId: dept.id, managerId: manager.id },
  });
  const other = await prisma.employee.create({
    data: { employeeCode: 'O1', firstName: 'Otto', lastName: 'Other', email: 'otto@test.com', hireDate: new Date('2021-06-01'), jobTitle: 'Software Engineer', departmentId: dept.id },
  });
  await prisma.user.create({ data: { email: 'admin@test.com', passwordHash: pw, role: 'ADMIN' } });
  await prisma.user.create({ data: { email: 'mgr@test.com', passwordHash: pw, role: 'MANAGER', employeeId: manager.id } });
  await prisma.user.create({ data: { email: 'emp@test.com', passwordHash: pw, role: 'EMPLOYEE', employeeId: report.id } });

  /* ------------------------------- harness -------------------------------- */
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const base = `http://127.0.0.1:${port}/api`;

  async function req(
    method: string,
    path: string,
    opts: { token?: string; body?: unknown } = {},
  ): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { status: res.status, data };
  }

  const login = async (email: string) => {
    const r = await req('POST', '/auth/login', { body: { email, password: 'testpass123' } });
    return r;
  };

  try {
    /* -------------------------------- auth -------------------------------- */
    await test('login returns an access token AND a refresh token', async () => {
      const r = await login('admin@test.com');
      assert.equal(r.status, 200);
      assert.ok(typeof r.data.token === 'string' && r.data.token.length > 0);
      assert.ok(typeof r.data.refreshToken === 'string' && r.data.refreshToken.length > 0);
    });

    await test('login with a wrong password is rejected (401)', async () => {
      const r = await req('POST', '/auth/login', { body: { email: 'admin@test.com', password: 'nope' } });
      assert.equal(r.status, 401);
    });

    await test('protected route requires a token (401)', async () => {
      const r = await req('GET', '/employees');
      assert.equal(r.status, 401);
    });

    /* ------------------------------ RBAC over HTTP ------------------------ */
    const admin = (await login('admin@test.com')).data;
    const mgr = (await login('mgr@test.com')).data;
    const emp = (await login('emp@test.com')).data;

    await test('admin can list the directory (200)', async () => {
      const r = await req('GET', '/employees', { token: admin.token });
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.data.data));
    });

    await test('employee can view self but not others (403)', async () => {
      const self = await req('GET', `/employees/${report.id}`, { token: emp.token });
      assert.equal(self.status, 200);
      const forbidden = await req('GET', `/employees/${other.id}`, { token: emp.token });
      assert.equal(forbidden.status, 403);
    });

    await test('manager can view a direct report but not an unrelated employee', async () => {
      const ok = await req('GET', `/employees/${report.id}`, { token: mgr.token });
      assert.equal(ok.status, 200);
      const forbidden = await req('GET', `/employees/${other.id}`, { token: mgr.token });
      assert.equal(forbidden.status, 403);
    });

    await test('manager PATCH cannot change status (manager-strip)', async () => {
      const r = await req('PATCH', `/employees/${report.id}`, {
        token: mgr.token,
        body: { jobTitle: 'Senior Software Engineer', status: 'TERMINATED' },
      });
      assert.equal(r.status, 200);
      const after = await req('GET', `/employees/${report.id}`, { token: admin.token });
      assert.equal(after.data.data.jobTitle, 'Senior Software Engineer'); // allowed field applied
      assert.equal(after.data.data.status, 'ACTIVE'); // privileged field stripped
    });

    /* --------------------------- review acknowledge ---------------------- */
    let reviewId = '';
    await test('manager can create a review for a report (201)', async () => {
      const r = await req('POST', `/employees/${report.id}/reviews`, {
        token: mgr.token,
        body: {
          periodStart: '2024-01-01',
          periodEnd: '2024-12-31',
          overallRating: 4,
          status: 'SUBMITTED',
        },
      });
      assert.equal(r.status, 201);
      reviewId = r.data.data.id;
      assert.ok(reviewId);
    });

    await test('employee may acknowledge their own review (200)', async () => {
      const r = await req('PATCH', `/reviews/${reviewId}`, {
        token: emp.token,
        body: { status: 'ACKNOWLEDGED' },
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.data.status, 'ACKNOWLEDGED');
    });

    await test('employee may NOT edit other fields of their review (403)', async () => {
      const r = await req('PATCH', `/reviews/${reviewId}`, {
        token: emp.token,
        body: { overallRating: 1 },
      });
      assert.equal(r.status, 403);
    });

    /* ------------------------------- refresh ----------------------------- */
    await test('refresh token mints a working new access token', async () => {
      const r = await req('POST', '/auth/refresh', { body: { refreshToken: admin.refreshToken } });
      assert.equal(r.status, 200);
      assert.ok(r.data.token);
      const check = await req('GET', '/employees', { token: r.data.token });
      assert.equal(check.status, 200);
    });

    await test('a garbage refresh token is rejected (401)', async () => {
      const r = await req('POST', '/auth/refresh', { body: { refreshToken: 'not-a-real-token' } });
      assert.equal(r.status, 401);
    });

    /* --------------------------- token revocation ------------------------ */
    await test('logout revokes BOTH the access and refresh tokens', async () => {
      const session = (await login('emp@test.com')).data;
      // tokens work before logout
      assert.equal((await req('GET', `/employees/${report.id}`, { token: session.token })).status, 200);
      // logout bumps tokenVersion
      assert.equal((await req('POST', '/auth/logout', { token: session.token })).status, 200);
      // old access token no longer valid
      assert.equal((await req('GET', `/employees/${report.id}`, { token: session.token })).status, 401);
      // old refresh token no longer valid
      assert.equal((await req('POST', '/auth/refresh', { body: { refreshToken: session.refreshToken } })).status, 401);
    });

    /* ----------------------------- persistence --------------------------- */
    await test('writes are persisted to the database', async () => {
      const count = await prisma.employee.count();
      assert.equal(count, 3);
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
    cleanupDbFiles();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  cleanupDbFiles();
  process.exit(1);
});
