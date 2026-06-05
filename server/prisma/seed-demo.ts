/**
 * Demo seed — populates a realistic company (people, salary history, reviews,
 * financial growth, goals, monthly metrics, history) WITHOUT creating any login
 * accounts, so the deployed app's dashboards and profiles aren't empty for a demo.
 *
 * Idempotent + non-destructive: skips entirely if employees already exist and
 * never deletes data. Disable with SEED_DEMO=false. Run via: npm run seed-demo.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* --------------------------------- helpers -------------------------------- */

// Deterministic PRNG so re-seeding produces the same demo data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240601);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const round = (n: number) => Math.round(n);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const NOW = new Date();
const MS_YEAR = 365.25 * 24 * 3600 * 1000;
function yearsAgoDate(years: number, month?: number, day?: number): Date {
  const base = new Date(NOW.getTime() - years * MS_YEAR);
  return new Date(base.getFullYear(), month ?? base.getMonth(), day ?? base.getDate());
}

/* ------------------------------ career ladders ----------------------------- */

const LADDERS: Record<string, Record<string, string>> = {
  engIC: {
    IC1: 'Associate Software Engineer',
    IC2: 'Software Engineer',
    IC3: 'Software Engineer II',
    IC4: 'Senior Software Engineer',
    IC5: 'Staff Software Engineer',
    IC6: 'Principal Software Engineer',
  },
  engM: {
    M2: 'Engineering Manager',
    M3: 'Director of Engineering',
    M4: 'VP of Engineering',
  },
  product: {
    IC3: 'Product Manager',
    IC4: 'Senior Product Manager',
    IC5: 'Principal Product Manager',
  },
  design: {
    IC2: 'Junior Product Designer',
    IC3: 'Product Designer',
    IC4: 'Senior Product Designer',
    IC5: 'Staff Product Designer',
  },
  people: {
    IC2: 'People Operations Associate',
    IC3: 'People Operations Specialist',
    IC4: 'Senior People Partner',
    M3: 'Head of People',
  },
  sales: {
    IC2: 'Sales Development Rep',
    IC3: 'Account Executive',
    IC4: 'Senior Account Executive',
    M3: 'Sales Director',
  },
  marketing: {
    IC3: 'Marketing Specialist',
    IC4: 'Marketing Manager',
    M3: 'Director of Marketing',
  },
  finance: {
    IC2: 'Junior Financial Analyst',
    IC3: 'Financial Analyst',
    IC4: 'Senior Financial Analyst',
  },
  exec: {
    E: 'Chief Executive Officer',
  },
};

const LOCATIONS = ['Bengaluru', 'Mumbai', 'Hyderabad', 'Pune', 'Delhi NCR', 'Chennai', 'Remote'];

type Seed = {
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
  department: string;
  track: keyof typeof LADDERS;
  level: string;
  currentSalary: number;
  managerCode: string | null;
  tenure: number; // years
  employmentType?: string;
};

