import { useState, type FormEvent } from 'react';
import { api, apiError, setSession } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Modal, Field } from './ui';
import { titleCase } from '../lib/format';

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
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
    setBusy(true);
    setError(null);
    try {
      const r = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // The version bump invalidates old tokens — adopt the freshly issued pair
      // so this session (access + refresh) stays alive.
      if (r.data?.token) setSession({ token: r.data.token, refreshToken: r.data.refreshToken });
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Account"
      onClose={onClose}
      footer={
        done ? (
          <button className="btn primary" onClick={onClose}>
            Close
          </button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" form="acct-form" disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </>
        )
      }
    >
      <div className="grid cols-2" style={{ gap: 12, marginBottom: 18 }}>
        <div className="kv">
          <span className="k">Signed in as</span>
          <span className="v">{user?.email}</span>
        </div>
        <div className="kv">
          <span className="k">Role</span>
          <span className="v">{titleCase(user?.role)}</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {done ? (
        <div className="badge green" style={{ padding: '6px 12px' }}>
          Password updated successfully
        </div>
      ) : (
        <form id="acct-form" onSubmit={submit}>
          <Field label="Current password">
            <input
              className="input"
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => set('currentPassword', e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <input
              className="input"
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className="input"
              type="password"
              required
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}
