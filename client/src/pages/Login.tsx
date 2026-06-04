import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../api/client';

const DEMO = [
  { role: 'Admin', email: 'admin@demo.com' },
  { role: 'HR', email: 'hr@demo.com' },
  { role: 'Manager', email: 'manager@demo.com' },
  { role: 'Employee', email: 'employee@demo.com' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo1234');
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
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">P</div> PeopleHub
        </div>
        <div className="login-sub">People management & performance system</div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="demo-accounts">
            <h4>Demo accounts · password “demo1234”</h4>
            {DEMO.map((d) => (
              <button
                type="button"
                key={d.email}
                className="demo-pill"
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
      </div>
    </div>
  );
}
