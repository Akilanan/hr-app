// One-off live-deployment verifier. Deleted after running.
const BASE = process.argv[2].replace(/\/$/, '');
const ADMIN_EMAIL = process.argv[3];
const ADMIN_PASS = process.argv[4];

let pass = 0, fail = 0;
const log = (ok, name, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function api(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 0. Wait for the service (free tier can be cold-starting / still booting).
  console.log(`\n=== Verifying ${BASE} ===\n`);
  const TP = 'Verify-1234';
  let accounts = {};
  let health = null;
  for (let i = 0; i < 16; i++) {
    try { health = await api('GET', '/api/health'); if (health.status === 200) break; } catch {}
    process.stdout.write(`  waiting for service… (${i + 1})\r`);
    await sleep(8000);
  }
  log(health?.status === 200 && health?.json?.db === 'ok', 'Health: server up + PostgreSQL connected',
      `status=${health?.status} db=${health?.json?.db}`);

  // 1. Admin login
  const adminLogin = await api('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASS } });
  const adminToken = adminLogin.json?.token;
  log(adminLogin.status === 200 && !!adminToken, 'Admin login',
      `status=${adminLogin.status} role=${adminLogin.json?.user?.role} mustChangePassword=${adminLogin.json?.user?.mustChangePassword}`);
  if (!adminToken) { console.log('\nCannot continue without an admin token.'); return finish(); }

  // 2. Demo data present
  const overview = await api('GET', '/api/dashboard/overview', { token: adminToken });
  const ov = overview.json?.data ?? overview.json ?? {};
  log(overview.status === 200, 'Dashboard overview loads',
      `status=${overview.status} headcount=${ov?.headcount?.total} avgSalary=${ov?.compensation?.avgSalary}`);

  const list = await api('GET', '/api/employees?pageSize=100', { token: adminToken });
  const employees = list.json?.data ?? [];
  log(list.status === 200 && employees.length >= 10, 'Employee directory populated (demo seed)', `count=${employees.length}`);
  if (!employees.length) return finish();

  // pick a manager M (appears as someone's managerId), a report R of M, and an unrelated U
  const byId = Object.fromEntries(employees.map((e) => [e.id, e]));
  const managerId = [...new Set(employees.map((e) => e.managerId).filter(Boolean))].find((id) => byId[id]);
  const M = byId[managerId];
  const R = employees.find((e) => e.managerId === M?.id);
  const U = employees.find((e) => e.id !== M?.id && e.managerId !== M?.id && e.id !== R?.id);
  log(!!(M && R && U), 'Picked manager/report/unrelated for role tests',
      `manager=${M?.firstName} ${M?.lastName} | report=${R?.firstName} | unrelated=${U?.firstName}`);

  const prof = await api('GET', `/api/employees/${R.id}`, { token: adminToken });
  log(prof.status === 200 && !!prof.json?.data, 'Full employee profile loads (admin)',
      `status=${prof.status} salary=${prof.json?.data?.currentSalary}`);

  // 3. Provision a login per role (linked to demo employees), then log in as each
  // HR gets NO employee link — org-level role, and linking it to an arbitrary
  // employee can hit the unique employeeId constraint (e.g. the admin's record).
  accounts = {
    HR: { email: 'role-hr@hr-app.test', emp: null },
    MANAGER: { email: 'role-manager@hr-app.test', emp: M },
    EMPLOYEE: { email: 'role-employee@hr-app.test', emp: R },
  };
  for (const [role, a] of Object.entries(accounts)) {
    const body = { email: a.email, password: TP, role };
    if (a.emp) body.employeeId = a.emp.id;
    const r = await api('POST', '/api/auth/register', { token: adminToken, body });
    a.created = r.status === 201 || r.status === 409;
    a.regStatus = r.status;
  }
  log(Object.values(accounts).every((a) => a.created), 'Provisioned HR / Manager / Employee logins',
      Object.entries(accounts).map(([r, a]) => `${r}=${a.regStatus}`).join(' '));

  for (const a of Object.values(accounts)) {
    const r = await api('POST', '/api/auth/login', { body: { email: a.email, password: TP } });
    a.token = r.json?.token;
  }
  log(Object.values(accounts).every((a) => a.token), 'All role logins succeed',
      Object.entries(accounts).map(([r, a]) => `${r}=${a.token ? 'ok' : 'FAIL'}`).join(' '));

  // 4. Permission matrix
  const hr = accounts.HR.token, mgr = accounts.MANAGER.token, emp = accounts.EMPLOYEE.token;

  const hrAny = await api('GET', `/api/employees/${U.id}`, { token: hr });
  log(hrAny.status === 200, 'HR can view any employee', `status=${hrAny.status}`);
  const hrList = await api('GET', '/api/employees?pageSize=100', { token: hr });
  log(hrList.status === 200, 'HR can list the directory', `count=${hrList.json?.data?.length}`);

  const mgrReport = await api('GET', `/api/employees/${R.id}`, { token: mgr });
  log(mgrReport.status === 200, 'Manager CAN view their direct report', `status=${mgrReport.status}`);
  const mgrUnrelated = await api('GET', `/api/employees/${U.id}`, { token: mgr });
  log(mgrUnrelated.status === 403, 'Manager CANNOT view an unrelated employee (403)', `status=${mgrUnrelated.status}`);

  const empSelf = await api('GET', `/api/employees/${R.id}`, { token: emp });
  log(empSelf.status === 200, 'Employee CAN view their own profile', `status=${empSelf.status}`);
  const empOther = await api('GET', `/api/employees/${U.id}`, { token: emp });
  log(empOther.status === 403, 'Employee CANNOT view another employee (403)', `status=${empOther.status}`);
  const empCreate = await api('POST', '/api/employees', { token: emp, body: { employeeCode: 'TESTX', firstName: 'T', lastName: 'X', email: 'testx@x.com', hireDate: new Date().toISOString(), jobTitle: 'x' } });
  log(empCreate.status === 403, 'Employee CANNOT create employees (403)', `status=${empCreate.status}`);

  const noAuth = await api('GET', '/api/employees');
  log(noAuth.status === 401, 'Unauthenticated request is rejected (401)', `status=${noAuth.status}`);

  const badPass = await api('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: 'wrong-password' } });
  log(badPass.status === 401, 'Wrong password is rejected (401)', `status=${badPass.status}`);

  finish();
  function finish() {
    console.log(`\n===== ${pass} passed, ${fail} failed =====`);
    console.log('Test role accounts created (password ' + TP + '):');
    for (const [role, a] of Object.entries(accounts || {})) console.log(`  ${role.padEnd(9)} ${a.email}`);
  }
})().catch((e) => { console.error('Verifier error:', e); process.exit(1); });