// Ordered so every manager is created before their reports.
// Salaries are realistic annual INR CTC (whole rupees).
const EMPLOYEES: Seed[] = [
  { code: 'E000', firstName: 'Arjun', lastName: 'Mehta', gender: 'Male', department: 'Executive', track: 'exec', level: 'E', currentSalary: 18000000, managerCode: null, tenure: 10 },
  { code: 'E001', firstName: 'Ananya', lastName: 'Iyer', gender: 'Female', department: 'People', track: 'people', level: 'M3', currentSalary: 6500000, managerCode: 'E000', tenure: 7 },
  { code: 'E002', firstName: 'Rahul', lastName: 'Sharma', gender: 'Male', department: 'People', track: 'people', level: 'IC3', currentSalary: 1200000, managerCode: 'E001', tenure: 3 },
  { code: 'E003', firstName: 'Priya', lastName: 'Patel', gender: 'Female', department: 'Engineering', track: 'engM', level: 'M4', currentSalary: 9000000, managerCode: 'E000', tenure: 8 },
  { code: 'E004', firstName: 'Vikram', lastName: 'Nair', gender: 'Male', department: 'Engineering', track: 'engM', level: 'M2', currentSalary: 7500000, managerCode: 'E003', tenure: 6 },
  { code: 'E005', firstName: 'Sneha', lastName: 'Reddy', gender: 'Female', department: 'Engineering', track: 'engIC', level: 'IC4', currentSalary: 4500000, managerCode: 'E004', tenure: 4 },
  { code: 'E006', firstName: 'Karan', lastName: 'Malhotra', gender: 'Male', department: 'Engineering', track: 'engIC', level: 'IC2', currentSalary: 1800000, managerCode: 'E004', tenure: 2 },
  { code: 'E007', firstName: 'Aisha', lastName: 'Khan', gender: 'Female', department: 'Engineering', track: 'engIC', level: 'IC3', currentSalary: 2800000, managerCode: 'E004', tenure: 3 },
  { code: 'E008', firstName: 'Aditya', lastName: 'Rao', gender: 'Male', department: 'Engineering', track: 'engIC', level: 'IC5', currentSalary: 8000000, managerCode: 'E003', tenure: 5 },
  { code: 'E009', firstName: 'Meera', lastName: 'Krishnan', gender: 'Female', department: 'Product', track: 'product', level: 'IC4', currentSalary: 5000000, managerCode: 'E000', tenure: 5 },
  { code: 'E010', firstName: 'Aryan', lastName: 'Gupta', gender: 'Male', department: 'Design', track: 'design', level: 'IC4', currentSalary: 3500000, managerCode: 'E009', tenure: 4 },
  { code: 'E011', firstName: 'Pooja', lastName: 'Desai', gender: 'Female', department: 'Design', track: 'design', level: 'IC3', currentSalary: 2000000, managerCode: 'E009', tenure: 2 },
  { code: 'E013', firstName: 'Divya', lastName: 'Menon', gender: 'Female', department: 'Sales', track: 'sales', level: 'M3', currentSalary: 8500000, managerCode: 'E000', tenure: 6 },
  { code: 'E012', firstName: 'Rohan', lastName: 'Verma', gender: 'Male', department: 'Sales', track: 'sales', level: 'IC3', currentSalary: 1800000, managerCode: 'E013', tenure: 3 },
  { code: 'E014', firstName: 'Siddharth', lastName: 'Joshi', gender: 'Male', department: 'Marketing', track: 'marketing', level: 'IC4', currentSalary: 2500000, managerCode: 'E000', tenure: 4 },
  { code: 'E015', firstName: 'Neha', lastName: 'Kulkarni', gender: 'Female', department: 'Finance', track: 'finance', level: 'IC3', currentSalary: 1400000, managerCode: 'E000', tenure: 3 },
];

const DEPARTMENTS: { name: string; description: string }[] = [
  { name: 'Executive', description: 'Company leadership' },
  { name: 'Engineering', description: 'Builds and operates the product' },
  { name: 'Product', description: 'Product strategy and roadmap' },
  { name: 'Design', description: 'Product and brand design' },
  { name: 'Sales', description: 'Revenue and customer acquisition' },
  { name: 'Marketing', description: 'Growth and brand marketing' },
  { name: 'People', description: 'People operations and HR' },
  { name: 'Finance', description: 'Finance and operations' },
];

