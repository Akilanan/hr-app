import { useState, type FormEvent } from 'react';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { Milestone } from '../../api/types';
import { Spinner, Empty, Modal, Field, Badge } from '../../components/ui';
import { toneStyle } from '../../lib/tone';
import { Icon } from '../../components/Icon';
import { useConfirm } from '../../components/useConfirm';
import { useToast } from '../../components/useToast';
import { fmtDate, titleCase } from '../../lib/format';

const TYPES = ['PROMOTION', 'ROLE_CHANGE', 'CERTIFICATION', 'PROJECT', 'AWARD', 'SKILL', 'TRAINING'];
const TYPE_ICON: Record<string, string> = {
  PROMOTION: 'arrow-up-circle',
  ROLE_CHANGE: 'git-branch',
  CERTIFICATION: 'scroll',
  PROJECT: 'rocket',
  AWARD: 'award',
  SKILL: 'lightbulb',
  TRAINING: 'graduation-cap',
};

export default function CareerTab({ employee, manage }: TabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/career-growth`).then((r) => r.data.data as Milestone[]),
    [employee.id],
  );

  const remove = async (m: Milestone) => {
    if (!(await confirm({ title: 'Delete milestone', message: 'Delete this milestone? This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/career-growth/${m.id}`);
      reload();
    } catch (e) {
      toast(apiError(e), 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Career growth</h3>
          <span className="card-title-sub">Milestones, achievements & development</span>
        </div>
        {manage && (
          <button className="btn primary sm" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={15} /> Add milestone
          </button>
        )}
      </div>

      <div className="card-pad">
        {loading ? (
          <Spinner />
        ) : error ? (
          <Empty icon="alert-triangle" title="Could not load milestones" hint={error} />
        ) : !data || data.length === 0 ? (
          <Empty icon="award" title="No milestones yet" />
        ) : (
          <div className="timeline">
            {data.map((m) => (
              <div className="timeline-item" key={m.id}>
                <div className="timeline-icon" style={toneStyle('purple')}>
                  <Icon name={TYPE_ICON[m.type] ?? 'award'} size={16} />
                </div>
                <div className="row between">
                  <div className="timeline-title">
                    {m.title}
                    <Badge tone="blue">{titleCase(m.type)}</Badge>
                  </div>
                  <div className="row">
                    <span className="timeline-meta nowrap">{fmtDate(m.date)}</span>
                    {manage && (
                      <button type="button" className="btn danger icon-btn" onClick={() => remove(m)} aria-label="Delete milestone" title="Delete">
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {m.description && <div className="timeline-desc">{m.description}</div>}
                {m.levelAtTime && <div className="timeline-meta">Level: {m.levelAtTime}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddMilestoneModal
          employeeId={employee.id}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AddMilestoneModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'CERTIFICATION',
    title: '',
    description: '',
    levelAtTime: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/employees/${employeeId}/career-growth`, {
        date: form.date,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        levelAtTime: form.levelAtTime || undefined,
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
      title="Add career milestone"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="milestone-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="milestone-form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Type">
            <select className="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className="input" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
        </div>
        <Field label="Title">
          <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
      </form>
    </Modal>
  );
}
