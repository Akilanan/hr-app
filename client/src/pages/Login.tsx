import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../api/client';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

const HeroScene = lazy(() => import('../three/HeroScene'));

const DEMO = [
  { role: 'Admin', email: 'admin@demo.com' },
  { role: 'HR', email: 'hr@demo.com' },
  { role: 'Manager', email: 'manager@demo.com' },
  { role: 'Employee', email: 'employee@demo.com' },
];

const STEPS = [
  { t: 'Sign in to your workspace', on: true },
  { t: 'Explore people & performance', on: false },
  { t: 'Manage your team with clarity', on: false },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="auth-scene" aria-hidden="true">
          <Suspense fallback={<div className="fx-scene-fallback" />}>
            <HeroScene />
          </Suspense>
        </div>
        <a className="lp-brand" href="/">
          <span className="lp-logo">P</span> PeopleHub
        </a>
        <div className="auth-hero">
          <h2>Welcome back to clearer people ops.</h2>
          <p>Profiles, performance, pay and goals — all in one calm, fast workspace for your team.</p>
          <ul className="auth-steps">
            {STEPS.map((s, i) => (
              <li key={s.t} className={`auth-step${s.on ? ' on' : ''}`}>
                <span className="n">{i + 1}</span>
                <span className="t">{s.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <Link to="/" className="auth-back">
          <Icon name="arrow-left" size={15} /> Back to home
        </Link>

        <div className="auth-card">
          <div className="top">
            <h1>Sign in</h1>
            <p>Enter your details to access your workspace.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  className="auth-input has-eye"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  onClick={() => setShowPw((s) => !s)}
                >
                  <Icon name={showPw ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
              <div className="auth-help">Demo password is “demo1234”.</div>
            </div>
            <button type="submit" className="lp-btn primary auth-btn lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="auth-demo">
              <h4>Demo accounts · password “demo1234”</h4>
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.email}
                  className="auth-pill"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('demo1234');
                  }}
                >
                  <strong>{d.role}</strong>
                  <span className="muted">{d.email}</span>
                </button>
              ))}
            </div>
          )}

          <div className="auth-foot">Need an account? Ask your workspace admin to invite you.</div>
        </div>
      </main>
    </div>
  );
}