const COMPETENCIES = ['Technical Skills', 'Communication', 'Collaboration', 'Ownership', 'Problem Solving', 'Leadership'];
const REVIEW_STRENGTHS = [
  'Consistently delivers high-quality work ahead of schedule.',
  'Strong cross-functional collaborator who lifts the whole team.',
  'Excellent technical depth and mentors others effectively.',
  'Owns problems end to end and communicates proactively.',
  'Great customer empathy reflected in the work shipped.',
];
const REVIEW_IMPROVEMENTS = [
  'Could delegate more to create space for strategic work.',
  'Opportunity to grow influence beyond the immediate team.',
  'Would benefit from sharing work-in-progress earlier.',
  'Focus on prioritization when juggling multiple initiatives.',
];
const GOAL_TEMPLATES: { title: string; category: string }[] = [
  { title: 'Complete AWS Solutions Architect certification', category: 'CERTIFICATION' },
  { title: 'Improve public speaking through 4 internal talks', category: 'COMMUNICATION' },
  { title: 'Lead a cross-team project to completion', category: 'LEADERSHIP' },
  { title: 'Deepen expertise in system design', category: 'TECHNICAL' },
  { title: 'Mentor two junior teammates', category: 'LEADERSHIP' },
  { title: 'Learn advanced data analysis with SQL & Python', category: 'TECHNICAL' },
  { title: 'Complete the management fundamentals program', category: 'LEADERSHIP' },
  { title: 'Become fluent in the core product domain', category: 'DOMAIN' },
];
const MILESTONE_EXTRAS: { type: string; title: string }[] = [
  { type: 'CERTIFICATION', title: 'Earned professional certification' },
  { type: 'AWARD', title: 'Received quarterly excellence award' },
  { type: 'PROJECT', title: 'Shipped a flagship project' },
  { type: 'TRAINING', title: 'Completed leadership training program' },
];
const METRIC_DEFS: { type: string; base: number; target: number; spread: number }[] = [
  { type: 'PRODUCTIVITY', base: 82, target: 85, spread: 10 },
  { type: 'QUALITY', base: 88, target: 90, spread: 8 },
  { type: 'GOAL_COMPLETION', base: 72, target: 80, spread: 18 },
  { type: 'ATTENDANCE', base: 96, target: 95, spread: 4 },
  { type: 'ENGAGEMENT', base: 78, target: 80, spread: 12 },
];

function levelOrder(track: keyof typeof LADDERS): string[] {
  return Object.keys(LADDERS[track]);
}
function titleFor(track: keyof typeof LADDERS, level: string): string {
  return LADDERS[track][level] ?? level;
}
function bonusRate(level: string): number {
  if (level === 'E') return 0.4;
  if (level.startsWith('M4')) return 0.3;
  if (level.startsWith('M')) return 0.2;
  if (level === 'IC5' || level === 'IC6') return 0.15;
  if (level === 'IC4') return 0.12;
  return 0.08;
}
function equityFor(level: string, base: number): number {
  if (level === 'E') return round(base * 1.5);
  if (level.startsWith('M4')) return round(base * 0.8);
  if (level.startsWith('M3') || level === 'IC5' || level === 'IC6') return round(base * 0.5);
  if (level.startsWith('M2') || level === 'IC4') return round(base * 0.3);
  if (level === 'IC3') return round(base * 0.12);
  return 0;
}

/* --------------------------------- run ------------------------------------- */

