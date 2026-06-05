import { useState, type FormEvent } from 'react';
import { api, apiError } from '../../api/client';
import { useFetch } from '../../lib/useFetch';
import type { TabProps } from '../EmployeeProfile';
import type { LearningGoal } from '../../api/types';
import { Spinner, Empty, Modal, Field, Badge, StatusBadge, ProgressBar } from '../../components/ui';
import { toneFor } from '../../lib/tone';
import { Icon } from '../../components/Icon';
import { useConfirm } from '../../components/useConfirm';
import { useToast } from '../../components/useToast';
import { fmtDate, titleCase } from '../../lib/format';
import { LEARNING_CATEGORIES, LEARNING_STATUSES, PRIORITIES } from '../../lib/enums';

export default function GoalsTab({ employee, manageGoals }: TabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; goal: LearningGoal } | null>(null);
  const { data, loading, error, reload } = useFetch(
    () => api.get(`/employees/${employee.id}/learning-goals`).then((r) => r.data.data as LearningGoal[]),
    [employee.id],
  );

  const remove = async (g: LearningGoal) => {
    if (!(await confirm({ title: 'Delete goal', message: 'Delete this learning goal? This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/learning-goals/${g.id}`);
      reload();
    } catch (e) {
      toast(apiError(e), 'error');
    }
  };

  return (
    <div>
      <div className="row between mb-2">
        <div>
          <h3 style={{ fontSize: 16 }}>Learning goals</h3>
          <span className="muted" style={{ fontSize: 13 }}>
            {data?.filter((g) => g.status === 'COMPLETED').length ?? 0} of {data?.length ?? 0} completed
          </span>
        </div>
        {manageGoals && (
          <button className="btn primary sm" onClick={() => setModal({ mode: 'add' })}>
            <Icon name="plus" size={15} /> Add goal
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Empty icon="alert-triangle" title="Could not load goals" hint={error} />
      ) : !data || data.length === 0 ? (
        <div className="card">
          <Empty icon="target" title="No learning goals yet" hint="Set development goals to track growth." />
        </div>
      ) : (
        <div className="grid cols-2">
          {data.map((g) => (
            <div className="card card-pad" key={g.id}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div className="row wrap" style={{ gap: 6 }}>
                  <Badge tone="gray">{titleCase(g.category)}</Badge>
                  <Badge tone={toneFor(g.priority)}>{titleCase(g.priority)}</Badge>
                  <StatusBadge value={g.status} />
                </div>
                {manageGoals && (
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn sm" onClick={() => setModal({ mode: 'edit', goal: g })}>
                      <Icon name="edit" size={14} /> Edit
                    </button>
                    <button type="button" className="btn danger icon-btn" onClick={() => remove(g)} aria-label="Delete goal" title="Delete">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 600, marginTop: 10 }}>{g.title}</div>
              {g.description && (
                <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
                  {g.description}
                </p>
              )}
              <div className="row between" style={{ margin: '12px 0 5px' }}>
                <span className="faint" style={{ fontSize: 12 }}>
                  Progress
                </span>
                <span className="tabular muted" style={{ fontSize: 12 }}>
                  {g.progress}%
                </span>
              </div>
              <ProgressBar value={g.progress} color={g.status === 'COMPLETED' ? 'var(--green)' : undefined} />
              <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>
                {g.status === 'COMPLETED' && g.completedDate
                  ? `Completed ${fmtDate(g.completedDate)}`
                  : g.targetDate
                  ? `Target ${fmtDate(g.targetDate)}`
                  : 'No target date'}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <GoalModal
          employeeId={employee.id}
          goal={modal.mode === 'edit' ? modal.goal : null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function GoalModal({
  employeeId,
  goal,
  onClose,
  onSaved,
}: {
  employeeId: string;
  goal: LearningGoal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: goal?.title ?? '',
    description: goal?.description ?? '',
    category: goal?.category ?? 'TECHNICAL',
    priority: goal?.priority ?? 'MEDIUM',
    status: goal?.status ?? 'NOT_STARTED',
    progress: String(goal?.progress ?? 0),
    targetDate: goal?.targetDate ? goal.targetDate.slice(0, 10) : '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      priority: form.priority,
      status: form.status,
      progress: Number(form.progress),
      targetDate: form.targetDate || undefined,
    };
    try {
      if (goal) await api.patch(`/learning-goals/${goal.id}`, payload);
      else await api.post(`/employees/${employeeId}/learning-goals`, payload);
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
      title={goal ? 'Edit goal' : 'Add learning goal'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" form="goal-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form id="goal-form" onSubmit={submit}>
        <Field label="Title">
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="form-row">
          <Field label="Category">
            <select className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {LEARNING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className="select" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {LEARNING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target date">
            <input className="input" type="date" value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} />
          </Field>
        </div>
        <Field label={`Progress: ${form.progress}%`}>
          <input type="range" min="0" max="100" step="5" value={form.progress} onChange={(e) => set('progress', e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
