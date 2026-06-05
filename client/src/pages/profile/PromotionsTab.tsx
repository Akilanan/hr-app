import { useState, type FormEvent } from 'react';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { Promotion } from '../../api/types';
import { Spinner, Empty, Modal, Field, Badge } from '../../components/ui';
import { toneStyle } from '../../lib/tone';
import { Icon } from '../../components/Icon';
import { useConfirm } from '../../components/useConfirm';
import { useToast } from '../../components/useToast';
import { fmtDate } from '../../lib/format';

export default function PromotionsTab({ employee, manage, onChanged }: TabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/promotions`).then((r) => r.data.data as Promotion[]),
    [employee.id],
  );

  const remove = async (p: Promotion) => {
    if (!(await confirm({ title: 'Delete promotion', message: 'Delete this promotion record? Title & level will revert.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/promotions/${p.id}`);
      reload();
    } catch (e) {
      toast(apiError(e), 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Promotion history</h3>
          <span className="card-title-sub">Title & level progression</span>
        </div>
        {manage && (
          <button className="btn primary sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={15} /> Record promotion
          </button>
        )}
      </div>

      <div className="card-pad">
        {loading ? (
          <Spinner />
        ) : error ? (
          <Empty icon="alert-triangle" title="Could not load promotions" hint={error} />
        ) : !data || data.length === 0 ? (
          <Empty icon="arrow-up-circle" title="No promotions recorded" />
        ) : (
          <div className="timeline">
            {data.map((p) => (
              <div className="timeline-item" key={p.id}>
                <div className="timeline-icon" style={toneStyle('purple')}>
                  <Icon name="arrow-up-circle" size={16} />
                </div>
                <div className="row between">
                  <div className="timeline-title">
                    {p.fromTitle ? `${p.fromTitle} → ` : ''}
                    {p.toTitle}
                    {p.toLevel && <Badge tone="purple">{p.toLevel}</Badge>}
                  </div>
                  <div className="row">
                    <span className="timeline-meta nowrap">{fmtDate(p.effectiveDate)}</span>
                    {manage && (
                      <button type="button" className="btn danger icon-btn" onClick={() => remove(p)} aria-label="Delete promotion" title="Delete">
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {p.reason && <div className="timeline-desc">{p.reason}</div>}
                {p.approvedBy && <div className="timeline-meta">Approved by {p.approvedBy}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddPromotionModal
          employee={employee}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function AddPromotionModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: TabProps['employee'];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    toTitle: '',
    toLevel: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: '',
    applyToEmployee: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employee.id}/promotions`, {
        toTitle: form.toTitle,
        toLevel: form.toLevel || undefined,
        effectiveDate: form.effectiveDate,
        reason: form.reason || undefined,
        applyToEmployee: form.applyToEmployee,
      });
      onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Record promotion"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="promo-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="promo-form" onSubmit={submit}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Current: <strong>{employee.jobTitle}</strong>
          {employee.level && ` · ${employee.level}`}
        </div>
        <div className="form-row">
          <Field label="New title">
            <input className="input" required value={form.toTitle} onChange={(e) => setForm((f) => ({ ...f, toTitle: e.target.value }))} />
          </Field>
          <Field label="New level">
            <input className="input" value={form.toLevel} onChange={(e) => setForm((f) => ({ ...f, toLevel: e.target.value }))} placeholder="e.g. IC5" />
          </Field>
        </div>
        <Field label="Effective date">
          <input className="input" type="date" required value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
        </Field>
        <Field label="Reason">
          <textarea className="textarea" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </Field>
        <label className="row" style={{ gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.applyToEmployee}
            onChange={(e) => setForm((f) => ({ ...f, applyToEmployee: e.target.checked }))}
          />
          Update the employee’s current title & level
        </label>
      </form>
    </Modal>
  );
}
