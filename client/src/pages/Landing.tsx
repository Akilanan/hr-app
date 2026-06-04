import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

/* Reveal-on-scroll wrapper (respects reduced-motion via CSS). */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setShown(true), io.disconnect())),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-reveal${shown ? ' in' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

const FEATURES = [
  {
    wide: true,
    tag: 'profiles',
    icon: 'file-text',
    title: 'One profile, the whole story',
    desc: 'History, promotions, salary changes, performance reviews, learning goals and financial growth — every chapter of an employee’s journey on a single, fast timeline.',
  },
  { tag: 'analytics', icon: 'trending-up', title: 'Performance insights', desc: 'KPI & OKR dashboards, rating trends and top-performer leaderboards, updated live.' },
  { tag: 'security', icon: 'shield', title: 'Role-based access', desc: 'Admin, HR, Manager and Employee scopes enforced end-to-end — people see exactly what they should.' },
  { tag: 'compensation', icon: 'dollar', title: 'Compensation tracking', desc: 'Raises, bonuses, market adjustments and total-comp growth, charted over time.' },
  { tag: 'growth', icon: 'award', title: 'Goals & growth', desc: 'Learning goals, milestones and career progression that managers and employees share.' },
];

const ROLES = [
  { key: 'HR', label: 'For HR', h: 'A single source of truth for your people', p: 'Onboard, track and report on the whole org without spreadsheets. Compensation, reviews and history stay in one auditable place.', pts: ['Bulk CSV import & export', 'Full audit trail', 'Org-wide dashboards'] },
  { key: 'Managers', label: 'For Managers', h: 'Lead your reports with real context', p: 'See each report’s goals, reviews and growth at a glance, and run review cycles without chasing forms.', pts: ['Direct-report scope', 'Review & goal tools', 'Performance trends'] },
  { key: 'Admins', label: 'For Admins', h: 'Control access down to the row', p: 'Four built-in roles with strict server-side enforcement, account provisioning and password controls.', pts: ['4-role RBAC', 'Account management', 'Rate-limited auth'] },
  { key: 'Employees', label: 'For Employees', h: 'Your career, clearly laid out', p: 'Track your own goals, see your review history and compensation growth, and own your development.', pts: ['Self-service goals', 'Review acknowledgement', 'Personal timeline'] },
];

const SPECS = [
  { k: 'Stack', v: 'React + Node + Prisma' },
  { k: 'Access', v: '4-role RBAC, server-enforced' },
  { k: 'Data', v: 'Yours — CSV import & export' },
  { k: 'Modules', v: '9, one workspace' },
  { k: 'Setup', v: 'Under 5 minutes' },
];

const STEPS = [
  { t: 'Add your team', d: 'Import everyone from a CSV or add people in seconds — no migration project required.' },
  { t: 'Track everything', d: 'Log promotions, pay, reviews and goals right on each profile as work happens.' },
  { t: 'Decide with data', d: 'Watch live dashboards turn day-to-day activity into clear, shareable insight.' },
];

const STATS = [
  { v: '9', l: 'modules in one workspace' },
  { v: '4', l: 'roles, fine-grained access' },
  { v: '0', l: 'spreadsheets needed' },
  { v: '<5m', l: 'to get started' },
];

const QUOTES = [
  { q: 'Finally a people tool that doesn’t fight me — reviews and comp history live in one place.', n: 'Aarav Sharma', r: 'Head of People, Northwind', a: 'AS' },
  { q: 'Our managers actually use it. The performance dashboards are what won them over.', n: 'Meera Krishnan', r: 'HR Lead, Lumen', a: 'MK' },
  { q: 'Setup took an afternoon and the role-based access just works. Exactly what we needed.', n: 'Daniel Rivera', r: 'Founder, Vertex Labs', a: 'DR' },
];

const LOGOS = ['Northwind', 'Lumen', 'Acme Labs', 'Vertex', 'Quanta', 'Helio'];

export default function Landing() {
  const [role, setRole] = useState(0);
  const active = ROLES[role];
  const { user } = useAuth();
  // Logged-out visitors go to the sign-in page; logged-in visitors go into the app.
  const go = user ? '/' : '/login';

  return (
    <div className="lp">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a className="lp-brand" href="#top">
            <span className="lp-logo">P</span> PeopleHub
          </a>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#roles">Roles</a>
            <a href="#how">How it works</a>
            <a href="#reviews">Reviews</a>
          </div>
          <div className="lp-nav-actions">
            <Link to={go} className="lp-nav-signin">Sign in</Link>
            <Link to={go} className="lp-btn primary">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero" id="top">
        <div className="lp-container">
          <span className="lp-eyebrow"><span className="dot" /> People ops, reimagined</span>
          <h1 className="lp-display">
            Manage people<br />with <span className="accent">clarity</span>
          </h1>
          <p className="sub">
            Profiles, pay, reviews, goals and live performance insights — one calm, fast workspace for your whole team.
          </p>
          <div className="lp-hero-cta">
            <Link to={go} className="lp-btn primary lg">
              Get started <Icon name="arrow-right" size={17} />
            </Link>
            <a href="#how" className="lp-btn ghost lg">
              <Icon name="play" size={15} /> Watch demo
            </a>
          </div>
          <div className="lp-hero-trust">
            <Icon name="check-circle" size={15} /> Free to start · No credit card · Set up in minutes
          </div>
        </div>

        {/* Product frame */}
        <div className="lp-container">
          <Reveal>
            <div className="lp-frame">
              <div className="lp-frame-bar">
                <i /><i /><i />
                <span className="url">app.peoplehub.com/dashboard</span>
              </div>
              <div className="lp-frame-body">
                <div className="lp-mini-kpis">
                  <div className="lp-mini-kpi">
                    <div className="l">Active headcount</div>
                    <div className="v">248</div>
                    <div className="d">+12 this quarter</div>
                  </div>
                  <div className="lp-mini-kpi">
                    <div className="l">Avg. review rating</div>
                    <div className="v">4.2<span style={{ fontSize: 15, color: 'var(--faint)' }}>/5</span></div>
                    <div className="d">9 awaiting sign-off</div>
                  </div>
                  <div className="lp-mini-kpi">
                    <div className="l">Goal completion</div>
                    <div className="v">68%</div>
                    <div className="d">170 of 250 done</div>
                  </div>
                </div>
                <div className="lp-mini-chart">
                  <div className="h"><b>Hiring trend</b><span>last 12 months</span></div>
                  <Sparkline />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      {/* Logos */}
      <section className="lp-logos">
        <div className="lp-container">
          <p>Trusted by people teams everywhere</p>
          <div className="lp-logos-row">
            {LOGOS.map((name) => (
              <span className="lp-logo-chip" key={name}>
                <i>{name[0]}</i> {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section alt" id="features">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <span className="lp-kicker">Everything you need</span>
              <h2>The whole employee lifecycle, in one place</h2>
              <p>Stop stitching together spreadsheets and point tools. PeopleHub keeps people data, performance and pay together — and makes it usable.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-bento">
              {FEATURES.map((f) => (
                <div className={`lp-card${f.wide ? ' wide feature-hero' : ''}`} key={f.title}>
                  <div className="lp-ficon"><Icon name={f.icon} size={22} /></div>
                  <span className="lp-tag">{f.tag}</span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Roles (segmented control) */}
      <section className="lp-section" id="roles">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <span className="lp-kicker">Built for every role</span>
              <h2>One workspace, tailored to each person</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-seg-wrap">
              <div className="lp-seg" role="tablist" aria-label="Choose a role">
                {ROLES.map((r, i) => (
                  <button key={r.key} type="button" role="tab" aria-selected={i === role} className={i === role ? 'on' : ''} onClick={() => setRole(i)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-role-panel">
              <h3>{active.h}</h3>
              <p>{active.p}</p>
              <div className="pts">
                {active.pts.map((pt) => (
                  <span key={pt}><Icon name="check-circle" size={15} /> {pt}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Technical specs */}
      <section className="lp-section alt">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <span className="lp-kicker">Under the hood</span>
              <h2>Serious software, sensible defaults</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-specs">
              {SPECS.map((s) => (
                <div className="lp-spec-row" key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section" id="how">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <span className="lp-kicker">How it works</span>
              <h2>Up and running in three steps</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <div className="lp-step" key={s.t}>
                  <div className="num">{i + 1}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="lp-section alt">
        <div className="lp-container">
          <Reveal>
            <div className="lp-stats">
              {STATS.map((s) => (
                <div className="lp-stat" key={s.l}>
                  <div className="v">{s.v}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-section" id="reviews">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <span className="lp-kicker">Loved by teams</span>
              <h2>Built for the people who run people ops</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-quotes">
              {QUOTES.map((q) => (
                <div className="lp-quote" key={q.n}>
                  <div className="stars" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Icon key={i} name="star" size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p>“{q.q}”</p>
                  <div className="who">
                    <span className="lp-avatar" aria-hidden="true">{q.a}</span>
                    <div>
                      <div className="n">{q.n}</div>
                      <div className="r">{q.r}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section">
        <div className="lp-container">
          <Reveal>
            <div className="lp-cta">
              <h2>Give your team the clarity they deserve</h2>
              <p>Your people data — organized, secure and insightful from day one. Start free, no credit card required.</p>
              <div className="lp-hero-cta">
                <Link to={go} className="lp-btn primary lg">
                  Get started <Icon name="arrow-right" size={17} />
                </Link>
                <Link to={go} className="lp-btn ghost lg">Sign in</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <a className="lp-brand" href="#top">
                <span className="lp-logo">P</span> PeopleHub
              </a>
              <p className="blurb">People management & performance — history, promotions, pay, reviews, goals and live dashboards in one calm workspace.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#roles">Roles</a></li>
                <li><a href="#how">How it works</a></li>
                <li><Link to={go}>Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#top">About</a></li>
                <li><a href="#top">Careers</a></li>
                <li><a href="#top">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li><a href="#top">Docs</a></li>
                <li><a href="#top">Changelog</a></li>
                <li><a href="#top">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-foot-bottom">
            <span>© 2026 PeopleHub. All rights reserved.</span>
            <span>Privacy · Terms · Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkline() {
  const pts = [18, 22, 19, 28, 25, 34, 30, 42, 38, 50, 46, 58];
  const w = 760;
  const h = 90;
  const max = 64;
  const step = w / (pts.length - 1);
  const coords = pts.map((p, i) => [i * step, h - (p / max) * (h - 12) - 4] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="90" preserveAspectRatio="none" role="img" aria-label="Hiring trend rising over the last 12 months">
      <defs>
        <linearGradient id="lpSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9a9ff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#b9a9ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lpSpark)" />
      <polyline points={line} fill="none" stroke="#e9e9f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
