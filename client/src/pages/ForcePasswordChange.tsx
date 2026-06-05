import { useState, type FormEvent } from 'react';
import { api, apiError, setSession } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

/**
 * Mandatory first-login screen. Admin-created accounts get a one-time password
 * and `mustChangePassword: true`; the app renders nothing else until the user
 * replaces it with their own private password. The change-password endpoint
 * clears the flag and returns a fresh token pair, then we refresh the session.
 */
export default function ForcePasswordChange() {
  const { user, logout, refresh } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError('Choose a new password that is different from the temporary one');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // Adopt the freshly issued tokens, then re-pull /me so the cleared
      // mustChangePassword flag lifts this gate and the app renders normally.
      if (r.data?.token) setSession({ token: r.data.token, refreshToken: r.data.refreshToken });
      await refresh();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  return (
    <div
      className="auth-main"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div className="auth-card">
        <div className="top">
          <h1>Set your password</h1>
          <p>
            Welcome{user?.email ? `, ${user.email}` : ''}. For security, please replace the temporary password you were
            given with your own before continuing.
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="fpc-current">Temporary password</label>
            <div className="auth-input-wrap">
              <input
                id="fpc-current"
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => set('currentPassword', e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="fpc-new">New password</label>
            <div className="auth-input-wrap">
              <input
                id="fpc-new"
                className="auth-input has-eye"
                type={showPw ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => set('newPassword', e.target.value)}
                autoComplete="new-password"
                minLength={8}
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
            <div className="auth-help">At least 8 characters.</div>
          </div>
          <div className="auth-field">
            <label htmlFor="fpc-confirm">Confirm new password</label>
            <div className="auth-input-wrap">
              <input
                id="fpc-confirm"
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>
          <button type="submit" className="lp-btn primary auth-btn lg" disabled={busy}>
            {busy ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>

        <div className="auth-foot">
          Not you?{' '}
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
