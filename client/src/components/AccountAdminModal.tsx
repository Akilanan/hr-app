import { useState } from 'react';
import { api, apiError } from '../api/client';
import { Modal, Field } from './ui';
import { titleCase } from '../lib/format';
import { ROLES, type Role } from '../lib/enums';
import type { Employee } from '../api/types';

/**
 * ADMIN-only login management for one employee.
 *  - No account yet  → create a login (POST /auth/register) with a generated one-time password.
 *  - Account exists   → reset the password (POST /auth/users/:id/reset-password).
 * Both issue a TEMPORARY password (shown once here) that the user must replace at
 * first login (the server sets mustChangePassword). Closes the loop for the
 * "clean slate — admin adds real people" workflow.
 */

// Strong password, no visually ambiguous characters, one of each class guaranteed.
function generatePassword(len = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*?';
  const all = upper + lower + digits + symbols;
  const draw = (set: string, n: number) => {
    const r = new Uint32Array(n);
    crypto.getRandomValues(r);
    return Array.from({ length: n }, (_, i) => set[r[i] % set.length]);
  };
  const chars = [...draw(upper, 1), ...draw(lower, 1), ...draw(digits, 1), ...draw(symbols, 1), ...draw(all, len - 4)];
  // Fisher–Yates-ish shuffle using crypto randomness so the guaranteed chars aren't positional.
  const keys = new Uint32Array(chars.length);
  crypto.getRandomValues(keys);
  return chars
    .map((c, i) => ({ c, k: keys[i] }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c)
    .join('');
}

export function AccountAdminModal({
  employee,
  onClose,
  onChanged,
}: {
  employee: Employee;
  onClose: () => void;
  onChanged: () => void;
}) {
  const existing = employee.user ?? null;
  const [email, setEmail] = useState(existing?.email ?? employee.email);
  const [role, setRole] = useState<Role>((existing?.role as Role) ?? 'EMPLOYEE');
  const [password, setPassword] = useState(generatePassword());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { kind: 'created' | 'reset'; email: string; password: string }>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(done ? done.password : password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable (e.g. non-secure context) — the value is visible to copy manually
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (existing) {
        await api.post(`/auth/users/${existing.id}/reset-password`, { newPassword: password });
        setDone({ kind: 'reset', email: existing.email, password });
      } else {
        await api.post('/auth/register', { email: email.trim().toLowerCase(), password, role, employeeId: employee.id });
        setDone({ kind: 'created', email: email.trim().toLowerCase(), password });
        onChanged(); // reload profile so the linked account shows up
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={existing ? 'Login account' : 'Create login account'}
      onClose={onClose}
      footer={
        done ? (
          <button type="button" className="btn primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn primary" disabled={busy} onClick={submit}>
              {busy ? 'Saving…' : existing ? 'Reset password' : 'Create account'}
            </button>
          </>
        )
      }
    >
      {error && <div className="error-banner">{error}</div>}

      {done ? (
        <div>
          <div className="badge green" style={{ padding: '6px 12px', marginBottom: 14 }}>
            {done.kind === 'created' ? 'Account created' : 'Password reset'}
          </div>
          <p className="muted" style={{ marginBottom: 12 }}>
            Share these credentials with <strong>{employee.firstName} {employee.lastName}</strong> securely. They’ll be
            required to set their own password at first sign-in. This password won’t be shown again.
          </p>
          <div className="kv" style={{ marginBottom: 8 }}>
            <span className="k">Email</span>
            <span className="v">{done.email}</span>
          </div>
          <div className="kv">
            <span className="k">Temporary password</span>
            <span className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ fontSize: 14 }}>{done.password}</code>
              <button type="button" className="btn" style={{ padding: '2px 8px' }} onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </span>
          </div>
        </div>
      ) : (
        <div>
          {existing ? (
            <p className="muted" style={{ marginBottom: 14 }}>
              This employee already has a login (<strong>{existing.email}</strong>, role {titleCase(existing.role)}).
              Resetting issues a new temporary password and signs out their other sessions.
            </p>
          ) : (
            <p className="muted" style={{ marginBottom: 14 }}>
              Give <strong>{employee.firstName} {employee.lastName}</strong> access to the app. They’ll set their own
              password at first sign-in.
            </p>
          )}

          {!existing && (
            <div className="form-row">
              <Field label="Login email">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="Role">
                <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {titleCase(r)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <Field label={existing ? 'New temporary password' : 'Temporary password'}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>
                Regenerate
              </button>
            </div>
          </Field>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
            Auto-generated and strong. You can regenerate or type your own (min 8 characters).
          </div>
        </div>
      )}
    </Modal>
  );
}