async function main() {
  if (process.env.SEED_DEMO === 'false') {
    console.log('[seed-demo] SEED_DEMO=false — skipping demo data.');
    return;
  }
  // Idempotent + non-destructive: only seed when the database has no employees yet,
  // so re-deploys never wipe or duplicate. Never deletes anything.
  const existingEmployees = await prisma.employee.count();
  if (existingEmployees > 0) {
    console.log(`[seed-demo] ${existingEmployees} employees already exist — skipping.`);
    return;
  }

  console.log('[seed-demo] Creating departments...');
  const deptByName = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const created = await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d });
    deptByName.set(d.name, created.id);
  }

  console.log('Creating employees...');
  const idByCode = new Map<string, string>();
  const ctx: Record<string, { id: string; hireDate: Date; seed: Seed }> = {};

  for (const e of EMPLOYEES) {
    const hireDate = yearsAgoDate(e.tenure, randInt(0, 11), randInt(1, 28));
    const dob = yearsAgoDate(randInt(26, 55), randInt(0, 11), randInt(1, 28));
    const created = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        firstName: e.firstName,
        lastName: e.lastName,
        email: `${e.firstName.toLowerCase()}.${e.lastName.toLowerCase()}@demo.com`,
        gender: e.gender,
        dateOfBirth: dob,
        hireDate,
        status: 'ACTIVE',
        jobTitle: titleFor(e.track, e.level),
        level: e.level,
        employmentType: e.employmentType ?? 'FULL_TIME',
        location: pick(LOCATIONS),
        currentSalary: e.currentSalary,
        currency: 'INR',
        departmentId: deptByName.get(e.department) ?? null,
        managerId: e.managerCode ? idByCode.get(e.managerCode) ?? null : null,
        bio: `${e.firstName} is part of the ${e.department} team.`,
      },
    });
    idByCode.set(e.code, created.id);
    ctx[e.code] = { id: created.id, hireDate, seed: e };
  }

  // Accumulators for bulk insert
  const promotions: any[] = [];
  const salaryChanges: any[] = [];
  const financialMetrics: any[] = [];
  const reviews: any[] = [];
  const goals: any[] = [];
  const perfMetrics: any[] = [];
  const milestones: any[] = [];
  const history: any[] = [];

  const hist = (employeeId: string, eventType: string, title: string, occurredAt: Date, opts: { description?: string; metadata?: any } = {}) =>
    history.push({
      employeeId,
      eventType,
      title,
      description: opts.description ?? null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      occurredAt,
      createdBy: 'system@demo.com',
    });

  console.log('Generating histories...');
  for (const e of EMPLOYEES) {
    const { id, hireDate } = ctx[e.code];
    const tenureMs = NOW.getTime() - hireDate.getTime();
    const order = levelOrder(e.track);
    const curIdx = order.indexOf(e.level);

    hist(id, 'HIRED', `Joined as ${titleFor(e.track, order[Math.max(0, curIdx)])}`, hireDate);

    // ---- Promotions (climb from a lower level to current) ----
    const numPromos = e.track === 'exec' ? 0 : Math.min(curIdx, Math.max(0, Math.floor(e.tenure / 2.5)));
    const startIdx = curIdx - numPromos;
    const promoEvents: { date: Date; fromLevel: string; toLevel: string }[] = [];
    for (let p = 1; p <= numPromos; p++) {
      const date = new Date(hireDate.getTime() + tenureMs * (p / (numPromos + 1)));
      const fromLevel = order[startIdx + p - 1];
      const toLevel = order[startIdx + p];
      promoEvents.push({ date, fromLevel, toLevel });
      const fromTitle = titleFor(e.track, fromLevel);
      const toTitle = titleFor(e.track, toLevel);
      promotions.push({
        employeeId: id,
        fromTitle,
        toTitle,
        fromLevel,
        toLevel,
        effectiveDate: date,
        reason: 'Strong sustained performance and expanded scope.',
        approvedBy: e.managerCode ? `${ctx[e.managerCode]?.seed.firstName} ${ctx[e.managerCode]?.seed.lastName}` : 'Leadership',
      });
      milestones.push({ employeeId: id, date, type: 'PROMOTION', title: `Promoted to ${toTitle}`, description: null, levelAtTime: toLevel });
      hist(id, 'PROMOTION', `Promoted to ${toTitle}`, date, { metadata: { fromLevel, toLevel } });
    }

    // ---- Salary trajectory (anniversary merits + promotion bumps) ----
    type Chg = { date: Date; pct: number; isPromo: boolean };
    const changeEvents: Chg[] = [];
    for (let k = 1; k <= Math.floor(e.tenure); k++) {
      const date = new Date(hireDate.getFullYear() + k, hireDate.getMonth(), hireDate.getDate());
      if (date.getTime() > NOW.getTime()) continue;
      changeEvents.push({ date, pct: rand(0.04, 0.07), isPromo: false });
    }
    for (const pe of promoEvents) changeEvents.push({ date: pe.date, pct: rand(0.13, 0.18), isPromo: true });
    changeEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Back-calculate so the final salary equals currentSalary exactly.
    const after: number[] = new Array(changeEvents.length);
    let running = e.currentSalary;
    for (let i = changeEvents.length - 1; i >= 0; i--) {
      after[i] = running;
      running = round(running / (1 + changeEvents[i].pct));
    }
    const startSalary = changeEvents.length ? round(after[0] / (1 + changeEvents[0].pct)) : e.currentSalary;

    const salaryAt = (date: Date): number => {
      let s = startSalary;
      for (let i = 0; i < changeEvents.length; i++) {
        if (changeEvents[i].date.getTime() <= date.getTime()) s = after[i];
        else break;
      }
      return s;
    };

    let prev = startSalary;
    for (let i = 0; i < changeEvents.length; i++) {
      const newSalary = after[i];
      const pctActual = prev > 0 ? Math.round(((newSalary - prev) / prev) * 10000) / 100 : 0;
      const changeType = changeEvents[i].isPromo ? 'PROMOTION' : pick(['RAISE', 'RAISE', 'MARKET']);
      salaryChanges.push({
        employeeId: id,
        previousSalary: prev,
        newSalary,
        currency: 'INR',
        changeType,
        percentChange: pctActual,
        effectiveDate: changeEvents[i].date,
        reason: changeEvents[i].isPromo ? 'Promotion increase' : 'Annual merit increase',
        approvedBy: e.managerCode ? `${ctx[e.managerCode]?.seed.firstName} ${ctx[e.managerCode]?.seed.lastName}` : 'Leadership',
      });
      hist(id, 'SALARY_CHANGE', `Salary increased to ₹${newSalary.toLocaleString('en-IN')}`, changeEvents[i].date, {
        metadata: { previousSalary: prev, newSalary, percentChange: pctActual, changeType },
      });
      prev = newSalary;
    }

    // ---- Financial growth (yearly total-comp series) ----
    for (let y = hireDate.getFullYear(); y <= NOW.getFullYear(); y++) {
      const periodDate = new Date(y, 0, 1);
      const anchor = periodDate.getTime() < hireDate.getTime() ? hireDate : periodDate;
      const base = salaryAt(anchor);
      const bonus = round(base * bonusRate(e.level) * rand(0.7, 1.1));
      const equity = round(equityFor(e.level, base) * rand(0.8, 1.1));
      financialMetrics.push({
        employeeId: id,
        periodDate,
        baseSalary: base,
        bonus,
        equity,
        totalCompensation: base + bonus + equity,
        currency: 'INR',
      });
    }

    // ---- Performance reviews (yearly, last up to 5 years) ----
    const reviewYears = Math.min(Math.floor(e.tenure), 5);
    let rating = rand(3.2, 3.8);
    for (let y = reviewYears; y >= 1; y--) {
      rating = clamp(rating + rand(-0.2, 0.4), 2.8, 4.9);
      const reviewDate = new Date(NOW.getFullYear() - y, 10, randInt(1, 25));
      if (reviewDate.getTime() < hireDate.getTime()) continue;
      const periodStart = new Date(reviewDate.getFullYear() - 1, 10, 1);
      const comps = COMPETENCIES.filter(() => rng() > 0.3)
        .slice(0, 5)
        .map((name) => ({ name, rating: Math.round(clamp(rating + rand(-0.5, 0.5), 1, 5) * 2) / 2 }));
      const isLatest = y === 1;
      reviews.push({
        employeeId: id,
        reviewerId: e.managerCode ? ctx[e.managerCode]?.id ?? null : null,
        periodStart,
        periodEnd: reviewDate,
        reviewDate,
        overallRating: Math.round(rating * 10) / 10,
        competencies: JSON.stringify(comps),
        strengths: pick(REVIEW_STRENGTHS),
        areasForImprovement: pick(REVIEW_IMPROVEMENTS),
        goalsForNextPeriod: 'Continue growing scope and impact in the coming year.',
        status: isLatest ? 'SUBMITTED' : 'ACKNOWLEDGED',
      });
      hist(id, 'REVIEW', `Performance review — ${(Math.round(rating * 10) / 10).toFixed(1)}/5`, reviewDate, {
        metadata: { rating: Math.round(rating * 10) / 10 },
      });
    }

    // ---- Learning goals ----
    const goalCount = randInt(2, 4);
    const chosen = [...GOAL_TEMPLATES].sort(() => rng() - 0.5).slice(0, goalCount);
    for (const g of chosen) {
      const roll = rng();
      let status = 'NOT_STARTED';
      let progress = 0;
      let completedDate: Date | null = null;
      const createdAt = new Date(NOW.getTime() - rand(0.2, 2) * MS_YEAR);
      if (roll < 0.4) {
        status = 'COMPLETED';
        progress = 100;
        completedDate = new Date(createdAt.getTime() + rand(0.1, 0.6) * MS_YEAR);
        if (completedDate.getTime() > NOW.getTime()) completedDate = NOW;
      } else if (roll < 0.8) {
        status = 'IN_PROGRESS';
        progress = randInt(25, 85);
      } else {
        status = pick(['NOT_STARTED', 'ON_HOLD']);
        progress = status === 'ON_HOLD' ? randInt(10, 40) : 0;
      }
      goals.push({
        employeeId: id,
        title: g.title,
        description: 'Aligned with this year’s development plan.',
        category: g.category,
        status,
        priority: pick(['LOW', 'MEDIUM', 'HIGH', 'MEDIUM']),
        progress,
        targetDate: new Date(NOW.getTime() + rand(0.1, 0.8) * MS_YEAR),
        completedDate,
        createdAt,
        updatedAt: completedDate ?? createdAt,
      });
      hist(id, 'GOAL_CREATED', `Learning goal: ${g.title}`, createdAt, { metadata: { category: g.category } });
      if (status === 'COMPLETED' && completedDate) {
        hist(id, 'GOAL_COMPLETED', `Completed goal: ${g.title}`, completedDate, { metadata: { category: g.category } });
      }
    }

    // ---- Performance metrics (monthly, last 12 months) ----
    for (const def of METRIC_DEFS) {
      let level = def.base + rand(-def.spread / 2, def.spread / 2);
      for (let m = 11; m >= 0; m--) {
        const periodDate = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
        if (periodDate.getTime() < hireDate.getTime()) continue;
        level = clamp(level + rand(-def.spread / 3, def.spread / 3) + 0.4, 40, 100);
        perfMetrics.push({
          employeeId: id,
          periodDate,
          metricType: def.type,
          value: Math.round(level * 10) / 10,
          target: def.target,
          unit: '%',
        });
      }
    }

    // ---- Extra career milestones ----
    const extras = [...MILESTONE_EXTRAS].sort(() => rng() - 0.5).slice(0, randInt(1, 2));
    for (const x of extras) {
      const date = new Date(hireDate.getTime() + tenureMs * rand(0.3, 0.95));
      milestones.push({ employeeId: id, date, type: x.type, title: x.title, description: null, levelAtTime: e.level });
      hist(id, 'MILESTONE', x.title, date, { metadata: { type: x.type } });
    }
  }

  console.log('Bulk inserting history records...');
  await prisma.promotion.createMany({ data: promotions });
  await prisma.salaryChange.createMany({ data: salaryChanges });
  await prisma.financialGrowthMetric.createMany({ data: financialMetrics });
  await prisma.performanceReview.createMany({ data: reviews });
  await prisma.learningGoal.createMany({ data: goals });
  await prisma.performanceMetric.createMany({ data: perfMetrics });
  await prisma.careerGrowthMilestone.createMany({ data: milestones });
  await prisma.historyEvent.createMany({ data: history });

  const counts = {
    departments: DEPARTMENTS.length,
    employees: EMPLOYEES.length,
    promotions: promotions.length,
    salaryChanges: salaryChanges.length,
    financialMetrics: financialMetrics.length,
    reviews: reviews.length,
    learningGoals: goals.length,
    performanceMetrics: perfMetrics.length,
    milestones: milestones.length,
    historyEvents: history.length,
  };

  console.log('\n✓ [seed-demo] Demo data created:', JSON.stringify(counts, null, 2));
  console.log('  (No login accounts created — add real users from the admin UI.)\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
